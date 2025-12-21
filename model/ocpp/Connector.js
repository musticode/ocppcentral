import mongoose from "mongoose";

const connectorSchema = new mongoose.Schema(
  {
    chargePointId: { type: String, required: true, index: true },
    connectorId: { type: Number, required: true }, // OCPP connector ID (0 = main, 1+ = physical connectors)
    name: { type: String },
    // Status from StatusNotification
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
      default: "Unavailable",
      index: true,
    },
    errorCode: {
      type: String,
      enum: [
        "ConnectorLockFailure",
        "EVCommunicationError",
        "GroundFailure",
        "HighTemperature",
        "InternalError",
        "LocalListConflict",
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
    info: { type: String }, // Additional free format info
    vendorId: { type: String }, // Vendor-specific error code
    vendorErrorCode: { type: String }, // Vendor-specific error code
    // Last status update
    lastStatusUpdate: { type: Date, default: Date.now },
    // Current transaction (if any)
    currentTransactionId: { type: Number, ref: "Transaction" },
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique connector per charge point
connectorSchema.index({ chargePointId: 1, connectorId: 1 }, { unique: true });
connectorSchema.index({ status: 1, chargePointId: 1 });

const Connector = mongoose.model("Connector", connectorSchema);

export default Connector;
