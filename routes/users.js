import express from "express";
import { getAllUsers } from "../service/management/userService.js";

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

export default router;
