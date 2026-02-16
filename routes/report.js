import express from "express";
import reportService from "../service/management/reportService.js";

const router = express.Router();

router.get("/charge-point", async (req, res) => {
  try {
    const { companyId, chargePointId, periodFrom, periodTo, save } = req.query;
    const report = await reportService.getChargePointReport({
      companyId,
      chargePointId,
      periodFrom,
      periodTo,
      save: save === "true" || save === true,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;