import FleetAssignment from "../../model/management/FleetAssignment.js";
import FleetVehicle from "../../model/management/FleetVehicle.js";
import Fleet from "../../model/management/Fleet.js";
import User from "../../model/management/User.js";
import fleetVehicleService from "./fleetVehicleService.js";

class FleetAssignmentService {
  async createAssignment(assignmentData) {
    const {
      fleetId,
      fleetVehicleId,
      driverId,
      assignedBy,
      assignmentType,
      scheduledStart,
      scheduledEnd,
      purpose,
      notes,
    } = assignmentData;

    if (!fleetId) throw new Error("Fleet ID is required");
    if (!fleetVehicleId) throw new Error("Fleet vehicle ID is required");
    if (!driverId) throw new Error("Driver ID is required");
    if (!assignedBy) throw new Error("Assigned by user ID is required");
    if (!scheduledStart) throw new Error("Scheduled start time is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const vehicle = await FleetVehicle.findById(fleetVehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

    if (vehicle.fleetId.toString() !== fleetId.toString()) {
      throw new Error("Vehicle does not belong to this fleet");
    }

    const driver = await User.findById(driverId);
    if (!driver) throw new Error("Driver not found");

    const conflictingAssignment = await FleetAssignment.findOne({
      fleetVehicleId,
      status: { $in: ["Pending", "Active"] },
      $or: [
        {
          scheduledStart: { $lte: scheduledEnd || new Date(scheduledStart.getTime() + 86400000) },
          scheduledEnd: { $gte: scheduledStart },
        },
      ],
    });

    if (conflictingAssignment) {
      throw new Error("Vehicle already has a conflicting assignment for this time period");
    }

    const assignment = new FleetAssignment({
      fleetId,
      fleetVehicleId,
      driverId,
      assignedBy,
      assignmentType: assignmentType || "Temporary",
      status: "Pending",
      scheduledStart,
      scheduledEnd,
      purpose,
      notes,
    });

    await assignment.save();

    if (vehicle.status === "Available") {
      await fleetVehicleService.updateFleetVehicle(fleetVehicleId, { status: "Assigned" });
    }

    return await this.getAssignmentById(assignment._id);
  }

  async getAssignmentById(assignmentId) {
    const assignment = await FleetAssignment.findById(assignmentId)
      .populate("fleetId", "name")
      .populate({
        path: "fleetVehicleId",
        populate: { path: "carId" },
      })
      .populate("driverId", "name email phone")
      .populate("assignedBy", "name email");

    if (!assignment) throw new Error("Assignment not found");
    return assignment;
  }

  async listAssignments({ fleetId, driverId, status, startDate, endDate } = {}) {
    const query = {};
    if (fleetId) query.fleetId = fleetId;
    if (driverId) query.driverId = driverId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.scheduledStart = {};
      if (startDate) query.scheduledStart.$gte = new Date(startDate);
      if (endDate) query.scheduledStart.$lte = new Date(endDate);
    }

    return await FleetAssignment.find(query)
      .populate("fleetId", "name")
      .populate({
        path: "fleetVehicleId",
        populate: { path: "carId" },
      })
      .populate("driverId", "name email phone")
      .populate("assignedBy", "name email")
      .sort({ scheduledStart: -1 });
  }

  async startAssignment(assignmentId, startData) {
    const assignment = await FleetAssignment.findById(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.status !== "Pending") {
      throw new Error("Assignment cannot be started. Current status: " + assignment.status);
    }

    assignment.status = "Active";
    assignment.actualStart = new Date();
    assignment.startLocation = startData.location;
    assignment.startOdometer = startData.odometer;
    assignment.startBatteryLevel = startData.batteryLevel;

    await assignment.save();

    await fleetVehicleService.updateFleetVehicle(assignment.fleetVehicleId, {
      status: "InUse",
      odometer: startData.odometer,
      batteryStatus: {
        currentLevel: startData.batteryLevel,
        lastUpdated: new Date(),
      },
    });

    return await this.getAssignmentById(assignmentId);
  }

  async completeAssignment(assignmentId, completionData) {
    const assignment = await FleetAssignment.findById(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.status !== "Active") {
      throw new Error("Assignment cannot be completed. Current status: " + assignment.status);
    }

    assignment.status = "Completed";
    assignment.actualEnd = new Date();
    assignment.endLocation = completionData.location;
    assignment.endOdometer = completionData.odometer;
    assignment.endBatteryLevel = completionData.batteryLevel;
    assignment.checklistCompleted = completionData.checklistCompleted || false;
    assignment.damageReported = completionData.damageReported || false;
    assignment.damageDetails = completionData.damageDetails;

    await assignment.save();

    await fleetVehicleService.updateFleetVehicle(assignment.fleetVehicleId, {
      status: "Available",
      odometer: completionData.odometer,
      batteryStatus: {
        currentLevel: completionData.batteryLevel,
        lastUpdated: new Date(),
      },
    });

    await fleetVehicleService.addAssignmentHistory(assignment.fleetVehicleId, {
      driverId: assignment.driverId,
      assignedAt: assignment.actualStart,
      returnedAt: assignment.actualEnd,
      startOdometer: assignment.startOdometer,
      endOdometer: assignment.endOdometer,
      notes: completionData.notes,
    });

    return await this.getAssignmentById(assignmentId);
  }

  async cancelAssignment(assignmentId, reason) {
    const assignment = await FleetAssignment.findById(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.status === "Completed") {
      throw new Error("Cannot cancel a completed assignment");
    }

    assignment.status = "Cancelled";
    assignment.notes = (assignment.notes || "") + `\nCancellation reason: ${reason}`;

    await assignment.save();

    const vehicle = await FleetVehicle.findById(assignment.fleetVehicleId);
    if (vehicle && vehicle.status === "Assigned") {
      await fleetVehicleService.updateFleetVehicle(assignment.fleetVehicleId, {
        status: "Available",
      });
    }

    return await this.getAssignmentById(assignmentId);
  }

  async updateAssignment(assignmentId, updateData) {
    const assignment = await FleetAssignment.findById(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.status === "Completed") {
      throw new Error("Cannot update a completed assignment");
    }

    const allowedUpdates = [
      "scheduledStart",
      "scheduledEnd",
      "purpose",
      "notes",
      "checklistCompleted",
      "damageReported",
      "damageDetails",
    ];

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        assignment[key] = updateData[key];
      }
    });

    await assignment.save();
    return await this.getAssignmentById(assignmentId);
  }

  async getActiveAssignmentsByDriver(driverId) {
    return await FleetAssignment.find({
      driverId,
      status: "Active",
    })
      .populate("fleetId", "name")
      .populate({
        path: "fleetVehicleId",
        populate: { path: "carId" },
      })
      .sort({ actualStart: -1 });
  }

  async getUpcomingAssignments(fleetId, days = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await FleetAssignment.find({
      fleetId,
      status: "Pending",
      scheduledStart: { $gte: startDate, $lte: endDate },
    })
      .populate({
        path: "fleetVehicleId",
        populate: { path: "carId" },
      })
      .populate("driverId", "name email phone")
      .sort({ scheduledStart: 1 });
  }

  async getAssignmentHistory(fleetVehicleId, limit = 10) {
    return await FleetAssignment.find({
      fleetVehicleId,
      status: "Completed",
    })
      .populate("driverId", "name email")
      .sort({ actualEnd: -1 })
      .limit(limit);
  }

  async getAssignmentStats(fleetId, startDate, endDate) {
    const query = { fleetId };
    if (startDate || endDate) {
      query.scheduledStart = {};
      if (startDate) query.scheduledStart.$gte = new Date(startDate);
      if (endDate) query.scheduledStart.$lte = new Date(endDate);
    }

    const assignments = await FleetAssignment.find(query);

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter((a) => a.status === "Completed").length;
    const activeAssignments = assignments.filter((a) => a.status === "Active").length;
    const cancelledAssignments = assignments.filter((a) => a.status === "Cancelled").length;

    const completedWithDamage = assignments.filter(
      (a) => a.status === "Completed" && a.damageReported
    ).length;

    const totalDistance = assignments
      .filter((a) => a.endOdometer && a.startOdometer)
      .reduce((sum, a) => sum + (a.endOdometer - a.startOdometer), 0);

    return {
      totalAssignments,
      completedAssignments,
      activeAssignments,
      cancelledAssignments,
      completedWithDamage,
      totalDistance,
      completionRate: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
    };
  }
}

export default new FleetAssignmentService();
