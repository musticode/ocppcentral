import mongoose from "mongoose";
import Tariff from "../../../model/management/Tariff.js";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import Company from "../../../model/management/Company.js";
import connectDB from "../../../configuration/db.js";

const createDemoTariffs = async () => {
  try {
    await connectDB();

    const chargePoints = await ChargePoint.find({});
    const companies = await Company.find({});

    if (chargePoints.length === 0) {
      console.log("⚠️  No charge points found. Please create charge points first.");
      return [];
    }

    const demoTariffs = [];

    chargePoints.forEach((cp, index) => {
      const numConnectors = index < 2 ? 2 : 1;

      for (let connectorId = 1; connectorId <= numConnectors; connectorId++) {
        demoTariffs.push({
          name: `${cp.name} - Connector ${connectorId} Tariff`,
          description: `Standard tariff for ${cp.chargePointId} connector ${connectorId}`,
          companyId: cp.companyId ? String(cp.companyId) : null,
          chargePointId: cp.chargePointId,
          connectorId: connectorId,
          basePrice: 0.40,
          currency: "USD",
          timeBasedPricing: [
            {
              startTime: "00:00",
              endTime: "06:00",
              pricePerKwh: 0.30,
            },
            {
              startTime: "18:00",
              endTime: "22:00",
              pricePerKwh: 0.50,
            },
          ],
          connectionFee: 1.5,
          minimumCharge: 2.0,
          isActive: true,
          validFrom: new Date("2024-01-01"),
          validUntil: null,
          createdBy: "system",
        });
      }
    });

    demoTariffs.push({
      name: "Weekend Special - CP001 Connector 1",
      description: "Weekend discount pricing",
      companyId: companies[0] ? String(companies[0]._id) : null,
      chargePointId: "CP001",
      connectorId: 1,
      basePrice: 0.32,
      currency: "USD",
      timeBasedPricing: [
        {
          startTime: "00:00",
          endTime: "23:59",
          dayOfWeek: 0,
          pricePerKwh: 0.28,
        },
        {
          startTime: "00:00",
          endTime: "23:59",
          dayOfWeek: 6,
          pricePerKwh: 0.28,
        },
      ],
      connectionFee: 1.0,
      minimumCharge: 1.5,
      isActive: false,
      validFrom: new Date("2024-01-01"),
      validUntil: new Date("2024-12-31"),
      createdBy: "admin",
    });

    await Tariff.deleteMany({});
    const createdTariffs = await Tariff.insertMany(demoTariffs);

    console.log(`✅ Created ${createdTariffs.length} demo tariffs`);

    return createdTariffs;
  } catch (error) {
    console.error("Error creating demo tariffs:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoTariffs()
    .then(() => {
      console.log("Demo tariffs creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo tariffs:", error);
      process.exit(1);
    });
}

export default createDemoTariffs;
