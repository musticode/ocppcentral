import Car from "../../model/management/Car.js";
import User from "../../model/management/User.js";
import Company from "../../model/management/Company.js";

class CarService {
  async createCar({ userId, companyId, make, model, year, color, licensePlate, vin, batteryCapacity, range, chargingPort, notes }) {
    if (!userId) throw new Error("userId is required");
    if (!make) throw new Error("make is required");
    if (!model) throw new Error("model is required");
    if (!year) throw new Error("year is required");
    if (!licensePlate) throw new Error("licensePlate is required");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (companyId) {
      const company = await Company.findById(companyId);
      if (!company) throw new Error("Company not found");
    }

    const existingCar = await Car.findOne({ licensePlate });
    if (existingCar) {
      throw new Error("Car with this license plate already exists");
    }

    if (vin) {
      const existingVin = await Car.findOne({ vin });
      if (existingVin) {
        throw new Error("Car with this VIN already exists");
      }
    }

    const car = new Car({
      userId,
      companyId: companyId || null,
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
      isActive: true,
    });

    await car.save();
    return car;
  }

  async getCarById(carId) {
    const car = await Car.findById(carId)
      .populate("userId", "name email")
      .populate("companyId", "name email");
    if (!car) throw new Error("Car not found");
    return car;
  }

  async getCarByLicensePlate(licensePlate) {
    const car = await Car.findOne({ licensePlate })
      .populate("userId", "name email")
      .populate("companyId", "name email");
    return car;
  }

  async listCars({ userId, companyId, isActive, make, model, year } = {}) {
    const query = {};
    if (userId) query.userId = userId;

    if (companyId) {
      const company = await Company.findOne({ id: companyId }).select("_id");
      if (!company) throw new Error(`Company ${companyId} not found`);
      query.companyId = company._id;
    }

    if (isActive !== undefined) query.isActive = isActive;
    if (make) query.make = new RegExp(make, "i");
    if (model) query.model = new RegExp(model, "i");
    if (year) query.year = year;

    return await Car.find(query)
      .populate("userId", "name email")
      .populate("companyId", "name email")
      .sort({ createdAt: -1 });
  }

  async listCarsByUser(userId) {
    if (!userId) throw new Error("userId is required");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    return await Car.find({ userId, isActive: true })
      .populate("companyId", "name email")
      .sort({ createdAt: -1 });
  }

  async listCarsByCompany(companyId) {
    if (!companyId) throw new Error("companyId is required");

    const company = await Company.findById(companyId);
    if (!company) throw new Error("Company not found");

    return await Car.find({ companyId, isActive: true })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
  }

  async updateCar(carId, updateData) {
    if (!carId) throw new Error("carId is required");

    const car = await Car.findById(carId);
    if (!car) throw new Error("Car not found");

    if (updateData.licensePlate && updateData.licensePlate !== car.licensePlate) {
      const existingCar = await Car.findOne({ licensePlate: updateData.licensePlate });
      if (existingCar) {
        throw new Error("Car with this license plate already exists");
      }
    }

    if (updateData.vin && updateData.vin !== car.vin) {
      const existingVin = await Car.findOne({ vin: updateData.vin });
      if (existingVin) {
        throw new Error("Car with this VIN already exists");
      }
    }

    const allowedUpdates = [
      "make",
      "model",
      "year",
      "color",
      "licensePlate",
      "vin",
      "batteryCapacity",
      "range",
      "chargingPort",
      "notes",
      "isActive",
    ];

    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        car[key] = updateData[key];
      }
    });

    car.updatedAt = new Date();
    await car.save();

    return await this.getCarById(carId);
  }

  async deactivateCar(carId) {
    if (!carId) throw new Error("carId is required");

    const car = await Car.findById(carId);
    if (!car) throw new Error("Car not found");

    car.isActive = false;
    car.updatedAt = new Date();
    await car.save();

    return car;
  }

  async activateCar(carId) {
    if (!carId) throw new Error("carId is required");

    const car = await Car.findById(carId);
    if (!car) throw new Error("Car not found");

    car.isActive = true;
    car.updatedAt = new Date();
    await car.save();

    return car;
  }

  async deleteCar(carId) {
    if (!carId) throw new Error("carId is required");

    const car = await Car.findById(carId);
    if (!car) throw new Error("Car not found");

    await Car.findByIdAndDelete(carId);
    return car;
  }

  async getCarStats(userId = null, companyId = null) {
    const query = {};
    if (userId) query.userId = userId;

    if (companyId) {
      const company = await Company.findOne({ id: companyId }).select("_id");
      if (!company) throw new Error(`Company ${companyId} not found`);
      query.companyId = company._id;
    }

    const totalCars = await Car.countDocuments(query);
    const activeCars = await Car.countDocuments({ ...query, isActive: true });
    const inactiveCars = await Car.countDocuments({ ...query, isActive: false });

    const makeDistribution = await Car.aggregate([
      { $match: query },
      { $group: { _id: "$make", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const chargingPortDistribution = await Car.aggregate([
      { $match: query },
      { $group: { _id: "$chargingPort", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return {
      totalCars,
      activeCars,
      inactiveCars,
      makeDistribution,
      chargingPortDistribution,
    };
  }
}

export default new CarService();
