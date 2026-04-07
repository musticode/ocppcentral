import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock all external dependencies so we can test handler logic in isolation.
// The real ocppHandler.js registers handlers inside the `server.on("client")`
// callback, so we replicate the handler logic here against the mocked deps.
// ---------------------------------------------------------------------------

// --- Mongoose models -------------------------------------------------------
vi.mock("../../model/ocpp/ChargePoint.js", () => {
  const findOne = vi.fn();
  const findOneAndUpdate = vi.fn();
  const ChargePoint = vi.fn().mockImplementation((data) => ({
    ...data,
    save: vi.fn().mockResolvedValue(data),
  }));
  ChargePoint.findOne = findOne;
  ChargePoint.findOneAndUpdate = findOneAndUpdate;
  return { default: ChargePoint };
});

vi.mock("../../model/ocpp/Heartbeat.js", () => {
  const Heartbeat = vi.fn().mockImplementation((data) => ({
    ...data,
    save: vi.fn().mockResolvedValue(data),
  }));
  return { default: Heartbeat };
});

// --- Services --------------------------------------------------------------
const mockAuthorize = {
  authorizeOCPPRequest: vi.fn(),
  saveAuthorization: vi.fn(),
};
vi.mock("../../service/ocpp/authorize.js", () => ({ default: mockAuthorize }));

const mockChargePointService = {
  getChargePointByIdentifier: vi.fn(),
  createOrUpdateConnectorStatus: vi.fn(),
};
vi.mock("../../service/management/chargePointService.js", () => ({
  default: mockChargePointService,
}));

const mockTransactionService = {
  createTransaction: vi.fn(),
  getTransactionByTransactionId: vi.fn(),
  stopTransaction: vi.fn(),
};
vi.mock("../../service/management/transactionService.js", () => ({
  default: mockTransactionService,
}));

const mockCreateMeterValueFromOCPP = vi.fn();
vi.mock("../../service/ocpp/meterValueService.js", () => ({
  createMeterValueFromOCPP: mockCreateMeterValueFromOCPP,
}));

const mockStatusNotificationService = {
  saveStatusNotification: vi.fn(),
};
vi.mock("../../service/ocpp/statusNotificationService.js", () => ({
  default: mockStatusNotificationService,
}));

const mockCreateConsumptionFromTransaction = vi.fn();
vi.mock("../../service/management/consumptionService.js", () => ({
  createConsumptionFromTransaction: mockCreateConsumptionFromTransaction,
}));

// ---------------------------------------------------------------------------
// Helpers — replicate handler logic extracted from ocppHandler.js
// ---------------------------------------------------------------------------

function bootNotificationHandler({ params }) {
  return {
    status: "Accepted",
    interval: 300,
    currentTime: new Date().toISOString(),
  };
}

function heartbeatHandler({ params }) {
  return {
    currentTime: new Date().toISOString(),
  };
}

async function authorizeHandler(clientIdentity, { params }) {
  const idTagInfo = await mockAuthorize.authorizeOCPPRequest(params.idTag);
  if (params.idTag && idTagInfo) {
    await mockAuthorize.saveAuthorization(
      clientIdentity,
      params.idTag,
      idTagInfo,
      idTagInfo.status
    );
  }
  return { idTagInfo };
}

async function statusNotificationHandler(clientIdentity, { params }) {
  const {
    connectorId,
    status,
    errorCode,
    info,
    vendorId,
    vendorErrorCode,
    timestamp,
  } = params;

  if (connectorId === undefined || !status) {
    throw new Error("Missing required parameters: connectorId and status");
  }

  const chargePoint =
    await mockChargePointService.getChargePointByIdentifier(clientIdentity);
  if (!chargePoint) {
    throw new Error(`Charge point ${clientIdentity} not found`);
  }

  const additionalData = {};
  if (errorCode && errorCode.trim() !== "") additionalData.errorCode = errorCode;
  if (info && info.trim() !== "") additionalData.info = info;
  if (vendorId && vendorId.trim() !== "") additionalData.vendorId = vendorId;
  if (vendorErrorCode && vendorErrorCode.trim() !== "")
    additionalData.vendorErrorCode = vendorErrorCode;
  if (timestamp) additionalData.timestamp = new Date(timestamp);

  await mockChargePointService.createOrUpdateConnectorStatus(
    clientIdentity,
    connectorId,
    status,
    additionalData
  );

  await mockStatusNotificationService.saveStatusNotification(
    clientIdentity,
    connectorId,
    status,
    additionalData
  );

  return {};
}

async function startTransactionHandler(clientIdentity, { params }) {
  if (
    params.connectorId === undefined ||
    !params.idTag ||
    params.meterStart === undefined
  ) {
    throw new Error(
      "Missing required parameters: connectorId, idTag, or meterStart"
    );
  }

  const chargePoint =
    await mockChargePointService.getChargePointByIdentifier(clientIdentity);
  if (!chargePoint) {
    throw new Error(`Charge point ${clientIdentity} not found`);
  }

  const transactionData = {
    chargePointId: clientIdentity,
    connectorId: params.connectorId,
    idTag: params.idTag,
    meterStart: params.meterStart,
    timestamp: params.timestamp ? new Date(params.timestamp) : new Date(),
    startedAt: new Date(),
    status: "Active",
  };

  if (params.reservationId !== undefined) {
    transactionData.reservationId = params.reservationId;
  }

  const transaction =
    await mockTransactionService.createTransaction(transactionData);

  let idTagInfo = { status: "Accepted" };
  try {
    const authResult = await mockAuthorize.authorizeOCPPRequest(params.idTag);
    idTagInfo = authResult;
  } catch {
    idTagInfo = { status: "Accepted" };
  }

  return {
    transactionId: transaction.transactionId,
    idTagInfo,
  };
}

async function stopTransactionHandler(clientIdentity, { params }) {
  const { transactionId, idTag, meterStop, timestamp, reason } = params;

  if (transactionId === undefined) {
    throw new Error("Missing required parameter: transactionId");
  }

  const chargePoint =
    await mockChargePointService.getChargePointByIdentifier(clientIdentity);
  if (!chargePoint) {
    throw new Error(`Charge point ${clientIdentity} not found`);
  }

  const transaction =
    await mockTransactionService.getTransactionByTransactionId(transactionId);
  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  const stopData = { meterStop, timestamp, reason, idTag };
  const updatedTransaction = await mockTransactionService.stopTransaction(
    transactionId,
    stopData
  );

  try {
    await mockCreateConsumptionFromTransaction(transactionId);
  } catch {
    // consumption errors are logged but not fatal
  }

  let idTagInfo = { status: "Accepted" };
  if (idTag) {
    try {
      const authResult = await mockAuthorize.authorizeOCPPRequest(idTag);
      idTagInfo = authResult;
    } catch {
      idTagInfo = { status: "Accepted" };
    }
  }

  return { idTagInfo };
}

async function meterValuesHandler(clientIdentity, { params }) {
  if (
    params.connectorId === undefined ||
    !params.meterValue ||
    !Array.isArray(params.meterValue)
  ) {
    return {};
  }

  const chargePoint =
    await mockChargePointService.getChargePointByIdentifier(clientIdentity);
  if (!chargePoint) {
    return {};
  }

  for (const meterValueEntry of params.meterValue) {
    if (!meterValueEntry.timestamp) continue;

    const meterValueParams = {
      connectorId: params.connectorId,
      transactionId: params.transactionId || null,
      timestamp: meterValueEntry.timestamp,
      meterValue: [{ sampledValue: meterValueEntry.sampledValue || [] }],
    };

    await mockCreateMeterValueFromOCPP(clientIdentity, meterValueParams);
  }

  return {};
}

function dataTransferHandler({ params }) {
  return {
    status: "Accepted",
    data: null,
  };
}

function firmwareStatusNotificationHandler({ params }) {
  return {};
}

function diagnosticsStatusNotificationHandler({ params }) {
  return {};
}

// ===========================================================================
// Tests
// ===========================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// BootNotification
// ---------------------------------------------------------------------------
describe("BootNotification", () => {
  it("should return Accepted status with interval and currentTime", () => {
    const params = {
      chargePointVendor: "TestVendor",
      chargePointModel: "TestModel",
      chargePointSerialNumber: "SN123456",
      firmwareVersion: "1.0.0",
    };

    const response = bootNotificationHandler({ params });

    expect(response).toHaveProperty("status", "Accepted");
    expect(response).toHaveProperty("interval", 300);
    expect(response).toHaveProperty("currentTime");
    expect(new Date(response.currentTime).toString()).not.toBe("Invalid Date");
  });

  it("should accept even with minimal params", () => {
    const response = bootNotificationHandler({
      params: {
        chargePointVendor: "Vendor",
        chargePointModel: "Model",
      },
    });

    expect(response.status).toBe("Accepted");
    expect(typeof response.interval).toBe("number");
  });

  it("should return ISO 8601 formatted currentTime", () => {
    const response = bootNotificationHandler({ params: {} });
    // ISO 8601 pattern check
    expect(response.currentTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});

// ---------------------------------------------------------------------------
// Heartbeat
// ---------------------------------------------------------------------------
describe("Heartbeat", () => {
  it("should return currentTime in ISO 8601 format", () => {
    const response = heartbeatHandler({ params: {} });

    expect(response).toHaveProperty("currentTime");
    expect(response.currentTime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  it("should return only currentTime field", () => {
    const response = heartbeatHandler({ params: {} });
    expect(Object.keys(response)).toEqual(["currentTime"]);
  });
});

// ---------------------------------------------------------------------------
// Authorize
// ---------------------------------------------------------------------------
describe("Authorize", () => {
  const identity = "CP001";

  it("should return Accepted for a valid idTag", async () => {
    mockAuthorize.authorizeOCPPRequest.mockResolvedValue({
      status: "Accepted",
    });
    mockAuthorize.saveAuthorization.mockResolvedValue(null);

    const response = await authorizeHandler(identity, {
      params: { idTag: "TAG001" },
    });

    expect(response).toHaveProperty("idTagInfo");
    expect(response.idTagInfo.status).toBe("Accepted");
    expect(mockAuthorize.saveAuthorization).toHaveBeenCalledWith(
      identity,
      "TAG001",
      { status: "Accepted" },
      "Accepted"
    );
  });

  it("should return Blocked for a blocked idTag", async () => {
    mockAuthorize.authorizeOCPPRequest.mockResolvedValue({
      status: "Blocked",
    });

    const response = await authorizeHandler(identity, {
      params: { idTag: "BLOCKED_TAG" },
    });

    expect(response.idTagInfo.status).toBe("Blocked");
  });

  it("should return Invalid for an unknown idTag", async () => {
    mockAuthorize.authorizeOCPPRequest.mockResolvedValue({
      status: "Invalid",
    });

    const response = await authorizeHandler(identity, {
      params: { idTag: "UNKNOWN_TAG" },
    });

    expect(response.idTagInfo.status).toBe("Invalid");
  });

  it("should return Expired for an expired idTag", async () => {
    mockAuthorize.authorizeOCPPRequest.mockResolvedValue({
      status: "Expired",
      expiryDate: "2020-01-01T00:00:00.000Z",
    });

    const response = await authorizeHandler(identity, {
      params: { idTag: "EXPIRED_TAG" },
    });

    expect(response.idTagInfo.status).toBe("Expired");
    expect(response.idTagInfo).toHaveProperty("expiryDate");
  });

  it("should include parentIdTag when present", async () => {
    mockAuthorize.authorizeOCPPRequest.mockResolvedValue({
      status: "Accepted",
      parentIdTag: "PARENT001",
    });

    const response = await authorizeHandler(identity, {
      params: { idTag: "CHILD001" },
    });

    expect(response.idTagInfo.parentIdTag).toBe("PARENT001");
  });
});

// ---------------------------------------------------------------------------
// StatusNotification
// ---------------------------------------------------------------------------
describe("StatusNotification", () => {
  const identity = "CP001";
  const mockChargePoint = { _id: "abc123", identifier: "CP001" };

  beforeEach(() => {
    mockChargePointService.getChargePointByIdentifier.mockResolvedValue(
      mockChargePoint
    );
    mockChargePointService.createOrUpdateConnectorStatus.mockResolvedValue({
      connectorId: 1,
      status: "Available",
    });
    mockStatusNotificationService.saveStatusNotification.mockResolvedValue({
      _id: "sn123",
    });
  });

  it("should return empty object on success", async () => {
    const response = await statusNotificationHandler(identity, {
      params: {
        connectorId: 1,
        status: "Available",
        errorCode: "NoError",
      },
    });

    expect(response).toEqual({});
  });

  it("should update connector status", async () => {
    await statusNotificationHandler(identity, {
      params: {
        connectorId: 1,
        status: "Charging",
        errorCode: "NoError",
      },
    });

    expect(
      mockChargePointService.createOrUpdateConnectorStatus
    ).toHaveBeenCalledWith(identity, 1, "Charging", { errorCode: "NoError" });
  });

  it("should save status notification record", async () => {
    await statusNotificationHandler(identity, {
      params: {
        connectorId: 0,
        status: "Available",
        errorCode: "NoError",
      },
    });

    expect(
      mockStatusNotificationService.saveStatusNotification
    ).toHaveBeenCalledWith(identity, 0, "Available", { errorCode: "NoError" });
  });

  it("should throw if connectorId is missing", async () => {
    await expect(
      statusNotificationHandler(identity, {
        params: { status: "Available" },
      })
    ).rejects.toThrow("Missing required parameters: connectorId and status");
  });

  it("should throw if status is missing", async () => {
    await expect(
      statusNotificationHandler(identity, {
        params: { connectorId: 1 },
      })
    ).rejects.toThrow("Missing required parameters: connectorId and status");
  });

  it("should throw if charge point not found", async () => {
    mockChargePointService.getChargePointByIdentifier.mockResolvedValue(null);

    await expect(
      statusNotificationHandler(identity, {
        params: { connectorId: 1, status: "Available" },
      })
    ).rejects.toThrow("Charge point CP001 not found");
  });

  it("should pass additional data (info, vendorId, vendorErrorCode)", async () => {
    await statusNotificationHandler(identity, {
      params: {
        connectorId: 1,
        status: "Faulted",
        errorCode: "GroundFailure",
        info: "Ground fault detected",
        vendorId: "VendorX",
        vendorErrorCode: "E001",
      },
    });

    expect(
      mockChargePointService.createOrUpdateConnectorStatus
    ).toHaveBeenCalledWith(identity, 1, "Faulted", {
      errorCode: "GroundFailure",
      info: "Ground fault detected",
      vendorId: "VendorX",
      vendorErrorCode: "E001",
    });
  });

  it("should filter out empty string additional data", async () => {
    await statusNotificationHandler(identity, {
      params: {
        connectorId: 1,
        status: "Available",
        errorCode: "",
        info: "",
        vendorId: "",
        vendorErrorCode: "",
      },
    });

    expect(
      mockChargePointService.createOrUpdateConnectorStatus
    ).toHaveBeenCalledWith(identity, 1, "Available", {});
  });

  it("should accept connectorId 0 (whole charge point)", async () => {
    const response = await statusNotificationHandler(identity, {
      params: {
        connectorId: 0,
        status: "Available",
        errorCode: "NoError",
      },
    });

    expect(response).toEqual({});
    expect(
      mockChargePointService.createOrUpdateConnectorStatus
    ).toHaveBeenCalledWith(identity, 0, "Available", { errorCode: "NoError" });
  });
});

// ---------------------------------------------------------------------------
// StartTransaction
// ---------------------------------------------------------------------------
describe("StartTransaction", () => {
  const identity = "CP001";
  const mockChargePoint = { _id: "abc123", identifier: "CP001" };

  beforeEach(() => {
    mockChargePointService.getChargePointByIdentifier.mockResolvedValue(
      mockChargePoint
    );
    mockTransactionService.createTransaction.mockResolvedValue({
      transactionId: 12345,
      _id: "tx_mongo_id",
    });
    mockAuthorize.authorizeOCPPRequest.mockResolvedValue({
      status: "Accepted",
    });
  });

  it("should return transactionId and idTagInfo on success", async () => {
    const response = await startTransactionHandler(identity, {
      params: {
        connectorId: 1,
        idTag: "TAG001",
        meterStart: 0,
        timestamp: "2025-01-01T10:00:00Z",
      },
    });

    expect(response).toHaveProperty("transactionId", 12345);
    expect(response).toHaveProperty("idTagInfo");
    expect(response.idTagInfo.status).toBe("Accepted");
  });

  it("should create transaction with correct data", async () => {
    await startTransactionHandler(identity, {
      params: {
        connectorId: 1,
        idTag: "TAG001",
        meterStart: 1000,
        timestamp: "2025-06-15T12:00:00Z",
      },
    });

    expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        chargePointId: "CP001",
        connectorId: 1,
        idTag: "TAG001",
        meterStart: 1000,
        status: "Active",
      })
    );
  });

  it("should include reservationId when provided", async () => {
    await startTransactionHandler(identity, {
      params: {
        connectorId: 1,
        idTag: "TAG001",
        meterStart: 0,
        reservationId: 42,
      },
    });

    expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ reservationId: 42 })
    );
  });

  it("should throw if connectorId is missing", async () => {
    await expect(
      startTransactionHandler(identity, {
        params: { idTag: "TAG001", meterStart: 0 },
      })
    ).rejects.toThrow("Missing required parameters");
  });

  it("should throw if idTag is missing", async () => {
    await expect(
      startTransactionHandler(identity, {
        params: { connectorId: 1, meterStart: 0 },
      })
    ).rejects.toThrow("Missing required parameters");
  });

  it("should throw if meterStart is missing", async () => {
    await expect(
      startTransactionHandler(identity, {
        params: { connectorId: 1, idTag: "TAG001" },
      })
    ).rejects.toThrow("Missing required parameters");
  });

  it("should throw if charge point not found", async () => {
    mockChargePointService.getChargePointByIdentifier.mockResolvedValue(null);

    await expect(
      startTransactionHandler(identity, {
        params: { connectorId: 1, idTag: "TAG001", meterStart: 0 },
      })
    ).rejects.toThrow("Charge point CP001 not found");
  });

  it("should default to Accepted if authorization fails", async () => {
    mockAuthorize.authorizeOCPPRequest.mockRejectedValue(
      new Error("Auth service unavailable")
    );

    const response = await startTransactionHandler(identity, {
      params: { connectorId: 1, idTag: "TAG001", meterStart: 0 },
    });

    expect(response.idTagInfo.status).toBe("Accepted");
  });

  it("should accept meterStart of 0", async () => {
    const response = await startTransactionHandler(identity, {
      params: { connectorId: 1, idTag: "TAG001", meterStart: 0 },
    });

    expect(response.transactionId).toBe(12345);
  });
});

// ---------------------------------------------------------------------------
// StopTransaction
// ---------------------------------------------------------------------------
describe("StopTransaction", () => {
  const identity = "CP001";
  const mockChargePoint = { _id: "abc123", identifier: "CP001" };
  const mockTransaction = {
    transactionId: 12345,
    chargePointId: "CP001",
    connectorId: 1,
    status: "Active",
  };

  beforeEach(() => {
    mockChargePointService.getChargePointByIdentifier.mockResolvedValue(
      mockChargePoint
    );
    mockTransactionService.getTransactionByTransactionId.mockResolvedValue(
      mockTransaction
    );
    mockTransactionService.stopTransaction.mockResolvedValue({
      ...mockTransaction,
      status: "Completed",
      meterStop: 5000,
      stoppedAt: new Date(),
    });
    mockCreateConsumptionFromTransaction.mockResolvedValue({});
    mockAuthorize.authorizeOCPPRequest.mockResolvedValue({
      status: "Accepted",
    });
  });

  it("should return idTagInfo on success", async () => {
    const response = await stopTransactionHandler(identity, {
      params: {
        transactionId: 12345,
        idTag: "TAG001",
        meterStop: 5000,
        timestamp: "2025-01-01T11:00:00Z",
        reason: "Local",
      },
    });

    expect(response).toHaveProperty("idTagInfo");
    expect(response.idTagInfo.status).toBe("Accepted");
  });

  it("should call stopTransaction with correct data", async () => {
    await stopTransactionHandler(identity, {
      params: {
        transactionId: 12345,
        meterStop: 5000,
        timestamp: "2025-01-01T11:00:00Z",
        reason: "EVDisconnected",
      },
    });

    expect(mockTransactionService.stopTransaction).toHaveBeenCalledWith(
      12345,
      expect.objectContaining({
        meterStop: 5000,
        reason: "EVDisconnected",
      })
    );
  });

  it("should create consumption after stopping", async () => {
    await stopTransactionHandler(identity, {
      params: { transactionId: 12345, meterStop: 5000 },
    });

    expect(mockCreateConsumptionFromTransaction).toHaveBeenCalledWith(12345);
  });

  it("should not fail if consumption creation fails", async () => {
    mockCreateConsumptionFromTransaction.mockRejectedValue(
      new Error("Consumption error")
    );

    const response = await stopTransactionHandler(identity, {
      params: { transactionId: 12345, meterStop: 5000 },
    });

    expect(response.idTagInfo.status).toBe("Accepted");
  });

  it("should throw if transactionId is missing", async () => {
    await expect(
      stopTransactionHandler(identity, {
        params: { meterStop: 5000 },
      })
    ).rejects.toThrow("Missing required parameter: transactionId");
  });

  it("should throw if charge point not found", async () => {
    mockChargePointService.getChargePointByIdentifier.mockResolvedValue(null);

    await expect(
      stopTransactionHandler(identity, {
        params: { transactionId: 12345 },
      })
    ).rejects.toThrow("Charge point CP001 not found");
  });

  it("should throw if transaction not found", async () => {
    mockTransactionService.getTransactionByTransactionId.mockResolvedValue(
      null
    );

    await expect(
      stopTransactionHandler(identity, {
        params: { transactionId: 99999 },
      })
    ).rejects.toThrow("Transaction 99999 not found");
  });

  it("should return Accepted even without idTag", async () => {
    const response = await stopTransactionHandler(identity, {
      params: { transactionId: 12345, meterStop: 5000 },
    });

    expect(response.idTagInfo.status).toBe("Accepted");
  });

  it("should handle EmergencyStop reason", async () => {
    await stopTransactionHandler(identity, {
      params: {
        transactionId: 12345,
        meterStop: 5000,
        reason: "EmergencyStop",
      },
    });

    expect(mockTransactionService.stopTransaction).toHaveBeenCalledWith(
      12345,
      expect.objectContaining({ reason: "EmergencyStop" })
    );
  });

  it("should default idTagInfo to Accepted if auth fails", async () => {
    mockAuthorize.authorizeOCPPRequest.mockRejectedValue(
      new Error("Auth error")
    );

    const response = await stopTransactionHandler(identity, {
      params: { transactionId: 12345, idTag: "TAG001", meterStop: 5000 },
    });

    expect(response.idTagInfo.status).toBe("Accepted");
  });
});

// ---------------------------------------------------------------------------
// MeterValues
// ---------------------------------------------------------------------------
describe("MeterValues", () => {
  const identity = "CP001";
  const mockChargePoint = { _id: "abc123", identifier: "CP001" };

  beforeEach(() => {
    mockChargePointService.getChargePointByIdentifier.mockResolvedValue(
      mockChargePoint
    );
    mockCreateMeterValueFromOCPP.mockResolvedValue({ _id: "mv123" });
  });

  it("should return empty object on success", async () => {
    const response = await meterValuesHandler(identity, {
      params: {
        connectorId: 1,
        transactionId: 12345,
        meterValue: [
          {
            timestamp: "2025-01-01T10:05:00Z",
            sampledValue: [
              {
                value: "1500",
                measurand: "Energy.Active.Import.Register",
                unit: "Wh",
              },
            ],
          },
        ],
      },
    });

    expect(response).toEqual({});
  });

  it("should save each meter value entry", async () => {
    await meterValuesHandler(identity, {
      params: {
        connectorId: 1,
        meterValue: [
          {
            timestamp: "2025-01-01T10:05:00Z",
            sampledValue: [
              { value: "1000", measurand: "Energy.Active.Import.Register" },
            ],
          },
          {
            timestamp: "2025-01-01T10:10:00Z",
            sampledValue: [
              { value: "2000", measurand: "Energy.Active.Import.Register" },
            ],
          },
        ],
      },
    });

    expect(mockCreateMeterValueFromOCPP).toHaveBeenCalledTimes(2);
  });

  it("should skip entries without timestamp", async () => {
    await meterValuesHandler(identity, {
      params: {
        connectorId: 1,
        meterValue: [
          { sampledValue: [{ value: "1000" }] }, // no timestamp
          {
            timestamp: "2025-01-01T10:05:00Z",
            sampledValue: [{ value: "2000" }],
          },
        ],
      },
    });

    expect(mockCreateMeterValueFromOCPP).toHaveBeenCalledTimes(1);
  });

  it("should return empty object if connectorId missing", async () => {
    const response = await meterValuesHandler(identity, {
      params: {
        meterValue: [
          {
            timestamp: "2025-01-01T10:05:00Z",
            sampledValue: [],
          },
        ],
      },
    });

    expect(response).toEqual({});
    expect(mockCreateMeterValueFromOCPP).not.toHaveBeenCalled();
  });

  it("should return empty object if meterValue is not an array", async () => {
    const response = await meterValuesHandler(identity, {
      params: { connectorId: 1, meterValue: "invalid" },
    });

    expect(response).toEqual({});
  });

  it("should return empty object if charge point not found", async () => {
    mockChargePointService.getChargePointByIdentifier.mockResolvedValue(null);

    const response = await meterValuesHandler(identity, {
      params: {
        connectorId: 1,
        meterValue: [
          {
            timestamp: "2025-01-01T10:05:00Z",
            sampledValue: [],
          },
        ],
      },
    });

    expect(response).toEqual({});
    expect(mockCreateMeterValueFromOCPP).not.toHaveBeenCalled();
  });

  it("should pass transactionId when provided", async () => {
    await meterValuesHandler(identity, {
      params: {
        connectorId: 1,
        transactionId: 555,
        meterValue: [
          {
            timestamp: "2025-01-01T10:05:00Z",
            sampledValue: [{ value: "100" }],
          },
        ],
      },
    });

    expect(mockCreateMeterValueFromOCPP).toHaveBeenCalledWith(
      identity,
      expect.objectContaining({ transactionId: 555 })
    );
  });

  it("should handle multiple sampledValues per meterValue entry", async () => {
    await meterValuesHandler(identity, {
      params: {
        connectorId: 1,
        meterValue: [
          {
            timestamp: "2025-01-01T10:05:00Z",
            sampledValue: [
              {
                value: "230",
                measurand: "Voltage",
                unit: "V",
                phase: "L1-N",
              },
              {
                value: "16",
                measurand: "Current.Import",
                unit: "A",
                phase: "L1",
              },
              {
                value: "3680",
                measurand: "Power.Active.Import",
                unit: "W",
              },
            ],
          },
        ],
      },
    });

    expect(mockCreateMeterValueFromOCPP).toHaveBeenCalledWith(
      identity,
      expect.objectContaining({
        connectorId: 1,
        meterValue: [
          {
            sampledValue: [
              { value: "230", measurand: "Voltage", unit: "V", phase: "L1-N" },
              {
                value: "16",
                measurand: "Current.Import",
                unit: "A",
                phase: "L1",
              },
              { value: "3680", measurand: "Power.Active.Import", unit: "W" },
            ],
          },
        ],
      })
    );
  });
});

// ---------------------------------------------------------------------------
// DataTransfer
// ---------------------------------------------------------------------------
describe("DataTransfer", () => {
  it("should return Accepted status", () => {
    const response = dataTransferHandler({
      params: { vendorId: "VendorX", messageId: "msg1", data: "test" },
    });

    expect(response.status).toBe("Accepted");
    expect(response).toHaveProperty("data", null);
  });

  it("should accept any vendor-specific params", () => {
    const response = dataTransferHandler({
      params: { vendorId: "Unknown", messageId: "custom", data: "{json:true}" },
    });

    expect(response.status).toBe("Accepted");
  });
});

// ---------------------------------------------------------------------------
// FirmwareStatusNotification
// ---------------------------------------------------------------------------
describe("FirmwareStatusNotification", () => {
  it("should return empty object for Downloaded status", () => {
    const response = firmwareStatusNotificationHandler({
      params: { status: "Downloaded" },
    });
    expect(response).toEqual({});
  });

  it("should return empty object for Installed status", () => {
    const response = firmwareStatusNotificationHandler({
      params: { status: "Installed" },
    });
    expect(response).toEqual({});
  });

  it("should return empty object for InstallationFailed status", () => {
    const response = firmwareStatusNotificationHandler({
      params: { status: "InstallationFailed" },
    });
    expect(response).toEqual({});
  });

  it("should return empty object for DownloadFailed status", () => {
    const response = firmwareStatusNotificationHandler({
      params: { status: "DownloadFailed" },
    });
    expect(response).toEqual({});
  });

  it("should return empty object for Installing status", () => {
    const response = firmwareStatusNotificationHandler({
      params: { status: "Installing" },
    });
    expect(response).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// DiagnosticsStatusNotification
// ---------------------------------------------------------------------------
describe("DiagnosticsStatusNotification", () => {
  it("should return empty object for Idle status", () => {
    const response = diagnosticsStatusNotificationHandler({
      params: { status: "Idle" },
    });
    expect(response).toEqual({});
  });

  it("should return empty object for Uploaded status", () => {
    const response = diagnosticsStatusNotificationHandler({
      params: { status: "Uploaded" },
    });
    expect(response).toEqual({});
  });

  it("should return empty object for UploadFailed status", () => {
    const response = diagnosticsStatusNotificationHandler({
      params: { status: "UploadFailed" },
    });
    expect(response).toEqual({});
  });

  it("should return empty object for Uploading status", () => {
    const response = diagnosticsStatusNotificationHandler({
      params: { status: "Uploading" },
    });
    expect(response).toEqual({});
  });
});
