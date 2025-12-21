import mongoose from "mongoose";

const sampleValueSchema = new mongoose.Schema(
  {
    value: { type: String, required: true }, // The sampled value as a string
    context: {
      type: String,
      enum: [
        "Sample.Periodic",
        "Sample.Clock",
        "Transaction.Begin",
        "Transaction.End",
        "Other",
      ],
      default: "Sample.Periodic",
    },
    format: {
      type: String,
      enum: ["Raw", "SignedData"],
      default: "Raw",
    },
    measurand: {
      type: String,
      enum: [
        "Energy.Active.Export.Register",
        "Energy.Active.Import.Register",
        "Energy.Reactive.Export.Register",
        "Energy.Reactive.Import.Register",
        "Energy.Active.Export.Interval",
        "Energy.Active.Import.Interval",
        "Energy.Reactive.Export.Interval",
        "Energy.Reactive.Import.Interval",
        "Power.Active.Export",
        "Power.Active.Import",
        "Power.Offered",
        "Power.Reactive.Export",
        "Power.Reactive.Import",
        "Power.Factor",
        "Current.Import",
        "Current.Export",
        "Current.Offered",
        "Voltage",
        "Frequency",
        "Temperature",
        "SoC",
        "RPM",
      ],
    },
    location: {
      type: String,
      enum: ["Cable", "EV", "Inlet", "Outlet", "Body"],
    },
    unit: {
      type: String,
      enum: [
        "Wh",
        "kWh",
        "varh",
        "kvarh",
        "W",
        "kW",
        "VA",
        "kVA",
        "var",
        "kvar",
        "A",
        "V",
        "K",
        "Celcius",
        "Fahrenheit",
        "Percent",
      ],
    },
    phase: {
      type: String,
      enum: [
        "L1",
        "L2",
        "L3",
        "N",
        "L1-N",
        "L2-N",
        "L3-N",
        "L1-L2",
        "L2-L3",
        "L3-L1",
      ],
    },
  },
  { _id: false }
);

const meterValueSchema = new mongoose.Schema(
  {
    chargePointId: { type: String, required: true, index: true },
    connectorId: { type: Number, required: true, index: true },
    transactionId: { type: Number, index: true }, // Optional: only present if transaction is active
    timestamp: { type: Date, required: true, index: true },
    sampledValue: [sampleValueSchema], // Array of sampled values
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
meterValueSchema.index({ chargePointId: 1, connectorId: 1, timestamp: -1 });
meterValueSchema.index({ transactionId: 1, timestamp: -1 });

const MeterValue = mongoose.model("MeterValue", meterValueSchema);

export default MeterValue;
