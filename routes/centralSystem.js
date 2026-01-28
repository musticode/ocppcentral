import express from "express";
import centralSystemService from "../service/ocpp/centralSystemService.js";

const router = express.Router({ mergeParams: true });

/** Base path expects :chargePointId — mount as /api/central-system/charge-points/:chargePointId */
const getChargePointId = (req) => req.params.chargePointId;

/** Send service result as JSON; 404 if charge point not connected, 400 for validation. */
function sendResult(res, result, validationError = null) {
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError.message });
  }
  if (result.success) {
    return res.status(200).json(result);
  }
  const isNotFound =
    result.error && /not connected|Charge point .* is not connected/i.test(result.error);
  return res.status(isNotFound ? 404 : 400).json(result);
}

/** Change availability: sets charger/connector as available or unavailable */
router.post("/change-availability", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { connectorId, type } = req.body ?? {};
    if (connectorId == null) validationError = new Error("connectorId is required");
    else if (!type) validationError = new Error("type is required (Operative | Inoperative)");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.changeAvailability(
      chargePointId,
      connectorId,
      type
    );
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Change configuration: updates charger configuration parameters */
router.post("/change-configuration", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { key, value } = req.body ?? {};
    if (!key) validationError = new Error("key is required");
    else if (value === undefined || value === null) validationError = new Error("value is required");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.changeConfiguration(
      chargePointId,
      key,
      value
    );
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Clear cache: clears local authorization cache */
router.post("/clear-cache", async (req, res) => {
  try {
    const chargePointId = getChargePointId(req);
    const result = await centralSystemService.clearCache(chargePointId);
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Get configuration: retrieves current configuration from the charger */
router.get("/get-configuration", async (req, res) => {
  try {
    const chargePointId = getChargePointId(req);
    const keys =
      typeof req.query.keys === "string"
        ? req.query.keys.split(",").map((k) => k.trim()).filter(Boolean)
        : [];
    const result = await centralSystemService.getConfiguration(chargePointId, keys);
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Remote start transaction; IdTag times out after 120 seconds on the charger */
router.post("/remote-start-transaction", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { idTag, connectorId } = req.body ?? {};
    if (!idTag) validationError = new Error("idTag is required");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.remoteStartTransaction(chargePointId, {
      idTag,
      connectorId,
    });
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Remote stop transaction */
router.post("/remote-stop-transaction", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { transactionId } = req.body ?? {};
    if (transactionId == null) validationError = new Error("transactionId is required");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.remoteStopTransaction(
      chargePointId,
      transactionId
    );
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Reset charger (Hard | Soft) */
router.post("/reset", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { type } = req.body ?? {};
    if (!type) validationError = new Error("type is required (Hard | Soft)");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.reset(chargePointId, type);
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Unlock connector (typically returns UnlockStatus.NotSupported) */
router.post("/unlock-connector", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { connectorId } = req.body ?? {};
    if (connectorId == null) validationError = new Error("connectorId is required");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.unlockConnector(
      chargePointId,
      connectorId
    );
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Get diagnostics: upload to FTP or HTTP POST location */
router.post("/get-diagnostics", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { location, startTime, stopTime, retries, retryInterval } = req.body ?? {};
    if (!location) validationError = new Error("location (URI) is required");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.getDiagnostics(chargePointId, {
      location,
      startTime,
      stopTime,
      retries,
      retryInterval,
    });
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Update firmware (always from ZapCloud; location/retrieveDate/retries ignored) */
router.post("/update-firmware", async (req, res) => {
  try {
    const chargePointId = getChargePointId(req);
    const { retries, retryInterval } = req.body ?? {};
    const result = await centralSystemService.updateFirmware(chargePointId, {
      retries,
      retryInterval,
    });
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Send local list of authorization entries */
router.post("/send-local-list", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { listVersion, localAuthorizationList, updateType } = req.body ?? {};
    if (listVersion == null) validationError = new Error("listVersion is required");
    else if (!Array.isArray(localAuthorizationList))
      validationError = new Error("localAuthorizationList must be an array");
    else if (!updateType)
      validationError = new Error("updateType is required (Full | Differential)");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.sendLocalList(chargePointId, {
      listVersion,
      localAuthorizationList,
      updateType,
    });
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Get local list version */
router.get("/get-local-list-version", async (req, res) => {
  try {
    const chargePointId = getChargePointId(req);
    const result = await centralSystemService.getLocalListVersion(chargePointId);
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Reserve now: reserve a connector */
router.post("/reserve-now", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { connectorId, expiryDate, idTag, reservationId, parentIdTag } = req.body ?? {};
    if (connectorId == null) validationError = new Error("connectorId is required");
    else if (!expiryDate) validationError = new Error("expiryDate is required (ISO 8601)");
    else if (!idTag) validationError = new Error("idTag is required");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.reserveNow(chargePointId, {
      connectorId,
      expiryDate,
      idTag,
      reservationId,
      parentIdTag,
    });
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Trigger message: request charger to send a specific message */
router.post("/trigger-message", async (req, res) => {
  let validationError = null;
  try {
    const chargePointId = getChargePointId(req);
    const { requestedMessage, connectorId } = req.body ?? {};
    if (!requestedMessage) validationError = new Error("requestedMessage is required");
    if (validationError) return sendResult(res, null, validationError);
    const result = await centralSystemService.triggerMessage(chargePointId, {
      requestedMessage,
      connectorId,
    });
    return sendResult(res, result);
  } catch (e) {
    return sendResult(res, { success: false, error: e?.message || String(e) });
  }
});

/** Optional: list supported trigger message types */
router.get("/trigger-message-types", (_req, res) => {
  res.json({
    success: true,
    data: { ...centralSystemService.TriggerMessageType },
  });
});

export default router;
