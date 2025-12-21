import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: Number, required: true, unique: true, index: true },
    chargePointId: { type: String, required: true, index: true },
    connectorId: { type: Number, required: true, index: true },
    idTag: { type: String, required: true, index: true },
    meterStart: { type: Number, required: true }, // Meter value at start of transaction
    reservationId: { type: Number }, // Optional: if transaction was started by a reservation
    timestamp: { type: Date, required: true }, // Start timestamp from charge point
    startedAt: { type: Date, default: Date.now }, // Server timestamp when transaction started
    stoppedAt: { type: Date }, // Server timestamp when transaction stopped
    meterStop: { type: Number }, // Meter value at end of transaction
    stopReason: {
      type: String,
      enum: [
        "DeAuthorized", // Transaction was stopped because of authorization revocation
        "EmergencyStop", // Emergency stop button was used
        "EVDisconnected", // EV disconnected from charging station
        "HardReset", // Hard reset command was received
        "Local", // Stopped locally on charge point
        "Other", // Other reason
        "PowerLoss", // Power loss
        "Reboot", // Reboot command was received
        "Remote", // Stopped remotely by central system
        "SoftReset", // Soft reset command was received
        "UnlockCommand", // Unlock command was received
      ],
    },
    idTagInfo: {
      status: {
        type: String,
        enum: ["Accepted", "Blocked", "Expired", "Invalid", "ConcurrentTx"],
      },
      expiryDate: { type: Date },
      parentIdTag: { type: String },
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Stopped"],
      default: "Active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
transactionSchema.index({ chargePointId: 1, status: 1 });
transactionSchema.index({ idTag: 1, status: 1 });
transactionSchema.index({ startedAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
