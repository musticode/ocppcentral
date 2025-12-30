import mongoose from "mongoose";

const statusNotificationSchema = new mongoose.Schema(
  {
    chargePointId: { type: String, required: true, index: true },
    connectorId: { type: Number, required: true }, // 0 = main, 1+ = physical connectors
    errorCode: {
      type: String,
      enum: [
        "ConnectorLockFailure",
        "EVCommunicationError",
        "GroundFailure",
        "HighTemperature",
        "InternalError",
        "LocalListConflict",
        "NoError",
        "Other",
        "OverCurrentFailure",
        "PowerMeterFailure",
        "PowerSwitchFailure",
        "ReaderFailure",
        "ResetFailure",
        "UnderVoltage",
        "OverVoltage",
        "WeakSignal",
      ],
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Available",
        "Occupied",
        "Unavailable",
        "Reserved",
        "Faulted",
        "Preparing",
        "Charging",
        "SuspendedEVSE",
        "SuspendedEV",
      ],
      index: true,
    },
    info: { type: String }, // Additional free format info
    timestamp: { type: Date, required: true, index: true }, // Timestamp from charge point
    vendorId: { type: String }, // Vendor-specific error code
    vendorErrorCode: { type: String }, // Vendor-specific error code
    // Metadata
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
statusNotificationSchema.index({
  chargePointId: 1,
  connectorId: 1,
  timestamp: -1,
});
statusNotificationSchema.index({ status: 1, timestamp: -1 });

const StatusNotification = mongoose.model(
  "StatusNotification",
  statusNotificationSchema
);

export default StatusNotification;
