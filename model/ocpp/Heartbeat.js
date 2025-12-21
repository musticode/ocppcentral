import mongoose from "mongoose";

const heartbeatSchema = new mongoose.Schema(
  {
    chargePointId: { type: String, required: true, index: true },
    currentTime: { type: Date, required: true }, // Server time sent in response
    // Metadata
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index for querying latest heartbeat per charge point
heartbeatSchema.index({ chargePointId: 1, timestamp: -1 });

const Heartbeat = mongoose.model("Heartbeat", heartbeatSchema);

export default Heartbeat;
