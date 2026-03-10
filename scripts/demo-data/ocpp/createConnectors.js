import mongoose from "mongoose";
import Connector from "../../../model/ocpp/Connector.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import connectDB from "../../../configuration/db.js";

const createDemoConnectors = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});

    if (chargePoints.length === 0) {
      console.log("⚠️  No charge points found. Please create charge points first.");
      return [];
    }

    const demoConnectors = [];

    chargePoints.forEach((cp) => {
      const numConnectors = cp.chargePointId.includes("CP001") || cp.chargePointId.includes("CP002") ? 2 : 
                           cp.chargePointId.includes("CP006") ? 4 : 1;

      demoConnectors.push({
        chargePointId: cp.chargePointId,
        connectorId: 0,
        name: "Main Connector",
        status: "Available",
        errorCode: "NoError",
        info: "Main charge point connector",
        lastStatusUpdate: new Date(),
      });

      for (let i = 1; i <= numConnectors; i++) {
        const statuses = ["Available", "Occupied", "Charging", "Available"];
        const status = statuses[i % statuses.length];

        demoConnectors.push({
          chargePointId: cp.chargePointId,
          connectorId: i,
          name: `Connector ${i}`,
          status: status,
          errorCode: "NoError",
          info: `Physical connector ${i}`,
          lastStatusUpdate: new Date(),
          currentTransactionId: status === "Charging" ? 1000 + i : null,
        });
      }
    });

    await Connector.deleteMany({});
    const createdConnectors = await Connector.insertMany(demoConnectors);

    console.log(`✅ Created ${createdConnectors.length} demo connectors`);

    return createdConnectors;
  } catch (error) {
    console.error("Error creating demo connectors:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoConnectors()
    .then(() => {
      console.log("Demo connectors creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo connectors:", error);
      process.exit(1);
    });
}

export default createDemoConnectors;
