import User from "../../model/management/User.js";
import Company from "../../model/management/Company.js";
import IdTag from "../../model/ocpp/IdTag.js";
import Pricing from "../../model/management/Pricing.js";
import { getActivePricingForUser } from "./pricingService.js";

export const createUser = async (userData) => {
  const user = new User(userData);
  await user.save();
  return user;
};

export const getUserById = async (id) => {
  return await User.findById(id).populate("IdTag");
};

export const getAllUsers = async () => {
  console.log("getAllUsers");
  return await User.find().populate("IdTag").sort({ createdAt: -1 });
};

export const getUserByEmail = async (email) => {
  return await User.findOne({ email }).populate("IdTag");
};

export const updateUser = async (id, userData) => {
  const user = await User.findByIdAndUpdate(id, userData, { new: true });
  // Check if user should have idTag after update
  await ensureUserHasIdTagIfNeeded(user._id);
  return user;
};

export const addIdTagToUser = async (userId, idTagId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.IdTag.includes(idTagId)) {
    user.IdTag.push(idTagId);
    await user.save();
  }
  return user;
};

/**
 * Check if user should have an idTag and create/assign one if needed
 * Rules:
 * 1. User has idTag if: company has no payment needed OR role is company_operator
 * 2. If user has no company (customer), check if they have pricing - if no pricing, they can authenticate all chargepoints
 */
export const ensureUserHasIdTagIfNeeded = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  let shouldHaveIdTag = false;
  let reason = "";

  // Check if user has a company
  if (user.companyId) {
    // User belongs to a company
    const company = await Company.findOne({ id: user.companyId });
    if (!company) {
      throw new Error(`Company with id ${user.companyId} not found`);
    }

    // User gets idTag if: company has no payment needed OR role is company_operator
    if (!company.paymentNeeded || user.role === "company_operator") {
      shouldHaveIdTag = true;
      reason = company.paymentNeeded
        ? "company_operator role"
        : "company has no payment needed";
    }
  } else {
    // Customer (no company) - check if they have pricing
    const userPricing = await getActivePricingForUser(user._id);

    // If customer has no pricing, they can authenticate all chargepoints (no idTag needed)
    // If customer has pricing, they need idTag
    if (userPricing) {
      shouldHaveIdTag = true;
      reason = "customer has pricing method";
    } else {
      // Customer without pricing can authenticate all chargepoints - no idTag needed
      shouldHaveIdTag = false;
      reason = "customer without pricing - can authenticate all chargepoints";
    }
  }

  // If user should have idTag and doesn't have one, create it
  if (shouldHaveIdTag && (!user.IdTag || user.IdTag.length === 0)) {
    // Generate idTag based on user email or create unique one
    const idTagString =
      user.email.split("@")[0].toUpperCase() +
      "_" +
      user._id.toString().slice(-6);

    // Check if idTag already exists
    let idTag = await IdTag.findOne({ idTag: idTagString });

    if (!idTag) {
      // Create new idTag
      idTag = new IdTag({
        idTag: idTagString,
        status: "Accepted",
        userId: user._id,
        isActive: true,
        notes: `Auto-generated for user: ${reason}`,
      });
      await idTag.save();
    }

    // Add idTag to user
    user.IdTag = [idTag._id];
    await user.save();

    return { idTag, created: true, reason };
  }

  // Remove idTag if user shouldn't have one (edge case handling)
  if (!shouldHaveIdTag && user.IdTag && user.IdTag.length > 0) {
    // Only remove if user is a customer without pricing
    if (!user.companyId) {
      // Don't actually remove - just note that they can authenticate without it
      // We'll handle this in authorization logic
    }
  }

  return { idTag: user.IdTag?.[0] || null, created: false, reason };
};

/**
 * Check if user can authenticate (has idTag or is customer without pricing)
 */
export const canUserAuthenticate = async (userId) => {
  const user = await User.findById(userId).populate("IdTag");
  if (!user) {
    return false;
  }

  // User has company
  if (user.companyId) {
    // Must have idTag to authenticate
    return user.IdTag && user.IdTag.length > 0;
  }

  // Customer (no company) - check if they have pricing
  const userPricing = await getActivePricingForUser(user._id);

  // Customer without pricing can authenticate all chargepoints
  // Customer with pricing needs idTag
  if (!userPricing) {
    return true; // Can authenticate all chargepoints
  }

  // Customer with pricing needs idTag
  return user.IdTag && user.IdTag.length > 0;
};

export const createNewUser = async (userData) => {
  const user = new User({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role || "user",
    companyId: userData.companyId || null,
    companyName: userData.companyName || null,
    IdTag: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await user.save();

  // Check if user should have idTag and create it if needed
  await ensureUserHasIdTagIfNeeded(user._id);

  // Refresh user with populated idTag
  return await User.findById(user._id).populate("IdTag");
};

/**
 * Handle pricing assignment to a customer
 * When a customer gets pricing, they need an idTag
 */
export const handlePricingAssignment = async (userId, pricingId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Only process if user is a customer (no company)
  if (!user.companyId) {
    // Ensure user has idTag now that they have pricing
    return await ensureUserHasIdTagIfNeeded(userId);
  }

  return { idTag: user.IdTag?.[0] || null, created: false };
};
