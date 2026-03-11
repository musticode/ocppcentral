import mongoose from "mongoose";

const fleetAssignmentSchema = new mongoose.Schema(
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
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignmentType: {
      type: String,
      enum: ["Temporary", "Permanent", "Scheduled"],
      default: "Temporary",
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
    },
    actualStart: {
      type: Date,
    },
    actualEnd: {
      type: Date,
    },
    startLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    endLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    startOdometer: {
      type: Number,
    },
    endOdometer: {
      type: Number,
    },
    startBatteryLevel: {
      type: Number,
    },
    endBatteryLevel: {
      type: Number,
    },
    purpose: {
      type: String,
    },
    notes: {
      type: String,
    },
    checklistCompleted: {
      type: Boolean,
      default: false,
    },
    damageReported: {
      type: Boolean,
      default: false,
    },
    damageDetails: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

fleetAssignmentSchema.index({ fleetId: 1, status: 1 });
fleetAssignmentSchema.index({ driverId: 1, status: 1 });
fleetAssignmentSchema.index({ fleetVehicleId: 1, status: 1 });
fleetAssignmentSchema.index({ scheduledStart: 1, scheduledEnd: 1 });

const FleetAssignment = mongoose.model("FleetAssignment", fleetAssignmentSchema);

export default FleetAssignment;
