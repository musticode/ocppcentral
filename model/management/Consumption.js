import mongoose from "mongoose";

const consumptionSchema = new mongoose.Schema({
  chargePointId: { type: String, required: true, index: true },
  connectorId: { type: Number, required: true, index: true },
  idTag: { type: String, required: true, index: true },
  meterStart: { type: Number, required: true },
  meterStop: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Consumption = mongoose.model("Consumption", consumptionSchema);

export default Consumption;
