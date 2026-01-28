import ocppHandler from "./ocppHandler.js";

/** Default timeout for OCPP calls (ms). Remote start IdTag typically times out after 120s on the charger side. */
const DEFAULT_CALL_TIMEOUT_MS = 30000;

/**
 * Get the OCPP client for a charge point. Throws if not connected.
 * @param {string} chargePointId - Charge point identifier (must match client.identity used in ocppHandler)
 * @returns {{ client: object }} - The ocpp-rpc client
 */
function getClient(chargePointId) {
  if (!chargePointId) {
    throw new Error("chargePointId is required");
  }
  const client = ocppHandler.getClient(chargePointId);
  if (!client) {
    throw new Error(`Charge point ${chargePointId} is not connected`);
  }
  return client;
}

/**
 * Execute an OCPP call and normalize result/errors into { success, data?, error?, raw? }.
 * @param {string} chargePointId
 * @param {string} action - OCPP action name (e.g. "ChangeAvailability")
 * @param {object} params - Request payload
 * @param {number} [timeoutMs]
 * @returns {Promise<{ success: boolean, data?: object, error?: string, raw?: object }>}
 */
async function call(chargePointId, action, params = {}, timeoutMs = DEFAULT_CALL_TIMEOUT_MS) {
  const client = getClient(chargePointId);
  try {
    const raw = await Promise.race([
      client.call(action, params),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("Request timeout")), timeoutMs)
      ),
    ]);
    return { success: true, data: raw, raw };
  } catch (err) {
    const message = err.message || (err.errorCode != null ? `OCPP error ${err.errorCode}` : "Unknown error");
    return { success: false, error: message, raw: err };
  }
}

// --- Operations ---

/**
 * Change availability: sets charger (or a connector) as available or unavailable.
 * @param {string} chargePointId
 * @param {number} connectorId - 0 = whole charge point, 1..n = specific connector
 * @param {"Operative"|"Inoperative"} type
 */
export async function changeAvailability(chargePointId, connectorId, type) {
  if (type !== "Operative" && type !== "Inoperative") {
    throw new Error('type must be "Operative" or "Inoperative"');
  }
  return call(chargePointId, "ChangeAvailability", {
    connectorId: Number(connectorId),
    type,
  });
}

/**
 * Change configuration: updates charger configuration parameters.
 * @param {string} chargePointId
 * @param {string} key - Configuration key name
 * @param {string} value - New value
 */
export async function changeConfiguration(chargePointId, key, value) {
  if (!key || value === undefined || value === null) {
    throw new Error("key and value are required");
  }
  return call(chargePointId, "ChangeConfiguration", {
    key: String(key),
    value: String(value),
  });
}

/**
 * Clear cache: clears local authorization cache on the charger.
 * @param {string} chargePointId
 */
export async function clearCache(chargePointId) {
  return call(chargePointId, "ClearCache", {});
}

/**
 * Get configuration: retrieves current configuration from the charger.
 * @param {string} chargePointId
 * @param {string[]} [keys] - Optional list of keys. Omit or empty to request all.
 */
export async function getConfiguration(chargePointId, keys = []) {
  const params = Array.isArray(keys) && keys.length > 0 ? { key: keys } : {};
  return call(chargePointId, "GetConfiguration", params);
}

/**
 * Remote start transaction: starts a transaction remotely.
 * IdTag typically times out after 120 seconds on the charge point.
 * @param {string} chargePointId
 * @param {object} options
 * @param {string} options.idTag - Authorization tag
 * @param {number} [options.connectorId] - Optional connector; if omitted, charger may choose.
 */
export async function remoteStartTransaction(chargePointId, options) {
  const { idTag, connectorId } = options || {};
  if (!idTag) {
    throw new Error("idTag is required for RemoteStartTransaction");
  }
  const params = { idTag };
  if (connectorId != null) {
    params.connectorId = Number(connectorId);
  }
  return call(chargePointId, "RemoteStartTransaction", params);
}

/**
 * Remote stop transaction: stops a transaction remotely.
 * @param {string} chargePointId
 * @param {number} transactionId - OCPP transaction id from the charger
 */
export async function remoteStopTransaction(chargePointId, transactionId) {
  if (transactionId == null) {
    throw new Error("transactionId is required for RemoteStopTransaction");
  }
  return call(chargePointId, "RemoteStopTransaction", {
    transactionId: Number(transactionId),
  });
}

/**
 * Reset: resets the charger.
 * @param {string} chargePointId
 * @param {"Hard"|"Soft"} type
 */
export async function reset(chargePointId, type) {
  if (type !== "Hard" && type !== "Soft") {
    throw new Error('type must be "Hard" or "Soft"');
  }
  return call(chargePointId, "Reset", { type });
}

/**
 * Unlock connector: provided but non-functional; returns UnlockStatus.NotSupported.
 * @param {string} chargePointId
 * @param {number} connectorId
 */
export async function unlockConnector(chargePointId, connectorId) {
  return call(chargePointId, "UnlockConnector", {
    connectorId: Number(connectorId),
  });
}

/**
 * Get diagnostics: uploads predefined observation values to the specified FTP or HTTP POST location.
 * @param {string} chargePointId
 * @param {object} options
 * @param {string} options.location - URI (e.g. ftp://… or https://…)
 * @param {string} [options.startTime] - ISO 8601
 * @param {string} [options.stopTime] - ISO 8601
 * @param {number} [options.retries]
 * @param {number} [options.retryInterval] - seconds
 */
export async function getDiagnostics(chargePointId, options = {}) {
  const { location, startTime, stopTime, retries, retryInterval } = options;
  if (!location) {
    throw new Error("location (URI) is required for GetDiagnostics");
  }
  const params = { location };
  if (startTime != null) params.startTime = startTime;
  if (stopTime != null) params.stopTime = stopTime;
  if (retries != null) params.retries = Number(retries);
  if (retryInterval != null) params.retryInterval = Number(retryInterval);
  return call(chargePointId, "GetDiagnostics", params);
}

/**
 * Update firmware: firmware is always downloaded from ZapCloud.
 * Location, RetrieveDate, and Retries are ignored by the charge point.
 * @param {string} chargePointId
 * @param {object} [options] - Optional; location/retrieveDate/retries are ignored.
 * @param {number} [options.retries]
 * @param {number} [options.retryInterval]
 */
export async function updateFirmware(chargePointId, options = {}) {
  const params = {
    location: "https://zapcloud/firmware",
    retrieveDate: new Date().toISOString(),
  };
  if (options.retries != null) params.retries = Number(options.retries);
  if (options.retryInterval != null) params.retryInterval = Number(options.retryInterval);
  return call(chargePointId, "UpdateFirmware", params);
}

/**
 * Send local list: sends a list of local authorization entries.
 * @param {string} chargePointId
 * @param {object} options
 * @param {number} options.listVersion - Version of the list
 * @param {Array<{idTag: string, idTagInfo?: object}>} options.localAuthorizationList
 * @param {"Full"|"Differential"} options.updateType
 */
export async function sendLocalList(chargePointId, options = {}) {
  const { listVersion, localAuthorizationList, updateType } = options;
  if (listVersion == null) {
    throw new Error("listVersion is required for SendLocalList");
  }
  if (!Array.isArray(localAuthorizationList)) {
    throw new Error("localAuthorizationList must be an array");
  }
  if (updateType !== "Full" && updateType !== "Differential") {
    throw new Error('updateType must be "Full" or "Differential"');
  }
  return call(chargePointId, "SendLocalList", {
    listVersion: Number(listVersion),
    localAuthorizationList,
    updateType,
  });
}

/**
 * Get local list version: retrieves the version of the local list on the charger.
 * @param {string} chargePointId
 */
export async function getLocalListVersion(chargePointId) {
  return call(chargePointId, "GetLocalListVersion", {});
}

/**
 * Reserve now: reserves a connector.
 * @param {string} chargePointId
 * @param {object} options
 * @param {number} options.connectorId
 * @param {string} options.expiryDate - ISO 8601
 * @param {string} options.idTag
 * @param {number} [options.reservationId] - If omitted, backend may generate
 * @param {string} [options.parentIdTag]
 */
export async function reserveNow(chargePointId, options = {}) {
  const { connectorId, expiryDate, idTag, reservationId, parentIdTag } = options;
  if (connectorId == null) {
    throw new Error("connectorId is required for ReserveNow");
  }
  if (!expiryDate) {
    throw new Error("expiryDate is required for ReserveNow");
  }
  if (!idTag) {
    throw new Error("idTag is required for ReserveNow");
  }
  const params = {
    connectorId: Number(connectorId),
    expiryDate,
    idTag,
  };
  if (reservationId != null) params.reservationId = Number(reservationId);
  if (parentIdTag != null) params.parentIdTag = parentIdTag;
  return call(chargePointId, "ReserveNow", params);
}

/** TriggerMessage requestedMessage values (OCPP 1.6 MessageTrigger). */
export const TriggerMessageType = Object.freeze({
  BootNotification: "BootNotification",
  DiagnosticsStatusNotification: "DiagnosticsStatusNotification",
  FirmwareStatusNotification: "FirmwareStatusNotification",
  Heartbeat: "Heartbeat",
  MeterValues: "MeterValues",
  StatusNotification: "StatusNotification",
});

/**
 * Trigger message: requests the charger to send a specific message.
 * @param {string} chargePointId
 * @param {object} options
 * @param {string} options.requestedMessage - One of TriggerMessageType values
 * @param {number} [options.connectorId] - Optional; required for MeterValues
 */
export async function triggerMessage(chargePointId, options = {}) {
  const { requestedMessage, connectorId } = options;
  if (!requestedMessage) {
    throw new Error("requestedMessage is required for TriggerMessage");
  }
  const params = { requestedMessage };
  if (connectorId != null) {
    params.connectorId = Number(connectorId);
  }
  return call(chargePointId, "TriggerMessage", params);
}

export default {
  getClient: (id) => getClient(id),
  changeAvailability,
  changeConfiguration,
  clearCache,
  getConfiguration,
  remoteStartTransaction,
  remoteStopTransaction,
  reset,
  unlockConnector,
  getDiagnostics,
  updateFirmware,
  sendLocalList,
  getLocalListVersion,
  reserveNow,
  triggerMessage,
  TriggerMessageType,
};
