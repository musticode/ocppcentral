import mongoose from "mongoose";
import MeterValue from "../../../model/ocpp/MeterValue.js";
import Transaction from "../../../model/ocpp/Transaction.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import connectDB from "../../../configuration/db.js";

const createDemoMeterValues = async () => {
  try {
    await connectDB();

    const transactions = await Transaction.find({});
    const chargePoints = await ChargePoint.find({});

    if (transactions.length === 0) {
      console.log("⚠️  No transactions found. Please create transactions first.");
      return [];
    }

    const demoMeterValues = [];

    transactions.forEach((tx) => {
      const numReadings = tx.status === "Active" ? 5 : 10;
      const startTime = new Date(tx.startedAt);
      const interval = 300000;

      for (let i = 0; i < numReadings; i++) {
        const timestamp = new Date(startTime.getTime() + i * interval);
        const energyValue = tx.meterStart + (i * 2000);
        const powerValue = 7.2 + (Math.random() * 3.8);
        const voltage = 230 + (Math.random() * 10 - 5);
        const current = powerValue * 1000 / voltage;

        demoMeterValues.push({
          chargePointId: tx.chargePointId,
          connectorId: tx.connectorId,
          transactionId: tx.transactionId,
          timestamp: timestamp,
          sampledValue: [
            {
              value: String(energyValue),
              context: i === 0 ? "Transaction.Begin" : i === numReadings - 1 && tx.status === "Completed" ? "Transaction.End" : "Sample.Periodic",
              format: "Raw",
              measurand: "Energy.Active.Import.Register",
              location: "Outlet",
              unit: "Wh",
            },
            {
              value: String(powerValue.toFixed(2)),
              context: "Sample.Periodic",
              format: "Raw",
              measurand: "Power.Active.Import",
              location: "Outlet",
              unit: "kW",
            },
            {
              value: String(voltage.toFixed(1)),
              context: "Sample.Periodic",
              format: "Raw",
              measurand: "Voltage",
              location: "Outlet",
              unit: "V",
              phase: "L1",
            },
            {
              value: String(current.toFixed(2)),
              context: "Sample.Periodic",
              format: "Raw",
              measurand: "Current.Import",
              location: "Outlet",
              unit: "A",
              phase: "L1",
            },
          ],
        });
      }
    });

    await MeterValue.deleteMany({});
    const createdMeterValues = await MeterValue.insertMany(demoMeterValues);

    console.log(`✅ Created ${createdMeterValues.length} demo meter values`);

    return createdMeterValues;
  } catch (error) {
    console.error("Error creating demo meter values:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoMeterValues()
    .then(() => {
      console.log("Demo meter values creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo meter values:", error);
      process.exit(1);
    });
}

export default createDemoMeterValues;
