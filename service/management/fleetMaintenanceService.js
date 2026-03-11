import FleetMaintenance from "../../model/management/FleetMaintenance.js";
import FleetVehicle from "../../model/management/FleetVehicle.js";
import Fleet from "../../model/management/Fleet.js";
import fleetVehicleService from "./fleetVehicleService.js";

class FleetMaintenanceService {
  async scheduleMaintenance(maintenanceData) {
    const {
      fleetId,
      fleetVehicleId,
      maintenanceType,
      category,
      priority,
      scheduledDate,
      description,
      serviceProvider,
      createdBy,
    } = maintenanceData;

    if (!fleetId) throw new Error("Fleet ID is required");
    if (!fleetVehicleId) throw new Error("Fleet vehicle ID is required");
    if (!maintenanceType) throw new Error("Maintenance type is required");
    if (!category) throw new Error("Category is required");
    if (!scheduledDate) throw new Error("Scheduled date is required");
    if (!description) throw new Error("Description is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const vehicle = await FleetVehicle.findById(fleetVehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

    const maintenance = new FleetMaintenance({
      fleetId,
      fleetVehicleId,
      maintenanceType,
      category,
      status: "Scheduled",
      priority: priority || "Medium",
      scheduledDate,
      description,
      serviceProvider,
      createdBy,
    });

    await maintenance.save();
    return await this.getMaintenanceById(maintenance._id);
  }

  async getMaintenanceById(maintenanceId) {
    const maintenance = await FleetMaintenance.findById(maintenanceId)
      .populate("fleetId", "name")
      .populate({
        path: "fleetVehicleId",
        populate: { path: "carId" },
      })
      .populate("createdBy", "name email");

    if (!maintenance) throw new Error("Maintenance record not found");
    return maintenance;
  }

  async listMaintenance({ fleetId, fleetVehicleId, status, category, priority, startDate, endDate } = {}) {
    const query = {};
    if (fleetId) query.fleetId = fleetId;
    if (fleetVehicleId) query.fleetVehicleId = fleetVehicleId;
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    return await FleetMaintenance.find(query)
      .populate("fleetId", "name")
      .populate({
        path: "fleetVehicleId",
        populate: { path: "carId" },
      })
      .populate("createdBy", "name email")
      .sort({ scheduledDate: -1 });
  }

  async startMaintenance(maintenanceId, startData) {
    const maintenance = await FleetMaintenance.findById(maintenanceId);
    if (!maintenance) throw new Error("Maintenance record not found");

    if (maintenance.status !== "Scheduled") {
      throw new Error("Maintenance cannot be started. Current status: " + maintenance.status);
    }

    maintenance.status = "InProgress";
    maintenance.odometerReading = startData.odometerReading;

    await maintenance.save();

    await fleetVehicleService.updateFleetVehicle(maintenance.fleetVehicleId, {
      status: "Maintenance",
    });

    return await this.getMaintenanceById(maintenanceId);
  }

  async completeMaintenance(maintenanceId, completionData) {
    const maintenance = await FleetMaintenance.findById(maintenanceId);
    if (!maintenance) throw new Error("Maintenance record not found");

    if (maintenance.status !== "InProgress") {
      throw new Error("Maintenance cannot be completed. Current status: " + maintenance.status);
    }

    maintenance.status = "Completed";
    maintenance.completedDate = new Date();
    maintenance.workPerformed = completionData.workPerformed;
    maintenance.partsReplaced = completionData.partsReplaced || [];
    maintenance.laborCost = completionData.laborCost || 0;
    maintenance.partsCost = completionData.partsCost || 0;
    maintenance.performedBy = completionData.performedBy;
    maintenance.nextServiceOdometer = completionData.nextServiceOdometer;
    maintenance.nextServiceDate = completionData.nextServiceDate;

    if (completionData.attachments) {
      maintenance.attachments = completionData.attachments;
    }

    await maintenance.save();

    const updateData = { status: "Available" };
    if (completionData.nextServiceDate) {
      updateData.nextServiceDate = completionData.nextServiceDate;
    }
    if (completionData.nextServiceOdometer) {
      updateData.serviceDueOdometer = completionData.nextServiceOdometer;
    }
    updateData.lastServiceDate = new Date();

    await fleetVehicleService.updateFleetVehicle(maintenance.fleetVehicleId, updateData);

    await fleetVehicleService.addMaintenanceRecord(maintenance.fleetVehicleId, {
      date: new Date(),
      type: maintenance.category,
      description: maintenance.workPerformed || maintenance.description,
      cost: maintenance.totalCost,
      performedBy: maintenance.performedBy,
      nextServiceOdometer: maintenance.nextServiceOdometer,
    });

    return await this.getMaintenanceById(maintenanceId);
  }

  async cancelMaintenance(maintenanceId, reason) {
    const maintenance = await FleetMaintenance.findById(maintenanceId);
    if (!maintenance) throw new Error("Maintenance record not found");

    if (maintenance.status === "Completed") {
      throw new Error("Cannot cancel a completed maintenance");
    }

    const previousStatus = maintenance.status;
    maintenance.status = "Cancelled";
    maintenance.notes = (maintenance.notes || "") + `\nCancellation reason: ${reason}`;

    await maintenance.save();

    if (previousStatus === "InProgress") {
      await fleetVehicleService.updateFleetVehicle(maintenance.fleetVehicleId, {
        status: "Available",
      });
    }

    return await this.getMaintenanceById(maintenanceId);
  }

  async updateMaintenance(maintenanceId, updateData) {
    const maintenance = await FleetMaintenance.findById(maintenanceId);
    if (!maintenance) throw new Error("Maintenance record not found");

    if (maintenance.status === "Completed") {
      throw new Error("Cannot update a completed maintenance");
    }

    const allowedUpdates = [
      "maintenanceType",
      "category",
      "priority",
      "scheduledDate",
      "description",
      "serviceProvider",
      "notes",
      "status",
    ];

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        maintenance[key] = updateData[key];
      }
    });

    await maintenance.save();
    return await this.getMaintenanceById(maintenanceId);
  }

  async getUpcomingMaintenance(fleetId, days = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await FleetMaintenance.find({
      fleetId,
      status: { $in: ["Scheduled", "InProgress"] },
      scheduledDate: { $gte: startDate, $lte: endDate },
    })
      .populate({
        path: "fleetVehicleId",
        populate: { path: "carId" },
      })
      .sort({ scheduledDate: 1 });
  }

  async getOverdueMaintenance(fleetId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await FleetMaintenance.find({
      fleetId,
      status: "Scheduled",
      scheduledDate: { $lt: today },
    })
      .populate({
        path: "fleetVehicleId",
        populate: { path: "carId" },
      })
      .sort({ scheduledDate: 1 });
  }

  async getMaintenanceHistory(fleetVehicleId, limit = 10) {
    return await FleetMaintenance.find({
      fleetVehicleId,
      status: "Completed",
    })
      .sort({ completedDate: -1 })
      .limit(limit);
  }

  async getMaintenanceStats(fleetId, startDate, endDate) {
    const query = { fleetId };
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const maintenanceRecords = await FleetMaintenance.find(query);

    const totalMaintenance = maintenanceRecords.length;
    const completed = maintenanceRecords.filter((m) => m.status === "Completed").length;
    const scheduled = maintenanceRecords.filter((m) => m.status === "Scheduled").length;
    const inProgress = maintenanceRecords.filter((m) => m.status === "InProgress").length;
    const cancelled = maintenanceRecords.filter((m) => m.status === "Cancelled").length;

    const totalCost = maintenanceRecords
      .filter((m) => m.status === "Completed")
      .reduce((sum, m) => sum + (m.totalCost || 0), 0);

    const categoryDistribution = await FleetMaintenance.aggregate([
      { $match: query },
      { $group: { _id: "$category", count: { $sum: 1 }, totalCost: { $sum: "$totalCost" } } },
      { $sort: { count: -1 } },
    ]);

    const avgCost = completed > 0 ? totalCost / completed : 0;

    return {
      totalMaintenance,
      completed,
      scheduled,
      inProgress,
      cancelled,
      totalCost: Math.round(totalCost * 100) / 100,
      avgCost: Math.round(avgCost * 100) / 100,
      categoryDistribution,
      completionRate: totalMaintenance > 0 ? Math.round((completed / totalMaintenance) * 100) : 0,
    };
  }

  async addAttachment(maintenanceId, attachment) {
    const maintenance = await FleetMaintenance.findById(maintenanceId);
    if (!maintenance) throw new Error("Maintenance record not found");

    if (!maintenance.attachments) {
      maintenance.attachments = [];
    }

    maintenance.attachments.push({
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      uploadedAt: new Date(),
    });

    await maintenance.save();
    return maintenance;
  }
}

export default new FleetMaintenanceService();
