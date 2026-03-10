import mongoose from "mongoose";
import BootNotification from "../../../model/ocpp/BootNotification.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import connectDB from "../../../configuration/db.js";

const createDemoBootNotifications = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});

    if (chargePoints.length === 0) {
      console.log("⚠️  No charge points found. Please create charge points first.");
      return [];
    }

    const demoBootNotifications = [];
    const now = new Date();

    chargePoints.forEach((cp, index) => {
      const bootTime = new Date(now.getTime() - (index + 1) * 86400000);

      demoBootNotifications.push({
        chargePointId: cp.chargePointId,
        chargePointVendor: cp.vendorName,
        chargePointModel: cp.model,
        chargePointSerialNumber: cp.serialNumber,
        chargeBoxSerialNumber: `CB-${cp.serialNumber}`,
        firmwareVersion: cp.firmwareVersion,
        iccid: `89014103${String(index).padStart(12, "0")}`,
        imsi: `31041${String(index).padStart(10, "0")}`,
        meterType: "EnergyMeter Pro",
        meterSerialNumber: `EM-${String(index + 1).padStart(6, "0")}`,
        status: "Accepted",
        currentTime: bootTime,
        interval: cp.heartbeatInterval,
        timestamp: bootTime,
      });

      if (index < 3) {
        const rebootTime = new Date(now.getTime() - 3600000);
        demoBootNotifications.push({
          chargePointId: cp.chargePointId,
          chargePointVendor: cp.vendorName,
          chargePointModel: cp.model,
          chargePointSerialNumber: cp.serialNumber,
          chargeBoxSerialNumber: `CB-${cp.serialNumber}`,
          firmwareVersion: cp.firmwareVersion,
          iccid: `89014103${String(index).padStart(12, "0")}`,
          imsi: `31041${String(index).padStart(10, "0")}`,
          meterType: "EnergyMeter Pro",
          meterSerialNumber: `EM-${String(index + 1).padStart(6, "0")}`,
          status: "Accepted",
          currentTime: rebootTime,
          interval: cp.heartbeatInterval,
          timestamp: rebootTime,
        });
      }
    });

    await BootNotification.deleteMany({});
    const createdBootNotifications = await BootNotification.insertMany(demoBootNotifications);

    console.log(`✅ Created ${createdBootNotifications.length} demo boot notifications`);

    return createdBootNotifications;
  } catch (error) {
    console.error("Error creating demo boot notifications:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoBootNotifications()
    .then(() => {
      console.log("Demo boot notifications creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo boot notifications:", error);
      process.exit(1);
    });
}

export default createDemoBootNotifications;
