import connectDB from "../../../configuration/db.js";
import Fleet from "../../../model/management/Fleet.js";
import FleetMaintenance from "../../../model/management/FleetMaintenance.js";
import FleetVehicle from "../../../model/management/FleetVehicle.js";
import User from "../../../model/management/User.js";

const createDemoFleetMaintenance = async () => {
  try {
    await connectDB();

    const fleets = await Fleet.find({});
    const fleetVehicles = await FleetVehicle.find({ isActive: true });
    const operators = await User.find({ role: "operator" });

    if (fleets.length === 0 || fleetVehicles.length === 0) {
      console.log("⚠️  No fleets or fleet vehicles found. Please create them first.");
      return [];
    }

    const createdBy = operators[0]?._id || null;

    const now = new Date();
    const demoMaint = [];

    for (let i = 0; i < Math.min(fleetVehicles.length, 6); i++) {
      const fv = fleetVehicles[i];
      const fleet = fleets.find((f) => String(f._id) === String(fv.fleetId)) || fleets[0];

      const status = i % 3 === 0 ? "Scheduled" : i % 3 === 1 ? "Completed" : "InProgress";

      const scheduledDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * (i + 1));
      const completedDate = status === "Completed" ? new Date(now.getTime() - 1000 * 60 * 60 * 24 * (i + 1)) : null;

      const partsCost = 40 + i * 25;
      const laborCost = 60 + i * 30;

      demoMaint.push({
        fleetId: fleet._id,
        fleetVehicleId: fv._id,
        maintenanceType: i % 2 === 0 ? "Scheduled" : "Unscheduled",
        category: i % 2 === 0 ? "Tires" : "Battery",
        status,
        priority: i % 4 === 0 ? "High" : "Medium",
        scheduledDate,
        completedDate,
        description: "Demo maintenance record",
        workPerformed: status === "Completed" ? "Performed standard demo service" : null,
        partsReplaced: [
          {
            partName: i % 2 === 0 ? "Tire" : "Battery coolant",
            partNumber: `PART-${1000 + i}`,
            quantity: 1,
            cost: partsCost,
          },
        ],
        laborCost,
        partsCost,
        serviceProvider: {
          name: "Demo Service Center",
          contact: "+1-555-0999",
          location: "Demo City",
        },
        performedBy: status === "Completed" ? "Demo Technician" : null,
        odometerReading: 10000 + i * 500,
        nextServiceOdometer: 10000 + i * 500 + 5000,
        nextServiceDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * (90 + i * 10)),
        notes: "Generated demo maintenance",
        createdBy,
      });
    }

    await FleetMaintenance.deleteMany({});
    const created = await FleetMaintenance.insertMany(demoMaint);

    console.log(`✅ Created ${created.length} demo fleet maintenance records`);
    return created;
  } catch (error) {
    console.error("Error creating demo fleet maintenance:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoFleetMaintenance()
    .then(() => {
      console.log("Demo fleet maintenance creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo fleet maintenance:", error);
      process.exit(1);
    });
}

export default createDemoFleetMaintenance;
