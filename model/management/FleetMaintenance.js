import mongoose from "mongoose";

const fleetMaintenanceSchema = new mongoose.Schema(
  {
    fleetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fleet",
      required: true,
      index: true,
    },
    fleetVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FleetVehicle",
      required: true,
      index: true,
    },
    maintenanceType: {
      type: String,
      enum: ["Scheduled", "Unscheduled", "Emergency", "Recall", "Inspection"],
      required: true,
    },
    category: {
      type: String,
      enum: ["Battery", "Tires", "Brakes", "Software", "Charging", "Body", "Interior", "Other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Scheduled", "InProgress", "Completed", "Cancelled", "Delayed"],
      default: "Scheduled",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    completedDate: {
      type: Date,
    },
    description: {
      type: String,
      required: true,
    },
    workPerformed: {
      type: String,
    },
    partsReplaced: [
      {
        partName: { type: String },
        partNumber: { type: String },
        quantity: { type: Number },
        cost: { type: Number },
        _id: false,
      },
    ],
    laborCost: {
      type: Number,
      default: 0,
    },
    partsCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    serviceProvider: {
      name: { type: String },
      contact: { type: String },
      location: { type: String },
    },
    performedBy: {
      type: String,
    },
    odometerReading: {
      type: Number,
    },
    nextServiceOdometer: {
      type: Number,
    },
    nextServiceDate: {
      type: Date,
    },
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    notes: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

fleetMaintenanceSchema.index({ fleetId: 1, status: 1 });
fleetMaintenanceSchema.index({ fleetVehicleId: 1, status: 1 });
fleetMaintenanceSchema.index({ scheduledDate: 1 });
fleetMaintenanceSchema.index({ status: 1, priority: 1 });

fleetMaintenanceSchema.pre("save", function (next) {
  this.totalCost = (this.laborCost || 0) + (this.partsCost || 0);
  next();
});

const FleetMaintenance = mongoose.model("FleetMaintenance", fleetMaintenanceSchema);

export default FleetMaintenance;
