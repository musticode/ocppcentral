import express from "express";

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

export default router;
