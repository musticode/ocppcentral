import mongoose from "mongoose";
import Report from "../../../model/management/Report.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import Consumption from "../../../model/management/Consumption.js";
import Company from "../../../model/management/Company.js";
import connectDB from "../../../configuration/db.js";

const createDemoReports = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});
    const consumptions = await Consumption.find({});
    const companies = await Company.find({});

    if (chargePoints.length === 0 || consumptions.length === 0) {
      console.log("⚠️  No charge points or consumptions found. Please create them first.");
      return [];
    }

    const demoReports = [];
    const now = new Date();

    chargePoints.forEach((cp) => {
      const cpConsumptions = consumptions.filter(c => c.chargePointId === cp.chargePointId);

      if (cpConsumptions.length === 0) return;

      const periodFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const totalTransactions = cpConsumptions.length;
      const totalEnergyConsumed = cpConsumptions.reduce((sum, c) => sum + c.energyConsumed, 0);
      const totalEnergyCost = cpConsumptions.reduce((sum, c) => sum + c.energyCost, 0);
      const totalCost = cpConsumptions.reduce((sum, c) => sum + c.totalCost, 0);

      const byConnector = {};
      cpConsumptions.forEach((c) => {
        if (!byConnector[c.connectorId]) {
          byConnector[c.connectorId] = {
            connectorId: c.connectorId,
            transactions: 0,
            energyConsumedKwh: 0,
            totalCost: 0,
          };
        }
        byConnector[c.connectorId].transactions += 1;
        byConnector[c.connectorId].energyConsumedKwh += c.energyConsumed;
        byConnector[c.connectorId].totalCost += c.totalCost;
      });

      demoReports.push({
        companyId: cp.companyId,
        chargePointId: cp.chargePointId,
        periodFrom: periodFrom,
        periodTo: periodTo,
        totals: {
          transactions: totalTransactions,
          energyConsumedKwh: totalEnergyConsumed,
          energyCost: totalEnergyCost,
          totalCost: totalCost,
          currency: "USD",
        },
        byConnector: Object.values(byConnector),
        generatedAt: now,
      });

      const lastMonthFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthTo = new Date(now.getFullYear(), now.getMonth(), 0);

      demoReports.push({
        companyId: cp.companyId,
        chargePointId: cp.chargePointId,
        periodFrom: lastMonthFrom,
        periodTo: lastMonthTo,
        totals: {
          transactions: Math.floor(totalTransactions * 0.8),
          energyConsumedKwh: totalEnergyConsumed * 0.75,
          energyCost: totalEnergyCost * 0.75,
          totalCost: totalCost * 0.75,
          currency: "USD",
        },
        byConnector: Object.values(byConnector).map(c => ({
          ...c,
          transactions: Math.floor(c.transactions * 0.8),
          energyConsumedKwh: c.energyConsumedKwh * 0.75,
          totalCost: c.totalCost * 0.75,
        })),
        generatedAt: new Date(now.getTime() - 30 * 86400000),
      });
    });

    await Report.deleteMany({});
    const createdReports = await Report.insertMany(demoReports);

    console.log(`✅ Created ${createdReports.length} demo reports`);

    return createdReports;
  } catch (error) {
    console.error("Error creating demo reports:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoReports()
    .then(() => {
      console.log("Demo reports creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo reports:", error);
      process.exit(1);
    });
}

export default createDemoReports;
