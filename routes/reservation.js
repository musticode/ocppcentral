import { authenticate, authorize } from "../middleware/authMiddleware.js";

import express from "express";
import reservationService from "../service/management/reservationService.js";

const router = express.Router();

/**
 * @route   GET /api/reservations
 * @desc    Get all reservations with optional filters
 * @access  Private (Admin)
 */
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { chargePointId, idTag, status, isActive } = req.query;
    const data = await reservationService.listReservations({
      chargePointId,
      idTag,
      status,
      isActive: isActive === "true",
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

router.get('/fetchCompanyReservations', authenticate, authorize("admin"), async (req, res) => {
  try {
    const { companyId } = req.query;
    const data = await reservationService.getReservationsByCompanyId(companyId);
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
 * @route   GET /api/reservations/:reservationId
 * @desc    Get a specific reservation by reservationId
 * @access  Private (Admin)
 */
router.get("/:reservationId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { reservationId } = req.params;
    const data = await reservationService.getReservationById(parseInt(reservationId));
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
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
 * @route   POST /api/reservations
 * @desc    Create a new reservation
 * @access  Private (Admin)
 */
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { chargePointId, connectorId, idTag, expiryDate, reservationId, parentIdTag } = req.body;

    if (!chargePointId || !idTag || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "chargePointId, idTag, and expiryDate are required",
      });
    }

    const data = await reservationService.createReservation({
      chargePointId,
      connectorId,
      idTag,
      expiryDate,
      reservationId,
      parentIdTag,
    });

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
 * @route   POST /api/reservations/:reservationId/cancel
 * @desc    Cancel a reservation
 * @access  Private (Admin)
 */
router.post("/:reservationId/cancel", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { reason } = req.body;

    const data = await reservationService.cancelReservation(
      parseInt(reservationId),
      "admin",
      reason
    );

    return res.json({
      success: true,
      message: "Reservation cancelled successfully",
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
 * @route   DELETE /api/reservations/:reservationId
 * @desc    Delete a reservation (admin cleanup only)
 * @access  Private (Admin)
 */
router.delete("/:reservationId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { reservationId } = req.params;

    const data = await reservationService.deleteReservation(parseInt(reservationId));

    return res.json({
      success: true,
      message: "Reservation deleted successfully",
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
 * @route   GET /api/reservations/charge-point/:chargePointId
 * @desc    Get reservations for a specific charge point
 * @access  Private (Admin)
 */
router.get("/charge-point/:chargePointId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { chargePointId } = req.params;
    const { status, isActive } = req.query;

    const data = await reservationService.listReservations({
      chargePointId,
      status,
      isActive: isActive === "true",
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
 * @route   GET /api/reservations/id-tag/:idTag
 * @desc    Get reservations for a specific idTag
 * @access  Private (Admin)
 */
router.get("/id-tag/:idTag", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { idTag } = req.params;
    const { status, isActive } = req.query;

    const data = await reservationService.listReservations({
      idTag,
      status,
      isActive: isActive === "true",
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
 * @route   GET /api/reservations/validate
 * @desc    Validate if a reservation can be made
 * @access  Private (Admin)
 */
router.post("/validate", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { chargePointId, connectorId, idTag } = req.body;

    if (!chargePointId || !idTag) {
      return res.status(400).json({
        success: false,
        message: "chargePointId and idTag are required",
      });
    }

    const validation = await reservationService.validateReservation(
      chargePointId,
      connectorId,
      idTag
    );

    return res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/reservations/expire-old
 * @desc    Mark expired reservations as expired
 * @access  Private (Admin)
 */
router.post("/expire-old", authenticate, authorize("admin"), async (req, res) => {
  try {
    const count = await reservationService.expireOldReservations();

    return res.json({
      success: true,
      message: `${count} reservations marked as expired`,
      count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
