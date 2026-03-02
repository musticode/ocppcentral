import { authenticate, authorize } from "../middleware/authMiddleware.js";

import express from "express";
import carService from "../service/management/carService.js";

const router = express.Router();

/**
 * @route   GET /api/cars
 * @desc    Get all cars with optional filters
 * @access  Private (Admin)
 */
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId, companyId, isActive, make, model, year } = req.query;
    const data = await carService.listCars({
      userId,
      companyId,
      isActive: isActive === undefined ? undefined : isActive === "true" || isActive === true,
      make,
      model,
      year: year ? parseInt(year) : undefined,
    });
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/cars/my-cars
 * @desc    Get cars for the authenticated user
 * @access  Private (User)
 */
router.get("/my-cars", authenticate, async (req, res) => {
  try {
    const data = await carService.listCarsByUser(req.userId);
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/cars/stats
 * @desc    Get car statistics
 * @access  Private (Admin)
 */
router.get("/stats", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId, companyId } = req.query;
    const data = await carService.getCarStats(userId, companyId);
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

/**
 * @route   GET /api/cars/user/:userId
 * @desc    Get cars for a specific user
 * @access  Private (Admin)
 */
router.get("/user/:userId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await carService.listCarsByUser(userId);
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/cars/company/:companyId
 * @desc    Get cars for a specific company
 * @access  Private (Admin)
 */
router.get("/company/:companyId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = await carService.listCarsByCompany(companyId);
    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/cars/license-plate/:licensePlate
 * @desc    Get car by license plate
 * @access  Private (Admin)
 */
router.get("/license-plate/:licensePlate", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { licensePlate } = req.params;
    const data = await carService.getCarByLicensePlate(licensePlate);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }
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

/**
 * @route   GET /api/cars/:carId
 * @desc    Get a specific car by ID
 * @access  Private (Admin or Owner)
 */
router.get("/:carId", authenticate, async (req, res) => {
  try {
    const { carId } = req.params;
    const data = await carService.getCarById(carId);

    if (req.userRole !== "admin" && data.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

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

/**
 * @route   POST /api/cars
 * @desc    Create a new car
 * @access  Private (User)
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { companyId, make, model, year, color, licensePlate, vin, batteryCapacity, range, chargingPort, notes } = req.body;

    const userId = req.userRole === "admin" && req.body.userId ? req.body.userId : req.userId;

    const data = await carService.createCar({
      userId,
      companyId,
      make,
      model,
      year,
      color,
      licensePlate,
      vin,
      batteryCapacity,
      range,
      chargingPort,
      notes,
    });

    return res.status(201).json({
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

/**
 * @route   PUT /api/cars/:carId
 * @desc    Update a car
 * @access  Private (Admin or Owner)
 */
router.put("/:carId", authenticate, async (req, res) => {
  try {
    const { carId } = req.params;
    const car = await carService.getCarById(carId);

    if (req.userRole !== "admin" && car.userId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await carService.updateCar(carId, req.body);

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

/**
 * @route   POST /api/cars/:carId/deactivate
 * @desc    Deactivate a car
 * @access  Private (Admin or Owner)
 */
router.post("/:carId/deactivate", authenticate, async (req, res) => {
  try {
    const { carId } = req.params;
    const car = await carService.getCarById(carId);

    if (req.userRole !== "admin" && car.userId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await carService.deactivateCar(carId);

    return res.json({
      success: true,
      message: "Car deactivated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/cars/:carId/activate
 * @desc    Activate a car
 * @access  Private (Admin or Owner)
 */
router.post("/:carId/activate", authenticate, async (req, res) => {
  try {
    const { carId } = req.params;
    const car = await carService.getCarById(carId);

    if (req.userRole !== "admin" && car.userId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const data = await carService.activateCar(carId);

    return res.json({
      success: true,
      message: "Car activated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/cars/:carId
 * @desc    Delete a car
 * @access  Private (Admin)
 */
router.delete("/:carId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { carId } = req.params;

    const data = await carService.deleteCar(carId);

    return res.json({
      success: true,
      message: "Car deleted successfully",
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
