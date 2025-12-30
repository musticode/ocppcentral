import express from "express";
import {
  getAllUsers,
  createNewUser,
} from "../service/management/userService.js";

const router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource, test");
});

router.get("/listAllUsers", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/createNewUser", async (req, res) => {
  try {
    const user = await createNewUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      companyId: req.body.companyId || null,
      companyName: req.body.companyName || null,
    });

    // Note: idTag is automatically created/assigned based on company and role rules
    // If a specific idTag needs to be created, use addIdTagToUser separately

    res.json({
      success: true,
      data: user,
      message:
        user.IdTag && user.IdTag.length > 0
          ? "User created with idTag assigned"
          : "User created. Customer without pricing can authenticate all chargepoints.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
