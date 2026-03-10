import mongoose from "mongoose";
import Authorization from "../../../model/ocpp/Authorization.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import IdTag from "../../../model/ocpp/IdTag.js";
import connectDB from "../../../configuration/db.js";

const createDemoAuthorizations = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});
    const idTags = await IdTag.find({});

    if (chargePoints.length === 0 || idTags.length === 0) {
      console.log("⚠️  No charge points or ID tags found. Please create them first.");
      return [];
    }

    const demoAuthorizations = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const cp = chargePoints[i % chargePoints.length];
      const idTag = idTags[i % idTags.length];
      const timestamp = new Date(now.getTime() - i * 600000);

      demoAuthorizations.push({
        chargePointId: cp.chargePointId,
        idTag: idTag.idTag,
        idTagInfo: {
          status: idTag.status,
          expiryDate: idTag.expiryDate,
          parentIdTag: idTag.parentIdTag,
        },
        timestamp: timestamp,
      });
    }

    await Authorization.deleteMany({});
    const createdAuthorizations = await Authorization.insertMany(demoAuthorizations);

    console.log(`✅ Created ${createdAuthorizations.length} demo authorizations`);

    return createdAuthorizations;
  } catch (error) {
    console.error("Error creating demo authorizations:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoAuthorizations()
    .then(() => {
      console.log("Demo authorizations creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo authorizations:", error);
      process.exit(1);
    });
}

export default createDemoAuthorizations;
