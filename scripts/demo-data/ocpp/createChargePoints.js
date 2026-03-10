import mongoose from "mongoose";
import ChargePoint from "../../../model/ocpp/ChargePoint.js";
import Company from "../../../model/management/Company.js";
import Location from "../../../model/management/Location.js";
import connectDB from "../../../configuration/db.js";

const createDemoChargePoints = async () => {
  try {
    await connectDB();

    const companies = await Company.find({});
    const locations = await Location.find({});

    const demoChargePoints = [
      {
        chargePointId: "CP001",
        name: "Downtown Fast Charger 1",
        description: "DC Fast Charger - 150kW",
        identifier: "CP001-DT-SF",
        model: "FastCharge Pro 150",
        vendorName: "ABB",
        firmwareVersion: "2.1.5",
        serialNumber: "ABB-FC150-001",
        ipAddress: "192.168.1.101",
        port: 8080,
        connectionStatus: "Connected",
        lastHeartbeat: new Date(),
        lastBootNotification: new Date(),
        heartbeatInterval: 300,
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: "100 Main Street, San Francisco, CA",
        },
        companyId: companies[0]?._id,
        companyName: companies[0]?.name,
        locationId: locations[0]?._id,
      },
      {
        chargePointId: "CP002",
        name: "Downtown Fast Charger 2",
        description: "DC Fast Charger - 150kW",
        identifier: "CP002-DT-SF",
        model: "FastCharge Pro 150",
        vendorName: "ABB",
        firmwareVersion: "2.1.5",
        serialNumber: "ABB-FC150-002",
        ipAddress: "192.168.1.102",
        port: 8080,
        connectionStatus: "Connected",
        lastHeartbeat: new Date(),
        lastBootNotification: new Date(),
        heartbeatInterval: 300,
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: "100 Main Street, San Francisco, CA",
        },
        companyId: companies[0]?._id,
        companyName: companies[0]?.name,
        locationId: locations[0]?._id,
      },
      {
        chargePointId: "CP003",
        name: "Airport Level 2 Charger",
        description: "Level 2 AC Charger - 22kW",
        identifier: "CP003-AP-SF",
        model: "SmartCharge AC22",
        vendorName: "Schneider Electric",
        firmwareVersion: "1.8.2",
        serialNumber: "SE-AC22-003",
        ipAddress: "192.168.2.103",
        port: 8080,
        connectionStatus: "Connected",
        lastHeartbeat: new Date(Date.now() - 60000),
        lastBootNotification: new Date(Date.now() - 3600000),
        heartbeatInterval: 300,
        location: {
          latitude: 37.6213,
          longitude: -122.3790,
          address: "SFO International Airport, San Francisco, CA",
        },
        companyId: companies[0]?._id,
        companyName: companies[0]?.name,
        locationId: locations[1]?._id,
      },
      {
        chargePointId: "CP004",
        name: "Mall West Charger 1",
        description: "Level 2 AC Charger - 11kW",
        identifier: "CP004-MW-TX",
        model: "EcoCharge L2",
        vendorName: "ChargePoint",
        firmwareVersion: "3.2.1",
        serialNumber: "CP-L2-004",
        ipAddress: "192.168.3.104",
        port: 8080,
        connectionStatus: "Connected",
        lastHeartbeat: new Date(),
        lastBootNotification: new Date(),
        heartbeatInterval: 300,
        location: {
          latitude: 30.2672,
          longitude: -97.7431,
          address: "500 Commerce Drive, Austin, TX",
        },
        companyId: companies[1]?._id,
        companyName: companies[1]?.name,
        locationId: locations[2]?._id,
      },
      {
        chargePointId: "CP005",
        name: "Tech Campus Charger",
        description: "Level 2 AC Charger - 22kW",
        identifier: "CP005-TC-WA",
        model: "SmartCharge AC22",
        vendorName: "Schneider Electric",
        firmwareVersion: "1.8.2",
        serialNumber: "SE-AC22-005",
        ipAddress: "192.168.4.105",
        port: 8080,
        connectionStatus: "Disconnected",
        lastHeartbeat: new Date(Date.now() - 600000),
        lastBootNotification: new Date(Date.now() - 7200000),
        heartbeatInterval: 300,
        location: {
          latitude: 47.6062,
          longitude: -122.3321,
          address: "1000 Innovation Way, Seattle, WA",
        },
        companyId: companies[2]?._id,
        companyName: companies[2]?.name,
        locationId: locations[3]?._id,
      },
      {
        chargePointId: "CP006",
        name: "Highway Rest Stop Charger",
        description: "DC Fast Charger - 350kW",
        identifier: "CP006-HW-CA",
        model: "UltraFast 350",
        vendorName: "Tesla",
        firmwareVersion: "4.0.1",
        serialNumber: "TSLA-UF350-006",
        ipAddress: "192.168.5.106",
        port: 8080,
        connectionStatus: "Connected",
        lastHeartbeat: new Date(),
        lastBootNotification: new Date(),
        heartbeatInterval: 300,
        location: {
          latitude: 38.5816,
          longitude: -121.4944,
          address: "I-5 Mile Marker 250, CA",
        },
        companyId: companies[2]?._id,
        companyName: companies[2]?.name,
        locationId: locations[4]?._id,
      },
    ];

    await ChargePoint.deleteMany({});
    const createdChargePoints = await ChargePoint.insertMany(demoChargePoints);

    console.log(`✅ Created ${createdChargePoints.length} demo charge points`);

    return createdChargePoints;
  } catch (error) {
    console.error("Error creating demo charge points:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoChargePoints()
    .then(() => {
      console.log("Demo charge points creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo charge points:", error);
      process.exit(1);
    });
}

export default createDemoChargePoints;
