import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },
    chargePointId: { type: String, required: true, index: true },
    periodFrom: { type: Date, default: null, index: true },
    periodTo: { type: Date, default: null, index: true },
    totals: {
      transactions: { type: Number, default: 0 },
      energyConsumedKwh: { type: Number, default: 0 },
      energyCost: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
    },
    byConnector: {
      type: [
        {
          connectorId: { type: Number, required: true },
          transactions: { type: Number, default: 0 },
          energyConsumedKwh: { type: Number, default: 0 },
          totalCost: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    generatedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  },
);

reportSchema.index({ chargePointId: 1, periodFrom: 1, periodTo: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
