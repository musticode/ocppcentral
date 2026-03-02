import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },
    make: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    color: {
      type: String,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vin: {
      type: String,
      unique: true,
      sparse: true,
    },
    batteryCapacity: {
      type: Number,
    },
    range: {
      type: Number,
    },
    chargingPort: {
      type: String,
      enum: ["Type 1", "Type 2", "CCS", "CHAdeMO", "Tesla", "Other"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

carSchema.index({ userId: 1, isActive: 1 });
carSchema.index({ companyId: 1, isActive: 1 });
carSchema.index({ licensePlate: 1 });

const Car = mongoose.model("Car", carSchema);

export default Car;
