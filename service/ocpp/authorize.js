import { Authorization } from "../../model/ocpp/index.js";
import IdTag from "../../model/ocpp/IdTag.js";

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
 * @returns {Object} idTagInfo object with status and optional fields
 */
function authorizeOCPPRequest(idTag) {
  if (!idTag) {
    return {
      status: "Invalid",
    };
  }

  // Check if tag is blocked
  if (blockedTags.has(idTag)) {
    return {
      status: "Blocked",
    };
  }

  // Check if tag is authorized
  if (authorizedTags.has(idTag)) {
    // Set expiry date to 1 year from now (optional)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    return {
      status: "Accepted",
      expiryDate: expiryDate.toISOString(),
    };
  }

  // Default: reject unknown tags
  // In production, you might want to check with an external authorization service
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
  if (!chargePointId || !idTag || !idTagInfo || !status) {
    return null;
  }

  const idTagModel = await IdTag.findOne({ idTag: idTag });

  const authorization = new Authorization({
    chargePointId: chargePointId,
    idTag: idTag,
    idTagInfo: {
      status: idTagModel.status,
      expiryDate: idTagModel.expiryDate,
      parentIdTag: idTagModel.parentIdTag,
    },
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
