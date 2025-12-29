import mongoose from "mongoose";

const consumptionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: Number,
      required: true,
      index: true,
    },
    chargePointId: { type: String, required: true, index: true },
    connectorId: { type: Number, required: true, index: true },
    idTag: { type: String, required: true, index: true },
    meterStart: { type: Number, required: true }, // Meter value at start (Wh)
    meterStop: { type: Number, required: true }, // Meter value at stop (Wh)
    energyConsumed: { type: Number, required: true }, // Calculated: (meterStop - meterStart) in kWh
    // Pricing information
    pricingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pricing",
      index: true,
    },
    pricePerKwh: { type: Number }, // Price per kWh at time of consumption
    connectionFee: { type: Number, default: 0 },
    // Cost calculation
    energyCost: { type: Number }, // Calculated: energyConsumed * pricePerKwh
    totalCost: { type: Number }, // Calculated: energyCost + connectionFee
    currency: { type: String, default: "USD" },
    // Timestamps
    transactionStartTime: { type: Date, required: true },
    transactionStopTime: { type: Date, required: true },
    timestamp: { type: Date, required: true }, // Consumption record timestamp
    // Additional metadata
    duration: { type: Number }, // Duration in seconds
    averagePower: { type: Number }, // Average power in kW (if available)
    peakPower: { type: Number }, // Peak power in kW (if available)
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
consumptionSchema.index({ chargePointId: 1, timestamp: -1 });
consumptionSchema.index({ idTag: 1, timestamp: -1 });
consumptionSchema.index({ transactionId: 1 });
consumptionSchema.index({ pricingId: 1 });

// Pre-save hook to calculate energy consumed and costs
consumptionSchema.pre("save", function (next) {
  // Calculate energy consumed in kWh (assuming meter values are in Wh)
  if (this.meterStop && this.meterStart) {
    this.energyConsumed = (this.meterStop - this.meterStart) / 1000; // Convert Wh to kWh
  }

  // Calculate costs if price is available
  if (this.pricePerKwh && this.energyConsumed) {
    this.energyCost = this.energyConsumed * this.pricePerKwh;
    this.totalCost = (this.energyCost || 0) + (this.connectionFee || 0);
  }

  // Calculate duration if timestamps are available
  if (this.transactionStartTime && this.transactionStopTime) {
    this.duration =
      (this.transactionStopTime - this.transactionStartTime) / 1000; // Duration in seconds
  }

  next();
});

const Consumption = mongoose.model("Consumption", consumptionSchema);

export default Consumption;
