import ChargingProfile from "../../model/management/ChargingProfile.js";

class ChargingProfileService {
    constructor() {
        this.chargingProfile = ChargingProfile;
    }

    /**
     * Validate charging profile business rules (OCPP 1.6 constraints)
     * @param {object} profileData - Charging profile data
     * @throws {Error} If validation fails
     */
    _validateProfile(profileData) {
        // ChargePointMaxProfile can only be on connectorId 0
        if (
            profileData.chargingProfilePurpose === "ChargePointMaxProfile" &&
            profileData.connectorId !== 0
        ) {
            throw new Error(
                "ChargePointMaxProfile can only be set on connectorId 0"
            );
        }

        // TxProfile requires a transactionId
        if (
            profileData.chargingProfilePurpose === "TxProfile" &&
            !profileData.transactionId
        ) {
            throw new Error("TxProfile requires a transactionId");
        }

        // recurrencyKind is only valid for Recurring kind
        if (
            profileData.recurrencyKind &&
            profileData.chargingProfileKind !== "Recurring"
        ) {
            throw new Error(
                "recurrencyKind is only valid when chargingProfileKind is Recurring"
            );
        }

        // Recurring kind requires recurrencyKind
        if (
            profileData.chargingProfileKind === "Recurring" &&
            !profileData.recurrencyKind
        ) {
            throw new Error("Recurring profiles require a recurrencyKind (Daily or Weekly)");
        }
    }

    /**
     * Check for stack level conflicts on the same connector + purpose
     * @param {object} profileData - Charging profile data
     * @param {string} [excludeId] - Profile ID to exclude (for updates)
     * @throws {Error} If a conflict is found
     */
    async _assertNoStackConflict(profileData, excludeId = null) {
        const query = {
            chargePointId: profileData.chargePointId,
            connectorId: profileData.connectorId,
            chargingProfilePurpose: profileData.chargingProfilePurpose,
            stackLevel: profileData.stackLevel,
            isActive: true,
        };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existing = await this.chargingProfile.findOne(query);
        if (existing) {
            throw new Error(
                `An active charging profile already exists for this charge point, connector, purpose, and stack level. Deactivate or remove the existing profile first.`
            );
        }
    }

    /**
     * Create a new charging profile
     * @param {object} profileData - Charging profile data
     * @returns {Promise<ChargingProfile>} Created profile
     */
    async createChargingProfile(profileData) {
        this._validateProfile(profileData);
        await this._assertNoStackConflict(profileData);

        const profile = new this.chargingProfile(profileData);
        await profile.save();
        return profile;
    }

    /**
     * Get charging profile by ID
     * @param {string} id - MongoDB ID
     * @returns {Promise<ChargingProfile>} Profile
     */
    async getChargingProfileById(id) {
        return await this.chargingProfile.findById(id);
    }

    /**
     * Get all charging profiles with optional filters
     * @param {object} filters - Filter options
     * @returns {Promise<Array>} Array of profiles
     */
    async getAllChargingProfiles(filters = {}) {
        const query = {};

        if (filters.companyId) query.companyId = filters.companyId;
        if (filters.chargePointId) query.chargePointId = filters.chargePointId;
        if (filters.connectorId !== undefined)
            query.connectorId = filters.connectorId;
        if (filters.chargingProfilePurpose)
            query.chargingProfilePurpose = filters.chargingProfilePurpose;
        if (filters.chargingProfileKind)
            query.chargingProfileKind = filters.chargingProfileKind;
        if (filters.isActive !== undefined) query.isActive = filters.isActive;
        if (filters.stackLevel !== undefined) query.stackLevel = filters.stackLevel;

        return await this.chargingProfile.find(query).sort({ stackLevel: -1, createdAt: -1 });
    }

    /**
     * Get charging profiles for a specific charge point
     * @param {string} chargePointId - Charge point identifier
     * @param {object} filters - Additional filters
     * @returns {Promise<Array>} Array of profiles
     */
    async getProfilesByChargePoint(chargePointId, filters = {}) {
        const query = { chargePointId };

        if (filters.connectorId !== undefined)
            query.connectorId = filters.connectorId;
        if (filters.chargingProfilePurpose)
            query.chargingProfilePurpose = filters.chargingProfilePurpose;
        if (filters.isActive !== undefined) query.isActive = filters.isActive;

        return await this.chargingProfile.find(query).sort({ stackLevel: -1, createdAt: -1 });
    }

    /**
     * Get active charging profiles for a connector (ordered by stack level)
     * @param {string} chargePointId - Charge point identifier
     * @param {number} connectorId - Connector ID
     * @returns {Promise<Array>} Active profiles sorted by stack level descending
     */
    async getActiveProfilesForConnector(chargePointId, connectorId) {
        return await this.chargingProfile
            .find({
                chargePointId,
                connectorId,
                isActive: true,
            })
            .sort({ stackLevel: -1 });
    }

    /**
     * Get profiles by company
     * @param {string} companyId - Company ID
     * @param {object} filters - Additional filters
     * @returns {Promise<Array>} Array of profiles
     */
    async getProfilesByCompany(companyId, filters = {}) {
        const query = { companyId };

        if (filters.chargePointId) query.chargePointId = filters.chargePointId;
        if (filters.isActive !== undefined) query.isActive = filters.isActive;

        return await this.chargingProfile.find(query).sort({ createdAt: -1 });
    }

    /**
     * Update a charging profile
     * @param {string} id - Profile MongoDB ID
     * @param {object} updateData - Data to update
     * @returns {Promise<ChargingProfile>} Updated profile
     */
    async updateChargingProfile(id, updateData) {
        const existing = await this.chargingProfile.findById(id);
        if (!existing) {
            throw new Error(`Charging profile with id ${id} not found`);
        }

        // Merge existing with update for validation
        const merged = { ...existing.toObject(), ...updateData };
        this._validateProfile(merged);

        // Check stack conflict only if relevant fields changed
        if (
            updateData.stackLevel !== undefined ||
            updateData.chargingProfilePurpose ||
            updateData.connectorId !== undefined
        ) {
            await this._assertNoStackConflict(merged, id);
        }

        const profile = await this.chargingProfile.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        return profile;
    }

    /**
     * Delete a charging profile
     * @param {string} id - Profile MongoDB ID
     * @returns {Promise<ChargingProfile>} Deleted profile
     */
    async deleteChargingProfile(id) {
        const profile = await this.chargingProfile.findByIdAndDelete(id);
        if (!profile) {
            throw new Error(`Charging profile with id ${id} not found`);
        }
        return profile;
    }

    /**
     * Deactivate a charging profile (soft delete)
     * @param {string} id - Profile MongoDB ID
     * @returns {Promise<ChargingProfile>} Updated profile
     */
    async deactivateChargingProfile(id) {
        return await this.updateChargingProfile(id, { isActive: false });
    }

    /**
     * Clear charging profiles for a charge point (OCPP ClearChargingProfile)
     * Matches profiles by optional criteria and removes them.
     * @param {string} chargePointId - Charge point identifier
     * @param {object} criteria - Optional: { chargingProfileId, connectorId, chargingProfilePurpose, stackLevel }
     * @returns {Promise<object>} { deletedCount }
     */
    async clearChargingProfiles(chargePointId, criteria = {}) {
        const query = { chargePointId };

        if (criteria.chargingProfileId !== undefined)
            query.chargingProfileId = criteria.chargingProfileId;
        if (criteria.connectorId !== undefined)
            query.connectorId = criteria.connectorId;
        if (criteria.chargingProfilePurpose)
            query.chargingProfilePurpose = criteria.chargingProfilePurpose;
        if (criteria.stackLevel !== undefined)
            query.stackLevel = criteria.stackLevel;

        const result = await this.chargingProfile.deleteMany(query);
        return { deletedCount: result.deletedCount };
    }
}

export default new ChargingProfileService();