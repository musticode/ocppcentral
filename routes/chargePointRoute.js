import express from "express";
import ChargePointService from "../service/management/chargePointService.js";
import locationService from "../service/management/locationService.js";

const router = express.Router();

router.get("/listAllChargePoints", async (req, res) => {
  try {
    const chargePoints = await ChargePointService.getAllChargePoints();
    res.json({
      success: true,
      data: chargePoints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chargePoint = await ChargePointService.getChargePointById(id);
    res.json({
      success: true,
      data: chargePoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/createChargePoint", async (req, res) => {
  try {
    const chargePoint = await ChargePointService.createChargePoint(req.body);

    res.json({
      success: true,
      data: chargePoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update charge point's location relation - must be before /:id
router.put("/:id/location", async (req, res) => {
  try {
    const { id } = req.params;
    const { locationId } = req.body;
    const chargePoint = await locationService.updateChargePointLocation(
      id,
      locationId ?? null
    );
    res.json({
      success: true,
      data: chargePoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update charge point
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chargePoint = await ChargePointService.updateChargePoint(
      id,
      req.body
    );
    if (!chargePoint) {
      return res.status(404).json({
        success: false,
        error: "Charge point not found",
      });
    }
    res.json({
      success: true,
      data: chargePoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete charge point
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chargePoint = await ChargePointService.deleteChargePoint(id);
    if (!chargePoint) {
      return res.status(404).json({
        success: false,
        error: "Charge point not found",
      });
    }
    res.json({
      success: true,
      data: chargePoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
