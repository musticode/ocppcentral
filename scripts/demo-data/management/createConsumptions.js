import mongoose from "mongoose";
import Consumption from "../../../model/management/Consumption.js";
import Transaction from "../../../model/ocpp/Transaction.js";
import Pricing from "../../../model/management/Pricing.js";
import Tariff from "../../../model/management/Tariff.js";
import connectDB from "../../../configuration/db.js";

const createDemoConsumptions = async () => {
  try {
    await connectDB();

    const transactions = await Transaction.find({ status: "Completed" });
    const pricings = await Pricing.find({ isActive: true });
    const tariffs = await Tariff.find({ isActive: true });

    if (transactions.length === 0) {
      console.log("⚠️  No completed transactions found. Please create transactions first.");
      return [];
    }

    const demoConsumptions = [];

    transactions.forEach((tx, index) => {
      const tariff = tariffs.find(
        (t) => t.chargePointId === tx.chargePointId && t.connectorId === tx.connectorId
      );
      const pricing = pricings[index % pricings.length];

      const pricePerKwh = tariff ? 0.40 : pricing?.basePrice || 0.35;
      const connectionFee = tariff?.connectionFee || pricing?.connectionFee || 1.0;

      demoConsumptions.push({
        transactionId: tx.transactionId,
        chargePointId: tx.chargePointId,
        connectorId: tx.connectorId,
        idTag: tx.idTag,
        meterStart: tx.meterStart,
        meterStop: tx.meterStop,
        energyConsumed: tx.energyConsumed,
        pricingId: pricing?._id,
        tariffId: tariff?._id,
        pricePerKwh: pricePerKwh,
        connectionFee: connectionFee,
        energyCost: tx.energyConsumed * pricePerKwh,
        totalCost: tx.energyConsumed * pricePerKwh + connectionFee,
        currency: "USD",
        transactionStartTime: tx.startedAt,
        transactionStopTime: tx.stoppedAt,
        timestamp: tx.stoppedAt,
        duration: (tx.stoppedAt - tx.startedAt) / 1000,
        averagePower: tx.energyConsumed / ((tx.stoppedAt - tx.startedAt) / 3600000),
        peakPower: (tx.energyConsumed / ((tx.stoppedAt - tx.startedAt) / 3600000)) * 1.2,
      });
    });

    await Consumption.deleteMany({});
    const createdConsumptions = await Consumption.insertMany(demoConsumptions);

    console.log(`✅ Created ${createdConsumptions.length} demo consumptions`);
    const totalEnergy = createdConsumptions.reduce((sum, c) => sum + c.energyConsumed, 0);
    const totalCost = createdConsumptions.reduce((sum, c) => sum + c.totalCost, 0);
    console.log(`   - Total Energy: ${totalEnergy.toFixed(2)} kWh`);
    console.log(`   - Total Cost: $${totalCost.toFixed(2)}`);

    return createdConsumptions;
  } catch (error) {
    console.error("Error creating demo consumptions:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoConsumptions()
    .then(() => {
      console.log("Demo consumptions creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo consumptions:", error);
      process.exit(1);
    });
}

export default createDemoConsumptions;
