import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
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
    // Applicable to specific charge points or all
    chargePointIds: [{ type: String }], // Empty array = applies to all charge points
    // Validity period
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date }, // Optional: null = no expiry
    // Metadata
    createdBy: { type: String }, // User ID who created this pricing
    updatedBy: { type: String }, // User ID who last updated this pricing
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
pricingSchema.index({ isActive: 1, validFrom: -1, validUntil: -1 });
pricingSchema.index({ chargePointIds: 1 });

// Method to get price per kWh for a given date/time
pricingSchema.methods.getPriceForDateTime = function (dateTime) {
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

const Pricing = mongoose.model("Pricing", pricingSchema);

export default Pricing;

