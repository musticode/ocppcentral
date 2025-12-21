import express from "express";
import {
  getAllChargePoints,
  getChargePointById,
  createChargePoint,
} from "../service/management/chargePointService.js";

const router = express.Router();

router.get("/listAllChargePoints", async (req, res) => {
  try {
    const chargePoints = await getAllChargePoints();
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
    const chargePoint = await getChargePointById(id);
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
    const chargePoint = await createChargePoint(req.body);

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
