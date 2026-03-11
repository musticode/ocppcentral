import Fleet from "../../model/management/Fleet.js";
import FleetVehicle from "../../model/management/FleetVehicle.js";
import Company from "../../model/management/Company.js";
import User from "../../model/management/User.js";

class FleetService {
  async createFleet(fleetData) {
    const { name, description, companyId, managerId, fleetType, location, operatingHours, contactInfo, settings } = fleetData;

    if (!name) throw new Error("Fleet name is required");
    if (!companyId) throw new Error("Company ID is required");
    if (!managerId) throw new Error("Manager ID is required");

    const company = await Company.findById(companyId);
    if (!company) throw new Error("Company not found");

    const manager = await User.findById(managerId);
    if (!manager) throw new Error("Manager not found");

    const existingFleet = await Fleet.findOne({ name, companyId });
    if (existingFleet) {
      throw new Error("Fleet with this name already exists for this company");
    }

    const fleet = new Fleet({
      name,
      description,
      companyId,
      managerId,
      fleetType: fleetType || "Corporate",
      status: "Active",
      totalVehicles: 0,
      activeVehicles: 0,
      location,
      operatingHours,
      contactInfo,
      settings: {
        autoAssignment: settings?.autoAssignment || false,
        maintenanceAlerts: settings?.maintenanceAlerts !== false,
        chargingAlerts: settings?.chargingAlerts !== false,
        lowBatteryThreshold: settings?.lowBatteryThreshold || 20,
      },
    });

    await fleet.save();
    return await this.getFleetById(fleet._id);
  }

  async getFleetById(fleetId) {
    const fleet = await Fleet.findById(fleetId)
      .populate("companyId", "name email phone")
      .populate("managerId", "name email");

    if (!fleet) throw new Error("Fleet not found");
    return fleet;
  }

  async listFleets({ companyId, managerId, status, fleetType } = {}) {
    const query = {};
    if (companyId) query.companyId = companyId;
    if (managerId) query.managerId = managerId;
    if (status) query.status = status;
    if (fleetType) query.fleetType = fleetType;

    return await Fleet.find(query)
      .populate("companyId", "name email phone")
      .populate("managerId", "name email")
      .sort({ createdAt: -1 });
  }

  async updateFleet(fleetId, updateData) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    if (updateData.name && updateData.name !== fleet.name) {
      const existingFleet = await Fleet.findOne({
        name: updateData.name,
        companyId: fleet.companyId,
        _id: { $ne: fleetId },
      });
      if (existingFleet) {
        throw new Error("Fleet with this name already exists for this company");
      }
    }

    const allowedUpdates = [
      "name",
      "description",
      "managerId",
      "fleetType",
      "status",
      "location",
      "operatingHours",
      "contactInfo",
      "settings",
      "metadata",
    ];

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === "settings" && fleet.settings) {
          fleet.settings = { ...fleet.settings, ...updateData.settings };
        } else {
          fleet[key] = updateData[key];
        }
      }
    });

    await fleet.save();
    return await this.getFleetById(fleetId);
  }

  async deleteFleet(fleetId) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const vehicleCount = await FleetVehicle.countDocuments({ fleetId, isActive: true });
    if (vehicleCount > 0) {
      throw new Error("Cannot delete fleet with active vehicles. Please remove or deactivate all vehicles first.");
    }

    await Fleet.findByIdAndDelete(fleetId);
    return fleet;
  }

  async getFleetStats(fleetId) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const vehicles = await FleetVehicle.find({ fleetId, isActive: true }).populate("carId");

    const statusDistribution = await FleetVehicle.aggregate([
      { $match: { fleetId: fleet._id, isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter((v) => v.status === "Available").length;
    const assignedVehicles = vehicles.filter((v) => v.status === "Assigned" || v.status === "InUse").length;
    const chargingVehicles = vehicles.filter((v) => v.status === "Charging").length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === "Maintenance").length;

    const batteryLevels = vehicles
      .filter((v) => v.batteryStatus?.currentLevel)
      .map((v) => v.batteryStatus.currentLevel);
    const avgBatteryLevel = batteryLevels.length > 0 
      ? batteryLevels.reduce((a, b) => a + b, 0) / batteryLevels.length 
      : 0;

    const lowBatteryVehicles = vehicles.filter(
      (v) => v.batteryStatus?.currentLevel && v.batteryStatus.currentLevel < (fleet.settings?.lowBatteryThreshold || 20)
    ).length;

    return {
      fleetId: fleet._id,
      fleetName: fleet.name,
      totalVehicles,
      availableVehicles,
      assignedVehicles,
      chargingVehicles,
      maintenanceVehicles,
      statusDistribution,
      avgBatteryLevel: Math.round(avgBatteryLevel),
      lowBatteryVehicles,
      utilizationRate: totalVehicles > 0 ? Math.round((assignedVehicles / totalVehicles) * 100) : 0,
    };
  }

  async getFleetsByCompany(companyId) {
    if (!companyId) throw new Error("Company ID is required");

    const company = await Company.findById(companyId);
    if (!company) throw new Error("Company not found");

    return await this.listFleets({ companyId });
  }

  async updateFleetVehicleCounts(fleetId) {
    const totalVehicles = await FleetVehicle.countDocuments({ fleetId, isActive: true });
    const activeVehicles = await FleetVehicle.countDocuments({
      fleetId,
      isActive: true,
      status: { $in: ["Available", "Assigned", "InUse", "Charging"] },
    });

    await Fleet.findByIdAndUpdate(fleetId, {
      totalVehicles,
      activeVehicles,
    });
  }
}

export default new FleetService();
