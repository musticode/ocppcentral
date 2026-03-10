import mongoose from "mongoose";
import Reservation from "../../../model/ocpp/Reservation.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import IdTag from "../../../model/ocpp/IdTag.js";
import connectDB from "../../../configuration/db.js";

const createDemoReservations = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});
    const idTags = await IdTag.find({ status: "Accepted", isActive: true });

    if (chargePoints.length === 0 || idTags.length === 0) {
      console.log("⚠️  No charge points or ID tags found. Please create them first.");
      return [];
    }

    const now = new Date();
    const demoReservations = [];

    let reservationIdCounter = 5001;

    for (let i = 0; i < 8; i++) {
      const cp = chargePoints[i % chargePoints.length];
      const idTag = idTags[i % idTags.length];
      const connectorId = (i % 2) + 1;

      let status, expiryDate, transactionId, cancelledAt;

      if (i < 2) {
        status = "Active";
        expiryDate = new Date(now.getTime() + 3600000);
        transactionId = null;
        cancelledAt = null;
      } else if (i < 4) {
        status = "Used";
        expiryDate = new Date(now.getTime() - 3600000);
        transactionId = 1001 + i;
        cancelledAt = null;
      } else if (i < 6) {
        status = "Expired";
        expiryDate = new Date(now.getTime() - 7200000);
        transactionId = null;
        cancelledAt = null;
      } else {
        status = "Cancelled";
        expiryDate = new Date(now.getTime() + 1800000);
        transactionId = null;
        cancelledAt = new Date(now.getTime() - 600000);
      }

      demoReservations.push({
        reservationId: reservationIdCounter++,
        chargePointId: cp.chargePointId,
        connectorId: connectorId,
        idTag: idTag.idTag,
        expiryDate: expiryDate,
        status: status,
        transactionId: transactionId,
        cancelledAt: cancelledAt,
        cancelledBy: status === "Cancelled" ? "user" : null,
      });
    }

    await Reservation.deleteMany({});
    const createdReservations = await Reservation.insertMany(demoReservations);

    console.log(`✅ Created ${createdReservations.length} demo reservations`);
    console.log(`   - Active: ${createdReservations.filter(r => r.status === "Active").length}`);
    console.log(`   - Used: ${createdReservations.filter(r => r.status === "Used").length}`);
    console.log(`   - Expired: ${createdReservations.filter(r => r.status === "Expired").length}`);
    console.log(`   - Cancelled: ${createdReservations.filter(r => r.status === "Cancelled").length}`);

    return createdReservations;
  } catch (error) {
    console.error("Error creating demo reservations:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoReservations()
    .then(() => {
      console.log("Demo reservations creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo reservations:", error);
      process.exit(1);
    });
}

export default createDemoReservations;
