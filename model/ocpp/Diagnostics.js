import mongoose from "mongoose";

const diagnosticsSchema = new mongoose.Schema(
  {
    chargePointId: { type: String, required: true, index: true },
    location: { type: String, required: true }, // URI where diagnostics file should be uploaded
    startTime: { type: Date }, // Optional: start time for diagnostics
    stopTime: { type: Date }, // Optional: stop time for diagnostics
    retryInterval: { type: Number }, // Optional: interval in seconds between retries
    retries: { type: Number, default: 0 }, // Number of retry attempts
    maxRetries: { type: Number, default: 3 }, // Maximum number of retries
    // Status tracking
    status: {
      type: String,
      required: true,
      enum: [
        "Pending", // Diagnostics requested but not yet started
        "Uploading", // Diagnostics file is being uploaded
        "Uploaded", // Diagnostics uploaded successfully
        "UploadFailed", // Upload failed
        "Cancelled", // Diagnostics request was cancelled
        "Idle", // No diagnostics in progress
      ],
      default: "Pending",
      index: true,
    },
    // Status notifications from charge point
    statusNotifications: [
      {
        status: {
          type: String,
          enum: ["Idle", "Uploaded", "UploadFailed", "Uploading"],
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // Upload information
    fileName: { type: String }, // Name of uploaded file
    fileSize: { type: Number }, // Size of uploaded file in bytes
    fileUrl: { type: String }, // URL where file was uploaded
    // Metadata
    requestedAt: { type: Date, default: Date.now },
    startedAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
    errorMessage: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes
diagnosticsSchema.index({ chargePointId: 1, status: 1 });
diagnosticsSchema.index({ status: 1, requestedAt: 1 });

const Diagnostics = mongoose.model("Diagnostics", diagnosticsSchema);

export default Diagnostics;
