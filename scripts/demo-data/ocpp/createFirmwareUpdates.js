import mongoose from "mongoose";
import FirmwareUpdate from "../../../model/ocpp/FirmwareUpdate.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import connectDB from "../../../configuration/db.js";

const createDemoFirmwareUpdates = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});

    if (chargePoints.length === 0) {
      console.log("⚠️  No charge points found. Please create charge points first.");
      return [];
    }

    const demoFirmwareUpdates = [];
    const now = new Date();

    chargePoints.forEach((cp, index) => {
      if (index < 2) {
        demoFirmwareUpdates.push({
          chargePointId: cp.chargePointId,
          location: `https://firmware.ocppcentral.com/updates/${cp.vendorName}/${cp.model}/v2.2.0.bin`,
          retrieveDate: new Date(now.getTime() - 86400000),
          retryInterval: 600,
          retries: 0,
          maxRetries: 3,
          status: "Installed",
          statusNotifications: [
            {
              status: "Downloaded",
              timestamp: new Date(now.getTime() - 82800000),
            },
            {
              status: "Installing",
              timestamp: new Date(now.getTime() - 79200000),
            },
            {
              status: "Installed",
              timestamp: new Date(now.getTime() - 75600000),
            },
          ],
          requestedAt: new Date(now.getTime() - 86400000),
          startedAt: new Date(now.getTime() - 82800000),
          completedAt: new Date(now.getTime() - 75600000),
          failedAt: null,
          errorMessage: null,
        });
      }

      if (index === 2) {
        demoFirmwareUpdates.push({
          chargePointId: cp.chargePointId,
          location: `https://firmware.ocppcentral.com/updates/${cp.vendorName}/${cp.model}/v1.9.0.bin`,
          retrieveDate: new Date(now.getTime() - 7200000),
          retryInterval: 600,
          retries: 0,
          maxRetries: 3,
          status: "Downloading",
          statusNotifications: [],
          requestedAt: new Date(now.getTime() - 7200000),
          startedAt: new Date(now.getTime() - 3600000),
          completedAt: null,
          failedAt: null,
          errorMessage: null,
        });
      }

      if (index === 3) {
        demoFirmwareUpdates.push({
          chargePointId: cp.chargePointId,
          location: `https://firmware.ocppcentral.com/updates/${cp.vendorName}/${cp.model}/v3.3.0.bin`,
          retrieveDate: new Date(now.getTime() - 14400000),
          retryInterval: 600,
          retries: 2,
          maxRetries: 3,
          status: "DownloadFailed",
          statusNotifications: [
            {
              status: "DownloadFailed",
              timestamp: new Date(now.getTime() - 10800000),
            },
          ],
          requestedAt: new Date(now.getTime() - 14400000),
          startedAt: new Date(now.getTime() - 12600000),
          completedAt: null,
          failedAt: new Date(now.getTime() - 10800000),
          errorMessage: "Firmware file corrupted or incomplete",
        });
      }

      if (index === 4) {
        demoFirmwareUpdates.push({
          chargePointId: cp.chargePointId,
          location: `https://firmware.ocppcentral.com/updates/${cp.vendorName}/${cp.model}/v1.8.3.bin`,
          retrieveDate: new Date(now.getTime() + 3600000),
          retryInterval: 600,
          retries: 0,
          maxRetries: 3,
          status: "Pending",
          statusNotifications: [],
          requestedAt: new Date(now.getTime() - 1800000),
          startedAt: null,
          completedAt: null,
          failedAt: null,
          errorMessage: null,
        });
      }
    });

    await FirmwareUpdate.deleteMany({});
    const createdFirmwareUpdates = await FirmwareUpdate.insertMany(demoFirmwareUpdates);

    console.log(`✅ Created ${createdFirmwareUpdates.length} demo firmware updates`);
    console.log(`   - Installed: ${createdFirmwareUpdates.filter(f => f.status === "Installed").length}`);
    console.log(`   - Downloading: ${createdFirmwareUpdates.filter(f => f.status === "Downloading").length}`);
    console.log(`   - DownloadFailed: ${createdFirmwareUpdates.filter(f => f.status === "DownloadFailed").length}`);
    console.log(`   - Pending: ${createdFirmwareUpdates.filter(f => f.status === "Pending").length}`);

    return createdFirmwareUpdates;
  } catch (error) {
    console.error("Error creating demo firmware updates:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoFirmwareUpdates()
    .then(() => {
      console.log("Demo firmware updates creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo firmware updates:", error);
      process.exit(1);
    });
}

export default createDemoFirmwareUpdates;
