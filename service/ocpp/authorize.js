import { Authorization } from "../../model/ocpp/index.js";
import IdTag from "../../model/ocpp/IdTag.js";
import User from "../../model/management/User.js";
import { canUserAuthenticate } from "../management/userService.js";
import { getActivePricingForUser } from "../management/pricingService.js";

// Authorization service for OCPP idTags
// In production, this should connect to a database or external authorization service

// Simple in-memory authorization list (for demo purposes)
// In production, this should be stored in a database
const authorizedTags = new Set([
  "TAG001",
  "TAG002",
  "TAG003",
  "OCPP1234TAG",
  "DEMO_TAG",
  "TEST_TAG",
]);

// Blocked tags
const blockedTags = new Set(["BLOCKED_TAG"]);

/**
 * Authorize an OCPP idTag request
 * @param {string} idTag - The idTag to authorize
 * @returns {Promise<Object>} idTagInfo object with status and optional fields
 */
async function authorizeOCPPRequest(idTag) {
  if (!idTag) {
    return {
      status: "Invalid",
    };
  }

  // Check if tag is blocked (in-memory list)
  if (blockedTags.has(idTag)) {
    return {
      status: "Blocked",
    };
  }

  // Check database for idTag
  const idTagDoc = await IdTag.findOne({ idTag: idTag }).populate("userId");

  if (idTagDoc) {
    // Check if idTag is active
    if (!idTagDoc.isActive) {
      return {
        status: "Blocked",
      };
    }

    // Check if idTag is expired
    if (idTagDoc.expiryDate && new Date() > idTagDoc.expiryDate) {
      return {
        status: "Expired",
      };
    }

    // Check idTag status
    if (idTagDoc.status === "Blocked") {
      return {
        status: "Blocked",
      };
    }

    // If idTag has a user, verify user can authenticate
    if (idTagDoc.userId) {
      const user = await User.findById(idTagDoc.userId);
      if (user) {
        const canAuth = await canUserAuthenticate(user._id);
        if (!canAuth) {
          return {
            status: "Invalid",
          };
        }
      }
    }

    // Valid idTag
    return {
      status: idTagDoc.status || "Accepted",
      expiryDate: idTagDoc.expiryDate
        ? idTagDoc.expiryDate.toISOString()
        : undefined,
      parentIdTag: idTagDoc.parentIdTag,
    };
  }

  // Check if idTag exists in in-memory authorized list (for backward compatibility)
  if (authorizedTags.has(idTag)) {
    // Set expiry date to 1 year from now (optional)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    return {
      status: "Accepted",
      expiryDate: expiryDate.toISOString(),
    };
  }

  // Check if idTag belongs to a customer without pricing (they can authenticate all chargepoints)
  // Try to find user by email pattern or other identifier
  // Note: This is a fallback - ideally idTag should be properly linked to user
  const user = await User.findOne({
    email: { $regex: new RegExp(idTag.split("_")[0], "i") },
  }).populate("IdTag");

  if (user && !user.companyId) {
    // Customer (no company) - check if they have pricing
    const userPricing = await getActivePricingForUser(user._id);

    // Customer without pricing can authenticate all chargepoints
    if (!userPricing) {
      return {
        status: "Accepted",
        expiryDate: undefined, // No expiry for customers without pricing
      };
    }
  }

  // Default: reject unknown tags
  return {
    status: "Invalid",
  };
}

/**
 * Add an authorized tag
 * @param {string} idTag - The idTag to authorize
 */
function addAuthorizedTag(idTag) {
  authorizedTags.add(idTag);
  blockedTags.delete(idTag); // Remove from blocked if it was there
}

/**
 * Remove an authorized tag
 * @param {string} idTag - The idTag to remove
 */
function removeAuthorizedTag(idTag) {
  authorizedTags.delete(idTag);
}

/**
 * Block a tag
 * @param {string} idTag - The idTag to block
 */
function blockTag(idTag) {
  blockedTags.add(idTag);
  authorizedTags.delete(idTag); // Remove from authorized if it was there
}

/**
 * Get all authorized tags
 * @returns {Array} Array of authorized tag strings
 */
function getAuthorizedTags() {
  return Array.from(authorizedTags);
}

/**
 * Get all blocked tags
 * @returns {Array} Array of blocked tag strings
 */
function getBlockedTags() {
  return Array.from(blockedTags);
}

async function saveAuthorization(chargePointId, idTag, idTagInfo, status) {
  if (!chargePointId || !idTag || !status) {
    return null;
  }

  const idTagModel = await IdTag.findOne({ idTag: idTag });

  const authorization = new Authorization({
    chargePointId: chargePointId,
    idTag: idTag,
    idTagInfo:
      idTagInfo ||
      (idTagModel
        ? {
            status: idTagModel.status,
            expiryDate: idTagModel.expiryDate,
            parentIdTag: idTagModel.parentIdTag,
          }
        : {
            status: status,
          }),
    timestamp: new Date(),
    createdAt: new Date(),
  });
  try {
    await authorization.save(authorization);
    return authorization;
  } catch (error) {
    console.error("Error saving authorization:", error);
    return null;
  }
}

export default {
  authorizeOCPPRequest: authorizeOCPPRequest,
  addAuthorizedTag: addAuthorizedTag,
  removeAuthorizedTag: removeAuthorizedTag,
  blockTag: blockTag,
  getAuthorizedTags: getAuthorizedTags,
  getBlockedTags: getBlockedTags,
  saveAuthorization: saveAuthorization,
};
