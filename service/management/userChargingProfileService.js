import IdTag from "../../model/ocpp/IdTag.js";
import Transaction from "../../model/ocpp/Transaction.js";
import User from "../../model/management/User.js";
import UserChargingProfile from "../../model/management/UserChargingProfile.js";

class UserChargingProfileService {
  constructor() {
    this.userChargingProfile = UserChargingProfile;
  }

  /**
   * Create a new user charging profile
   * @param {object} profileData - Profile data
   * @returns {Promise<UserChargingProfile>} Created profile
   */
  async createProfile(profileData) {
    // Check if user already has an active profile
    const existing = await this.userChargingProfile.findOne({
      userId: profileData.userId,
      isActive: true,
    });
    if (existing) {
      throw new Error(
        "User already has an active charging profile. Deactivate the existing one first or update it."
      );
    }

    const profile = new this.userChargingProfile(profileData);
    await profile.save();
    return profile;
  }

  /**
   * Get profile by ID
   * @param {string} id - Profile MongoDB ID
   * @returns {Promise<UserChargingProfile>}
   */
  async getProfileById(id) {
    return await this.userChargingProfile.findById(id).populate("userId", "-password");
  }

  /**
   * Get active profile for a user
   * @param {string} userId - User MongoDB ID
   * @returns {Promise<UserChargingProfile|null>}
   */
  async getActiveProfileByUserId(userId) {
    return await this.userChargingProfile
      .findOne({ userId, isActive: true })
      .populate("userId", "-password");
  }

  /**
   * Get all profiles with optional filters
   * @param {object} filters
   * @returns {Promise<Array>}
   */
  async getAllProfiles(filters = {}) {
    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.companyId) query.companyId = filters.companyId;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    return await this.userChargingProfile
      .find(query)
      .populate("userId", "-password")
      .sort({ createdAt: -1 });
  }

  /**
   * Update user charging profile (preferences)
   * @param {string} id - Profile MongoDB ID
   * @param {object} updateData
   * @returns {Promise<UserChargingProfile>}
   */
  async updateProfile(id, updateData) {
    const existing = await this.userChargingProfile.findById(id);
    if (!existing) {
      throw new Error(`User charging profile with id ${id} not found`);
    }

    const profile = await this.userChargingProfile.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    return profile;
  }

  /**
   * Delete user charging profile
   * @param {string} id - Profile MongoDB ID
   * @returns {Promise<UserChargingProfile>}
   */
  async deleteProfile(id) {
    const profile = await this.userChargingProfile.findByIdAndDelete(id);
    if (!profile) {
      throw new Error(`User charging profile with id ${id} not found`);
    }
    return profile;
  }

  /**
   * Deactivate a profile (soft delete)
   * @param {string} id
   * @returns {Promise<UserChargingProfile>}
   */
  async deactivateProfile(id) {
    return await this.updateProfile(id, { isActive: false });
  }

  // ─── Transaction Analysis & Cron Logic ────────────────────────────────

  /**
   * Get all idTag strings that belong to a user
   * @param {string} userId - User MongoDB ID
   * @returns {Promise<string[]>} Array of idTag strings
   */
  async _getUserIdTags(userId) {
    const tags = await IdTag.find({ userId, isActive: true }).select("idTag");
    return tags.map((t) => t.idTag);
  }

  /**
   * Analyse a user's completed transactions and compute stats
   * @param {string} userId - User MongoDB ID
   * @param {number} lookbackDays - How many days of history to analyse
   * @returns {Promise<object>} Computed stats object
   */
  async computeStatsForUser(userId, lookbackDays = 90) {
    const idTags = await this._getUserIdTags(userId);
    if (!idTags.length) {
      return this._emptyStats();
    }

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - lookbackDays);
    const periodEnd = new Date();

    const transactions = await Transaction.find({
      idTag: { $in: idTags },
      status: "Completed",
      startedAt: { $gte: periodStart },
    }).sort({ startedAt: -1 });

    if (!transactions.length) {
      return {
        ...this._emptyStats(),
        calculationPeriodStart: periodStart,
        calculationPeriodEnd: periodEnd,
        lastCalculatedAt: new Date(),
      };
    }

    // Basic aggregates
    const totalTransactions = transactions.length;
    let totalEnergy = 0;
    let totalDurationMs = 0;
    const hourBuckets = new Array(24).fill(0);
    const chargePointCount = {};
    const connectorCount = {};

    for (const tx of transactions) {
      const energy = tx.energyConsumed || (tx.meterStop != null && tx.meterStart != null ? (tx.meterStop - tx.meterStart) / 1000 : 0);
      totalEnergy += energy;

      if (tx.stoppedAt && tx.startedAt) {
        totalDurationMs += new Date(tx.stoppedAt) - new Date(tx.startedAt);
      }

      // Hour bucket (start hour)
      const startHour = new Date(tx.startedAt).getHours();
      hourBuckets[startHour]++;

      // Charge point frequency
      const cpKey = tx.chargePointId;
      chargePointCount[cpKey] = (chargePointCount[cpKey] || 0) + 1;

      // Connector frequency
      const connKey = `${tx.chargePointId}:${tx.connectorId}`;
      connectorCount[connKey] = (connectorCount[connKey] || 0) + 1;
    }

    // Peak vs off-peak (peak = 07:00–19:00)
    let peakCount = 0;
    let offPeakCount = 0;
    for (let h = 0; h < 24; h++) {
      if (h >= 7 && h < 19) {
        peakCount += hourBuckets[h];
      } else {
        offPeakCount += hourBuckets[h];
      }
    }

    // Most frequent start/end hour
    const mostFrequentStartHour = hourBuckets.indexOf(Math.max(...hourBuckets));
    // Estimate end hour from average duration
    const avgDurationHours =
      totalTransactions > 0
        ? totalDurationMs / totalTransactions / 3600000
        : 0;
    const mostFrequentEndHour = Math.min(
      23,
      Math.round(mostFrequentStartHour + avgDurationHours)
    );

    // Most used charge point & connector
    const mostUsedChargePointId = Object.entries(chargePointCount).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    const mostUsedConnPair = Object.entries(connectorCount).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    const mostUsedConnectorId = mostUsedConnPair
      ? parseInt(mostUsedConnPair.split(":")[1])
      : undefined;

    const avgEnergyPerSession =
      totalTransactions > 0 ? totalEnergy / totalTransactions : 0;
    const avgSessionDuration =
      totalTransactions > 0
        ? totalDurationMs / totalTransactions / 60000
        : 0;

    // Unique active days
    const activeDays = new Set(
      transactions.map((tx) =>
        new Date(tx.startedAt).toISOString().slice(0, 10)
      )
    ).size;
    const avgDailyConsumption = activeDays > 0 ? totalEnergy / activeDays : 0;

    // Recommended max limit: based on average energy per session converted to watts
    // Rough heuristic: avgEnergy(kWh) / avgDuration(h) * 1000 = avg power W
    const avgPowerW =
      avgSessionDuration > 0
        ? (avgEnergyPerSession / (avgSessionDuration / 60)) * 1000
        : 7400; // default 7.4kW
    const recommendedMaxLimit = Math.round(avgPowerW * 1.2); // 20% headroom

    return {
      totalTransactions,
      totalEnergyConsumed: Math.round(totalEnergy * 100) / 100,
      avgEnergyPerSession: Math.round(avgEnergyPerSession * 100) / 100,
      avgSessionDuration: Math.round(avgSessionDuration * 10) / 10,
      avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
      peakHourUsagePercent:
        totalTransactions > 0
          ? Math.round((peakCount / totalTransactions) * 10000) / 100
          : 0,
      offPeakHourUsagePercent:
        totalTransactions > 0
          ? Math.round((offPeakCount / totalTransactions) * 10000) / 100
          : 0,
      mostUsedChargePointId,
      mostUsedConnectorId,
      recommendedMaxLimit,
      recommendedChargingRateUnit: "W",
      mostFrequentStartHour,
      mostFrequentEndHour,
      calculationPeriodStart: periodStart,
      calculationPeriodEnd: periodEnd,
      lastCalculatedAt: new Date(),
    };
  }

  /**
   * Generate an OCPP-compatible charging schedule from computed stats + preferences
   */
  _generateSchedule(computedStats, preferences = {}) {
    const rateUnit =
      preferences.preferredChargingRateUnit ||
      computedStats.recommendedChargingRateUnit ||
      "W";
    const maxLimit =
      preferences.preferredMaxLimit ||
      computedStats.recommendedMaxLimit ||
      7400;

    const periods = [];

    if (preferences.ecoChargingEnabled && computedStats.offPeakHourUsagePercent > 0) {
      // Eco mode: lower limit during peak, full during off-peak
      // Peak period (07:00 - 19:00) = 25200s - 68400s from midnight
      periods.push(
        { startPeriod: 0, limit: maxLimit, numberPhases: 3 }, // midnight–07:00 full
        { startPeriod: 25200, limit: Math.round(maxLimit * 0.5), numberPhases: 3 }, // 07:00–19:00 half
        { startPeriod: 68400, limit: maxLimit, numberPhases: 3 } // 19:00–midnight full
      );
    } else {
      // Flat profile using computed or preferred limit
      periods.push({ startPeriod: 0, limit: maxLimit, numberPhases: 3 });
    }

    return {
      chargingRateUnit: rateUnit,
      chargingSchedulePeriod: periods,
      duration: 86400, // 24 hours
    };
  }

  _emptyStats() {
    return {
      totalTransactions: 0,
      totalEnergyConsumed: 0,
      avgEnergyPerSession: 0,
      avgSessionDuration: 0,
      avgDailyConsumption: 0,
      peakHourUsagePercent: 0,
      offPeakHourUsagePercent: 0,
      mostUsedChargePointId: undefined,
      mostUsedConnectorId: undefined,
      recommendedMaxLimit: 7400,
      recommendedChargingRateUnit: "W",
      mostFrequentStartHour: undefined,
      mostFrequentEndHour: undefined,
      calculationPeriodStart: undefined,
      calculationPeriodEnd: undefined,
      lastCalculatedAt: new Date(),
    };
  }

  /**
   * Recalculate and update a single user's charging profile
   * @param {string} profileId - UserChargingProfile MongoDB ID
   * @returns {Promise<UserChargingProfile>} Updated profile
   */
  async recalculateProfile(profileId) {
    const profile = await this.userChargingProfile.findById(profileId);
    if (!profile) {
      throw new Error(`User charging profile with id ${profileId} not found`);
    }

    const stats = await this.computeStatsForUser(profile.userId);
    const schedule = this._generateSchedule(stats, profile.preferences || {});

    profile.computedStats = stats;
    profile.generatedSchedule = schedule;
    profile.updatedAt = new Date();
    await profile.save();

    return profile;
  }

  /**
   * Daily cron job: recalculate all active user charging profiles
   * @returns {Promise<object>} Summary { processed, updated, errors }
   */
  async recalculateAllProfiles() {
    const profiles = await this.userChargingProfile.find({ isActive: true });
    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const profile of profiles) {
      processed++;
      try {
        const stats = await this.computeStatsForUser(profile.userId);
        const schedule = this._generateSchedule(stats, profile.preferences || {});

        profile.computedStats = stats;
        profile.generatedSchedule = schedule;
        profile.updatedAt = new Date();
        await profile.save();
        updated++;
      } catch (err) {
        errors++;
        console.error(
          `[CronJob] Failed to recalculate profile ${profile._id} for user ${profile.userId}:`,
          err.message
        );
      }
    }

    const summary = { processed, updated, errors, finishedAt: new Date() };
    console.log("[CronJob] Recalculate all user charging profiles:", summary);
    return summary;
  }
}

export default new UserChargingProfileService();
