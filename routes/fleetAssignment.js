import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import fleetAssignmentService from "../service/management/fleetAssignmentService.js";

const router = express.Router();

/**
 * @route   POST /api/fleet-assignments
 * @desc    Create a new fleet assignment
 * @access  Private (Admin, Company Operator)
 */
router.post("/", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const assignmentData = {
      ...req.body,
      assignedBy: req.userId,
    };
    const data = await fleetAssignmentService.createAssignment(assignmentData);
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
 * @route   GET /api/fleet-assignments
 * @desc    Get fleet assignments with filters
 * @access  Private (Admin, Company Operator)
 */
router.get("/", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId, driverId, status, startDate, endDate } = req.query;
    const data = await fleetAssignmentService.listAssignments({
      fleetId,
      driverId,
      status,
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
 * @route   GET /api/fleet-assignments/my-assignments
 * @desc    Get assignments for authenticated driver
 * @access  Private
 */
router.get("/my-assignments", authenticate, async (req, res) => {
  try {
    const data = await fleetAssignmentService.listAssignments({
      driverId: req.userId,
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
 * @route   GET /api/fleet-assignments/active/:driverId
 * @desc    Get active assignments for driver
 * @access  Private
 */
router.get("/active/:driverId", authenticate, async (req, res) => {
  try {
    const { driverId } = req.params;
    
    if (req.userRole !== "admin" && req.userRole !== "company_operator" && req.userId !== driverId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await fleetAssignmentService.getActiveAssignmentsByDriver(driverId);
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
 * @route   GET /api/fleet-assignments/upcoming/:fleetId
 * @desc    Get upcoming assignments for fleet
 * @access  Private (Admin, Company Operator)
 */
router.get("/upcoming/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { days } = req.query;
    const data = await fleetAssignmentService.getUpcomingAssignments(
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
 * @route   GET /api/fleet-assignments/history/:fleetVehicleId
 * @desc    Get assignment history for vehicle
 * @access  Private (Admin, Company Operator)
 */
router.get("/history/:fleetVehicleId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetVehicleId } = req.params;
    const { limit } = req.query;
    const data = await fleetAssignmentService.getAssignmentHistory(
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
 * @route   GET /api/fleet-assignments/stats/:fleetId
 * @desc    Get assignment statistics
 * @access  Private (Admin, Company Operator)
 */
router.get("/stats/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await fleetAssignmentService.getAssignmentStats(fleetId, startDate, endDate);
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
 * @route   GET /api/fleet-assignments/:assignmentId
 * @desc    Get assignment by ID
 * @access  Private
 */
router.get("/:assignmentId", authenticate, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const data = await fleetAssignmentService.getAssignmentById(assignmentId);
    
    if (req.userRole !== "admin" && req.userRole !== "company_operator" && 
        data.driverId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

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
 * @route   POST /api/fleet-assignments/:assignmentId/start
 * @desc    Start an assignment
 * @access  Private
 */
router.post("/:assignmentId/start", authenticate, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const data = await fleetAssignmentService.startAssignment(assignmentId, req.body);
    return res.json({
      success: true,
      message: "Assignment started successfully",
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
 * @route   POST /api/fleet-assignments/:assignmentId/complete
 * @desc    Complete an assignment
 * @access  Private
 */
router.post("/:assignmentId/complete", authenticate, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const data = await fleetAssignmentService.completeAssignment(assignmentId, req.body);
    return res.json({
      success: true,
      message: "Assignment completed successfully",
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
 * @route   POST /api/fleet-assignments/:assignmentId/cancel
 * @desc    Cancel an assignment
 * @access  Private (Admin, Company Operator)
 */
router.post("/:assignmentId/cancel", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { reason } = req.body;
    const data = await fleetAssignmentService.cancelAssignment(assignmentId, reason);
    return res.json({
      success: true,
      message: "Assignment cancelled successfully",
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
 * @route   PUT /api/fleet-assignments/:assignmentId
 * @desc    Update an assignment
 * @access  Private (Admin, Company Operator)
 */
router.put("/:assignmentId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const data = await fleetAssignmentService.updateAssignment(assignmentId, req.body);
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
