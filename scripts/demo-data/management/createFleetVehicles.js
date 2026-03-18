import connectDB from "../../../configuration/db.js";
import Car from "../../../model/management/Car.js";
import Fleet from "../../../model/management/Fleet.js";
import FleetVehicle from "../../../model/management/FleetVehicle.js";
import User from "../../../model/management/User.js";

const createDemoFleetVehicles = async () => {
  try {
    await connectDB();

    const fleets = await Fleet.find({});
    const cars = await Car.find({ isActive: true });
    const operators = await User.find({ role: "operator" });

    if (fleets.length === 0) {
      console.log("⚠️  No fleets found. Please create fleets first.");
      return [];
    }

    if (cars.length === 0) {
      console.log("⚠️  No cars found. Please create cars first.");
      return [];
    }

    const demoFleetVehicles = [];

    // Assign a few cars into each fleet
    let vehicleCounter = 1;
    fleets.forEach((fleet, fleetIndex) => {
      const fleetCars = cars.filter((c) => {
        // Prefer cars that belong to the same company, otherwise allow any
        if (!c.companyId) return false;
        return String(c.companyId) === String(fleet.companyId);
      });

      const candidateCars = fleetCars.length > 0 ? fleetCars : cars;
      const take = Math.min(2 + (fleetIndex % 2), candidateCars.length);

      for (let i = 0; i < take; i++) {
        const car = candidateCars[(fleetIndex + i) % candidateCars.length];
        const assignDriver = operators.length > 0 && (i % 2 === 0);

        demoFleetVehicles.push({
          fleetId: fleet._id,
          carId: car._id,
          vehicleNumber: `FV-${String(vehicleCounter).padStart(4, "0")}`,
          assignedDriverId: assignDriver ? operators[(fleetIndex + i) % operators.length]._id : null,
          status: assignDriver ? "Assigned" : "Available",
          currentLocation: {
            address: fleet.location?.address,
            lastUpdated: new Date(),
          },
          batteryStatus: {
            currentLevel: 50 + ((fleetIndex + i) * 7) % 50,
            estimatedRange: car.range || 200,
            lastUpdated: new Date(),
          },
          odometer: 10000 + (fleetIndex + i) * 1250,
          lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * (30 + i * 15)),
          nextServiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (60 + i * 10)),
          notes: "Demo fleet vehicle",
          isActive: true,
        });

        vehicleCounter += 1;
      }
    });

    await FleetVehicle.deleteMany({});
    const created = await FleetVehicle.insertMany(demoFleetVehicles);

    // Update fleet counters
    for (const fleet of fleets) {
      const total = await FleetVehicle.countDocuments({ fleetId: fleet._id });
      const active = await FleetVehicle.countDocuments({ fleetId: fleet._id, isActive: true });
      fleet.totalVehicles = total;
      fleet.activeVehicles = active;
      await fleet.save();
    }

    console.log(`✅ Created ${created.length} demo fleet vehicles`);
    return created;
  } catch (error) {
    console.error("Error creating demo fleet vehicles:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoFleetVehicles()
    .then(() => {
      console.log("Demo fleet vehicles creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo fleet vehicles:", error);
      process.exit(1);
    });
}

export default createDemoFleetVehicles;
