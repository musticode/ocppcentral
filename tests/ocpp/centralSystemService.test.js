import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock ocppHandler so we never touch a real WebSocket / RPCServer
// ---------------------------------------------------------------------------
const mockClient = {
  call: vi.fn(),
};

vi.mock("../../service/ocpp/ocppHandler.js", () => {
  const connectedClients = new Map();
  return {
    default: {
      connectedClients,
      getClient: vi.fn((id) => {
        if (id === "CONNECTED_CP") return mockClient;
        return null;
      }),
      getAllClients: vi.fn(() => []),
    },
  };
});

vi.mock("../../model/management/User.js", () => {
  return {
    default: {
      findOne: vi.fn(),
    },
  };
});

vi.mock("../../model/management/PaymentMethod.js", () => {
  return {
    default: {
      findOne: vi.fn(),
    },
  };
});

// ---------------------------------------------------------------------------
// Import the service under test (after mocks are set up)
// ---------------------------------------------------------------------------
import {
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
  cancelReservation,
  triggerMessage,
  TriggerMessageType,
} from "../../service/ocpp/centralSystemService.js";

import User from "../../model/management/User.js";
import PaymentMethod from "../../model/management/PaymentMethod.js";

// ===========================================================================
// Tests
// ===========================================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.call.mockReset();
});

// ---------------------------------------------------------------------------
// Connection checks
// ---------------------------------------------------------------------------
describe("Connection validation", () => {
  it("should throw when chargePointId is not connected", async () => {
    await expect(changeAvailability("OFFLINE_CP", 1, "Operative")).rejects.toThrow(
      "Charge point OFFLINE_CP is not connected"
    );
  });

  it("should throw when chargePointId is empty", async () => {
    await expect(changeAvailability("", 1, "Operative")).rejects.toThrow(
      "chargePointId is required"
    );
  });
});

// ---------------------------------------------------------------------------
// ChangeAvailability
// ---------------------------------------------------------------------------
describe("ChangeAvailability", () => {
  it("should send Operative request and return success", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await changeAvailability("CONNECTED_CP", 1, "Operative");

    expect(mockClient.call).toHaveBeenCalledWith("ChangeAvailability", {
      connectorId: 1,
      type: "Operative",
    });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe("Accepted");
  });

  it("should send Inoperative request", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    await changeAvailability("CONNECTED_CP", 0, "Inoperative");

    expect(mockClient.call).toHaveBeenCalledWith("ChangeAvailability", {
      connectorId: 0,
      type: "Inoperative",
    });
  });

  it("should reject invalid type", async () => {
    await expect(
      changeAvailability("CONNECTED_CP", 1, "Invalid")
    ).rejects.toThrow('type must be "Operative" or "Inoperative"');
  });

  it("should handle charger Rejected response", async () => {
    mockClient.call.mockResolvedValue({ status: "Rejected" });

    const result = await changeAvailability("CONNECTED_CP", 1, "Operative");

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("Rejected");
  });

  it("should handle Scheduled response", async () => {
    mockClient.call.mockResolvedValue({ status: "Scheduled" });

    const result = await changeAvailability("CONNECTED_CP", 1, "Inoperative");

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("Scheduled");
  });
});

// ---------------------------------------------------------------------------
// ChangeConfiguration
// ---------------------------------------------------------------------------
describe("ChangeConfiguration", () => {
  it("should send configuration change and return success", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await changeConfiguration(
      "CONNECTED_CP",
      "HeartbeatInterval",
      "60"
    );

    expect(mockClient.call).toHaveBeenCalledWith("ChangeConfiguration", {
      key: "HeartbeatInterval",
      value: "60",
    });
    expect(result.success).toBe(true);
  });

  it("should throw if key is missing", async () => {
    await expect(
      changeConfiguration("CONNECTED_CP", "", "60")
    ).rejects.toThrow("key and value are required");
  });

  it("should throw if value is null", async () => {
    await expect(
      changeConfiguration("CONNECTED_CP", "Key", null)
    ).rejects.toThrow("key and value are required");
  });

  it("should convert value to string", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    await changeConfiguration("CONNECTED_CP", "MeterValueSampleInterval", "300");

    expect(mockClient.call).toHaveBeenCalledWith("ChangeConfiguration", {
      key: "MeterValueSampleInterval",
      value: "300",
    });
  });

  it("should handle RebootRequired response", async () => {
    mockClient.call.mockResolvedValue({ status: "RebootRequired" });

    const result = await changeConfiguration(
      "CONNECTED_CP",
      "SomeKey",
      "SomeValue"
    );

    expect(result.data.status).toBe("RebootRequired");
  });
});

// ---------------------------------------------------------------------------
// ClearCache
// ---------------------------------------------------------------------------
describe("ClearCache", () => {
  it("should send ClearCache and return success", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await clearCache("CONNECTED_CP");

    expect(mockClient.call).toHaveBeenCalledWith("ClearCache", {});
    expect(result.success).toBe(true);
    expect(result.data.status).toBe("Accepted");
  });

  it("should handle Rejected response", async () => {
    mockClient.call.mockResolvedValue({ status: "Rejected" });

    const result = await clearCache("CONNECTED_CP");

    expect(result.data.status).toBe("Rejected");
  });
});

// ---------------------------------------------------------------------------
// GetConfiguration
// ---------------------------------------------------------------------------
describe("GetConfiguration", () => {
  it("should request all config when no keys specified", async () => {
    mockClient.call.mockResolvedValue({
      configurationKey: [
        { key: "HeartbeatInterval", value: "300", readonly: false },
      ],
      unknownKey: [],
    });

    const result = await getConfiguration("CONNECTED_CP");

    expect(mockClient.call).toHaveBeenCalledWith("GetConfiguration", {});
    expect(result.success).toBe(true);
    expect(result.data.configurationKey).toHaveLength(1);
  });

  it("should request specific keys", async () => {
    mockClient.call.mockResolvedValue({
      configurationKey: [
        { key: "HeartbeatInterval", value: "300", readonly: false },
      ],
      unknownKey: ["NonExistentKey"],
    });

    const result = await getConfiguration("CONNECTED_CP", [
      "HeartbeatInterval",
      "NonExistentKey",
    ]);

    expect(mockClient.call).toHaveBeenCalledWith("GetConfiguration", {
      key: ["HeartbeatInterval", "NonExistentKey"],
    });
    expect(result.data.unknownKey).toContain("NonExistentKey");
  });

  it("should send empty params for empty keys array", async () => {
    mockClient.call.mockResolvedValue({ configurationKey: [] });

    await getConfiguration("CONNECTED_CP", []);

    expect(mockClient.call).toHaveBeenCalledWith("GetConfiguration", {});
  });
});

// ---------------------------------------------------------------------------
// RemoteStartTransaction
// ---------------------------------------------------------------------------
describe("RemoteStartTransaction", () => {
  beforeEach(() => {
    User.findOne.mockResolvedValue({ _id: "user123" });
    PaymentMethod.findOne.mockResolvedValue({ _id: "pm123", isActive: true });
  });

  it("should send RemoteStartTransaction with idTag", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await remoteStartTransaction("CONNECTED_CP", {
      idTag: "TAG001",
    });

    expect(mockClient.call).toHaveBeenCalledWith("RemoteStartTransaction", {
      idTag: "TAG001",
    });
    expect(result.success).toBe(true);
  });

  it("should include connectorId when provided", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    await remoteStartTransaction("CONNECTED_CP", {
      idTag: "TAG001",
      connectorId: 2,
    });

    expect(mockClient.call).toHaveBeenCalledWith("RemoteStartTransaction", {
      idTag: "TAG001",
      connectorId: 2,
    });
  });

  it("should throw if idTag is missing", async () => {
    await expect(
      remoteStartTransaction("CONNECTED_CP", {})
    ).rejects.toThrow("idTag is required for RemoteStartTransaction");
  });

  it("should throw if user not found", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      remoteStartTransaction("CONNECTED_CP", { idTag: "TAG001" })
    ).rejects.toThrow("User not found");
  });

  it("should throw if no active payment method", async () => {
    PaymentMethod.findOne.mockResolvedValue(null);

    await expect(
      remoteStartTransaction("CONNECTED_CP", { idTag: "TAG001" })
    ).rejects.toThrow("No active payment method found for user");
  });

  it("should handle Rejected response from charger", async () => {
    mockClient.call.mockResolvedValue({ status: "Rejected" });

    const result = await remoteStartTransaction("CONNECTED_CP", {
      idTag: "TAG001",
    });

    expect(result.data.status).toBe("Rejected");
  });
});

// ---------------------------------------------------------------------------
// RemoteStopTransaction
// ---------------------------------------------------------------------------
describe("RemoteStopTransaction", () => {
  it("should send RemoteStopTransaction with transactionId", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await remoteStopTransaction("CONNECTED_CP", 12345);

    expect(mockClient.call).toHaveBeenCalledWith("RemoteStopTransaction", {
      transactionId: 12345,
    });
    expect(result.success).toBe(true);
  });

  it("should throw if transactionId is null", async () => {
    await expect(
      remoteStopTransaction("CONNECTED_CP", null)
    ).rejects.toThrow("transactionId is required");
  });

  it("should handle Rejected response", async () => {
    mockClient.call.mockResolvedValue({ status: "Rejected" });

    const result = await remoteStopTransaction("CONNECTED_CP", 12345);

    expect(result.data.status).toBe("Rejected");
  });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
describe("Reset", () => {
  it("should send Hard reset", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await reset("CONNECTED_CP", "Hard");

    expect(mockClient.call).toHaveBeenCalledWith("Reset", { type: "Hard" });
    expect(result.success).toBe(true);
  });

  it("should send Soft reset", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    await reset("CONNECTED_CP", "Soft");

    expect(mockClient.call).toHaveBeenCalledWith("Reset", { type: "Soft" });
  });

  it("should reject invalid reset type", async () => {
    await expect(reset("CONNECTED_CP", "Medium")).rejects.toThrow(
      'type must be "Hard" or "Soft"'
    );
  });
});

// ---------------------------------------------------------------------------
// UnlockConnector
// ---------------------------------------------------------------------------
describe("UnlockConnector", () => {
  it("should send UnlockConnector request", async () => {
    mockClient.call.mockResolvedValue({ status: "Unlocked" });

    const result = await unlockConnector("CONNECTED_CP", 1);

    expect(mockClient.call).toHaveBeenCalledWith("UnlockConnector", {
      connectorId: 1,
    });
    expect(result.success).toBe(true);
  });

  it("should handle NotSupported response", async () => {
    mockClient.call.mockResolvedValue({ status: "NotSupported" });

    const result = await unlockConnector("CONNECTED_CP", 1);

    expect(result.data.status).toBe("NotSupported");
  });
});

// ---------------------------------------------------------------------------
// GetDiagnostics
// ---------------------------------------------------------------------------
describe("GetDiagnostics", () => {
  it("should send GetDiagnostics with location", async () => {
    mockClient.call.mockResolvedValue({ fileName: "diag-123.txt" });

    const result = await getDiagnostics("CONNECTED_CP", {
      location: "ftp://example.com/diag",
    });

    expect(mockClient.call).toHaveBeenCalledWith("GetDiagnostics", {
      location: "ftp://example.com/diag",
    });
    expect(result.success).toBe(true);
  });

  it("should include optional time filters", async () => {
    mockClient.call.mockResolvedValue({ fileName: "diag-123.txt" });

    await getDiagnostics("CONNECTED_CP", {
      location: "ftp://example.com/diag",
      startTime: "2025-01-01T00:00:00Z",
      stopTime: "2025-01-02T00:00:00Z",
      retries: 3,
      retryInterval: 60,
    });

    expect(mockClient.call).toHaveBeenCalledWith("GetDiagnostics", {
      location: "ftp://example.com/diag",
      startTime: "2025-01-01T00:00:00Z",
      stopTime: "2025-01-02T00:00:00Z",
      retries: 3,
      retryInterval: 60,
    });
  });

  it("should throw if location is missing", async () => {
    await expect(getDiagnostics("CONNECTED_CP", {})).rejects.toThrow(
      "location (URI) is required"
    );
  });
});

// ---------------------------------------------------------------------------
// UpdateFirmware
// ---------------------------------------------------------------------------
describe("UpdateFirmware", () => {
  it("should send UpdateFirmware request", async () => {
    mockClient.call.mockResolvedValue({});

    const result = await updateFirmware("CONNECTED_CP");

    expect(mockClient.call).toHaveBeenCalledWith(
      "UpdateFirmware",
      expect.objectContaining({
        location: "https://zapcloud/firmware",
      })
    );
    expect(result.success).toBe(true);
  });

  it("should include retry options when specified", async () => {
    mockClient.call.mockResolvedValue({});

    await updateFirmware("CONNECTED_CP", { retries: 5, retryInterval: 120 });

    expect(mockClient.call).toHaveBeenCalledWith(
      "UpdateFirmware",
      expect.objectContaining({
        retries: 5,
        retryInterval: 120,
      })
    );
  });
});

// ---------------------------------------------------------------------------
// SendLocalList
// ---------------------------------------------------------------------------
describe("SendLocalList", () => {
  it("should send Full update", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await sendLocalList("CONNECTED_CP", {
      listVersion: 1,
      localAuthorizationList: [
        { idTag: "TAG001", idTagInfo: { status: "Accepted" } },
      ],
      updateType: "Full",
    });

    expect(mockClient.call).toHaveBeenCalledWith("SendLocalList", {
      listVersion: 1,
      localAuthorizationList: [
        { idTag: "TAG001", idTagInfo: { status: "Accepted" } },
      ],
      updateType: "Full",
    });
    expect(result.success).toBe(true);
  });

  it("should send Differential update", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    await sendLocalList("CONNECTED_CP", {
      listVersion: 2,
      localAuthorizationList: [{ idTag: "TAG002" }],
      updateType: "Differential",
    });

    expect(mockClient.call).toHaveBeenCalledWith(
      "SendLocalList",
      expect.objectContaining({ updateType: "Differential" })
    );
  });

  it("should throw if listVersion is missing", async () => {
    await expect(
      sendLocalList("CONNECTED_CP", {
        localAuthorizationList: [],
        updateType: "Full",
      })
    ).rejects.toThrow("listVersion is required");
  });

  it("should throw if localAuthorizationList is not an array", async () => {
    await expect(
      sendLocalList("CONNECTED_CP", {
        listVersion: 1,
        localAuthorizationList: "invalid",
        updateType: "Full",
      })
    ).rejects.toThrow("localAuthorizationList must be an array");
  });

  it("should throw if updateType is invalid", async () => {
    await expect(
      sendLocalList("CONNECTED_CP", {
        listVersion: 1,
        localAuthorizationList: [],
        updateType: "Partial",
      })
    ).rejects.toThrow('updateType must be "Full" or "Differential"');
  });
});

// ---------------------------------------------------------------------------
// GetLocalListVersion
// ---------------------------------------------------------------------------
describe("GetLocalListVersion", () => {
  it("should return list version number", async () => {
    mockClient.call.mockResolvedValue({ listVersion: 5 });

    const result = await getLocalListVersion("CONNECTED_CP");

    expect(mockClient.call).toHaveBeenCalledWith("GetLocalListVersion", {});
    expect(result.success).toBe(true);
    expect(result.data.listVersion).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// ReserveNow
// ---------------------------------------------------------------------------
describe("ReserveNow", () => {
  it("should send reservation request", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await reserveNow("CONNECTED_CP", {
      connectorId: 1,
      expiryDate: "2025-12-31T23:59:59Z",
      idTag: "TAG001",
      reservationId: 100,
    });

    expect(mockClient.call).toHaveBeenCalledWith("ReserveNow", {
      connectorId: 1,
      expiryDate: "2025-12-31T23:59:59Z",
      idTag: "TAG001",
      reservationId: 100,
    });
    expect(result.success).toBe(true);
  });

  it("should include parentIdTag when provided", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    await reserveNow("CONNECTED_CP", {
      connectorId: 1,
      expiryDate: "2025-12-31T23:59:59Z",
      idTag: "CHILD001",
      parentIdTag: "PARENT001",
    });

    expect(mockClient.call).toHaveBeenCalledWith(
      "ReserveNow",
      expect.objectContaining({ parentIdTag: "PARENT001" })
    );
  });

  it("should throw if connectorId is missing", async () => {
    await expect(
      reserveNow("CONNECTED_CP", {
        expiryDate: "2025-12-31T23:59:59Z",
        idTag: "TAG001",
      })
    ).rejects.toThrow("connectorId is required");
  });

  it("should throw if expiryDate is missing", async () => {
    await expect(
      reserveNow("CONNECTED_CP", { connectorId: 1, idTag: "TAG001" })
    ).rejects.toThrow("expiryDate is required");
  });

  it("should throw if idTag is missing", async () => {
    await expect(
      reserveNow("CONNECTED_CP", {
        connectorId: 1,
        expiryDate: "2025-12-31T23:59:59Z",
      })
    ).rejects.toThrow("idTag is required");
  });

  it("should handle Occupied response", async () => {
    mockClient.call.mockResolvedValue({ status: "Occupied" });

    const result = await reserveNow("CONNECTED_CP", {
      connectorId: 1,
      expiryDate: "2025-12-31T23:59:59Z",
      idTag: "TAG001",
    });

    expect(result.data.status).toBe("Occupied");
  });
});

// ---------------------------------------------------------------------------
// CancelReservation
// ---------------------------------------------------------------------------
describe("CancelReservation", () => {
  it("should send cancel reservation request", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await cancelReservation("CONNECTED_CP", {
      reservationId: 100,
    });

    expect(mockClient.call).toHaveBeenCalledWith("CancelReservation", {
      reservationId: 100,
    });
    expect(result.success).toBe(true);
  });

  it("should throw if reservationId is missing", async () => {
    await expect(
      cancelReservation("CONNECTED_CP", {})
    ).rejects.toThrow("reservationId is required");
  });

  it("should handle Rejected response", async () => {
    mockClient.call.mockResolvedValue({ status: "Rejected" });

    const result = await cancelReservation("CONNECTED_CP", {
      reservationId: 999,
    });

    expect(result.data.status).toBe("Rejected");
  });
});

// ---------------------------------------------------------------------------
// TriggerMessage
// ---------------------------------------------------------------------------
describe("TriggerMessage", () => {
  it("should trigger BootNotification", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    const result = await triggerMessage("CONNECTED_CP", {
      requestedMessage: TriggerMessageType.BootNotification,
    });

    expect(mockClient.call).toHaveBeenCalledWith("TriggerMessage", {
      requestedMessage: "BootNotification",
    });
    expect(result.success).toBe(true);
  });

  it("should trigger Heartbeat", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    await triggerMessage("CONNECTED_CP", {
      requestedMessage: TriggerMessageType.Heartbeat,
    });

    expect(mockClient.call).toHaveBeenCalledWith("TriggerMessage", {
      requestedMessage: "Heartbeat",
    });
  });

  it("should trigger MeterValues with connectorId", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    await triggerMessage("CONNECTED_CP", {
      requestedMessage: TriggerMessageType.MeterValues,
      connectorId: 1,
    });

    expect(mockClient.call).toHaveBeenCalledWith("TriggerMessage", {
      requestedMessage: "MeterValues",
      connectorId: 1,
    });
  });

  it("should trigger StatusNotification", async () => {
    mockClient.call.mockResolvedValue({ status: "Accepted" });

    await triggerMessage("CONNECTED_CP", {
      requestedMessage: TriggerMessageType.StatusNotification,
    });

    expect(mockClient.call).toHaveBeenCalledWith("TriggerMessage", {
      requestedMessage: "StatusNotification",
    });
  });

  it("should throw if requestedMessage is missing", async () => {
    await expect(
      triggerMessage("CONNECTED_CP", {})
    ).rejects.toThrow("requestedMessage is required");
  });

  it("should handle NotImplemented response", async () => {
    mockClient.call.mockResolvedValue({ status: "NotImplemented" });

    const result = await triggerMessage("CONNECTED_CP", {
      requestedMessage: TriggerMessageType.DiagnosticsStatusNotification,
    });

    expect(result.data.status).toBe("NotImplemented");
  });
});

// ---------------------------------------------------------------------------
// TriggerMessageType enum
// ---------------------------------------------------------------------------
describe("TriggerMessageType", () => {
  it("should expose all OCPP 1.6 trigger message types", () => {
    expect(TriggerMessageType.BootNotification).toBe("BootNotification");
    expect(TriggerMessageType.DiagnosticsStatusNotification).toBe(
      "DiagnosticsStatusNotification"
    );
    expect(TriggerMessageType.FirmwareStatusNotification).toBe(
      "FirmwareStatusNotification"
    );
    expect(TriggerMessageType.Heartbeat).toBe("Heartbeat");
    expect(TriggerMessageType.MeterValues).toBe("MeterValues");
    expect(TriggerMessageType.StatusNotification).toBe("StatusNotification");
  });

  it("should be frozen (immutable)", () => {
    expect(Object.isFrozen(TriggerMessageType)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Timeout / error handling (via the call() wrapper)
// ---------------------------------------------------------------------------
describe("Error handling", () => {
  it("should return success:false on OCPP call error", async () => {
    mockClient.call.mockRejectedValue(new Error("GenericError"));

    const result = await clearCache("CONNECTED_CP");

    expect(result.success).toBe(false);
    expect(result.error).toBe("GenericError");
  });

  it("should return success:false on timeout", async () => {
    // Simulate a call that never resolves within the timeout
    mockClient.call.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 60000))
    );

    const result = await clearCache("CONNECTED_CP");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Request timeout");
  }, 35000);

  it("should handle OCPP error code in rejection", async () => {
    const ocppError = new Error();
    ocppError.errorCode = "NotSupported";
    mockClient.call.mockRejectedValue(ocppError);

    const result = await reset("CONNECTED_CP", "Soft");

    expect(result.success).toBe(false);
    expect(result.error).toContain("NotSupported");
  });
});
