import mongoose from "mongoose";
import Notification from "../../../model/management/Notification.js";
import User from "../../../model/management/User.js";
import Company from "../../../model/management/Company.js";
import connectDB from "../../../configuration/db.js";

const createDemoNotifications = async () => {
  try {
    await connectDB();

    const users = await User.find({});
    const companies = await Company.find({});

    const demoNotifications = [
      {
        title: "Welcome to OCPP Central",
        message: "Your account has been successfully created. Start charging!",
        type: "success",
        userId: users[1]?._id,
        companyId: null,
        isRead: false,
        isDeleted: false,
        isArchived: false,
      },
      {
        title: "Charging Session Completed",
        message: "Your charging session at Downtown Hub has completed. Total cost: $12.50",
        type: "info",
        userId: users[2]?._id,
        companyId: null,
        isRead: true,
        isDeleted: false,
        isArchived: false,
      },
      {
        title: "Low Battery Alert",
        message: "Your vehicle battery is below 20%. Find nearby charging stations.",
        type: "warning",
        userId: users[5]?._id,
        companyId: null,
        isRead: false,
        isDeleted: false,
        isArchived: false,
      },
      {
        title: "Payment Failed",
        message: "Payment for charging session #12345 failed. Please update payment method.",
        type: "alert",
        userId: users[6]?._id,
        companyId: null,
        isRead: false,
        isDeleted: false,
        isArchived: false,
      },
      {
        title: "New Charging Station Available",
        message: "A new fast charging station is now available at Airport Parking Garage",
        type: "info",
        userId: null,
        companyId: null,
        isRead: false,
        isDeleted: false,
        isArchived: false,
      },
      {
        title: "Maintenance Scheduled",
        message: "Charging station CP001 will undergo maintenance on 2024-03-15",
        type: "warning",
        userId: null,
        companyId: companies[0]?._id,
        isRead: false,
        isDeleted: false,
        isArchived: false,
      },
      {
        title: "Monthly Usage Report Ready",
        message: "Your monthly charging report for February 2024 is now available",
        type: "info",
        userId: users[3]?._id,
        companyId: companies[0]?._id,
        isRead: false,
        isDeleted: false,
        isArchived: false,
      },
      {
        title: "Special Weekend Pricing",
        message: "Enjoy 20% off on all charging sessions this weekend!",
        type: "success",
        userId: null,
        companyId: null,
        isRead: false,
        isDeleted: false,
        isArchived: false,
      },
    ];

    await Notification.deleteMany({});
    const createdNotifications = await Notification.insertMany(demoNotifications);

    console.log(`✅ Created ${createdNotifications.length} demo notifications`);

    return createdNotifications;
  } catch (error) {
    console.error("Error creating demo notifications:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoNotifications()
    .then(() => {
      console.log("Demo notifications creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo notifications:", error);
      process.exit(1);
    });
}

export default createDemoNotifications;
