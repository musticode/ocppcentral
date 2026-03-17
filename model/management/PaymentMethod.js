import mongoose from "mongoose";

const PaymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["credit_card", "debit_card", "bank_account", "paypal", "stripe", "other"],
      default: "credit_card",
    },
    provider: {
      type: String,
      required: true,
      enum: ["stripe", "paypal", "square", "manual", "other"],
      default: "stripe",
    },
    cardLast4: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^\d{4}$/.test(v);
        },
        message: "Card last 4 digits must be exactly 4 digits",
      },
    },
    cardBrand: {
      type: String,
      enum: ["visa", "mastercard", "amex", "discover", "other", null],
    },
    cardExpMonth: {
      type: Number,
      min: 1,
      max: 12,
    },
    cardExpYear: {
      type: Number,
      min: new Date().getFullYear(),
    },
    bankAccountLast4: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^\d{4}$/.test(v);
        },
        message: "Bank account last 4 digits must be exactly 4 digits",
      },
    },
    bankName: {
      type: String,
    },
    paypalEmail: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email format",
      },
    },
    externalId: {
      type: String,
      index: true,
    },
    externalCustomerId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    billingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    lastUsedAt: {
      type: Date,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired", "failed", "pending"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

PaymentMethodSchema.index({ userId: 1, isActive: 1 });
PaymentMethodSchema.index({ userId: 1, isDefault: 1 });
PaymentMethodSchema.index({ userId: 1, status: 1 });

PaymentMethodSchema.virtual("isExpired").get(function () {
  if (!this.cardExpMonth || !this.cardExpYear) return false;
  const now = new Date();
  const expDate = new Date(this.cardExpYear, this.cardExpMonth, 0);
  return expDate < now;
});

PaymentMethodSchema.virtual("displayName").get(function () {
  if (this.type === "credit_card" || this.type === "debit_card") {
    return `${this.cardBrand || "Card"} •••• ${this.cardLast4 || "****"}`;
  } else if (this.type === "bank_account") {
    return `${this.bankName || "Bank"} •••• ${this.bankAccountLast4 || "****"}`;
  } else if (this.type === "paypal") {
    return `PayPal (${this.paypalEmail || "Account"})`;
  }
  return this.type;
});

PaymentMethodSchema.set("toJSON", { virtuals: true });
PaymentMethodSchema.set("toObject", { virtuals: true });

PaymentMethodSchema.pre("save", async function (next) {
  if (this.isModified("isActive") && this.isActive) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  
  if (this.cardExpMonth && this.cardExpYear) {
    const now = new Date();
    const expDate = new Date(this.cardExpYear, this.cardExpMonth, 0);
    if (expDate < now) {
      this.status = "expired";
      this.isActive = false;
    }
  }
  
  next();
});

export default mongoose.model("PaymentMethod", PaymentMethodSchema);
