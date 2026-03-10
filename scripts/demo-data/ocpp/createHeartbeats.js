import mongoose from "mongoose";
import Heartbeat from "../../../model/ocpp/Heartbeat.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import connectDB from "../../../configuration/db.js";

const createDemoHeartbeats = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});

    if (chargePoints.length === 0) {
      console.log("⚠️  No charge points found. Please create charge points first.");
      return [];
    }

    const demoHeartbeats = [];
    const now = new Date();

    chargePoints.forEach((cp) => {
      const interval = cp.heartbeatInterval || 300;
      const numHeartbeats = 10;

      for (let i = 0; i < numHeartbeats; i++) {
        const timestamp = new Date(now.getTime() - i * interval * 1000);

        demoHeartbeats.push({
          chargePointId: cp.chargePointId,
          currentTime: timestamp,
          timestamp: timestamp,
        });
      }
    });

    await Heartbeat.deleteMany({});
    const createdHeartbeats = await Heartbeat.insertMany(demoHeartbeats);

    console.log(`✅ Created ${createdHeartbeats.length} demo heartbeats`);

    return createdHeartbeats;
  } catch (error) {
    console.error("Error creating demo heartbeats:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoHeartbeats()
    .then(() => {
      console.log("Demo heartbeats creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo heartbeats:", error);
      process.exit(1);
    });
}

export default createDemoHeartbeats;
