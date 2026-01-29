import { RPCServer, createRPCError } from "ocpp-rpc";
import authorize from "./authorize.js";
import { v4 as uuidv4 } from "uuid";
import ChargePoint from "../../model/ocpp/ChargePoint.js";
import Heartbeat from "../../model/ocpp/Heartbeat.js";
import transactionService from "../management/transactionService.js";
import chargePointService from "../management/chargePointService.js";
import statusNotificationService from "./statusNotificationService.js";
import { createMeterValueFromOCPP } from "./meterValueService.js";
import { createConsumptionFromTransaction } from "../management/consumptionService.js";

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
      })`,
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

  client.handle("MeterValues", async ({ params }) => {
    console.log(`Server got MeterValues from ${client.identity}:`, params);
    // OCPP MeterValues params structure:
    // - connectorId (required)
    // - transactionId (optional, only present if transaction is active)
    // - meterValue (array of {timestamp, sampledValue[]})

    try {
      const chargePointIdentifier = client.identity;

      // Validate required parameters
      if (
        params.connectorId === undefined ||
        !params.meterValue ||
        !Array.isArray(params.meterValue)
      ) {
        console.error(
          "Missing required parameters: connectorId or meterValue array",
        );
        return {};
      }

      // Verify charge point exists
      const chargePoint = await chargePointService.getChargePointByIdentifier(
        chargePointIdentifier,
      );

      if (!chargePoint) {
        console.error(`Charge point ${chargePointIdentifier} not found`);
        return {};
      }

      // If transactionId is provided, verify transaction exists
      if (params.transactionId) {
        const transaction =
          await transactionService.getTransactionByTransactionId(
            params.transactionId,
          );

        if (transaction) {
          console.log(
            `MeterValues received for active transaction ${params.transactionId}`,
          );
        } else {
          console.warn(
            `MeterValues received for non-existent transaction ${params.transactionId}`,
          );
        }
      }

      // Process each meter value entry in the array
      // Each meterValue entry creates one MeterValue document in the database
      const savedMeterValues = [];

      for (const meterValueEntry of params.meterValue) {
        try {
          // Each meterValue entry has: timestamp and sampledValue array
          if (!meterValueEntry.timestamp) {
            console.warn(
              "MeterValue entry missing timestamp, skipping",
              meterValueEntry,
            );
            continue;
          }

          // Prepare meter value data according to OCPP format
          // createMeterValueFromOCPP expects meterValue array where each entry has sampledValue
          // We pass a single entry wrapped in an array
          const meterValueParams = {
            connectorId: params.connectorId,
            transactionId: params.transactionId || null,
            timestamp: meterValueEntry.timestamp,
            meterValue: [
              {
                sampledValue: meterValueEntry.sampledValue || [],
              },
            ],
          };

          // Save meter value to database
          // The service will extract all sampledValues from the meterValue array
          const savedMeterValue = await createMeterValueFromOCPP(
            chargePointIdentifier,
            meterValueParams,
          );

          savedMeterValues.push(savedMeterValue);

          const sampledValueCount = (meterValueEntry.sampledValue || []).length;
          console.log(
            `MeterValue saved: ID=${
              savedMeterValue._id
            }, chargePoint=${chargePointIdentifier}, connector=${
              params.connectorId
            }, transaction=${params.transactionId || "N/A"}, timestamp=${
              meterValueEntry.timestamp
            }, sampledValues=${sampledValueCount}`,
          );
        } catch (error) {
          console.error(
            `Error saving meter value entry: ${error.message}`,
            error,
          );
          // Continue processing other meter values even if one fails
        }
      }

      console.log(
        `Successfully saved ${savedMeterValues.length} of ${params.meterValue.length} meter value entries`,
      );

      // OCPP MeterValues doesn't require a response (empty object is acceptable)
      return {};
    } catch (error) {
      console.error(`Error handling MeterValues: ${error.message}`, error);
      // OCPP MeterValues doesn't require a response, but we return empty object
      return {};
    }
  });

  client.handle("StartTransaction", async ({ params }) => {
    console.log(`Server got StartTransaction from ${client.identity}:`, params);
    // params: connectorId, idTag, meterStart, reservationId, timestamp

    try {
      const chargePointIdentifier = client.identity;

      // Validate required parameters
      if (
        params.connectorId === undefined ||
        !params.idTag ||
        params.meterStart === undefined
      ) {
        throw new Error(
          "Missing required parameters: connectorId, idTag, or meterStart",
        );
      }

      // Get charge point
      const chargePoint = await chargePointService.getChargePointByIdentifier(
        chargePointIdentifier,
      );

      if (!chargePoint) {
        throw new Error(`Charge point ${chargePointIdentifier} not found`);
      }

      // Prepare transaction data
      // transactionId will be auto-generated by createTransaction if not provided
      const transactionData = {
        chargePointId: chargePointIdentifier, // Use identifier string for consistency
        connectorId: params.connectorId,
        idTag: params.idTag,
        meterStart: params.meterStart,
        timestamp: params.timestamp ? new Date(params.timestamp) : new Date(),
        startedAt: new Date(),
        status: "Active", // Explicitly set status
      };

      // Add reservationId if provided
      if (params.reservationId !== undefined) {
        transactionData.reservationId = params.reservationId;
      }

      console.log(
        `Creating transaction with data: ${JSON.stringify(transactionData)}`,
      );

      // Create transaction (transactionId will be auto-generated)
      const transaction =
        await transactionService.createTransaction(transactionData);

      console.log(
        `Transaction created with ID: ${transaction.transactionId}, MongoDB _id: ${transaction._id}`,
      );

      // Authorize idTag
      let idTagInfo = {
        status: "Accepted",
      };

      try {
        const authResult = await authorize.authorizeOCPPRequest(params.idTag);
        idTagInfo = authResult;
      } catch (error) {
        console.error(
          `Error authorizing idTag ${params.idTag}: ${error.message}`,
        );
        // Default to Accepted if authorization fails
        idTagInfo = { status: "Accepted" };
      }

      return {
        transactionId: transaction.transactionId,
        idTagInfo: idTagInfo,
      };
    } catch (error) {
      console.error(`Error handling StartTransaction: ${error.message}`);
      throw error;
    }
  });

  client.handle("StopTransaction", async ({ params }) => {
    console.log(`Server got StopTransaction from ${client.identity}:`, params);
    // params: transactionId, idTag, meterStop, timestamp, reason

    try {
      const chargePointIdentifier = client.identity;
      const { transactionId, idTag, meterStop, timestamp, reason } = params;

      // Validate required parameters
      if (transactionId === undefined) {
        throw new Error("Missing required parameter: transactionId");
      }

      // Verify charge point exists
      const chargePoint = await chargePointService.getChargePointByIdentifier(
        chargePointIdentifier,
      );

      if (!chargePoint) {
        throw new Error(`Charge point ${chargePointIdentifier} not found`);
      }

      // Get transaction by OCPP transactionId (not MongoDB _id)
      const transaction =
        await transactionService.getTransactionByTransactionId(transactionId);

      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      // Verify transaction belongs to this charge point
      // Handle both cases: chargePointId as identifier string or MongoDB _id string
      const transactionChargePointId = transaction.chargePointId?.toString();
      const chargePointIdString = chargePoint._id?.toString();

      if (
        transactionChargePointId !== chargePointIdentifier &&
        transactionChargePointId !== chargePointIdString
      ) {
        console.warn(
          `Transaction ${transactionId} chargePointId mismatch. Transaction: ${transactionChargePointId}, ChargePoint: ${chargePointIdentifier} or ${chargePointIdString}`,
        );
        // Don't throw error, just log warning - might be due to data inconsistency
      }

      // Prepare stop data
      const stopData = {
        meterStop: meterStop,
        timestamp: timestamp,
        reason: reason,
        idTag: idTag,
      };

      // Stop the transaction and update in database
      const updatedTransaction = await transactionService.stopTransaction(
        transactionId,
        stopData,
      );

      // Calculate and persist consumption using this charge point's connector tariff
      try {
        await createConsumptionFromTransaction(transactionId);
        console.log(
          `Consumption calculated for transaction ${transactionId} (chargePoint ${chargePointIdentifier}, connector ${transaction.connectorId})`,
        );
      } catch (consumptionError) {
        // Log but do not fail StopTransaction; OCPP response must still succeed
        console.error(
          `Failed to create consumption for transaction ${transactionId}:`,
          consumptionError.message,
        );
      }

      console.log(
        `Transaction ${transactionId} stopped successfully. Status: ${updatedTransaction.status}, MeterStop: ${updatedTransaction.meterStop}, StopReason: ${updatedTransaction.stopReason}`,
      );
      console.log(
        `Updated transaction in database: ${JSON.stringify({
          transactionId: updatedTransaction.transactionId,
          status: updatedTransaction.status,
          stoppedAt: updatedTransaction.stoppedAt,
          meterStop: updatedTransaction.meterStop,
          stopReason: updatedTransaction.stopReason,
        })}`,
      );

      // Authorize idTag if provided (OCPP 1.6 requires idTagInfo in response)
      let idTagInfo = {
        status: "Accepted",
      };

      if (idTag) {
        try {
          const authResult = await authorize.authorizeOCPPRequest(idTag);
          idTagInfo = authResult;
        } catch (error) {
          console.error(`Error authorizing idTag ${idTag}: ${error.message}`);
          // Default to Accepted if authorization fails
          idTagInfo = { status: "Accepted" };
        }
      }

      // Return valid OCPP StopTransaction response
      return {
        idTagInfo: idTagInfo,
      };
    } catch (error) {
      console.error(`Error handling StopTransaction: ${error.message}`);
      throw error;
    }
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
        idTagInfo.status,
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
      params,
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
        chargePointIdentifier,
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
        additionalData,
      );

      console.log(
        `Connector ${connectorId} status updated to ${status} for charge point ${chargePointIdentifier}`,
      );

      // Save StatusNotification record for history
      const statusNotification =
        await statusNotificationService.saveStatusNotification(
          chargePointIdentifier,
          connectorId,
          status,
          additionalData,
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
      params,
    );
    // params: status (Downloaded, DownloadFailed, InstallationFailed, Installed, Installing)

    // No response data required
    return {};
  });

  // DiagnosticsStatusNotification - Reports diagnostics upload status
  client.handle("DiagnosticsStatusNotification", ({ params }) => {
    console.log(
      `Server got DiagnosticsStatusNotification from ${client.identity}:`,
      params,
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
