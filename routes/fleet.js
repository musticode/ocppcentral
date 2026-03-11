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
      message: "Fleet deleted successfully",
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
