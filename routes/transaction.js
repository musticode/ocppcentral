import express from "express";
import TransactionService from "../service/management/transactionService.js";
const router = express.Router();

router.get("/listAllTransactions", async (req, res) => {
  try {
    const transactions = await getAllTransactions();
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
