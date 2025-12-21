import mongoose from "mongoose";

const authorizationSchema = new mongoose.Schema(
  {
    chargePointId: { type: String, required: true, index: true },
    idTag: { type: String, required: true, index: true },
    // Authorization result
    idTagInfo: {
      status: {
        type: String,
        required: true,
        enum: ["Accepted", "Blocked", "Expired", "Invalid", "ConcurrentTx"],
      },
      expiryDate: { type: Date }, // Optional: ISO 8601 date when idTag expires
      parentIdTag: { type: String }, // Optional: parent idTag if this is a child tag
    },
    // Metadata
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
authorizationSchema.index({ chargePointId: 1, timestamp: -1 });
authorizationSchema.index({ idTag: 1, timestamp: -1 });
authorizationSchema.index({ "idTagInfo.status": 1 });

const Authorization = mongoose.model("Authorization", authorizationSchema);

export default Authorization;
