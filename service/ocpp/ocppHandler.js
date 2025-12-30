import { RPCServer, createRPCError } from "ocpp-rpc";
import authorize from "./authorize.js";
import { v4 as uuidv4 } from "uuid";
import ChargePoint from "../../model/ocpp/ChargePoint.js";
import Heartbeat from "../../model/ocpp/Heartbeat.js";
import transactionService from "../management/transactionService.js";
import chargePointService from "../management/chargePointService.js";
import statusNotificationService from "./statusNotificationService.js";

// Store connected clients
const connectedClients = new Map();

const server = new RPCServer({
  protocols: ["ocpp1.6"],
  strictMode: false, // Set to false for better compatibility
});

// Authentication handler - accepts all connections for now
server.auth((accept, reject, handshake) => {
  try {
    let chargePointId = handshake.chargePointId;

    // Extract chargePointId from URL if not provided
    if (!chargePointId && handshake.url) {
      const urlParts = handshake.url
        .split("/")
        .filter((part) => part.length > 0);
      chargePointId = urlParts[urlParts.length - 1] || "unknown";
    }

    if (!chargePointId || chargePointId === "unknown") {
      // Try to get from request path
      chargePointId = "unknown";
    }

    console.log(
      `Authentication request from: ${chargePointId} (URL: ${
        handshake.url || "N/A"
      })`
    );

    // Accept all connections (you can add authorization logic here)
    accept({
      sessionId: `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      chargePointId: chargePointId,
    });
  } catch (error) {
    console.error("Auth handler error:", error);
    reject(400, "Authentication failed");
  }
});

server.on("client", async (client) => {
  const chargePointId = client.identity || "unknown";
  console.log(`OCPP Client connected: ${chargePointId}`);

  // Store client connection
  connectedClients.set(chargePointId, {
    client: client,
    connectedAt: new Date(),
    lastHeartbeat: null,
    connectionStatus: "Connected",
    transactions: [],
  });

  let chargePoint = await ChargePoint.findOne({
    identifier: client.identity,
  });

  if (!chargePoint) {
    // create a new charge point
    chargePoint = await ChargePoint.create({
      identifier: client.identity,
      chargePointId: chargePointId,
    });
  } else {
    // update the charge point
    chargePoint.connectedAt = new Date();
    chargePoint.lastHeartbeat = new Date();
    chargePoint.connectionStatus = "Connected";
    chargePoint.identifier = client.identity;
    chargePoint.sessionId = uuidv4();
    await chargePoint.save();
  }

  // Handle client disconnect
  client.on("close", () => {
    console.log(`OCPP Client disconnected: ${chargePointId}`);
    if (connectedClients.has(chargePointId)) {
      const clientData = connectedClients.get(chargePointId);
      clientData.connectionStatus = "Disconnected";
      clientData.disconnectedAt = new Date();

      chargePoint.sessionId = null;
      chargePoint.connectionStatus = "Disconnected";
      chargePoint.save();
    }
  });

  // Handle client errors
  client.on("error", (error) => {
    console.error(`OCPP Client error for ${chargePointId}:`, error);
  });
  // create a specific handler for handling BootNotification requests
  client.handle("BootNotification", ({ params }) => {
    console.log(`Server got BootNotification from ${client.identity}:`, params);

    // respond to accept the client
    return {
      status: "Accepted",
      interval: 300,
      currentTime: new Date().toISOString(),
    };
  });

  client.handle("Heartbeat", async ({ params }) => {
    console.log("Heartbeat params:", client);

    console.log(`Server got Heartbeat from ${client.identity}:`, params);

    // Update last heartbeat time
    if (connectedClients.has(chargePointId)) {
      connectedClients.get(chargePointId).lastHeartbeat = new Date();
    }

    const heartBeat = new Heartbeat({
      chargePointId: params.chargePointId,
      currentTime: new Date().toISOString(),
      createdAt: new Date(),
      timestamp: new Date(),
    });

    //await heartBeat.save(heartBeat);
    console.log(`Heartbeat saved: ${heartBeat}`);

    return {
      currentTime: new Date().toISOString(),
    };
  });

  client.handle("MeterValues", ({ params }) => {
    console.log(`Server got MeterValues from ${client.identity}:`, params);

    return {
      status: "Accepted",
    };
  });

  client.handle("StartTransaction", async ({ params }) => {
    console.log(`Server got StartTransaction from ${client.identity}:`, params);
    // params: connectorId, idTag, meterStart, reservationId, timestamp

    const chargePoint = await ChargePoint.findOne({
      chargePointId: client.identity,
    });

    if (!chargePoint) {
      throw new Error(`Charge point ${chargePointId} not found`);
    }

    const transactionData = {
      chargePointId: chargePoint._id,
      connectorId: params.connectorId,
      idTag: params.idTag,
      meterStart: params.meterStart,
      timestamp: params.timestamp,
      startedAt: new Date(),
    };

    try {
      const transaction = await transactionService.createTransaction(
        transactionData
      );

      console.log(`Transaction created: ${transaction}`);

      return {
        transactionId: transaction.transactionId,
        idTagInfo: {
          status: "Accepted", // Can be: Accepted, Blocked, Expired, Invalid, ConcurrentTx
          expiryDate: null, // Optional: ISO 8601 date when idTag expires
          parentIdTag: null, // Optional: parent idTag if this is a child tag
        },
      };
    } catch (error) {
      console.error(`Error creating transaction: ${error}`);
      return {
        status: "Rejected",
        errorCode: "500",
        errorDescription: `Error creating transaction: ${error.message}`,
      };
    }
  });

  client.handle("StopTransaction", async ({ params }) => {
    console.log(`Server got StopTransaction from ${client.identity}:`, params);

    const chargePoint = await ChargePoint.findOne({
      chargePointId: client.identity,
    });

    if (!chargePoint) {
      throw new Error(`Charge point ${chargePointId} not found`);
    }

    const transaction = await transactionService.getTransactionById(
      params.transactionId
    );

    if (!transaction) {
      throw new Error(`Transaction ${params.transactionId} not found`);
    }

    transaction.stoppedAt = new Date();
    transaction.meterStop = params.meterStop;
    transaction.stopReason = params.reason;
    await transaction.save();

    return {
      transactionId: transaction.transactionId,
      idTagInfo: {
        status: "Accepted",
      },
    };
  });

  // Authorize - Verifies if an idTag is authorized to start a transaction
  client.handle("Authorize", async ({ params }) => {
    console.log(`Server got Authorize from ${client.identity}:`, params);

    // Use authorize service to check idTag
    const idTagInfo = await authorize.authorizeOCPPRequest(params.idTag);

    // Save authorization record
    if (params.idTag && idTagInfo) {
      await authorize.saveAuthorization(
        client.identity,
        params.idTag,
        idTagInfo,
        idTagInfo.status
      );
    }

    return {
      idTagInfo: idTagInfo,
    };
  });

  // StatusNotification - Informs about the status of a connector
  client.handle("StatusNotification", async ({ params }) => {
    console.log(
      `Server got StatusNotification from ${client.identity}:`,
      params
    );
    console.log(`StatusNotification params: ${JSON.stringify(params)}`);

    try {
      const chargePointIdentifier = client.identity;
      const {
        connectorId,
        status,
        errorCode,
        info,
        vendorId,
        vendorErrorCode,
        timestamp,
      } = params;

      // Validate required parameters
      if (connectorId === undefined || !status) {
        throw new Error("Missing required parameters: connectorId and status");
      }

      // Get or verify charge point exists
      const chargePoint = await chargePointService.getChargePointByIdentifier(
        chargePointIdentifier
      );

      if (!chargePoint) {
        throw new Error(`Charge point ${chargePointIdentifier} not found`);
      }

      // Prepare additional data for connector and status notification
      // Filter out empty strings to avoid validation issues
      const additionalData = {};
      if (errorCode && errorCode.trim() !== "")
        additionalData.errorCode = errorCode;
      if (info && info.trim() !== "") additionalData.info = info;
      if (vendorId && vendorId.trim() !== "")
        additionalData.vendorId = vendorId;
      if (vendorErrorCode && vendorErrorCode.trim() !== "")
        additionalData.vendorErrorCode = vendorErrorCode;
      if (timestamp) additionalData.timestamp = new Date(timestamp);

      // Create or update connector status
      const connector = await chargePointService.createOrUpdateConnectorStatus(
        chargePointIdentifier,
        connectorId,
        status,
        additionalData
      );

      console.log(
        `Connector ${connectorId} status updated to ${status} for charge point ${chargePointIdentifier}`
      );

      // Save StatusNotification record for history
      const statusNotification =
        await statusNotificationService.saveStatusNotification(
          chargePointIdentifier,
          connectorId,
          status,
          additionalData
        );

      console.log(`StatusNotification saved: ${statusNotification._id}`);

      return {};
    } catch (error) {
      console.error(`Error handling StatusNotification: ${error.message}`);
      throw error;
    }
  });

  // DataTransfer - Vendor-specific data transfer
  client.handle("DataTransfer", ({ params }) => {
    console.log(`Server got DataTransfer from ${client.identity}:`, params);
    // params: vendorId, messageId, data

    return {
      status: "Accepted", // Can be: Accepted, Rejected, UnknownMessageId, UnknownVendorId
      data: null, // Optional: vendor-specific data
    };
  });

  // FirmwareStatusNotification - Reports firmware update status
  client.handle("FirmwareStatusNotification", ({ params }) => {
    console.log(
      `Server got FirmwareStatusNotification from ${client.identity}:`,
      params
    );
    // params: status (Downloaded, DownloadFailed, InstallationFailed, Installed, Installing)

    // No response data required
    return {};
  });

  // DiagnosticsStatusNotification - Reports diagnostics upload status
  client.handle("DiagnosticsStatusNotification", ({ params }) => {
    console.log(
      `Server got DiagnosticsStatusNotification from ${client.identity}:`,
      params
    );
    // params: status (Idle, Uploaded, UploadFailed, Uploading)

    // No response data required
    return {};
  });
});

// Export server and utility functions
// Export the server as the main export
const handler = server;

// Attach utility functions and properties
handler.connectedClients = connectedClients;
handler.getClient = (chargePointId) => {
  const clientData = connectedClients.get(chargePointId);
  return clientData ? clientData.client : null;
};
handler.getAllClients = () => {
  return Array.from(connectedClients.entries()).map(([id, data]) => ({
    chargePointId: id,
    connectedAt: data.connectedAt,
    lastHeartbeat: data.lastHeartbeat,
    status: data.status,
    transactionCount: data.transactions.length,
    activeTransactions: data.transactions.filter((t) => !t.stoppedAt).length,
  }));
};

export default handler;
