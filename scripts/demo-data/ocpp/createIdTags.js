import mongoose from "mongoose";
import IdTag from "../../../model/ocpp/IdTag.js";
import User from "../../../model/management/User.js";
import Company from "../../../model/management/Company.js";
import connectDB from "../../../configuration/db.js";

const createDemoIdTags = async () => {
  try {
    await connectDB();

    const users = await User.find({});
    const companies = await Company.find({});

    const demoIdTags = [
      {
        idTag: "TAG-USER-001",
        parentIdTag: null,
        companyId: null,
        status: "Accepted",
        expiryDate: new Date("2025-12-31"),
        userId: users[1]?._id,
        notes: "Primary RFID tag for John Doe",
        description: "Tesla Model 3 owner",
        isActive: true,
      },
      {
        idTag: "TAG-USER-002",
        parentIdTag: null,
        companyId: null,
        status: "Accepted",
        expiryDate: new Date("2025-12-31"),
        userId: users[2]?._id,
        notes: "Primary RFID tag for Jane Smith",
        description: "Nissan Leaf owner",
        isActive: true,
      },
      {
        idTag: "TAG-USER-003",
        parentIdTag: null,
        companyId: null,
        status: "Accepted",
        expiryDate: new Date("2025-12-31"),
        userId: users[5]?._id,
        notes: "Primary RFID tag for Alice Johnson",
        description: "Chevrolet Bolt owner",
        isActive: true,
      },
      {
        idTag: "TAG-USER-004",
        parentIdTag: null,
        companyId: null,
        status: "Accepted",
        expiryDate: new Date("2025-12-31"),
        userId: users[6]?._id,
        notes: "Primary RFID tag for Bob Williams",
        description: "Ford Mustang Mach-E owner",
        isActive: true,
      },
      {
        idTag: "TAG-COMPANY-001",
        parentIdTag: null,
        companyId: companies[0]?._id,
        status: "Accepted",
        expiryDate: new Date("2026-12-31"),
        userId: users[3]?._id,
        notes: "Company operator tag",
        description: "GreenCharge Solutions fleet",
        isActive: true,
      },
      {
        idTag: "TAG-COMPANY-002",
        parentIdTag: null,
        companyId: companies[1]?._id,
        status: "Accepted",
        expiryDate: new Date("2026-12-31"),
        userId: users[4]?._id,
        notes: "Fleet manager tag",
        description: "EV Fleet Services",
        isActive: true,
      },
      {
        idTag: "TAG-BLOCKED-001",
        parentIdTag: null,
        companyId: null,
        status: "Blocked",
        expiryDate: new Date("2024-12-31"),
        userId: null,
        notes: "Blocked due to payment issues",
        description: "Suspended account",
        isActive: false,
      },
      {
        idTag: "TAG-EXPIRED-001",
        parentIdTag: null,
        companyId: null,
        status: "Expired",
        expiryDate: new Date("2023-12-31"),
        userId: null,
        notes: "Expired tag - needs renewal",
        description: "Old membership",
        isActive: false,
      },
      {
        idTag: "TAG-CHILD-001",
        parentIdTag: "TAG-COMPANY-001",
        companyId: companies[0]?._id,
        status: "Accepted",
        expiryDate: new Date("2025-12-31"),
        userId: null,
        notes: "Child tag for fleet vehicle",
        description: "Fleet vehicle #1",
        isActive: true,
      },
      {
        idTag: "TAG-CHILD-002",
        parentIdTag: "TAG-COMPANY-001",
        companyId: companies[0]?._id,
        status: "Accepted",
        expiryDate: new Date("2025-12-31"),
        userId: null,
        notes: "Child tag for fleet vehicle",
        description: "Fleet vehicle #2",
        isActive: true,
      },
    ];

    await IdTag.deleteMany({});
    const createdIdTags = await IdTag.insertMany(demoIdTags);

    console.log(`✅ Created ${createdIdTags.length} demo ID tags`);

    return createdIdTags;
  } catch (error) {
    console.error("Error creating demo ID tags:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoIdTags()
    .then(() => {
      console.log("Demo ID tags creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo ID tags:", error);
      process.exit(1);
    });
}

export default createDemoIdTags;
