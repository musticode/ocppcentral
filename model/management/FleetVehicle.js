import mongoose from "mongoose";

const fleetVehicleSchema = new mongoose.Schema(
  {
    fleetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fleet",
      required: true,
      index: true,
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      index: true,
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["Available", "Assigned", "InUse", "Charging", "Maintenance", "OutOfService"],
      default: "Available",
      index: true,
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      lastUpdated: { type: Date },
    },
    batteryStatus: {
      currentLevel: { type: Number, min: 0, max: 100 },
      estimatedRange: { type: Number },
      lastUpdated: { type: Date },
    },
    odometer: {
      type: Number,
      default: 0,
    },
    lastServiceDate: {
      type: Date,
    },
    nextServiceDate: {
      type: Date,
    },
    serviceDueOdometer: {
      type: Number,
    },
    assignmentHistory: [
      {
        driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assignedAt: { type: Date },
        returnedAt: { type: Date },
        startOdometer: { type: Number },
        endOdometer: { type: Number },
        notes: { type: String },
      },
    ],
    maintenanceRecords: [
      {
        date: { type: Date, required: true },
        type: { type: String, required: true },
        description: { type: String },
        cost: { type: Number },
        performedBy: { type: String },
        nextServiceOdometer: { type: Number },
        _id: false,
      },
    ],
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

fleetVehicleSchema.index({ fleetId: 1, status: 1 });
fleetVehicleSchema.index({ fleetId: 1, isActive: 1 });
fleetVehicleSchema.index({ assignedDriverId: 1, status: 1 });
fleetVehicleSchema.index({ vehicleNumber: 1 }, { unique: true });

const FleetVehicle = mongoose.model("FleetVehicle", fleetVehicleSchema);

export default FleetVehicle;
