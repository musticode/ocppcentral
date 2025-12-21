import mongoose from "mongoose";

const bootNotificationSchema = new mongoose.Schema(
  {
    chargePointId: { type: String, required: true, index: true },
    // BootNotification request data
    chargePointVendor: { type: String, required: true }, // Vendor name
    chargePointModel: { type: String, required: true }, // Charge point model
    chargePointSerialNumber: { type: String }, // Serial number (optional)
    chargeBoxSerialNumber: { type: String }, // Charge box serial number (optional)
    firmwareVersion: { type: String }, // Firmware version (optional)
    iccid: { type: String }, // ICCID of the modem (optional)
    imsi: { type: String }, // IMSI of the modem (optional)
    meterType: { type: String }, // Meter type (optional)
    meterSerialNumber: { type: String }, // Meter serial number (optional)
    // BootNotification response
    status: {
      type: String,
      required: true,
      enum: ["Accepted", "Pending", "Rejected"],
      default: "Accepted",
    },
    currentTime: { type: Date, required: true }, // Server time sent in response
    interval: { type: Number, required: true }, // Heartbeat interval in seconds
    // Metadata
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index for querying latest boot notification per charge point
bootNotificationSchema.index({ chargePointId: 1, timestamp: -1 });

const BootNotification = mongoose.model(
  "BootNotification",
  bootNotificationSchema
);

export default BootNotification;
