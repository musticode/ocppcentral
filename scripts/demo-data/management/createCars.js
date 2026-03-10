import mongoose from "mongoose";
import Car from "../../../model/management/Car.js";
import User from "../../../model/management/User.js";
import Company from "../../../model/management/Company.js";
import connectDB from "../../../configuration/db.js";

const createDemoCars = async () => {
  try {
    await connectDB();

    const users = await User.find({});
    const companies = await Company.find({});

    if (users.length === 0) {
      console.log("⚠️  No users found. Please create users first.");
      return [];
    }

    const demoCars = [
      {
        userId: users[1]?._id,
        companyId: null,
        make: "Tesla",
        model: "Model 3",
        year: 2023,
        color: "Midnight Silver Metallic",
        licensePlate: "EV-T3-001",
        vin: "5YJ3E1EA1KF123456",
        batteryCapacity: 75,
        range: 358,
        chargingPort: "Type 2",
        isActive: true,
        notes: "Long Range AWD",
      },
      {
        userId: users[2]?._id,
        companyId: null,
        make: "Nissan",
        model: "Leaf",
        year: 2022,
        color: "Deep Blue Pearl",
        licensePlate: "EV-NL-002",
        vin: "1N4AZ1CP8NC123789",
        batteryCapacity: 62,
        range: 226,
        chargingPort: "CHAdeMO",
        isActive: true,
        notes: "SL Plus trim",
      },
      {
        userId: users[5]?._id,
        companyId: null,
        make: "Chevrolet",
        model: "Bolt EV",
        year: 2023,
        color: "Bright Blue Metallic",
        licensePlate: "EV-CB-003",
        vin: "1G1FY6S01N4123456",
        batteryCapacity: 65,
        range: 259,
        chargingPort: "CCS",
        isActive: true,
        notes: "Premier trim",
      },
      {
        userId: users[6]?._id,
        companyId: null,
        make: "Ford",
        model: "Mustang Mach-E",
        year: 2023,
        color: "Grabber Blue Metallic",
        licensePlate: "EV-FM-004",
        vin: "3FMTK3SU1MMA12345",
        batteryCapacity: 91,
        range: 312,
        chargingPort: "CCS",
        isActive: true,
        notes: "Extended Range AWD",
      },
      {
        userId: users[3]?._id,
        companyId: companies[0]?._id,
        make: "Tesla",
        model: "Model Y",
        year: 2023,
        color: "Pearl White Multi-Coat",
        licensePlate: "EV-TY-005",
        vin: "5YJYGDEE1MF123456",
        batteryCapacity: 75,
        range: 330,
        chargingPort: "Type 2",
        isActive: true,
        notes: "Company fleet vehicle",
      },
      {
        userId: users[4]?._id,
        companyId: companies[1]?._id,
        make: "Volkswagen",
        model: "ID.4",
        year: 2022,
        color: "Dusk Blue Metallic",
        licensePlate: "EV-VW-006",
        vin: "1V2WREE20MC123456",
        batteryCapacity: 82,
        range: 275,
        chargingPort: "CCS",
        isActive: true,
        notes: "Fleet vehicle - ID.4 Pro S",
      },
      {
        userId: users[1]?._id,
        companyId: null,
        make: "Hyundai",
        model: "Ioniq 5",
        year: 2023,
        color: "Cyber Gray Metallic",
        licensePlate: "EV-HI-007",
        vin: "KM8KRDAF1NU123456",
        batteryCapacity: 77.4,
        range: 303,
        chargingPort: "CCS",
        isActive: true,
        notes: "Limited AWD",
      },
    ];

    await Car.deleteMany({});
    const createdCars = await Car.insertMany(demoCars.filter(car => car.userId));

    console.log(`✅ Created ${createdCars.length} demo cars`);

    return createdCars;
  } catch (error) {
    console.error("Error creating demo cars:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoCars()
    .then(() => {
      console.log("Demo cars creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo cars:", error);
      process.exit(1);
    });
}

export default createDemoCars;
