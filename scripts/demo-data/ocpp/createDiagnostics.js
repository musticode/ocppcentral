import mongoose from "mongoose";
import Diagnostics from "../../../model/ocpp/Diagnostics.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import connectDB from "../../../configuration/db.js";

const createDemoDiagnostics = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});

    if (chargePoints.length === 0) {
      console.log("⚠️  No charge points found. Please create charge points first.");
      return [];
    }

    const demoDiagnostics = [];
    const now = new Date();

    chargePoints.forEach((cp, index) => {
      if (index < 3) {
        demoDiagnostics.push({
          chargePointId: cp.chargePointId,
          location: `https://diagnostics.ocppcentral.com/uploads/${cp.chargePointId}`,
          startTime: new Date(now.getTime() - 86400000),
          stopTime: new Date(now.getTime() - 3600000),
          retryInterval: 300,
          retries: 0,
          maxRetries: 3,
          status: "Uploaded",
          statusNotifications: [
            {
              status: "Uploading",
              timestamp: new Date(now.getTime() - 7200000),
            },
            {
              status: "Uploaded",
              timestamp: new Date(now.getTime() - 3600000),
            },
          ],
          fileName: `${cp.chargePointId}_diagnostics_${Date.now()}.log`,
          fileSize: 1024 * (500 + index * 100),
          fileUrl: `https://diagnostics.ocppcentral.com/files/${cp.chargePointId}_diagnostics.log`,
          requestedAt: new Date(now.getTime() - 86400000),
          startedAt: new Date(now.getTime() - 7200000),
          completedAt: new Date(now.getTime() - 3600000),
          failedAt: null,
          errorMessage: null,
        });
      }

      if (index === 3) {
        demoDiagnostics.push({
          chargePointId: cp.chargePointId,
          location: `https://diagnostics.ocppcentral.com/uploads/${cp.chargePointId}`,
          startTime: new Date(now.getTime() - 7200000),
          stopTime: new Date(now.getTime() - 1800000),
          retryInterval: 300,
          retries: 2,
          maxRetries: 3,
          status: "UploadFailed",
          statusNotifications: [
            {
              status: "Uploading",
              timestamp: new Date(now.getTime() - 3600000),
            },
            {
              status: "UploadFailed",
              timestamp: new Date(now.getTime() - 1800000),
            },
          ],
          fileName: null,
          fileSize: null,
          fileUrl: null,
          requestedAt: new Date(now.getTime() - 7200000),
          startedAt: new Date(now.getTime() - 3600000),
          completedAt: null,
          failedAt: new Date(now.getTime() - 1800000),
          errorMessage: "Network timeout during upload",
        });
      }

      if (index === 4) {
        demoDiagnostics.push({
          chargePointId: cp.chargePointId,
          location: `https://diagnostics.ocppcentral.com/uploads/${cp.chargePointId}`,
          startTime: new Date(now.getTime() - 1800000),
          stopTime: new Date(now.getTime()),
          retryInterval: 300,
          retries: 0,
          maxRetries: 3,
          status: "Pending",
          statusNotifications: [],
          fileName: null,
          fileSize: null,
          fileUrl: null,
          requestedAt: new Date(now.getTime() - 1800000),
          startedAt: null,
          completedAt: null,
          failedAt: null,
          errorMessage: null,
        });
      }
    });

    await Diagnostics.deleteMany({});
    const createdDiagnostics = await Diagnostics.insertMany(demoDiagnostics);

    console.log(`✅ Created ${createdDiagnostics.length} demo diagnostics`);
    console.log(`   - Uploaded: ${createdDiagnostics.filter(d => d.status === "Uploaded").length}`);
    console.log(`   - UploadFailed: ${createdDiagnostics.filter(d => d.status === "UploadFailed").length}`);
    console.log(`   - Pending: ${createdDiagnostics.filter(d => d.status === "Pending").length}`);

    return createdDiagnostics;
  } catch (error) {
    console.error("Error creating demo diagnostics:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoDiagnostics()
    .then(() => {
      console.log("Demo diagnostics creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo diagnostics:", error);
      process.exit(1);
    });
}

export default createDemoDiagnostics;
