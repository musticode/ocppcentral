import express from "express";
import chargingProfileService from "../service/management/smartChargingService.js";

const router = express.Router();

/**
 * GET /charging-profiles - Get all charging profiles with optional filters
 * Query params: companyId, chargePointId, connectorId, chargingProfilePurpose, chargingProfileKind, isActive, stackLevel
 */
router.get("/", async (req, res) => {
  try {
    const filters = {};
    if (req.query.companyId) filters.companyId = req.query.companyId;
    if (req.query.chargePointId)
      filters.chargePointId = req.query.chargePointId;
    if (req.query.connectorId !== undefined)
      filters.connectorId = parseInt(req.query.connectorId);
    if (req.query.chargingProfilePurpose)
      filters.chargingProfilePurpose = req.query.chargingProfilePurpose;
    if (req.query.chargingProfileKind)
      filters.chargingProfileKind = req.query.chargingProfileKind;
    if (req.query.isActive !== undefined)
      filters.isActive = req.query.isActive === "true";
    if (req.query.stackLevel !== undefined)
      filters.stackLevel = parseInt(req.query.stackLevel);

    const profiles = await chargingProfileService.getAllChargingProfiles(filters);
    res.json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /charging-profiles/company/:companyId - Get charging profiles by company
 */
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const filters = {};
    if (req.query.chargePointId)
      filters.chargePointId = req.query.chargePointId;
    if (req.query.isActive !== undefined)
      filters.isActive = req.query.isActive === "true";

    const profiles = await chargingProfileService.getProfilesByCompany(
      companyId,
      filters
    );
    res.json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /charging-profiles/charge-point/:chargePointId - Get profiles for a charge point
 */
router.get("/charge-point/:chargePointId", async (req, res) => {
  try {
    const { chargePointId } = req.params;
    const filters = {};
    if (req.query.connectorId !== undefined)
      filters.connectorId = parseInt(req.query.connectorId);
    if (req.query.chargingProfilePurpose)
      filters.chargingProfilePurpose = req.query.chargingProfilePurpose;
    if (req.query.isActive !== undefined)
      filters.isActive = req.query.isActive === "true";

    const profiles = await chargingProfileService.getProfilesByChargePoint(
      chargePointId,
      filters
    );
    res.json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /charging-profiles/connector/:chargePointId/:connectorId - Get active profiles for a connector
 */
router.get("/connector/:chargePointId/:connectorId", async (req, res) => {
  try {
    const { chargePointId, connectorId } = req.params;
    const profiles =
      await chargingProfileService.getActiveProfilesForConnector(
        chargePointId,
        parseInt(connectorId)
      );
    res.json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /charging-profiles/:id - Get charging profile by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await chargingProfileService.getChargingProfileById(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Charging profile not found",
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /charging-profiles - Create a new charging profile
 */
router.post("/", async (req, res) => {
  try {
    const profile = await chargingProfileService.createChargingProfile(req.body);
    res.status(201).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /charging-profiles/:id - Update charging profile
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await chargingProfileService.updateChargingProfile(
      id,
      req.body
    );
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /charging-profiles/:id - Delete charging profile
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await chargingProfileService.deleteChargingProfile(id);
    res.json({
      success: true,
      data: profile,
      message: "Charging profile deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /charging-profiles/:id/deactivate - Deactivate charging profile (soft delete)
 */
router.patch("/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await chargingProfileService.deactivateChargingProfile(id);
    res.json({
      success: true,
      data: profile,
      message: "Charging profile deactivated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /charging-profiles/clear/:chargePointId - Clear charging profiles (OCPP-style)
 * Body: { chargingProfileId, connectorId, chargingProfilePurpose, stackLevel } (all optional)
 */
router.post("/clear/:chargePointId", async (req, res) => {
  try {
    const { chargePointId } = req.params;
    const result = await chargingProfileService.clearChargingProfiles(
      chargePointId,
      req.body
    );
    res.json({
      success: true,
      data: result,
      message: `${result.deletedCount} charging profile(s) cleared`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
