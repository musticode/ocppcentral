import Fleet from "../../model/management/Fleet.js";
import FleetVehicle from "../../model/management/FleetVehicle.js";
import FleetAssignment from "../../model/management/FleetAssignment.js";
import FleetMaintenance from "../../model/management/FleetMaintenance.js";
import Transaction from "../../model/ocpp/Transaction.js";
import Consumption from "../../model/management/Consumption.js";

class FleetAnalyticsService {
  async getFleetDashboard(fleetId, startDate, endDate) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const vehicles = await FleetVehicle.find({ fleetId, isActive: true }).populate("carId");

    const vehicleStats = {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === "Available").length,
      inUse: vehicles.filter((v) => v.status === "InUse").length,
      charging: vehicles.filter((v) => v.status === "Charging").length,
      maintenance: vehicles.filter((v) => v.status === "Maintenance").length,
      outOfService: vehicles.filter((v) => v.status === "OutOfService").length,
    };

    const assignmentFilter = { fleetId, ...dateFilter };
    const assignments = await FleetAssignment.find(assignmentFilter);
    const assignmentStats = {
      total: assignments.length,
      active: assignments.filter((a) => a.status === "Active").length,
      completed: assignments.filter((a) => a.status === "Completed").length,
      cancelled: assignments.filter((a) => a.status === "Cancelled").length,
    };

    const maintenanceFilter = { fleetId, ...dateFilter };
    const maintenance = await FleetMaintenance.find(maintenanceFilter);
    const maintenanceStats = {
      total: maintenance.length,
      scheduled: maintenance.filter((m) => m.status === "Scheduled").length,
      inProgress: maintenance.filter((m) => m.status === "InProgress").length,
      completed: maintenance.filter((m) => m.status === "Completed").length,
      totalCost: maintenance
        .filter((m) => m.status === "Completed")
        .reduce((sum, m) => sum + (m.totalCost || 0), 0),
    };

    const batteryLevels = vehicles
      .filter((v) => v.batteryStatus?.currentLevel)
      .map((v) => v.batteryStatus.currentLevel);
    const avgBatteryLevel = batteryLevels.length > 0 
      ? batteryLevels.reduce((a, b) => a + b, 0) / batteryLevels.length 
      : 0;

    const lowBatteryCount = vehicles.filter(
      (v) => v.batteryStatus?.currentLevel && v.batteryStatus.currentLevel < (fleet.settings?.lowBatteryThreshold || 20)
    ).length;

    const utilizationRate = vehicleStats.total > 0 
      ? Math.round(((vehicleStats.inUse + vehicleStats.charging) / vehicleStats.total) * 100) 
      : 0;

    return {
      fleetInfo: {
        id: fleet._id,
        name: fleet.name,
        type: fleet.fleetType,
        status: fleet.status,
      },
      vehicleStats,
      assignmentStats,
      maintenanceStats,
      batteryStats: {
        avgLevel: Math.round(avgBatteryLevel),
        lowBatteryCount,
        threshold: fleet.settings?.lowBatteryThreshold || 20,
      },
      utilizationRate,
      period: {
        startDate: startDate || "All time",
        endDate: endDate || "Present",
      },
    };
  }

  async getVehicleUtilization(fleetId, startDate, endDate) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.scheduledStart = {};
      if (startDate) dateFilter.scheduledStart.$gte = new Date(startDate);
      if (endDate) dateFilter.scheduledStart.$lte = new Date(endDate);
    }

    const assignments = await FleetAssignment.find({ fleetId, ...dateFilter })
      .populate({
        path: "fleetVehicleId",
        populate: { path: "carId" },
      });

    const vehicleUtilization = {};

    assignments.forEach((assignment) => {
      if (!assignment.fleetVehicleId) return;

      const vehicleId = assignment.fleetVehicleId._id.toString();
      const vehicleNumber = assignment.fleetVehicleId.vehicleNumber;

      if (!vehicleUtilization[vehicleId]) {
        vehicleUtilization[vehicleId] = {
          vehicleNumber,
          vehicleId,
          carInfo: assignment.fleetVehicleId.carId,
          totalAssignments: 0,
          completedAssignments: 0,
          totalDistance: 0,
          totalHours: 0,
        };
      }

      vehicleUtilization[vehicleId].totalAssignments++;

      if (assignment.status === "Completed") {
        vehicleUtilization[vehicleId].completedAssignments++;

        if (assignment.endOdometer && assignment.startOdometer) {
          vehicleUtilization[vehicleId].totalDistance += assignment.endOdometer - assignment.startOdometer;
        }

        if (assignment.actualEnd && assignment.actualStart) {
          const hours = (assignment.actualEnd - assignment.actualStart) / (1000 * 60 * 60);
          vehicleUtilization[vehicleId].totalHours += hours;
        }
      }
    });

    return Object.values(vehicleUtilization).sort((a, b) => b.totalAssignments - a.totalAssignments);
  }

  async getDriverPerformance(fleetId, startDate, endDate) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.scheduledStart = {};
      if (startDate) dateFilter.scheduledStart.$gte = new Date(startDate);
      if (endDate) dateFilter.scheduledStart.$lte = new Date(endDate);
    }

    const assignments = await FleetAssignment.find({ 
      fleetId, 
      status: "Completed",
      ...dateFilter 
    }).populate("driverId", "name email");

    const driverPerformance = {};

    assignments.forEach((assignment) => {
      if (!assignment.driverId) return;

      const driverId = assignment.driverId._id.toString();

      if (!driverPerformance[driverId]) {
        driverPerformance[driverId] = {
          driverId,
          driverName: assignment.driverId.name,
          driverEmail: assignment.driverId.email,
          totalAssignments: 0,
          completedAssignments: 0,
          totalDistance: 0,
          totalHours: 0,
          damageReports: 0,
          avgBatteryUsage: 0,
          batteryUsageCount: 0,
        };
      }

      driverPerformance[driverId].totalAssignments++;
      driverPerformance[driverId].completedAssignments++;

      if (assignment.endOdometer && assignment.startOdometer) {
        driverPerformance[driverId].totalDistance += assignment.endOdometer - assignment.startOdometer;
      }

      if (assignment.actualEnd && assignment.actualStart) {
        const hours = (assignment.actualEnd - assignment.actualStart) / (1000 * 60 * 60);
        driverPerformance[driverId].totalHours += hours;
      }

      if (assignment.damageReported) {
        driverPerformance[driverId].damageReports++;
      }

      if (assignment.startBatteryLevel && assignment.endBatteryLevel) {
        const batteryUsage = assignment.startBatteryLevel - assignment.endBatteryLevel;
        driverPerformance[driverId].avgBatteryUsage += batteryUsage;
        driverPerformance[driverId].batteryUsageCount++;
      }
    });

    Object.values(driverPerformance).forEach((driver) => {
      if (driver.batteryUsageCount > 0) {
        driver.avgBatteryUsage = Math.round(driver.avgBatteryUsage / driver.batteryUsageCount);
      }
      delete driver.batteryUsageCount;
    });

    return Object.values(driverPerformance).sort((a, b) => b.totalAssignments - a.totalAssignments);
  }

  async getMaintenanceCostAnalysis(fleetId, startDate, endDate) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.completedDate = {};
      if (startDate) dateFilter.completedDate.$gte = new Date(startDate);
      if (endDate) dateFilter.completedDate.$lte = new Date(endDate);
    }

    const maintenance = await FleetMaintenance.find({
      fleetId,
      status: "Completed",
      ...dateFilter,
    }).populate({
      path: "fleetVehicleId",
      populate: { path: "carId" },
    });

    const totalCost = maintenance.reduce((sum, m) => sum + (m.totalCost || 0), 0);
    const totalLaborCost = maintenance.reduce((sum, m) => sum + (m.laborCost || 0), 0);
    const totalPartsCost = maintenance.reduce((sum, m) => sum + (m.partsCost || 0), 0);

    const categoryBreakdown = await FleetMaintenance.aggregate([
      { 
        $match: { 
          fleetId: fleet._id, 
          status: "Completed",
          ...dateFilter 
        } 
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalCost: { $sum: "$totalCost" },
          avgCost: { $avg: "$totalCost" },
        },
      },
      { $sort: { totalCost: -1 } },
    ]);

    const vehicleBreakdown = {};
    maintenance.forEach((m) => {
      if (!m.fleetVehicleId) return;

      const vehicleId = m.fleetVehicleId._id.toString();
      const vehicleNumber = m.fleetVehicleId.vehicleNumber;

      if (!vehicleBreakdown[vehicleId]) {
        vehicleBreakdown[vehicleId] = {
          vehicleId,
          vehicleNumber,
          carInfo: m.fleetVehicleId.carId,
          maintenanceCount: 0,
          totalCost: 0,
        };
      }

      vehicleBreakdown[vehicleId].maintenanceCount++;
      vehicleBreakdown[vehicleId].totalCost += m.totalCost || 0;
    });

    return {
      summary: {
        totalMaintenance: maintenance.length,
        totalCost: Math.round(totalCost * 100) / 100,
        totalLaborCost: Math.round(totalLaborCost * 100) / 100,
        totalPartsCost: Math.round(totalPartsCost * 100) / 100,
        avgCostPerMaintenance: maintenance.length > 0 ? Math.round((totalCost / maintenance.length) * 100) / 100 : 0,
      },
      categoryBreakdown,
      vehicleBreakdown: Object.values(vehicleBreakdown).sort((a, b) => b.totalCost - a.totalCost),
    };
  }

  async getChargingAnalytics(fleetId, startDate, endDate) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const vehicles = await FleetVehicle.find({ fleetId, isActive: true }).populate("carId");
    const vehicleIds = vehicles.map((v) => v.carId?.licensePlate).filter(Boolean);

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.transactionStartTime = {};
      if (startDate) dateFilter.transactionStartTime.$gte = new Date(startDate);
      if (endDate) dateFilter.transactionStartTime.$lte = new Date(endDate);
    }

    const consumptions = await Consumption.find(dateFilter);

    const fleetConsumptions = consumptions.filter((c) => {
      return vehicles.some((v) => v.carId && c.chargePointId);
    });

    const totalEnergy = fleetConsumptions.reduce((sum, c) => sum + (c.energyConsumed || 0), 0);
    const totalCost = fleetConsumptions.reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const totalSessions = fleetConsumptions.length;

    const avgEnergyPerSession = totalSessions > 0 ? totalEnergy / totalSessions : 0;
    const avgCostPerSession = totalSessions > 0 ? totalCost / totalSessions : 0;

    const chargingByVehicle = {};
    fleetConsumptions.forEach((c) => {
      const key = c.idTag || "Unknown";
      if (!chargingByVehicle[key]) {
        chargingByVehicle[key] = {
          idTag: key,
          sessions: 0,
          totalEnergy: 0,
          totalCost: 0,
        };
      }
      chargingByVehicle[key].sessions++;
      chargingByVehicle[key].totalEnergy += c.energyConsumed || 0;
      chargingByVehicle[key].totalCost += c.totalCost || 0;
    });

    return {
      summary: {
        totalSessions,
        totalEnergy: Math.round(totalEnergy * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        avgEnergyPerSession: Math.round(avgEnergyPerSession * 100) / 100,
        avgCostPerSession: Math.round(avgCostPerSession * 100) / 100,
      },
      byVehicle: Object.values(chargingByVehicle).sort((a, b) => b.totalEnergy - a.totalEnergy),
    };
  }

  async getFleetComparison(companyId) {
    if (!companyId) throw new Error("Company ID is required");

    const fleets = await Fleet.find({ companyId, status: "Active" });

    const comparison = await Promise.all(
      fleets.map(async (fleet) => {
        const vehicles = await FleetVehicle.find({ fleetId: fleet._id, isActive: true });
        const assignments = await FleetAssignment.find({ fleetId: fleet._id });
        const maintenance = await FleetMaintenance.find({ fleetId: fleet._id, status: "Completed" });

        const completedAssignments = assignments.filter((a) => a.status === "Completed");
        const totalDistance = completedAssignments
          .filter((a) => a.endOdometer && a.startOdometer)
          .reduce((sum, a) => sum + (a.endOdometer - a.startOdometer), 0);

        const maintenanceCost = maintenance.reduce((sum, m) => sum + (m.totalCost || 0), 0);

        return {
          fleetId: fleet._id,
          fleetName: fleet.name,
          fleetType: fleet.fleetType,
          totalVehicles: vehicles.length,
          activeVehicles: vehicles.filter((v) => v.status !== "OutOfService").length,
          totalAssignments: assignments.length,
          completedAssignments: completedAssignments.length,
          totalDistance,
          maintenanceCount: maintenance.length,
          maintenanceCost,
          utilizationRate: vehicles.length > 0 
            ? Math.round((vehicles.filter((v) => v.status === "InUse" || v.status === "Assigned").length / vehicles.length) * 100) 
            : 0,
        };
      })
    );

    return comparison.sort((a, b) => b.totalVehicles - a.totalVehicles);
  }
}

export default new FleetAnalyticsService();
