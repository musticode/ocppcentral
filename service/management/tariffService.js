import Tariff from "../../model/management/Tariff.js";

class TariffService {
  constructor() {
    this.tariff = Tariff;
  }

  /**
   * Check if two time ranges (HH:mm) overlap
   * @param {string} start1 - Start time (HH:mm)
   * @param {string} end1 - End time (HH:mm)
   * @param {string} start2 - Start time (HH:mm)
   * @param {string} end2 - End time (HH:mm)
   * @returns {boolean} True if ranges overlap
   */
  _timeRangesOverlap(start1, end1, start2, end2) {
    if (!start1 || !end1 || !start2 || !end2) return false;
    return start1 <= end2 && start2 <= end1;
  }

  /**
   * Check if two day-of-week selections overlap.
   * undefined/null means "all days", so it overlaps with any specific day.
   * @param {number|undefined|null} day1 - Day of week (0-6)
   * @param {number|undefined|null} day2 - Day of week (0-6)
   * @returns {boolean} True if they apply on the same day
   */
  _daysOverlap(day1, day2) {
    if (day1 === undefined || day1 === null) return true;
    if (day2 === undefined || day2 === null) return true;
    return day1 === day2;
  }

  /**
   * Check if a new time-based pricing entry conflicts with existing entries.
   * @param {Array} newEntries - New timeBasedPricing entries
   * @param {Array} existingEntries - Existing timeBasedPricing entries
   * @returns {boolean} True if there is a conflict
   */
  _hasOverlappingTimeZones(newEntries, existingEntries) {
    if (!newEntries?.length || !existingEntries?.length) return false;
    for (const newEntry of newEntries) {
      for (const existingEntry of existingEntries) {
        const sameDay = this._daysOverlap(
          newEntry.dayOfWeek,
          existingEntry.dayOfWeek,
        );
        const timeOverlap = this._timeRangesOverlap(
          newEntry.startTime,
          newEntry.endTime,
          existingEntry.startTime,
          existingEntry.endTime,
        );
        if (sameDay && timeOverlap) return true;
      }
    }
    return false;
  }

  /**
   * Validate that no active tariff for the same chargePointId and connectorId
   * has overlapping time zones (same dayOfWeek + overlapping startTime/endTime).
   * @param {string} chargePointId - Charge point ID
   * @param {number} connectorId - Connector ID
   * @param {Array} timeBasedPricing - Time-based pricing entries to check
   * @param {string} [excludeTariffId] - Tariff ID to exclude (e.g. when updating)
   * @throws {Error} If a conflict is found
   */
  async _assertNoTariffConflict(
    chargePointId,
    connectorId,
    timeBasedPricing,
    excludeTariffId = null,
  ) {
    if (!timeBasedPricing?.length) return;

    const query = {
      chargePointId,
      connectorId,
      isActive: true,
    };
    if (excludeTariffId) {
      query._id = { $ne: excludeTariffId };
    }

    const existingTariffs = await this.tariff.find(query);
    for (const existing of existingTariffs) {
      const conflict = this._hasOverlappingTimeZones(
        timeBasedPricing,
        existing.timeBasedPricing || [],
      );
      if (conflict) {
        throw new Error(
          `Tariff conflict: an active tariff already exists for this charge point and connector with overlapping time zone (same day and overlapping start/end time). Resolve or deactivate the existing tariff first.`,
        );
      }
    }
  }

  /**
   * Create a new tariff
   * @param {object} tariffData - Tariff data
   * @returns {Promise<Tariff>} Created tariff
   */
  async createTariff(tariffData) {
    // Validate required fields
    if (!tariffData.companyId) {
      //throw new Error("companyId is required");
    }
    if (!tariffData.chargePointId) {
      //throw new Error("chargePointId is required");
    }
    if (tariffData.connectorId === undefined) {
      //throw new Error("connectorId is required");
    }

    await this._assertNoTariffConflict(
      tariffData.chargePointId,
      tariffData.connectorId,
      tariffData.timeBasedPricing,
    );

    const tariff = new this.tariff(tariffData);
    await tariff.save();
    return tariff;
  }

  async updateConnectorTariff(chargePointId, connectorId, tariffData) {
    const tariff = await this.tariff
      .findOne({
        chargePointId: chargePointId,
        connectorId: connectorId,
        isActive: true,
      })
      .sort({ validFrom: -1, createdAt: -1 });
    if (!tariff) {
      throw new Error("No active tariff found for this connector");
    }
    const mergedTimeBasedPricing =
      tariffData.timeBasedPricing !== undefined
        ? tariffData.timeBasedPricing
        : tariff.timeBasedPricing;
    if (mergedTimeBasedPricing?.length) {
      await this._assertNoTariffConflict(
        chargePointId,
        connectorId,
        mergedTimeBasedPricing,
        tariff._id.toString(),
      );
    }
    const updatedTariff = await this.tariff.findOneAndUpdate(
      {
        chargePointId: chargePointId,
        connectorId: connectorId,
        isActive: true,
      },
      tariffData,
      { new: true },
    );
    return updatedTariff;
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
    dateTime = new Date(),
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
    const existing = await this.tariff.findById(id);
    if (!existing) {
      throw new Error(`Tariff with id ${id} not found`);
    }

    const mergedTimeBasedPricing =
      updateData.timeBasedPricing !== undefined
        ? updateData.timeBasedPricing
        : existing.timeBasedPricing;
    if (mergedTimeBasedPricing?.length) {
      await this._assertNoTariffConflict(
        existing.chargePointId,
        existing.connectorId,
        mergedTimeBasedPricing,
        id,
      );
    }

    const tariff = await this.tariff.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true },
    );

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
    dateTime = new Date(),
  ) {
    const tariff = await this.getTariffForConnector(
      chargePointId,
      connectorId,
      dateTime,
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
