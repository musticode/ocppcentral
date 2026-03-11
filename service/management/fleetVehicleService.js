import FleetVehicle from "../../model/management/FleetVehicle.js";
import Fleet from "../../model/management/Fleet.js";
import Car from "../../model/management/Car.js";
import User from "../../model/management/User.js";
import fleetService from "./fleetService.js";

class FleetVehicleService {
  async addVehicleToFleet(vehicleData) {
    const { fleetId, carId, vehicleNumber, assignedDriverId, status, currentLocation, batteryStatus, odometer } = vehicleData;

    if (!fleetId) throw new Error("Fleet ID is required");
    if (!carId) throw new Error("Car ID is required");
    if (!vehicleNumber) throw new Error("Vehicle number is required");

    const fleet = await Fleet.findById(fleetId);
    if (!fleet) throw new Error("Fleet not found");

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
    await fleetService.updateFleetVehicleCounts(fleetId);

    return await this.getFleetVehicleById(fleetVehicle._id);
  }

  async getFleetVehicleById(vehicleId) {
    const vehicle = await FleetVehicle.findById(vehicleId)
      .populate("fleetId", "name companyId")
      .populate("carId")
      .populate("assignedDriverId", "name email phone");

    if (!vehicle) throw new Error("Fleet vehicle not found");
    return vehicle;
  }

  async listFleetVehicles({ fleetId, status, assignedDriverId, isActive } = {}) {
    const query = {};
    if (fleetId) query.fleetId = fleetId;
    if (status) query.status = status;
    if (assignedDriverId) query.assignedDriverId = assignedDriverId;
    if (isActive !== undefined) query.isActive = isActive;

    return await FleetVehicle.find(query)
      .populate("fleetId", "name companyId")
      .populate("carId")
      .populate("assignedDriverId", "name email phone")
      .sort({ createdAt: -1 });
  }

  async updateFleetVehicle(vehicleId, updateData) {
    if (!vehicleId) throw new Error("Vehicle ID is required");

    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

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
      await fleetService.updateFleetVehicleCounts(vehicle.fleetId);
    }

    return await this.getFleetVehicleById(vehicleId);
  }

  async updateVehicleLocation(vehicleId, location) {
    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

    vehicle.currentLocation = {
      ...location,
      lastUpdated: new Date(),
    };

    await vehicle.save();
    return vehicle;
  }

  async updateVehicleBatteryStatus(vehicleId, batteryStatus) {
    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

    vehicle.batteryStatus = {
      ...batteryStatus,
      lastUpdated: new Date(),
    };

    await vehicle.save();

    const fleet = await Fleet.findById(vehicle.fleetId);
    if (fleet?.settings?.chargingAlerts && batteryStatus.currentLevel < (fleet.settings.lowBatteryThreshold || 20)) {
      console.log(`Low battery alert for vehicle ${vehicle.vehicleNumber}: ${batteryStatus.currentLevel}%`);
    }

    return vehicle;
  }

  async assignDriver(vehicleId, driverId) {
    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

    const driver = await User.findById(driverId);
    if (!driver) throw new Error("Driver not found");

    vehicle.assignedDriverId = driverId;
    vehicle.status = "Assigned";

    await vehicle.save();
    return await this.getFleetVehicleById(vehicleId);
  }

  async unassignDriver(vehicleId) {
    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

    vehicle.assignedDriverId = null;
    vehicle.status = "Available";

    await vehicle.save();
    return await this.getFleetVehicleById(vehicleId);
  }

  async addMaintenanceRecord(vehicleId, maintenanceData) {
    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

    if (!vehicle.maintenanceRecords) {
      vehicle.maintenanceRecords = [];
    }

    vehicle.maintenanceRecords.push({
      date: maintenanceData.date || new Date(),
      type: maintenanceData.type,
      description: maintenanceData.description,
      cost: maintenanceData.cost || 0,
      performedBy: maintenanceData.performedBy,
      nextServiceOdometer: maintenanceData.nextServiceOdometer,
    });

    if (maintenanceData.nextServiceOdometer) {
      vehicle.serviceDueOdometer = maintenanceData.nextServiceOdometer;
    }

    vehicle.lastServiceDate = maintenanceData.date || new Date();

    await vehicle.save();
    return vehicle;
  }

  async addAssignmentHistory(vehicleId, assignmentData) {
    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

    if (!vehicle.assignmentHistory) {
      vehicle.assignmentHistory = [];
    }

    vehicle.assignmentHistory.push({
      driverId: assignmentData.driverId,
      assignedAt: assignmentData.assignedAt || new Date(),
      returnedAt: assignmentData.returnedAt,
      startOdometer: assignmentData.startOdometer,
      endOdometer: assignmentData.endOdometer,
      notes: assignmentData.notes,
    });

    await vehicle.save();
    return vehicle;
  }

  async removeVehicleFromFleet(vehicleId) {
    const vehicle = await FleetVehicle.findById(vehicleId);
    if (!vehicle) throw new Error("Fleet vehicle not found");

    if (vehicle.status === "InUse" || vehicle.status === "Assigned") {
      throw new Error("Cannot remove vehicle that is currently in use or assigned");
    }

    vehicle.isActive = false;
    await vehicle.save();

    await fleetService.updateFleetVehicleCounts(vehicle.fleetId);

    return vehicle;
  }

  async getVehiclesByDriver(driverId) {
    if (!driverId) throw new Error("Driver ID is required");

    return await FleetVehicle.find({ assignedDriverId: driverId, isActive: true })
      .populate("fleetId", "name companyId")
      .populate("carId");
  }

  async getAvailableVehicles(fleetId) {
    if (!fleetId) throw new Error("Fleet ID is required");

    return await FleetVehicle.find({
      fleetId,
      status: "Available",
      isActive: true,
    })
      .populate("carId")
      .sort({ vehicleNumber: 1 });
  }

  async getVehiclesDueForMaintenance(fleetId, daysAhead = 7) {
    const query = { isActive: true };
    if (fleetId) query.fleetId = fleetId;

    const vehicles = await FleetVehicle.find(query)
      .populate("fleetId", "name")
      .populate("carId");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysAhead);

    return vehicles.filter((vehicle) => {
      if (vehicle.nextServiceDate && vehicle.nextServiceDate <= dueDate) {
        return true;
      }
      if (vehicle.serviceDueOdometer && vehicle.odometer >= vehicle.serviceDueOdometer - 500) {
        return true;
      }
      return false;
    });
  }
}

export default new FleetVehicleService();
