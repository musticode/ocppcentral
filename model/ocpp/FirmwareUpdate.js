import mongoose from "mongoose";

const firmwareUpdateSchema = new mongoose.Schema(
  {
    chargePointId: { type: String, required: true, index: true },
    location: { type: String, required: true }, // URI where firmware can be downloaded
    retrieveDate: { type: Date, required: true }, // Date when firmware should be retrieved
    retryInterval: { type: Number }, // Optional: interval in seconds between retries
    retries: { type: Number, default: 0 }, // Number of retry attempts
    maxRetries: { type: Number, default: 3 }, // Maximum number of retries
    // Status tracking
    status: {
      type: String,
      required: true,
      enum: [
        "Pending", // Update requested but not yet started
        "Downloading", // Firmware is being downloaded
        "Downloaded", // Firmware downloaded successfully
        "Installing", // Firmware is being installed
        "Installed", // Firmware installed successfully
        "DownloadFailed", // Download failed
        "InstallationFailed", // Installation failed
        "Cancelled", // Update was cancelled
      ],
      default: "Pending",
      index: true,
    },
    // Status notifications from charge point
    statusNotifications: [
      {
        status: {
          type: String,
          enum: [
            "Downloaded",
            "DownloadFailed",
            "InstallationFailed",
            "Installed",
            "Installing",
          ],
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],
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
firmwareUpdateSchema.index({ chargePointId: 1, status: 1 });
firmwareUpdateSchema.index({ status: 1, retrieveDate: 1 });

const FirmwareUpdate = mongoose.model("FirmwareUpdate", firmwareUpdateSchema);

export default FirmwareUpdate;
