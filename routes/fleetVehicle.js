import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import fleetVehicleService from "../service/management/fleetVehicleService.js";

const router = express.Router();

/**
 * @route   POST /api/fleet-vehicles
 * @desc    Add vehicle to fleet
 * @access  Private (Admin, Company Operator)
 */
router.post("/", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const data = await fleetVehicleService.addVehicleToFleet(req.body);
    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/fleet-vehicles
 * @desc    Get fleet vehicles with filters
 * @access  Private (Admin, Company Operator)
 */
router.get("/", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId, status, assignedDriverId, isActive } = req.query;
    const data = await fleetVehicleService.listFleetVehicles({
      fleetId,
      status,
      assignedDriverId,
      isActive: isActive === undefined ? undefined : isActive === "true",
    });
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/fleet-vehicles/available/:fleetId
 * @desc    Get available vehicles in fleet
 * @access  Private (Admin, Company Operator)
 */
router.get("/available/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetVehicleService.getAvailableVehicles(fleetId);
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/fleet-vehicles/driver/:driverId
 * @desc    Get vehicles assigned to driver
 * @access  Private
 */
router.get("/driver/:driverId", authenticate, async (req, res) => {
  try {
    const { driverId } = req.params;
    
    if (req.userRole !== "admin" && req.userRole !== "company_operator" && req.userId !== driverId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await fleetVehicleService.getVehiclesByDriver(driverId);
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/fleet-vehicles/maintenance-due/:fleetId
 * @desc    Get vehicles due for maintenance
 * @access  Private (Admin, Company Operator)
 */
router.get("/maintenance-due/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { daysAhead } = req.query;
    const data = await fleetVehicleService.getVehiclesDueForMaintenance(
      fleetId,
      daysAhead ? parseInt(daysAhead) : 7
    );
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/fleet-vehicles/:vehicleId
 * @desc    Get fleet vehicle by ID
 * @access  Private (Admin, Company Operator)
 */
router.get("/:vehicleId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const data = await fleetVehicleService.getFleetVehicleById(vehicleId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/fleet-vehicles/:vehicleId
 * @desc    Update fleet vehicle
 * @access  Private (Admin, Company Operator)
 */
router.put("/:vehicleId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const data = await fleetVehicleService.updateFleetVehicle(vehicleId, req.body);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/fleet-vehicles/:vehicleId/location
 * @desc    Update vehicle location
 * @access  Private
 */
router.post("/:vehicleId/location", authenticate, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const data = await fleetVehicleService.updateVehicleLocation(vehicleId, req.body);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/fleet-vehicles/:vehicleId/battery
 * @desc    Update vehicle battery status
 * @access  Private
 */
router.post("/:vehicleId/battery", authenticate, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const data = await fleetVehicleService.updateVehicleBatteryStatus(vehicleId, req.body);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/fleet-vehicles/:vehicleId/assign-driver
 * @desc    Assign driver to vehicle
 * @access  Private (Admin, Company Operator)
 */
router.post("/:vehicleId/assign-driver", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { driverId } = req.body;
    const data = await fleetVehicleService.assignDriver(vehicleId, driverId);
    return res.json({
      success: true,
      message: "Driver assigned successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/fleet-vehicles/:vehicleId/unassign-driver
 * @desc    Unassign driver from vehicle
 * @access  Private (Admin, Company Operator)
 */
router.post("/:vehicleId/unassign-driver", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const data = await fleetVehicleService.unassignDriver(vehicleId);
    return res.json({
      success: true,
      message: "Driver unassigned successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/fleet-vehicles/:vehicleId/maintenance-record
 * @desc    Add maintenance record
 * @access  Private (Admin, Company Operator)
 */
router.post("/:vehicleId/maintenance-record", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const data = await fleetVehicleService.addMaintenanceRecord(vehicleId, req.body);
    return res.json({
      success: true,
      message: "Maintenance record added successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/fleet-vehicles/:vehicleId
 * @desc    Remove vehicle from fleet
 * @access  Private (Admin, Company Operator)
 */
router.delete("/:vehicleId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const data = await fleetVehicleService.removeVehicleFromFleet(vehicleId);
    return res.json({
      success: true,
      message: "Vehicle removed from fleet successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
