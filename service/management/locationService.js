import Location from "../../model/management/Location.js";
import ChargePoint from "../../model/ocpp/ChargePoint.js";

export class LocationService {
  constructor() {
    this.location = Location;
    this.chargePoint = ChargePoint;
  }

  async getAllLocations() {
    return await this.location.find();
  }

  async getLocationById(id) {
    return await this.location.findById(id);
  }

  async getLocationByName(name) {
    return await this.location.findOne({ name });
  }

  async createLocation(locationData) {
    if (await this.location.exists({ name: locationData.name })) {
      throw new Error(`Location with name "${locationData.name}" already exists`);
    }
    const location = new Location({
      id: locationData.id,
      ...locationData,
    });
    await location.save();
    return location;
  }

  async updateLocation(id, locationData) {
    const location = await this.location.findByIdAndUpdate(
      id,
      { ...locationData, updatedAt: new Date() },
      { new: true }
    );
    return location;
  }

  async deleteLocation(id) {
    // Unassign charge points from this location before deleting
    await this.chargePoint.updateMany(
      { locationId: id },
      { $unset: { locationId: "" } }
    );
    return await this.location.findByIdAndDelete(id);
  }

  /**
   * Update charge point's location relation
   * @param {string} chargePointId - Charge point MongoDB _id
   * @param {string|null} locationId - Location MongoDB _id or null to unassign
   */
  async updateChargePointLocation(chargePointId, locationId) {
    const chargePoint = await this.chargePoint.findById(chargePointId);
    if (!chargePoint) {
      throw new Error(`Charge point with id ${chargePointId} not found`);
    }
    if (locationId !== null) {
      const location = await this.location.findById(locationId);
      if (!location) {
        throw new Error(`Location with id ${locationId} not found`);
      }
    }
    chargePoint.locationId = locationId || null;
    await chargePoint.save();
    return chargePoint.populate("locationId");
  }

  /**
   * Get charge points assigned to a location
   */
  async getChargePointsByLocation(locationId) {
    return await this.chargePoint
      .find({ locationId })
      .populate("locationId");
  }
}

export default new LocationService();
