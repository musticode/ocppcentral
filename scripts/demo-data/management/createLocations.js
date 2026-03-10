import mongoose from "mongoose";
import Location from "../../../model/management/Location.js";
import connectDB from "../../../configuration/db.js";

const createDemoLocations = async () => {
  try {
    await connectDB();

    const demoLocations = [
      {
        id: "loc_001",
        name: "Downtown Charging Hub",
        address: "100 Main Street, San Francisco, CA 94102",
        latitude: 37.7749,
        longitude: -122.4194,
        description: "Central downtown location with 10 fast chargers",
      },
      {
        id: "loc_002",
        name: "Airport Parking Garage",
        address: "SFO International Airport, San Francisco, CA 94128",
        latitude: 37.6213,
        longitude: -122.3790,
        description: "Level 3 parking with 8 charging stations",
      },
      {
        id: "loc_003",
        name: "Shopping Mall West",
        address: "500 Commerce Drive, Austin, TX 78701",
        latitude: 30.2672,
        longitude: -97.7431,
        description: "Outdoor parking lot with 6 Level 2 chargers",
      },
      {
        id: "loc_004",
        name: "Tech Campus North",
        address: "1000 Innovation Way, Seattle, WA 98101",
        latitude: 47.6062,
        longitude: -122.3321,
        description: "Employee parking with 12 charging points",
      },
      {
        id: "loc_005",
        name: "Highway Rest Stop",
        address: "I-5 Mile Marker 250, CA",
        latitude: 38.5816,
        longitude: -121.4944,
        description: "Rest area with 4 DC fast chargers",
      },
    ];

    await Location.deleteMany({});
    const createdLocations = await Location.insertMany(demoLocations);

    console.log(`✅ Created ${createdLocations.length} demo locations`);

    return createdLocations;
  } catch (error) {
    console.error("Error creating demo locations:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoLocations()
    .then(() => {
      console.log("Demo locations creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo locations:", error);
      process.exit(1);
    });
}

export default createDemoLocations;
