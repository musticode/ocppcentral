import express from "express";
import paymentService from "../service/management/paymentService.js";

const router = express.Router();

/**
 * GET /payments - Get all payments with optional filters
 * Query params: companyId, userId, status, chargePointId, idTag, transactionId, from, to
 */
router.get("/", async (req, res) => {
  try {
    const filters = {};
    if (req.query.companyId) filters.companyId = req.query.companyId;
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.chargePointId)
      filters.chargePointId = req.query.chargePointId;
    if (req.query.idTag) filters.idTag = req.query.idTag;
    if (req.query.transactionId !== undefined)
      filters.transactionId = parseInt(req.query.transactionId, 10);
    if (req.query.from) filters.from = req.query.from;
    if (req.query.to) filters.to = req.query.to;

    const payments = await paymentService.getAllPayments(filters);
    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /payments/company/:companyId - Get payments for a company
 * Query params: status, from, to
 */
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.from) filters.from = req.query.from;
    if (req.query.to) filters.to = req.query.to;

    const payments = await paymentService.getPaymentsByCompany(
      companyId,
      filters
    );
    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /payments/user/:userId - Get payments for a user
 * Query params: status, from, to
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.from) filters.from = req.query.from;
    if (req.query.to) filters.to = req.query.to;

    const payments = await paymentService.getPaymentsByUser(userId, filters);
    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /payments/:id - Get payment by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /payments - Create a new payment
 */
router.post("/", async (req, res) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /payments/:id - Update payment
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.updatePayment(id, req.body);
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    const status = error.message?.includes("not found") ? 404 : 400;
    res.status(status).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /payments/:id/complete - Mark payment as completed
 */
router.patch("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.completePayment(id, req.body);
    res.json({
      success: true,
      data: payment,
      message: "Payment completed successfully",
    });
  } catch (error) {
    const status = error.message?.includes("not found") ? 404 : 400;
    res.status(status).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
