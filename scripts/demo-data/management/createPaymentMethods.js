import mongoose from "mongoose";
import connectDB from "../../../configuration/db.js";
import PaymentMethod from "../../../model/management/PaymentMethod.js";
import User from "../../../model/management/User.js";

const createDemoPaymentMethods = async () => {
  try {
    await connectDB();

    const users = await User.find({});

    if (users.length === 0) {
      console.log("⚠️  No users found. Please create users first.");
      return [];
    }

    const customers = users.filter((u) => u.role === "customer");

    if (customers.length === 0) {
      console.log("⚠️  No customer users found. Please create users with role=customer first.");
      return [];
    }

    const currentYear = new Date().getFullYear();

    const demoMethods = [];

    customers.forEach((customer, index) => {
      const makeActive = index % 2 === 0;
      const verified = index % 3 !== 2;

      demoMethods.push({
        userId: customer._id,
        type: "credit_card",
        provider: "stripe",
        cardLast4: String(1000 + ((index + 11) % 8999)).slice(-4),
        cardBrand: index % 2 === 0 ? "visa" : "mastercard",
        cardExpMonth: ((index % 12) + 1),
        cardExpYear: currentYear + 2,
        externalId: `pm_demo_${customer._id.toString().slice(-6)}_${index}`,
        externalCustomerId: `cus_demo_${customer._id.toString().slice(-6)}`,
        isActive: makeActive,
        isVerified: verified,
        isDefault: makeActive,
        billingAddress: {
          street: "123 Demo St",
          city: "Demo City",
          state: "CA",
          zipCode: "94102",
          country: "USA",
        },
        metadata: { demo: true },
        status: verified ? "active" : "pending",
      });

      demoMethods.push({
        userId: customer._id,
        type: "paypal",
        provider: "paypal",
        paypalEmail: customer.email,
        externalId: `pp_demo_${customer._id.toString().slice(-6)}_${index}`,
        isActive: false,
        isVerified: true,
        isDefault: false,
        status: "active",
        metadata: { demo: true },
      });
    });

    await PaymentMethod.deleteMany({});

    const created = [];
    for (const method of demoMethods) {
      const doc = new PaymentMethod(method);
      await doc.save();
      created.push(doc);
    }

    const activeCount = await PaymentMethod.countDocuments({ isActive: true });
    const verifiedCount = await PaymentMethod.countDocuments({ isVerified: true });

    console.log(`✅ Created ${created.length} demo payment methods`);
    console.log(`   - Active: ${activeCount}`);
    console.log(`   - Verified: ${verifiedCount}`);

    return created;
  } catch (error) {
    console.error("Error creating demo payment methods:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoPaymentMethods()
    .then(() => {
      console.log("Demo payment methods creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo payment methods:", error);
      process.exit(1);
    });
}

export default createDemoPaymentMethods;
