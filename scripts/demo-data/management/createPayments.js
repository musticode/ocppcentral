import mongoose from "mongoose";
import Payment from "../../../model/management/Payment.js";
import Consumption from "../../../model/management/Consumption.js";
import User from "../../../model/management/User.js";
import Company from "../../../model/management/Company.js";
import connectDB from "../../../configuration/db.js";

const createDemoPayments = async () => {
  try {
    await connectDB();

    const consumptions = await Consumption.find({});
    const users = await User.find({});
    const companies = await Company.find({});

    if (consumptions.length === 0) {
      console.log("⚠️  No consumptions found. Please create consumptions first.");
      return [];
    }

    const demoPayments = [];

    consumptions.forEach((consumption, index) => {
      const user = users[index % users.length];
      const isCompleted = index % 5 !== 4;
      const paymentMethod = ["Card", "Wallet", "Card", "Invoice"][index % 4];

      demoPayments.push({
        amount: consumption.totalCost,
        currency: consumption.currency,
        status: isCompleted ? "Completed" : index % 10 === 9 ? "Failed" : "Pending",
        paymentMethod: paymentMethod,
        userId: user?._id,
        companyId: user?.companyId || null,
        transactionId: consumption.transactionId,
        consumptionId: consumption._id,
        chargePointId: consumption.chargePointId,
        idTag: consumption.idTag,
        paidAt: isCompleted ? new Date(consumption.timestamp.getTime() + 60000) : null,
        externalPaymentId: isCompleted ? `stripe_pi_${Date.now()}_${index}` : null,
        description: `Payment for charging session #${consumption.transactionId}`,
        metadata: {
          energyConsumed: consumption.energyConsumed,
          pricePerKwh: consumption.pricePerKwh,
          duration: consumption.duration,
        },
      });
    });

    demoPayments.push({
      amount: 25.0,
      currency: "USD",
      status: "Refunded",
      paymentMethod: "Card",
      userId: users[0]?._id,
      companyId: null,
      transactionId: null,
      consumptionId: null,
      chargePointId: "CP001",
      idTag: "TAG-USER-001",
      paidAt: new Date(Date.now() - 86400000),
      externalPaymentId: `stripe_pi_refund_${Date.now()}`,
      description: "Refund for cancelled session",
      metadata: {
        reason: "Session cancelled by user",
      },
    });

    await Payment.deleteMany({});
    const createdPayments = await Payment.insertMany(demoPayments);

    console.log(`✅ Created ${createdPayments.length} demo payments`);
    console.log(`   - Completed: ${createdPayments.filter(p => p.status === "Completed").length}`);
    console.log(`   - Pending: ${createdPayments.filter(p => p.status === "Pending").length}`);
    console.log(`   - Failed: ${createdPayments.filter(p => p.status === "Failed").length}`);
    console.log(`   - Refunded: ${createdPayments.filter(p => p.status === "Refunded").length}`);

    return createdPayments;
  } catch (error) {
    console.error("Error creating demo payments:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoPayments()
    .then(() => {
      console.log("Demo payments creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo payments:", error);
      process.exit(1);
    });
}

export default createDemoPayments;
