import mongoose from "mongoose";

const fleetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fleetType: {
      type: String,
      enum: ["Corporate", "Rental", "Delivery", "Taxi", "Public", "Other"],
      default: "Corporate",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Maintenance"],
      default: "Active",
      index: true,
    },
    totalVehicles: {
      type: Number,
      default: 0,
    },
    activeVehicles: {
      type: Number,
      default: 0,
    },
    location: {
      //address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    operatingHours: {
      start: { type: String },
      end: { type: String },
    },
    contactInfo: {
      email: { type: String },
      phone: { type: String },
    },
    settings: {
      autoAssignment: { type: Boolean, default: false },
      maintenanceAlerts: { type: Boolean, default: true },
      chargingAlerts: { type: Boolean, default: true },
      lowBatteryThreshold: { type: Number, default: 20 },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

fleetSchema.index({ companyId: 1, status: 1 });
fleetSchema.index({ managerId: 1, status: 1 });
fleetSchema.index({ name: 1, companyId: 1 });

const Fleet = mongoose.model("Fleet", fleetSchema);

export default Fleet;
