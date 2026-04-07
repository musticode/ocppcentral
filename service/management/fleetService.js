import Fleet from "../../model/management/Fleet.js";
import FleetVehicle from "../../model/management/FleetVehicle.js";
import FleetAssignment from "../../model/management/FleetAssignment.js";
import Company from "../../model/management/Company.js";
import User from "../../model/management/User.js";
import Car from "../../model/management/Car.js";
import Consumption from "../../model/management/Consumption.js";

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
    return this._normalizeFleet(fleet);
  }

  async listFleets({ companyId, managerId, status, fleetType } = {}) {
    const query = {};

    if (companyId) {
      const company = await Company.findOne({ id: companyId }).select("_id");
      if (!company) throw new Error(`Company ${companyId} not found`);
      query.companyId = company._id;
    }

    if (managerId) query.managerId = managerId;
    if (status) query.status = status;
    if (fleetType) query.fleetType = fleetType;

    const fleets = await Fleet.find(query)
      .populate("companyId", "name email phone")
      .populate("managerId", "name email")
      .sort({ createdAt: -1 });

    return Promise.all(fleets.map((f) => this._normalizeFleet(f)));
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

    const company = await Company.findOne({ id: companyId }).select("_id");
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

  async getFleetVehicles(fleetId) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const vehicles = await FleetVehicle.find({ fleetId, isActive: true })
      .populate("carId")
      .populate("assignedDriverId", "name email phone")
      .sort({ vehicleNumber: 1 });

    return vehicles.map((v) => this._normalizeVehicle(v));
  }

  async assignVehicleToFleet(fleetId, vehicleData) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const { carId, vehicleNumber, assignedDriverId, status, currentLocation, batteryStatus, odometer } = vehicleData;

    if (!carId) throw new Error("Car ID is required");
    if (!vehicleNumber) throw new Error("Vehicle number is required");

    const car = await Car.findById(carId);
    if (!car) throw new Error("Car not found");

    const existingVehicle = await FleetVehicle.findOne({ vehicleNumber });
    if (existingVehicle) {
      throw new Error("Vehicle number already exists");
    }

    const existingCarInFleet = await FleetVehicle.findOne({ carId, isActive: true });
    if (existingCarInFleet) {
      throw new Error("This car is already assigned to a fleet");
    }

    if (assignedDriverId) {
      const driver = await User.findById(assignedDriverId);
      if (!driver) throw new Error("Driver not found");
    }

    const fleetVehicle = new FleetVehicle({
      fleetId,
      carId,
      vehicleNumber,
      assignedDriverId: assignedDriverId || null,
      status: status || "Available",
      currentLocation,
      batteryStatus,
      odometer: odometer || 0,
      isActive: true,
    });

    await fleetVehicle.save();
    await this.updateFleetVehicleCounts(fleetId);

    return await FleetVehicle.findById(fleetVehicle._id)
      .populate("fleetId", "name companyId")
      .populate("carId")
      .populate("assignedDriverId", "name email phone");
  }

  async updateFleetVehicle(fleetId, vehicleId, updateData) {
    if (!fleetId) throw new Error("Fleet ID is required");
    if (!vehicleId) throw new Error("Vehicle ID is required");

    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");
    if (vehicle.fleetId.toString() !== fleetId) {
      throw new Error("Vehicle does not belong to this fleet");
    }

    if (updateData.vehicleNumber && updateData.vehicleNumber !== vehicle.vehicleNumber) {
      const existingVehicle = await FleetVehicle.findOne({ vehicleNumber: updateData.vehicleNumber });
      if (existingVehicle) {
        throw new Error("Vehicle number already exists");
      }
    }

    if (updateData.assignedDriverId) {
      const driver = await User.findById(updateData.assignedDriverId);
      if (!driver) throw new Error("Driver not found");
    }

    const allowedUpdates = [
      "vehicleNumber",
      "assignedDriverId",
      "status",
      "currentLocation",
      "batteryStatus",
      "odometer",
      "lastServiceDate",
      "nextServiceDate",
      "serviceDueOdometer",
      "notes",
      "isActive",
    ];

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        vehicle[key] = updateData[key];
      }
    });

    await vehicle.save();

    if (updateData.status || updateData.isActive !== undefined) {
      await this.updateFleetVehicleCounts(fleetId);
    }

    return await FleetVehicle.findById(vehicleId)
      .populate("fleetId", "name companyId")
      .populate("carId")
      .populate("assignedDriverId", "name email phone");
  }

  async removeVehicleFromFleet(fleetId, vehicleId) {
    if (!fleetId) throw new Error("Fleet ID is required");
    if (!vehicleId) throw new Error("Vehicle ID is required");

    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");
    if (vehicle.fleetId.toString() !== fleetId) {
      throw new Error("Vehicle does not belong to this fleet");
    }

    if (vehicle.status === "InUse" || vehicle.status === "Assigned") {
      throw new Error("Cannot remove vehicle that is currently in use or assigned");
    }

    vehicle.isActive = false;
    await vehicle.save();

    await this.updateFleetVehicleCounts(fleetId);

    return vehicle;
  }

  async getFleetDrivers(fleetId) {
    if (!fleetId) throw new Error("Fleet ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const vehicles = await FleetVehicle.find({ fleetId, isActive: true, assignedDriverId: { $ne: null } })
      .populate("assignedDriverId", "name email phone")
      .populate("carId", "licensePlate make model")
      .sort({ createdAt: -1 });

    const driverMap = new Map();
    vehicles.forEach((vehicle) => {
      if (vehicle.assignedDriverId) {
        const driverId = vehicle.assignedDriverId._id.toString();
        if (!driverMap.has(driverId)) {
          const car = vehicle.carId;
          const vehicleName = car
            ? `${car.make || ""} ${car.model || ""} (${car.licensePlate || ""})`.trim()
            : vehicle.vehicleNumber || "";
          driverMap.set(driverId, {
            id: vehicle.assignedDriverId._id,
            userName: vehicle.assignedDriverId.name || "",
            userEmail: vehicle.assignedDriverId.email || "",
            phone: vehicle.assignedDriverId.phone || "",
            assignedVehicleName: vehicleName,
            status: "Active",
            licenseNumber: null,
            licenseExpiry: null,
            totalSessions: 0,
            totalEnergyConsumed: 0,
          });
        }
      }
    });

    return Array.from(driverMap.values());
  }

  async assignDriverToFleet(fleetId, driverData) {
    if (!fleetId) throw new Error("Fleet ID is required");
    if (!driverData.driverId) throw new Error("Driver ID is required");
    if (!driverData.vehicleId) throw new Error("Vehicle ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const driver = await User.findById(driverData.driverId);
    if (!driver) throw new Error("Driver not found");

    const vehicle = await FleetVehicle.findById(driverData.vehicleId);
    if (!vehicle) throw new Error("Vehicle not found");
    if (vehicle.fleetId.toString() !== fleetId) {
      throw new Error("Vehicle does not belong to this fleet");
    }

    vehicle.assignedDriverId = driverData.driverId;
    vehicle.status = "Assigned";
    await vehicle.save();

    return {
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      assignedVehicle: {
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        status: "Assigned",
      },
    };
  }

  async updateFleetDriver(fleetId, driverId, updateData) {
    if (!fleetId) throw new Error("Fleet ID is required");
    if (!driverId) throw new Error("Driver ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const driver = await User.findById(driverId);
    if (!driver) throw new Error("Driver not found");

    const vehicle = await FleetVehicle.findOne({ fleetId, assignedDriverId: driverId, isActive: true });
    if (!vehicle) {
      throw new Error("Driver is not assigned to any vehicle in this fleet");
    }

    if (updateData.vehicleId && updateData.vehicleId !== vehicle._id.toString()) {
      const newVehicle = await FleetVehicle.findById(updateData.vehicleId);
      if (!newVehicle) throw new Error("New vehicle not found");
      if (newVehicle.fleetId.toString() !== fleetId) {
        throw new Error("New vehicle does not belong to this fleet");
      }

      vehicle.assignedDriverId = null;
      vehicle.status = "Available";
      await vehicle.save();

      newVehicle.assignedDriverId = driverId;
      newVehicle.status = "Assigned";
      await newVehicle.save();

      return {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        assignedVehicle: {
          vehicleId: newVehicle._id,
          vehicleNumber: newVehicle.vehicleNumber,
          status: "Assigned",
        },
      };
    }

    return {
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      assignedVehicle: {
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        status: vehicle.status,
      },
    };
  }

  async removeDriverFromFleet(fleetId, driverId) {
    if (!fleetId) throw new Error("Fleet ID is required");
    if (!driverId) throw new Error("Driver ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const vehicle = await FleetVehicle.findOne({ fleetId, assignedDriverId: driverId, isActive: true });
    if (!vehicle) {
      throw new Error("Driver is not assigned to any vehicle in this fleet");
    }

    vehicle.assignedDriverId = null;
    vehicle.status = "Available";
    await vehicle.save();
  }

  async getCompanyFleetStats(companyId) {
    if (!companyId) throw new Error("Company ID is required");

    const company = await Company.findOne({ id: companyId }).select("_id");
    if (!company) throw new Error("Company not found");

    const fleets = await Fleet.find({ companyId: company._id });
    const fleetIds = fleets.map(f => f._id);

    const totalFleets = fleets.length;
    const activeFleets = fleets.filter(f => f.status === "Active").length;

    const allVehicles = await FleetVehicle.find({ fleetId: { $in: fleetIds }, isActive: true });
    const totalVehicles = allVehicles.length;
    const availableVehicles = allVehicles.filter(v => v.status === "Available").length;
    const vehiclesInUse = allVehicles.filter(v => v.status === "InUse").length;
    const vehiclesCharging = allVehicles.filter(v => v.status === "Charging").length;
    const vehiclesInMaintenance = allVehicles.filter(v => v.status === "Maintenance").length;

    const allDrivers = await FleetVehicle.find({
      fleetId: { $in: fleetIds },
      isActive: true,
      assignedDriverId: { $ne: null }
    }).distinct("assignedDriverId");
    const totalDrivers = allDrivers.length;

    const activeDrivers = await FleetAssignment.find({
      fleetId: { $in: fleetIds },
      status: "Active",
    }).distinct("driverId");

    const consumptions = await Consumption.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const totalEnergyConsumed = consumptions.reduce((sum, c) => sum + (c.energyConsumed || 0), 0);
    const totalSessions = consumptions.length;

    const avgEfficiency = totalVehicles > 0 && totalEnergyConsumed > 0
      ? Math.round((totalEnergyConsumed / totalVehicles) * 100) / 100
      : 0;

    return {
      totalFleets,
      activeFleets,
      totalVehicles,
      availableVehicles,
      vehiclesInUse,
      vehiclesCharging,
      vehiclesInMaintenance,
      totalDrivers,
      activeDrivers: activeDrivers.length,
      totalEnergyConsumed: Math.round(totalEnergyConsumed * 100) / 100,
      totalSessions,
      averageEfficiency: avgEfficiency,
    };
  }

  async getFleetAnalytics(fleetId, period = "1M") {
    if (!fleetId) throw new Error("Fleet ID is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

    const periodMap = {
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "1Y": 365,
    };

    const days = periodMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const vehicles = await FleetVehicle.find({ fleetId, isActive: true }).populate("carId");

    const consumptions = await Consumption.find({
      createdAt: { $gte: startDate },
    });

    const energyConsumption = [];
    const dateMap = new Map();

    consumptions.forEach(c => {
      const date = c.createdAt.toISOString().split("T")[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, energy: 0, sessions: 0 });
      }
      const entry = dateMap.get(date);
      entry.energy += c.energyConsumed || 0;
      entry.sessions += 1;
    });

    energyConsumption.push(...Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date)));

    const assignments = await FleetAssignment.find({
      fleetId,
      createdAt: { $gte: startDate },
    }).populate("fleetVehicleId", "vehicleNumber");

    const vehicleUtilization = [];
    const vehicleUtilMap = new Map();

    assignments.forEach(a => {
      if (!a.fleetVehicleId) return;
      const vId = a.fleetVehicleId._id.toString();
      if (!vehicleUtilMap.has(vId)) {
        vehicleUtilMap.set(vId, {
          vehicleId: vId,
          vehicleNumber: a.fleetVehicleId.vehicleNumber,
          totalAssignments: 0,
          completedAssignments: 0,
          totalHours: 0,
        });
      }
      const entry = vehicleUtilMap.get(vId);
      entry.totalAssignments += 1;
      if (a.status === "Completed") {
        entry.completedAssignments += 1;
        if (a.actualStart && a.actualEnd) {
          entry.totalHours += (a.actualEnd - a.actualStart) / (1000 * 60 * 60);
        }
      }
    });

    vehicleUtilization.push(...Array.from(vehicleUtilMap.values()));

    const driverAssignments = await FleetAssignment.find({
      fleetId,
      status: "Completed",
      createdAt: { $gte: startDate },
    }).populate("driverId", "name email");

    const driverPerformance = [];
    const driverPerfMap = new Map();

    driverAssignments.forEach(a => {
      if (!a.driverId) return;
      const dId = a.driverId._id.toString();
      if (!driverPerfMap.has(dId)) {
        driverPerfMap.set(dId, {
          driverId: dId,
          driverName: a.driverId.name,
          totalAssignments: 0,
          completedAssignments: 0,
          totalDistance: 0,
        });
      }
      const entry = driverPerfMap.get(dId);
      entry.totalAssignments += 1;
      entry.completedAssignments += 1;
      if (a.startOdometer && a.endOdometer) {
        entry.totalDistance += a.endOdometer - a.startOdometer;
      }
    });

    driverPerformance.push(...Array.from(driverPerfMap.values()));

    const totalEnergy = consumptions.reduce((sum, c) => sum + (c.energyConsumed || 0), 0);
    const totalCost = consumptions.reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const totalSessions = consumptions.length;

    return {
      fleetId,
      period,
      energyConsumption,
      vehicleUtilization,
      driverPerformance,
      costAnalysis: {
        totalCost: Math.round(totalCost * 100) / 100,
        costPerKwh: totalEnergy > 0 ? Math.round((totalCost / totalEnergy) * 100) / 100 : 0,
        costPerSession: totalSessions > 0 ? Math.round((totalCost / totalSessions) * 100) / 100 : 0,
        costPerVehicle: vehicles.length > 0 ? Math.round((totalCost / vehicles.length) * 100) / 100 : 0,
      },
    };
  }
  // ── helpers to flatten Mongoose docs into frontend-friendly shapes ──

  async _normalizeFleet(fleet) {
    const obj = fleet.toObject ? fleet.toObject() : { ...fleet };
    const fleetId = obj._id;

    // Compute vehicle / driver counts
    const vehicleCount = await FleetVehicle.countDocuments({ fleetId, isActive: true });
    const driverCount = await FleetVehicle.countDocuments({
      fleetId,
      isActive: true,
      assignedDriverId: { $ne: null },
    });

    // Flatten populated managerId
    const manager = typeof obj.managerId === "object" && obj.managerId
      ? obj.managerId.name || ""
      : "";
    const managerEmail = typeof obj.managerId === "object" && obj.managerId
      ? obj.managerId.email || ""
      : "";

    // Flatten location.address if it's somehow an object
    if (obj.location && typeof obj.location.address === "object") {
      obj.location.address = obj.location.address?.address || "";
    }


    return {
      ...obj,
      id: obj._id,
      vehicleCount,
      driverCount,
      manager,
      managerEmail,
      totalSessions: 0,
      totalEnergyConsumed: 0,
      averageEfficiency: 0,
    };
  }

  _normalizeVehicle(vehicle) {
    const obj = vehicle.toObject ? vehicle.toObject() : { ...vehicle };

    // Map populated carId → car
    const car = typeof obj.carId === "object" && obj.carId
      ? {
        make: obj.carId.make || obj.carId.brand || "",
        model: obj.carId.model || "",
        licensePlate: obj.carId.licensePlate || obj.carId.plateNumber || "",
        year: obj.carId.year || "",
      }
      : null;

    // Map populated assignedDriverId → assignedDriverName
    const assignedDriverName = typeof obj.assignedDriverId === "object" && obj.assignedDriverId
      ? obj.assignedDriverId.name || ""
      : null;

    // Flatten batteryStatus → batteryLevel
    const batteryLevel = obj.batteryStatus?.currentLevel ?? undefined;

    // Flatten currentLocation → string
    const currentLocation = obj.currentLocation
      ? obj.currentLocation.address || [obj.currentLocation.latitude, obj.currentLocation.longitude].filter(Boolean).join(", ") || null
      : null;

    return {
      ...obj,
      id: obj._id,
      car,
      assignedDriverName,
      batteryLevel,
      currentLocation,
      totalSessions: 0,
      totalEnergyConsumed: 0,
    };
  }
}

export default new FleetService();
