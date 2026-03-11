import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import fleetMaintenanceService from "../service/management/fleetMaintenanceService.js";

const router = express.Router();

/**
 * @route   POST /api/fleet-maintenance
 * @desc    Schedule maintenance
 * @access  Private (Admin, Company Operator)
 */
router.post("/", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const maintenanceData = {
      ...req.body,
      createdBy: req.userId,
    };
    const data = await fleetMaintenanceService.scheduleMaintenance(maintenanceData);
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
 * @route   GET /api/fleet-maintenance
 * @desc    Get maintenance records with filters
 * @access  Private (Admin, Company Operator)
 */
router.get("/", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId, fleetVehicleId, status, category, priority, startDate, endDate } = req.query;
    const data = await fleetMaintenanceService.listMaintenance({
      fleetId,
      fleetVehicleId,
      status,
      category,
      priority,
      startDate,
      endDate,
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
 * @route   GET /api/fleet-maintenance/upcoming/:fleetId
 * @desc    Get upcoming maintenance for fleet
 * @access  Private (Admin, Company Operator)
 */
router.get("/upcoming/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { days } = req.query;
    const data = await fleetMaintenanceService.getUpcomingMaintenance(
      fleetId,
      days ? parseInt(days) : 7
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
 * @route   GET /api/fleet-maintenance/overdue/:fleetId
 * @desc    Get overdue maintenance for fleet
 * @access  Private (Admin, Company Operator)
 */
router.get("/overdue/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const data = await fleetMaintenanceService.getOverdueMaintenance(fleetId);
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
 * @route   GET /api/fleet-maintenance/history/:fleetVehicleId
 * @desc    Get maintenance history for vehicle
 * @access  Private (Admin, Company Operator)
 */
router.get("/history/:fleetVehicleId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetVehicleId } = req.params;
    const { limit } = req.query;
    const data = await fleetMaintenanceService.getMaintenanceHistory(
      fleetVehicleId,
      limit ? parseInt(limit) : 10
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
 * @route   GET /api/fleet-maintenance/stats/:fleetId
 * @desc    Get maintenance statistics
 * @access  Private (Admin, Company Operator)
 */
router.get("/stats/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await fleetMaintenanceService.getMaintenanceStats(fleetId, startDate, endDate);
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
 * @route   GET /api/fleet-maintenance/:maintenanceId
 * @desc    Get maintenance by ID
 * @access  Private (Admin, Company Operator)
 */
router.get("/:maintenanceId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const data = await fleetMaintenanceService.getMaintenanceById(maintenanceId);
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
 * @route   POST /api/fleet-maintenance/:maintenanceId/start
 * @desc    Start maintenance
 * @access  Private (Admin, Company Operator)
 */
router.post("/:maintenanceId/start", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const data = await fleetMaintenanceService.startMaintenance(maintenanceId, req.body);
    return res.json({
      success: true,
      message: "Maintenance started successfully",
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
 * @route   POST /api/fleet-maintenance/:maintenanceId/complete
 * @desc    Complete maintenance
 * @access  Private (Admin, Company Operator)
 */
router.post("/:maintenanceId/complete", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const data = await fleetMaintenanceService.completeMaintenance(maintenanceId, req.body);
    return res.json({
      success: true,
      message: "Maintenance completed successfully",
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
 * @route   POST /api/fleet-maintenance/:maintenanceId/cancel
 * @desc    Cancel maintenance
 * @access  Private (Admin, Company Operator)
 */
router.post("/:maintenanceId/cancel", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const { reason } = req.body;
    const data = await fleetMaintenanceService.cancelMaintenance(maintenanceId, reason);
    return res.json({
      success: true,
      message: "Maintenance cancelled successfully",
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
 * @route   POST /api/fleet-maintenance/:maintenanceId/attachment
 * @desc    Add attachment to maintenance
 * @access  Private (Admin, Company Operator)
 */
router.post("/:maintenanceId/attachment", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const data = await fleetMaintenanceService.addAttachment(maintenanceId, req.body);
    return res.json({
      success: true,
      message: "Attachment added successfully",
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
 * @route   PUT /api/fleet-maintenance/:maintenanceId
 * @desc    Update maintenance
 * @access  Private (Admin, Company Operator)
 */
router.put("/:maintenanceId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { maintenanceId } = req.params;
    const data = await fleetMaintenanceService.updateMaintenance(maintenanceId, req.body);
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

export default router;
