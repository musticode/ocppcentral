import mongoose from "mongoose";
import Transaction from "../../../model/ocpp/Transaction.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import IdTag from "../../../model/ocpp/IdTag.js";
import connectDB from "../../../configuration/db.js";

const createDemoTransactions = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});
    const idTags = await IdTag.find({ status: "Accepted", isActive: true });

    if (chargePoints.length === 0 || idTags.length === 0) {
      console.log("⚠️  No charge points or ID tags found. Please create them first.");
      return [];
    }

    const now = new Date();
    const demoTransactions = [];

    let transactionIdCounter = 1001;

    for (let i = 0; i < 15; i++) {
      const cp = chargePoints[i % chargePoints.length];
      const idTag = idTags[i % idTags.length];
      const connectorId = (i % 2) + 1;

      const isActive = i < 3;
      const startTime = new Date(now.getTime() - (i + 1) * 3600000);
      const stopTime = isActive ? null : new Date(startTime.getTime() + (2 + i % 3) * 3600000);

      const meterStart = 10000 + i * 5000;
      const meterStop = isActive ? null : meterStart + (15000 + i * 2000);
      const energyConsumed = isActive ? null : (meterStop - meterStart) / 1000;

      demoTransactions.push({
        transactionId: transactionIdCounter++,
        chargePointId: cp.chargePointId,
        connectorId: connectorId,
        idTag: idTag.idTag,
        meterStart: meterStart,
        timestamp: startTime,
        startedAt: startTime,
        stoppedAt: stopTime,
        meterStop: meterStop,
        energyConsumed: energyConsumed,
        meterValues: [],
        stopReason: isActive ? null : ["Remote", "Local", "EVDisconnected"][i % 3],
        idTagInfo: {
          status: "Accepted",
          expiryDate: idTag.expiryDate,
          parentIdTag: idTag.parentIdTag,
        },
        status: isActive ? "Active" : "Completed",
      });
    }

    await Transaction.deleteMany({});
    const createdTransactions = await Transaction.insertMany(demoTransactions);

    console.log(`✅ Created ${createdTransactions.length} demo transactions`);
    console.log(`   - Active: ${createdTransactions.filter(t => t.status === "Active").length}`);
    console.log(`   - Completed: ${createdTransactions.filter(t => t.status === "Completed").length}`);

    return createdTransactions;
  } catch (error) {
    console.error("Error creating demo transactions:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoTransactions()
    .then(() => {
      console.log("Demo transactions creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo transactions:", error);
      process.exit(1);
    });
}

export default createDemoTransactions;
