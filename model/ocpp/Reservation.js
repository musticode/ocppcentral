import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    reservationId: { type: Number, required: true, unique: true, index: true },
    chargePointId: { type: String, required: true, index: true },
    connectorId: { type: Number }, // Optional: specific connector, null = any connector
    idTag: { type: String, required: true, index: true },
    expiryDate: { type: Date, required: true, index: true }, // Reservation expiry date
    // Status
    status: {
      type: String,
      required: true,
      enum: ["Active", "Used", "Expired", "Cancelled"],
      default: "Active",
      index: true,
    },
    // Transaction started from this reservation
    transactionId: { type: Number, ref: "Transaction" },
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    cancelledBy: { type: String }, // Who cancelled (user/system)
  },
  {
    timestamps: true,
  }
);

// Indexes
reservationSchema.index({ chargePointId: 1, status: 1 });
reservationSchema.index({ idTag: 1, status: 1 });
reservationSchema.index({ expiryDate: 1, status: 1 });

// Virtual to check if reservation is expired
reservationSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiryDate;
});

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
