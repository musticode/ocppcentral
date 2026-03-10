import mongoose from "mongoose";
import Pricing from "../../../model/management/Pricing.js";
import User from "../../../model/management/User.js";
import connectDB from "../../../configuration/db.js";

const createDemoPricing = async () => {
  try {
    await connectDB();

    const users = await User.find({});

    const demoPricing = [
      {
        name: "Standard Pricing",
        description: "Default pricing for all charge points",
        basePrice: 0.35,
        currency: "USD",
        timeBasedPricing: [
          {
            startTime: "00:00",
            endTime: "06:00",
            pricePerKwh: 0.25,
          },
          {
            startTime: "18:00",
            endTime: "23:59",
            pricePerKwh: 0.45,
          },
        ],
        connectionFee: 1.0,
        minimumCharge: 2.0,
        isActive: true,
        chargePointIds: [],
        validFrom: new Date("2024-01-01"),
        validUntil: null,
        createdBy: "system",
      },
      {
        name: "Premium Fast Charging",
        description: "Higher rate for DC fast chargers",
        basePrice: 0.55,
        currency: "USD",
        timeBasedPricing: [
          {
            startTime: "00:00",
            endTime: "06:00",
            pricePerKwh: 0.40,
          },
        ],
        connectionFee: 2.0,
        minimumCharge: 5.0,
        isActive: true,
        chargePointIds: ["CP001", "CP002"],
        validFrom: new Date("2024-01-01"),
        validUntil: null,
        createdBy: "system",
      },
      {
        name: "Weekend Special",
        description: "Discounted weekend pricing",
        basePrice: 0.30,
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
        connectionFee: 0.5,
        minimumCharge: 1.5,
        isActive: true,
        chargePointIds: [],
        validFrom: new Date("2024-01-01"),
        validUntil: new Date("2024-12-31"),
        createdBy: "system",
      },
      {
        name: "Customer VIP Pricing",
        description: "Special pricing for VIP customer",
        basePrice: 0.25,
        currency: "USD",
        timeBasedPricing: [],
        connectionFee: 0,
        minimumCharge: 0,
        isActive: true,
        chargePointIds: [],
        validFrom: new Date("2024-01-01"),
        validUntil: null,
        userId: users[1]?._id,
        createdBy: "admin",
      },
      {
        name: "Business Hours Rate",
        description: "Pricing for business hours 9-5",
        basePrice: 0.40,
        currency: "USD",
        timeBasedPricing: [
          {
            startTime: "09:00",
            endTime: "17:00",
            pricePerKwh: 0.38,
          },
        ],
        connectionFee: 1.5,
        minimumCharge: 2.5,
        isActive: true,
        chargePointIds: ["CP003", "CP004", "CP005"],
        validFrom: new Date("2024-01-01"),
        validUntil: null,
        createdBy: "system",
      },
    ];

    await Pricing.deleteMany({});
    const createdPricing = await Pricing.insertMany(demoPricing);

    console.log(`✅ Created ${createdPricing.length} demo pricing plans`);

    return createdPricing;
  } catch (error) {
    console.error("Error creating demo pricing:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoPricing()
    .then(() => {
      console.log("Demo pricing creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo pricing:", error);
      process.exit(1);
    });
}

export default createDemoPricing;
