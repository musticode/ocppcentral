import mongoose from "mongoose";

const tariffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    // Company reference
    companyId: {
      type: String,
      required: true,
      index: true,
      ref: "Company",
    },
    // Specific to charge point and connector
    chargePointId: { type: String, required: true, index: true },
    connectorId: { type: Number, required: true, index: true },
    // Pricing structure
    basePrice: { type: Number, required: true, default: 0 }, // Base price per kWh
    currency: { type: String, required: true, default: "USD" },
    // Time-based pricing (optional)
    timeBasedPricing: [
      {
        startTime: { type: String, required: true }, // HH:mm format
        endTime: { type: String, required: true }, // HH:mm format
        dayOfWeek: {
          type: Number,
          enum: [0, 1, 2, 3, 4, 5, 6], // 0 = Sunday, 6 = Saturday
        }, // Optional: specific day, null = all days
        pricePerKwh: { type: Number, required: true },
        _id: false,
      },
    ],
    // Connection fee (optional)
    connectionFee: { type: Number, default: 0 },
    // Minimum charge (optional)
    minimumCharge: { type: Number, default: 0 },
    // Status
    isActive: { type: Boolean, default: true, index: true },
    // Validity period
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date }, // Optional: null = no expiry
    // Metadata
    createdBy: { type: String }, // User ID who created this tariff
    updatedBy: { type: String }, // User ID who last updated this tariff
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
tariffSchema.index({ companyId: 1, isActive: 1 });
tariffSchema.index({ chargePointId: 1, connectorId: 1, isActive: 1 });
tariffSchema.index({ isActive: 1, validFrom: -1, validUntil: -1 });
// Compound index to ensure unique active tariff per connector
tariffSchema.index(
  { chargePointId: 1, connectorId: 1, isActive: 1, validFrom: -1 },
  { unique: false }
);

// Method to get price per kWh for a given date/time
tariffSchema.methods.getPriceForDateTime = function (dateTime) {
  const hour = dateTime.getHours();
  const minutes = dateTime.getMinutes();
  const timeString = `${hour.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
  const dayOfWeek = dateTime.getDay();

  // Check if there's a time-based pricing for this time
  if (this.timeBasedPricing && this.timeBasedPricing.length > 0) {
    for (const timePrice of this.timeBasedPricing) {
      const start = timePrice.startTime;
      const end = timePrice.endTime;
      const dayMatch =
        timePrice.dayOfWeek === undefined || timePrice.dayOfWeek === dayOfWeek;

      if (dayMatch && timeString >= start && timeString <= end) {
        return timePrice.pricePerKwh;
      }
    }
  }

  // Return base price if no time-based pricing matches
  return this.basePrice;
};

const Tariff = mongoose.model("Tariff", tariffSchema);

export default Tariff;
