import express from "express";
import locationService from "../service/management/locationService.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// List all locations - must be before /:id to avoid conflict
router.get("/listAllLocations", async (req, res) => {
  try {
    const locations = await locationService.getAllLocations();
    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create location - must be before /:id
router.post("/createLocation", async (req, res) => {
  try {
    const { name, address, latitude, longitude, description } = req.body;
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: "Name and address are required",
      });
    }
    const id = uuidv4();
    const location = await locationService.createLocation({
      id,
      name,
      address,
      latitude,
      longitude,
      description,
    });
    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get charge points for a location - must be before /:id
router.get("/:id/charge-points", async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationService.getLocationById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Location not found",
      });
    }
    const chargePoints = await locationService.getChargePointsByLocation(id);
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

// Get location by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationService.getLocationById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Location not found",
      });
    }
    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update location
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, description } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (description !== undefined) updateData.description = description;
    const location = await locationService.updateLocation(id, updateData);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Location not found",
      });
    }
    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete location (unassigns charge points first)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationService.deleteLocation(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Location not found",
      });
    }
    res.json({
      success: true,
      data: location,
      message: "Location deleted. Charge points were unassigned.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
