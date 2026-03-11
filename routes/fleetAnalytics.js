import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import fleetAnalyticsService from "../service/management/fleetAnalyticsService.js";

const router = express.Router();

/**
 * @route   GET /api/fleet-analytics/dashboard/:fleetId
 * @desc    Get fleet dashboard analytics
 * @access  Private (Admin, Company Operator)
 */
router.get("/dashboard/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await fleetAnalyticsService.getFleetDashboard(fleetId, startDate, endDate);
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
 * @route   GET /api/fleet-analytics/vehicle-utilization/:fleetId
 * @desc    Get vehicle utilization analytics
 * @access  Private (Admin, Company Operator)
 */
router.get("/vehicle-utilization/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await fleetAnalyticsService.getVehicleUtilization(fleetId, startDate, endDate);
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
 * @route   GET /api/fleet-analytics/driver-performance/:fleetId
 * @desc    Get driver performance analytics
 * @access  Private (Admin, Company Operator)
 */
router.get("/driver-performance/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await fleetAnalyticsService.getDriverPerformance(fleetId, startDate, endDate);
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
 * @route   GET /api/fleet-analytics/maintenance-cost/:fleetId
 * @desc    Get maintenance cost analysis
 * @access  Private (Admin, Company Operator)
 */
router.get("/maintenance-cost/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await fleetAnalyticsService.getMaintenanceCostAnalysis(fleetId, startDate, endDate);
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
 * @route   GET /api/fleet-analytics/charging/:fleetId
 * @desc    Get charging analytics
 * @access  Private (Admin, Company Operator)
 */
router.get("/charging/:fleetId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { fleetId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await fleetAnalyticsService.getChargingAnalytics(fleetId, startDate, endDate);
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
 * @route   GET /api/fleet-analytics/comparison/:companyId
 * @desc    Get fleet comparison for company
 * @access  Private (Admin, Company Operator)
 */
router.get("/comparison/:companyId", authenticate, authorize("admin", "company_operator"), async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = await fleetAnalyticsService.getFleetComparison(companyId);
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

export default router;
