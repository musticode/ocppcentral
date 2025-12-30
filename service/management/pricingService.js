import Pricing from "../../model/management/Pricing.js";

/**
 * Create a new pricing plan
 */
export const createPricing = async (pricingData) => {
  const pricing = new Pricing(pricingData);
  await pricing.save();
  return pricing;
};

/**
 * Get pricing by ID
 */
export const getPricingById = async (id) => {
  return await Pricing.findById(id);
};

/**
 * Get all pricing plans
 */
export const getAllPricing = async (filters = {}) => {
  const query = {};

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  if (filters.chargePointId) {
    query.$or = [
      { chargePointIds: { $size: 0 } }, // Applies to all
      { chargePointIds: filters.chargePointId }, // Applies to specific charge point
    ];
  }

  return await Pricing.find(query).sort({ createdAt: -1 });
};

/**
 * Get active pricing for a specific charge point and date/time
 */
export const getActivePricingForChargePoint = async (
  chargePointId,
  dateTime = new Date()
) => {
  const query = {
    isActive: true,
    validFrom: { $lte: dateTime },
    $and: [
      {
        $or: [{ validUntil: null }, { validUntil: { $gte: dateTime } }],
      },
      {
        $or: [
          { chargePointIds: { $size: 0 } }, // Applies to all
          { chargePointIds: chargePointId }, // Applies to specific charge point
        ],
      },
    ],
  };

  const pricing = await Pricing.findOne(query).sort({ createdAt: -1 });
  return pricing;
};

/**
 * Get price per kWh for a specific charge point and date/time
 */
export const getPricePerKwh = async (chargePointId, dateTime = new Date()) => {
  const pricing = await getActivePricingForChargePoint(chargePointId, dateTime);

  if (!pricing) {
    throw new Error("No active pricing found for charge point");
  }

  return pricing.getPriceForDateTime(dateTime);
};

/**
 * Update pricing plan
 */
export const updatePricing = async (id, pricingData) => {
  return await Pricing.findByIdAndUpdate(id, pricingData, { new: true });
};

/**
 * Delete pricing plan
 */
export const deletePricing = async (id) => {
  return await Pricing.findByIdAndDelete(id);
};

/**
 * Deactivate pricing plan
 */
export const deactivatePricing = async (id) => {
  return await Pricing.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
};

/**
 * Activate pricing plan
 */
export const activatePricing = async (id) => {
  return await Pricing.findByIdAndUpdate(id, { isActive: true }, { new: true });
};

/**
 * Get active pricing for a specific user (customer)
 */
export const getActivePricingForUser = async (userId) => {
  return await Pricing.findOne({
    userId: userId,
    isActive: true,
    validFrom: { $lte: new Date() },
    $or: [{ validUntil: null }, { validUntil: { $gte: new Date() } }],
  }).sort({ createdAt: -1 });
};

/**
 * Check if user has active pricing
 */
export const userHasActivePricing = async (userId) => {
  const pricing = await getActivePricingForUser(userId);
  return pricing !== null;
};
