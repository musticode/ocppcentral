import express from "express";
import tariffService from "../service/management/tariffService.js";

const router = express.Router();

/**
 * GET /tariff - Get all tariffs with optional filters
 * Query params: companyId, chargePointId, connectorId, isActive
 */
router.get("/", async (req, res) => {
  try {
    const filters = {};
    if (req.query.companyId) filters.companyId = req.query.companyId;
    if (req.query.chargePointId)
      filters.chargePointId = req.query.chargePointId;
    if (req.query.connectorId !== undefined)
      filters.connectorId = parseInt(req.query.connectorId);
    if (req.query.isActive !== undefined)
      filters.isActive = req.query.isActive === "true";

    const tariffs = await tariffService.getAllTariffs(filters);
    res.json({
      success: true,
      count: tariffs.length,
      data: tariffs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /tariff/company/:companyId - Get all tariffs for a company
 */
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const filters = {};
    if (req.query.chargePointId)
      filters.chargePointId = req.query.chargePointId;
    if (req.query.connectorId !== undefined)
      filters.connectorId = parseInt(req.query.connectorId);
    if (req.query.isActive !== undefined)
      filters.isActive = req.query.isActive === "true";

    const tariffs = await tariffService.getTariffsByCompany(companyId, filters);
    res.json({
      success: true,
      count: tariffs.length,
      data: tariffs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /tariff/connector/:chargePointId/:connectorId - Get active tariff for a connector
 * Query params: dateTime (optional ISO string)
 */
router.get("/connector/:chargePointId/:connectorId", async (req, res) => {
  try {
    const { chargePointId, connectorId } = req.params;
    const dateTime = req.query.dateTime
      ? new Date(req.query.dateTime)
      : new Date();

    const tariff = await tariffService.getTariffForConnector(
      chargePointId,
      parseInt(connectorId),
      dateTime,
    );

    if (!tariff) {
      return res.json({
        success: true,
        data: null,
        message: "No active tariff found for this connector",
      });
    }

    res.json({
      success: true,
      data: tariff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /tariff/price/:chargePointId/:connectorId - Get price for a connector
 * Query params: dateTime (optional ISO string)
 */
router.get("/price/:chargePointId/:connectorId", async (req, res) => {
  try {
    const { chargePointId, connectorId } = req.params;
    const dateTime = req.query.dateTime
      ? new Date(req.query.dateTime)
      : new Date();

    const priceInfo = await tariffService.getPriceForConnector(
      chargePointId,
      parseInt(connectorId),
      dateTime,
    );

    if (!priceInfo) {
      return res.json({
        success: true,
        data: null,
        message: "No active tariff found for this connector",
      });
    }

    res.json({
      success: true,
      data: priceInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /tariff/:id - Get tariff by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tariff = await tariffService.getTariffById(id);

    if (!tariff) {
      return res.status(404).json({
        success: false,
        error: "Tariff not found",
      });
    }

    res.json({
      success: true,
      data: tariff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /tariff - Create a new tariff
 */
router.post("/", async (req, res) => {
  try {
    const tariff = await tariffService.createTariff(req.body);
    res.status(201).json({
      success: true,
      data: tariff,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /tariff/connector/:chargePointId/:connectorId - Update tariff for a connector
 */
router.put("/connector/:chargePointId/:connectorId", async (req, res) => {
  try {
    const { chargePointId, connectorId } = req.params;
    const tariff = await tariffService.updateConnectorTariff(
      chargePointId,
      connectorId,
      req.body,
    );
    res.json({
      success: true,
      message: "Tariff updated successfully",
      data: tariff,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /tariff/:id - Update tariff
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tariff = await tariffService.updateTariff(id, req.body);
    res.json({
      success: true,
      data: tariff,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /tariff/:id - Delete tariff
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tariff = await tariffService.deleteTariff(id);
    res.json({
      success: true,
      data: tariff,
      message: "Tariff deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /tariff/:id/deactivate - Deactivate tariff (soft delete)
 */
router.patch("/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    const tariff = await tariffService.deactivateTariff(id);
    res.json({
      success: true,
      data: tariff,
      message: "Tariff deactivated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
