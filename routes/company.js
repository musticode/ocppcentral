import express from "express";
import companyService from "../service/management/companyService.js";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();

router.get("/listAllCompanies", async (req, res) => {
  try {
    const companies = await companyService.getAllCompanies();
    res.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const company = await companyService.getCompanyByName(name);

    res.json({
      success: true,
      data: company,
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
    const company = await companyService.getCompanyById(id);
    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/createCompany", async (req, res) => {
  try {
    const id = uuidv4();
    const {
      name,
      address,
      phone,
      email,
      website,
      logo,
      description,
      paymentNeeded,
    } = req.body;
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: "Name and address are required",
      });
    }
    const company = await companyService.createCompany({
      id,
      ...req.body, // name, address, phone, email, website, logo, description, paymentNeeded
    });
    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
