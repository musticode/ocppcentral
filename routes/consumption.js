import express from "express";
import {
  createConsumptionFromTransaction,
  getConsumptionById,
  getAllConsumption,
} from "../service/management/consumptionService.js";
const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const consumption = await getConsumptionById(req.params.id);
    res.json({
      success: true,
      data: consumption,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const consumption = await getAllConsumption();
    res.json({
      success: true,
      data: consumption,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
