import express from "express";
import TransactionService from "../service/management/transactionService.js";
const router = express.Router();

router.get("/listAllSessions", async (req, res) => {
  console.log("req.query", req.query);
  const companyId = req.query.companyId;
  console.log("companyId", companyId);
  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: "companyId query param is required",
    });
  }
  try {
    const sessions = await TransactionService.fetchSessionsByCompanyId(companyId);
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


router.get("/listAllTransactions", async (req, res) => {
  try {
    const transactions = await TransactionService.getAllTransactions();
    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/fetchTransactionsByCompanyName", async (req, res) => {
  console.log("req.params", req.params);
  try {
    const transactions =
      await TransactionService.fetchTransactionsByCompanyName(
        req.params.companyName
      );
    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
