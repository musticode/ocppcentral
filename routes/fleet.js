import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import fleetService from "../service/management/fleetService.js";

const router = express.Router();

/**
 * @route   POST /api/fleets
 * @desc    Create a new fleet
 * @access  Private (Admin, Company Operator)
 */
router.post("/", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const data = await fleetService.createFleet(req.body);
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
 * @route   GET /api/fleets
 * @desc    Get all fleets with optional filters
 * @access  Private (Admin, Company Operator)
 */
router.get("/", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { companyId, managerId, status, fleetType } = req.query;
    const data = await fleetService.listFleets({
      companyId,
      managerId,
      status,
      fleetType,
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
 * @route   GET /api/fleets/stats
 * @desc    Get company-wide fleet statistics
 * @access  Private (Admin, Company Operator)
 */
router.get("/stats", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }
    const data = await fleetService.getCompanyFleetStats(companyId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/fleets/company/:companyId
 * @desc    Get fleets by company
 * @access  Private (Admin, Company Operator)
 */
router.get("/company/:companyId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = await fleetService.getFleetsByCompany(companyId);
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
 * @route   GET /api/fleets/:fleetId/stats
 * @desc    Get fleet statistics
 * @access  Private (Admin, Company Operator)
 */
router.get("/:fleetId/stats", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetService.getFleetStats(fleetId);
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
 * @route   GET /api/fleets/:fleetId/vehicles
 * @desc    Get vehicles in a fleet
 * @access  Private (Admin, Company Operator)
 */
router.get("/:fleetId/vehicles", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetService.getFleetVehicles(fleetId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/fleets/:fleetId/vehicles
 * @desc    Assign vehicle to fleet
 * @access  Private (Admin, Company Operator)
 */
router.post("/:fleetId/vehicles", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetService.assignVehicleToFleet(fleetId, req.body);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/fleets/:fleetId/vehicles/:vehicleId
 * @desc    Update fleet vehicle
 * @access  Private (Admin, Company Operator)
 */
router.put("/:fleetId/vehicles/:vehicleId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId, vehicleId } = req.params;
    const data = await fleetService.updateFleetVehicle(fleetId, vehicleId, req.body);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/fleets/:fleetId/vehicles/:vehicleId
 * @desc    Remove vehicle from fleet
 * @access  Private (Admin, Company Operator)
 */
router.delete("/:fleetId/vehicles/:vehicleId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId, vehicleId } = req.params;
    await fleetService.removeVehicleFromFleet(fleetId, vehicleId);
    return res.json({
      success: true,
      message: "Vehicle removed from fleet successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/fleets/:fleetId/drivers
 * @desc    Get drivers in a fleet
 * @access  Private (Admin, Company Operator)
 */
router.get("/:fleetId/drivers", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetService.getFleetDrivers(fleetId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/fleets/:fleetId/drivers
 * @desc    Assign driver to fleet
 * @access  Private (Admin, Company Operator)
 */
router.post("/:fleetId/drivers", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetService.assignDriverToFleet(fleetId, req.body);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/fleets/:fleetId/drivers/:driverId
 * @desc    Update fleet driver
 * @access  Private (Admin, Company Operator)
 */
router.put("/:fleetId/drivers/:driverId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId, driverId } = req.params;
    const data = await fleetService.updateFleetDriver(fleetId, driverId, req.body);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/fleets/:fleetId/drivers/:driverId
 * @desc    Remove driver from fleet
 * @access  Private (Admin, Company Operator)
 */
router.delete("/:fleetId/drivers/:driverId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId, driverId } = req.params;
    await fleetService.removeDriverFromFleet(fleetId, driverId);
    return res.json({
      success: true,
      message: "Driver removed from fleet successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/fleets/:fleetId/analytics
 * @desc    Get fleet analytics for a specific period
 * @access  Private (Admin, Company Operator)
 */
router.get("/:fleetId/analytics", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { period } = req.query;
    const data = await fleetService.getFleetAnalytics(fleetId, period);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/fleets/:fleetId
 * @desc    Get fleet by ID
 * @access  Private (Admin, Company Operator)
 */
router.get("/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetService.getFleetById(fleetId);
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
 * @route   PUT /api/fleets/:fleetId
 * @desc    Update fleet
 * @access  Private (Admin, Company Operator)
 */
router.put("/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetService.updateFleet(fleetId, req.body);
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
 * @route   DELETE /api/fleets/:fleetId
 * @desc    Delete fleet
 * @access  Private (Admin)
 */
router.delete("/:fleetId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetService.deleteFleet(fleetId);
    return res.json({
      success: true,
      message: "Fleet deleted successfully!",
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
