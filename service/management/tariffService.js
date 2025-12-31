import Tariff from "../../model/management/Tariff.js";

class TariffService {
  constructor() {
    this.tariff = Tariff;
  }

  /**
   * Create a new tariff
   * @param {object} tariffData - Tariff data
   * @returns {Promise<Tariff>} Created tariff
   */
  async createTariff(tariffData) {
    // Validate required fields
    if (!tariffData.companyId) {
      throw new Error("companyId is required");
    }
    if (!tariffData.chargePointId) {
      throw new Error("chargePointId is required");
    }
    if (tariffData.connectorId === undefined) {
      throw new Error("connectorId is required");
    }

    const tariff = new this.tariff(tariffData);
    await tariff.save();
    return tariff;
  }

  /**
   * Get tariff by ID
   * @param {string} id - Tariff ID
   * @returns {Promise<Tariff>} Tariff
   */
  async getTariffById(id) {
    return await this.tariff.findById(id);
  }

  /**
   * Get active tariff for a specific connector at a given date/time
   * @param {string} chargePointId - Charge point identifier
   * @param {number} connectorId - Connector ID
   * @param {Date} dateTime - Date/time to check (defaults to now)
   * @returns {Promise<Tariff|null>} Active tariff or null
   */
  async getTariffForConnector(
    chargePointId,
    connectorId,
    dateTime = new Date()
  ) {
    const query = {
      chargePointId: chargePointId,
      connectorId: connectorId,
      isActive: true,
      validFrom: { $lte: dateTime },
      $or: [
        { validUntil: null }, // No expiry
        { validUntil: { $gte: dateTime } }, // Not expired
      ],
    };

    // Get the most recent valid tariff
    return await this.tariff
      .findOne(query)
      .sort({ validFrom: -1, createdAt: -1 });
  }

  /**
   * Get all tariffs with optional filters
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} Array of tariffs
   */
  async getAllTariffs(filters = {}) {
    const query = {};

    if (filters.companyId) {
      query.companyId = filters.companyId;
    }

    if (filters.chargePointId) {
      query.chargePointId = filters.chargePointId;
    }

    if (filters.connectorId !== undefined) {
      query.connectorId = filters.connectorId;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return await this.tariff.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get tariffs by company
   * @param {string} companyId - Company ID
   * @param {object} filters - Additional filters
   * @returns {Promise<Array>} Array of tariffs
   */
  async getTariffsByCompany(companyId, filters = {}) {
    const query = { companyId: companyId };

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.chargePointId) {
      query.chargePointId = filters.chargePointId;
    }

    if (filters.connectorId !== undefined) {
      query.connectorId = filters.connectorId;
    }

    return await this.tariff.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update tariff
   * @param {string} id - Tariff ID
   * @param {object} updateData - Data to update
   * @returns {Promise<Tariff>} Updated tariff
   */
  async updateTariff(id, updateData) {
    const tariff = await this.tariff.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!tariff) {
      throw new Error(`Tariff with id ${id} not found`);
    }

    return tariff;
  }

  /**
   * Delete tariff
   * @param {string} id - Tariff ID
   * @returns {Promise<Tariff>} Deleted tariff
   */
  async deleteTariff(id) {
    const tariff = await this.tariff.findByIdAndDelete(id);

    if (!tariff) {
      throw new Error(`Tariff with id ${id} not found`);
    }

    return tariff;
  }

  /**
   * Deactivate tariff (soft delete)
   * @param {string} id - Tariff ID
   * @returns {Promise<Tariff>} Updated tariff
   */
  async deactivateTariff(id) {
    return await this.updateTariff(id, { isActive: false });
  }

  /**
   * Get price per kWh for a connector at a specific date/time
   * @param {string} chargePointId - Charge point identifier
   * @param {number} connectorId - Connector ID
   * @param {Date} dateTime - Date/time to get price for
   * @returns {Promise<object|null>} Price info or null
   */
  async getPriceForConnector(
    chargePointId,
    connectorId,
    dateTime = new Date()
  ) {
    const tariff = await this.getTariffForConnector(
      chargePointId,
      connectorId,
      dateTime
    );

    if (!tariff) {
      return null;
    }

    return {
      tariffId: tariff._id,
      pricePerKwh: tariff.getPriceForDateTime(dateTime),
      connectionFee: tariff.connectionFee || 0,
      minimumCharge: tariff.minimumCharge || 0,
      currency: tariff.currency || "USD",
      tariff: tariff,
    };
  }
}

export default new TariffService();
