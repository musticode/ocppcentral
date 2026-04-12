import express from "express";
import userChargingProfileService from "../service/management/userChargingProfileService.js";

const router = express.Router();

/**
 * GET / - Get all user charging profiles with optional filters
 * Query params: userId, companyId, isActive
 */
router.get("/", async (req, res) => {
  try {
    const filters = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.companyId) filters.companyId = req.query.companyId;
    if (req.query.isActive !== undefined)
      filters.isActive = req.query.isActive === "true";

    const profiles = await userChargingProfileService.getAllProfiles(filters);
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
 * GET /user/:userId - Get active charging profile for a user
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile =
      await userChargingProfileService.getActiveProfileByUserId(userId);

    if (!profile) {
      return res.json({
        success: true,
        data: null,
        message: "No active charging profile found for this user",
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
 * GET /:id - Get user charging profile by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await userChargingProfileService.getProfileById(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "User charging profile not found",
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
 * POST / - Create a new user charging profile
 */
router.post("/", async (req, res) => {
  try {
    const profile = await userChargingProfileService.createProfile(req.body);
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
 * PUT /:id - Update user charging profile (preferences)
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await userChargingProfileService.updateProfile(id, req.body);
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
 * DELETE /:id - Delete user charging profile
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await userChargingProfileService.deleteProfile(id);
    res.json({
      success: true,
      data: profile,
      message: "User charging profile deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /:id/deactivate - Deactivate user charging profile (soft delete)
 */
router.patch("/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await userChargingProfileService.deactivateProfile(id);
    res.json({
      success: true,
      data: profile,
      message: "User charging profile deactivated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /:id/recalculate - Manually trigger recalculation for a single profile
 */
router.post("/:id/recalculate", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await userChargingProfileService.recalculateProfile(id);
    res.json({
      success: true,
      data: profile,
      message: "Charging profile recalculated from transaction history",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /recalculate-all - Manually trigger recalculation for all active profiles
 * (Same logic as the daily cron job)
 */
router.post("/recalculate-all", async (req, res) => {
  try {
    const summary = await userChargingProfileService.recalculateAllProfiles();
    res.json({
      success: true,
      data: summary,
      message: "All active user charging profiles recalculated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
