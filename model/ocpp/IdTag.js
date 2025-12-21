import mongoose from "mongoose";

const idTagSchema = new mongoose.Schema(
  {
    idTag: { type: String, required: true, unique: true, index: true },
    parentIdTag: { type: String }, // Optional: parent idTag if this is a child tag
    status: {
      type: String,
      required: true,
      enum: ["Accepted", "Blocked", "Expired", "Invalid", "ConcurrentTx"],
      default: "Accepted",
      index: true,
    },
    expiryDate: { type: Date }, // Optional: ISO 8601 date when idTag expires
    // User/Account information
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Link to user account
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // Additional info
    notes: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
idTagSchema.index({ status: 1, isActive: 1 });
idTagSchema.index({ expiryDate: 1 });

// Virtual to check if tag is expired
idTagSchema.virtual("isExpired").get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

const IdTag = mongoose.model("IdTag", idTagSchema);

export default IdTag;
