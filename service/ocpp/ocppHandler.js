import { RPCServer, createRPCError } from "ocpp-rpc";
import authorize from "./authorize.js";
import { v4 as uuidv4 } from "uuid";
import ChargePoint from "../../model/ocpp/ChargePoint.js";

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
    status: "connected",
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
    chargePoint.status = "connected";
    chargePoint.identifier = client.identity;
    chargePoint.sessionId = uuidv4();
    await chargePoint.save();
  }

  // Handle client disconnect
  client.on("close", () => {
    console.log(`OCPP Client disconnected: ${chargePointId}`);
    if (connectedClients.has(chargePointId)) {
      const clientData = connectedClients.get(chargePointId);
      clientData.status = "disconnected";
      clientData.disconnectedAt = new Date();

      chargePoint.sessionId = null;
      chargePoint.status = "disconnected";
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

  client.handle("Heartbeat", ({ params }) => {
    console.log(`Server got Heartbeat from ${client.identity}:`, params);

    // Update last heartbeat time
    if (connectedClients.has(chargePointId)) {
      connectedClients.get(chargePointId).lastHeartbeat = new Date();
    }

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

  client.handle("StartTransaction", ({ params }) => {
    console.log(`Server got StartTransaction from ${client.identity}:`, params);
    // params: connectorId, idTag, meterStart, reservationId, timestamp

    // Generate a transaction ID (in production, this should be stored in database)
    const transactionId = Math.floor(Math.random() * 1000000);

    // Store transaction
    if (connectedClients.has(chargePointId)) {
      const clientData = connectedClients.get(chargePointId);
      clientData.transactions.push({
        transactionId: transactionId,
        connectorId: params.connectorId,
        idTag: params.idTag,
        meterStart: params.meterStart,
        timestamp: params.timestamp,
        startedAt: new Date(),
      });
    }

    return {
      transactionId: transactionId,
      idTagInfo: {
        status: "Accepted", // Can be: Accepted, Blocked, Expired, Invalid, ConcurrentTx
        expiryDate: null, // Optional: ISO 8601 date when idTag expires
        parentIdTag: null, // Optional: parent idTag if this is a child tag
      },
    };
  });

  client.handle("StopTransaction", ({ params }) => {
    console.log(`Server got StopTransaction from ${client.identity}:`, params);

    // Mark transaction as stopped
    if (connectedClients.has(chargePointId)) {
      const clientData = connectedClients.get(chargePointId);
      const transaction = clientData.transactions.find(
        (t) => t.transactionId === params.transactionId
      );
      if (transaction) {
        transaction.stoppedAt = new Date();
        transaction.meterStop = params.meterStop;
        transaction.reason = params.reason;
      }
    }

    return {
      idTagInfo: {
        status: "Accepted",
      },
    };
  });

  // Authorize - Verifies if an idTag is authorized to start a transaction
  client.handle("Authorize", ({ params }) => {
    console.log(`Server got Authorize from ${client.identity}:`, params);

    // Use authorize service to check idTag
    const idTagInfo = authorize.authorizeOCPPRequest(params.idTag);

    return {
      idTagInfo: idTagInfo,
    };
  });

  // StatusNotification - Informs about the status of a connector
  client.handle("StatusNotification", ({ params }) => {
    console.log(
      `Server got StatusNotification from ${client.identity}:`,
      params
    );
    // params: connectorId, errorCode, status, info, timestamp, vendorId, vendorErrorCode

    // No response data required, but we return empty object to acknowledge
    return {};
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
