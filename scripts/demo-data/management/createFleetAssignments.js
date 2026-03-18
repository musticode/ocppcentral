import connectDB from "../../../configuration/db.js";
import Fleet from "../../../model/management/Fleet.js";
import FleetAssignment from "../../../model/management/FleetAssignment.js";
import FleetVehicle from "../../../model/management/FleetVehicle.js";
import User from "../../../model/management/User.js";

const createDemoFleetAssignments = async () => {
  try {
    await connectDB();

    const fleets = await Fleet.find({});
    const fleetVehicles = await FleetVehicle.find({ isActive: true });
    const operators = await User.find({ role: "operator" });

    if (fleets.length === 0 || fleetVehicles.length === 0) {
      console.log("⚠️  No fleets or fleet vehicles found. Please create them first.");
      return [];
    }

    if (operators.length === 0) {
      console.log("⚠️  No operator users found. Please create users with role=operator first.");
      return [];
    }

    const now = new Date();
    const demoAssignments = [];

    // Create a mix of Active, Completed, and Pending assignments
    let assignmentCount = 0;

    for (let i = 0; i < Math.min(fleetVehicles.length, 6); i++) {
      const fv = fleetVehicles[i];
      const fleet = fleets.find((f) => String(f._id) === String(fv.fleetId)) || fleets[0];
      const driver = operators[(i + 1) % operators.length];
      const assignedBy = operators[i % operators.length];

      const status = i % 3 === 0 ? "Active" : i % 3 === 1 ? "Completed" : "Pending";

      const scheduledStart = new Date(now.getTime() - 1000 * 60 * 60 * 24 * (3 + i));
      const scheduledEnd = new Date(now.getTime() + 1000 * 60 * 60 * 24 * (2 + i));

      const actualStart = status === "Pending" ? null : new Date(now.getTime() - 1000 * 60 * 60 * (10 + i));
      const actualEnd = status === "Completed" ? new Date(now.getTime() - 1000 * 60 * 60 * (2 + i)) : null;

      demoAssignments.push({
        fleetId: fleet._id,
        fleetVehicleId: fv._id,
        driverId: driver._id,
        assignedBy: assignedBy._id,
        assignmentType: i % 2 === 0 ? "Temporary" : "Permanent",
        status,
        scheduledStart,
        scheduledEnd,
        actualStart,
        actualEnd,
        startLocation: {
          address: fleet.location?.address,
        },
        endLocation: {
          address: fleet.location?.address,
        },
        startOdometer: 10000 + i * 250,
        endOdometer: status === "Completed" ? 10000 + i * 250 + 120 : null,
        startBatteryLevel: 70 - i * 5,
        endBatteryLevel: status === "Completed" ? 50 - i * 3 : null,
        purpose: "Demo assignment",
        notes: "Generated demo fleet assignment",
        checklistCompleted: status !== "Pending",
        damageReported: false,
      });

      assignmentCount += 1;
    }

    await FleetAssignment.deleteMany({});
    const created = await FleetAssignment.insertMany(demoAssignments);

    console.log(`✅ Created ${created.length} demo fleet assignments`);
    return created;
  } catch (error) {
    console.error("Error creating demo fleet assignments:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoFleetAssignments()
    .then(() => {
      console.log("Demo fleet assignments creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo fleet assignments:", error);
      process.exit(1);
    });
}

export default createDemoFleetAssignments;
