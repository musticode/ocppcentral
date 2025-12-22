import mongoose from "mongoose";

const chargePointSchema = new mongoose.Schema(
  {
    chargePointId: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    description: { type: String },
    identifier: { type: String, required: true, unique: true, index: true },
    // BootNotification data
    model: { type: String }, // Charge point model
    vendorName: { type: String }, // Vendor name
    firmwareVersion: { type: String }, // Firmware version
    serialNumber: { type: String }, // Serial number
    // Connection info
    ipAddress: { type: String },
    port: { type: Number },
    sessionId: { type: String }, // Current WebSocket session ID
    // Status
    connectionStatus: {
      type: String,
      enum: ["Connected", "Disconnected", "Offline"],
      default: "Offline",
      index: true,
    },
    lastHeartbeat: { type: Date }, // Last heartbeat timestamp
    lastBootNotification: { type: Date }, // Last boot notification timestamp
    // BootNotification response
    heartbeatInterval: { type: Number, default: 300 }, // Heartbeat interval in seconds
    // Location (optional)
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes
chargePointSchema.index({ connectionStatus: 1, lastHeartbeat: -1 });

const ChargePoint = mongoose.model("ChargePoint", chargePointSchema);

export default ChargePoint;
