import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // Amount and currency
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "USD" },
    // Status
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded", "Cancelled"],
      default: "Pending",
      index: true,
    },
    // Payment method (e.g. Card, Wallet, Invoice, Cash)
    paymentMethod: {
      type: String,
      enum: ["Card", "Wallet", "Invoice", "Cash", "Other"],
      default: "Other",
    },
    // References
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    companyId: {
      type: String,
      index: true,
    },
    // OCPP transaction (charging session)
    transactionId: { type: Number, index: true }, // OCPP transactionId
    consumptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consumption",
      index: true,
    },
    chargePointId: { type: String, index: true },
    idTag: { type: String, index: true },
    // Timestamps
    paidAt: { type: Date },
    // External gateway reference (e.g. Stripe payment intent id)
    externalPaymentId: { type: String, index: true },
    // Optional metadata
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ companyId: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
