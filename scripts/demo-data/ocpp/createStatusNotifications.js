import mongoose from "mongoose";
import StatusNotification from "../../../model/ocpp/StatusNotification.js";
import Connector from "../../../model/ocpp/Connector.js";
import connectDB from "../../../configuration/db.js";

const createDemoStatusNotifications = async () => {
  try {
    await connectDB();

    const connectors = await Connector.find({});

    if (connectors.length === 0) {
      console.log("⚠️  No connectors found. Please create connectors first.");
      return [];
    }

    const demoStatusNotifications = [];
    const now = new Date();

    connectors.forEach((connector, index) => {
      const statusHistory = [
        { status: "Available", errorCode: "NoError", hoursAgo: 24 },
        { status: "Preparing", errorCode: "NoError", hoursAgo: 12 },
        { status: "Charging", errorCode: "NoError", hoursAgo: 10 },
        { status: "SuspendedEV", errorCode: "NoError", hoursAgo: 8 },
        { status: "Charging", errorCode: "NoError", hoursAgo: 7 },
        { status: "Finishing", errorCode: "NoError", hoursAgo: 4 },
        { status: connector.status, errorCode: connector.errorCode || "NoError", hoursAgo: 0 },
      ];

      statusHistory.forEach((statusItem) => {
        const timestamp = new Date(now.getTime() - statusItem.hoursAgo * 3600000);

        demoStatusNotifications.push({
          chargePointId: connector.chargePointId,
          connectorId: connector.connectorId,
          errorCode: statusItem.errorCode,
          status: statusItem.status,
          info: `Status update for connector ${connector.connectorId}`,
          timestamp: timestamp,
          vendorId: null,
          vendorErrorCode: null,
        });
      });
    });

    await StatusNotification.deleteMany({});
    const createdStatusNotifications = await StatusNotification.insertMany(demoStatusNotifications);

    console.log(`✅ Created ${createdStatusNotifications.length} demo status notifications`);

    return createdStatusNotifications;
  } catch (error) {
    console.error("Error creating demo status notifications:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoStatusNotifications()
    .then(() => {
      console.log("Demo status notifications creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo status notifications:", error);
      process.exit(1);
    });
}

export default createDemoStatusNotifications;
