import { authenticate, authorize } from "../middleware/authMiddleware.js";

import express from "express";
import paymentMethodService from "../service/management/paymentMethodService.js";

const router = express.Router();

/**
 * @route   GET /api/payment-methods
 * @desc    Get all payment methods with optional filters (admin only)
 * @access  Private (Admin)
 */
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId, isActive, status, type, provider } = req.query;
    const data = await paymentMethodService.listPaymentMethods({
      userId,
      isActive: isActive === undefined ? undefined : isActive === "true" || isActive === true,
      status,
      type,
      provider,
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
 * @route   GET /api/payment-methods/my-methods
 * @desc    Get payment methods for the authenticated user
 * @access  Private (User)
 */
router.get("/my-methods", authenticate, async (req, res) => {
  try {
    const data = await paymentMethodService.listPaymentMethodsByUser(req.userId);
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
 * @route   GET /api/payment-methods/active
 * @desc    Get active payment method for the authenticated user
 * @access  Private (User)
 */
router.get("/active", authenticate, async (req, res) => {
  try {
    const data = await paymentMethodService.getActivePaymentMethod(req.userId);
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
 * @route   GET /api/payment-methods/check-payment
 * @desc    Check if user has active payment method
 * @access  Private (User)
 */
router.get("/check-payment", authenticate, async (req, res) => {
  try {
    const data = await paymentMethodService.checkUserHasActivePayment(req.userId);
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
 * @route   GET /api/payment-methods/stats
 * @desc    Get payment method statistics
 * @access  Private (Admin)
 */
router.get("/stats", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.query;
    const data = await paymentMethodService.getPaymentStats(userId);
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
 * @route   GET /api/payment-methods/user/:userId
 * @desc    Get payment methods for a specific user (admin only)
 * @access  Private (Admin)
 */
router.get("/user/:userId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await paymentMethodService.listPaymentMethodsByUser(userId);
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
 * @route   GET /api/payment-methods/:paymentMethodId
 * @desc    Get a specific payment method by ID
 * @access  Private (Admin or Owner)
 */
router.get("/:paymentMethodId", authenticate, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const data = await paymentMethodService.getPaymentMethodById(paymentMethodId);

    if (req.userRole !== "admin" && data.userId._id.toString() !== req.userId) {
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
 * @route   POST /api/payment-methods
 * @desc    Create a new payment method
 * @access  Private (User)
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      type,
      provider,
      cardLast4,
      cardBrand,
      cardExpMonth,
      cardExpYear,
      bankAccountLast4,
      bankName,
      paypalEmail,
      externalId,
      externalCustomerId,
      isActive,
      isVerified,
      isDefault,
      billingAddress,
      metadata,
    } = req.body;

    const userId = req.userRole === "admin" && req.body.userId ? req.body.userId : req.userId;

    const data = await paymentMethodService.createPaymentMethod({
      userId,
      type,
      provider,
      cardLast4,
      cardBrand,
      cardExpMonth,
      cardExpYear,
      bankAccountLast4,
      bankName,
      paypalEmail,
      externalId,
      externalCustomerId,
      isActive,
      isVerified,
      isDefault,
      billingAddress,
      metadata,
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
 * @route   POST /api/payment-methods/:paymentMethodId/set-active
 * @desc    Set a payment method as active
 * @access  Private (Admin or Owner)
 */
router.post("/:paymentMethodId/set-active", authenticate, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const paymentMethod = await paymentMethodService.getPaymentMethodById(paymentMethodId);

    if (req.userRole !== "admin" && paymentMethod.userId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await paymentMethodService.setActivePaymentMethod(
      paymentMethod.userId._id.toString(),
      paymentMethodId
    );

    return res.json({
      success: true,
      message: "Payment method set as active",
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
 * @route   POST /api/payment-methods/:paymentMethodId/verify
 * @desc    Verify a payment method (admin only)
 * @access  Private (Admin)
 */
router.post("/:paymentMethodId/verify", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const data = await paymentMethodService.verifyPaymentMethod(paymentMethodId);

    return res.json({
      success: true,
      message: "Payment method verified",
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
 * @route   POST /api/payment-methods/expire-old
 * @desc    Mark expired payment methods as expired
 * @access  Private (Admin)
 */
router.post("/expire-old", authenticate, authorize("admin"), async (req, res) => {
  try {
    const count = await paymentMethodService.expireOldPaymentMethods();

    return res.json({
      success: true,
      message: `${count} payment methods marked as expired`,
      count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/payment-methods/:paymentMethodId
 * @desc    Update a payment method
 * @access  Private (Admin or Owner)
 */
router.put("/:paymentMethodId", authenticate, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const paymentMethod = await paymentMethodService.getPaymentMethodById(paymentMethodId);

    if (req.userRole !== "admin" && paymentMethod.userId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await paymentMethodService.updatePaymentMethod(paymentMethodId, req.body);

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
 * @route   POST /api/payment-methods/:paymentMethodId/deactivate
 * @desc    Deactivate a payment method
 * @access  Private (Admin or Owner)
 */
router.post("/:paymentMethodId/deactivate", authenticate, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const paymentMethod = await paymentMethodService.getPaymentMethodById(paymentMethodId);

    if (req.userRole !== "admin" && paymentMethod.userId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await paymentMethodService.deactivatePaymentMethod(paymentMethodId);

    return res.json({
      success: true,
      message: "Payment method deactivated",
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
 * @route   DELETE /api/payment-methods/:paymentMethodId
 * @desc    Delete a payment method
 * @access  Private (Admin or Owner)
 */
router.delete("/:paymentMethodId", authenticate, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const paymentMethod = await paymentMethodService.getPaymentMethodById(paymentMethodId);

    if (req.userRole !== "admin" && paymentMethod.userId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await paymentMethodService.deletePaymentMethod(paymentMethodId);

    return res.json({
      success: true,
      message: "Payment method deleted",
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
