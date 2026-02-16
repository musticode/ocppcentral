import { authenticate, authorize } from "../middleware/authMiddleware.js";

import express from "express";
import idTagService from "../service/management/idTagService.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("IdTag");
});


router.get("/list", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { companyId, userId, isActive } = req.query;
    const data = await idTagService.listIdTags({
      companyId,
      userId,
      isActive: isActive === undefined ? undefined : isActive === "true" || isActive === true,
    });
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

// Admin creates an idTag for a user/company
router.post("/admin/create", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { idTag, companyId, userId, parentIdTag, expiryDate, description, status } = req.body;

    const data = await idTagService.createIdTagByAdmin({
      idTag,
      companyId,
      userId,
      parentIdTag,
      expiryDate,
      description,
      status,
    });

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

// Customer (mobile client) creates their own idTag
router.post("/customer/create", authenticate, authorize("user"), async (req, res) => {
  try {
    const { idTag, parentIdTag, expiryDate, description } = req.body;

    const data = await idTagService.createIdTagByCustomer({
      userId: req.userId,
      idTag,
      parentIdTag,
      expiryDate,
      description,
    });

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

export default router;
