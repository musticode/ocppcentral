import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock all database models and services
// ---------------------------------------------------------------------------
const mockIdTagFindOne = vi.fn();
const mockUserFindById = vi.fn();
const mockUserFindOne = vi.fn();
const mockAuthorizationSave = vi.fn();
const mockIdTagModelFindOne = vi.fn();

vi.mock("../../model/ocpp/IdTag.js", () => {
  return {
    default: {
      findOne: (...args) => {
        // For authorizeOCPPRequest - needs .populate()
        if (typeof args[0] === "object" && args[0].idTag) {
          return {
            populate: vi.fn().mockImplementation(() => mockIdTagFindOne()),
          };
        }
        return mockIdTagModelFindOne(...args);
      },
    },
  };
});

vi.mock("../../model/management/User.js", () => {
  return {
    default: {
      findById: (...args) => mockUserFindById(...args),
      findOne: (...args) => ({
        populate: vi.fn().mockImplementation(() => mockUserFindOne(...args)),
      }),
    },
  };
});

vi.mock("../../model/ocpp/Authorization.js", () => {
  // Must use a regular function so it can be called with `new`
  function Authorization(data) {
    Object.assign(this, data);
    this.save = mockAuthorizationSave.mockResolvedValue(this);
  }
  return { default: Authorization };
});

const mockCanUserAuthenticate = vi.fn();
vi.mock("../../service/management/userService.js", () => ({
  canUserAuthenticate: (...args) => mockCanUserAuthenticate(...args),
}));

const mockGetActivePricingForUser = vi.fn();
vi.mock("../../service/management/pricingService.js", () => ({
  getActivePricingForUser: (...args) => mockGetActivePricingForUser(...args),
}));

const mockCheckPaymentStatus = vi.fn();
vi.mock("../../service/management/paymentService.js", () => ({
  default: {
    checkPaymentStatusForAuthorization: (...args) =>
      mockCheckPaymentStatus(...args),
  },
}));

// ---------------------------------------------------------------------------
// Import the module under test
// ---------------------------------------------------------------------------
import authorize from "../../service/ocpp/authorize.js";

// ===========================================================================
// Tests
// ===========================================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckPaymentStatus.mockResolvedValue({ allowed: true });
});

// ---------------------------------------------------------------------------
// authorizeOCPPRequest
// ---------------------------------------------------------------------------
describe("authorizeOCPPRequest", () => {
  it("should return Invalid for null/empty idTag", async () => {
    const result = await authorize.authorizeOCPPRequest(null);
    expect(result.status).toBe("Invalid");

    const result2 = await authorize.authorizeOCPPRequest("");
    expect(result2.status).toBe("Invalid");
  });

  it("should return Blocked for blocked tags (in-memory)", async () => {
    // BLOCKED_TAG is in the blockedTags set in authorize.js
    mockIdTagFindOne.mockResolvedValue(null);
    const result = await authorize.authorizeOCPPRequest("BLOCKED_TAG");
    expect(result.status).toBe("Blocked");
  });

  it("should return Accepted for active DB idTag", async () => {
    mockIdTagFindOne.mockResolvedValue({
      idTag: "DB_TAG",
      isActive: true,
      status: "Accepted",
      expiryDate: null,
      parentIdTag: null,
      userId: null,
    });

    const result = await authorize.authorizeOCPPRequest("DB_TAG");
    expect(result.status).toBe("Accepted");
  });

  it("should return Blocked for inactive DB idTag", async () => {
    mockIdTagFindOne.mockResolvedValue({
      idTag: "INACTIVE_TAG",
      isActive: false,
      status: "Accepted",
    });

    const result = await authorize.authorizeOCPPRequest("INACTIVE_TAG");
    expect(result.status).toBe("Blocked");
  });

  it("should return Expired for expired DB idTag", async () => {
    mockIdTagFindOne.mockResolvedValue({
      idTag: "EXPIRED_TAG",
      isActive: true,
      status: "Accepted",
      expiryDate: new Date("2020-01-01"),
    });

    const result = await authorize.authorizeOCPPRequest("EXPIRED_TAG");
    expect(result.status).toBe("Expired");
  });

  it("should return Blocked for DB idTag with Blocked status", async () => {
    mockIdTagFindOne.mockResolvedValue({
      idTag: "STATUS_BLOCKED",
      isActive: true,
      status: "Blocked",
      expiryDate: null,
    });

    const result = await authorize.authorizeOCPPRequest("STATUS_BLOCKED");
    expect(result.status).toBe("Blocked");
  });

  it("should check user authentication when idTag has userId", async () => {
    mockIdTagFindOne.mockResolvedValue({
      idTag: "USER_TAG",
      isActive: true,
      status: "Accepted",
      expiryDate: null,
      userId: "user123",
    });
    mockUserFindById.mockResolvedValue({ _id: "user123" });
    mockCanUserAuthenticate.mockResolvedValue(true);

    const result = await authorize.authorizeOCPPRequest("USER_TAG");
    expect(result.status).toBe("Accepted");
    expect(mockCanUserAuthenticate).toHaveBeenCalledWith("user123");
  });

  it("should return Invalid when user cannot authenticate", async () => {
    mockIdTagFindOne.mockResolvedValue({
      idTag: "USER_TAG",
      isActive: true,
      status: "Accepted",
      expiryDate: null,
      userId: "user123",
    });
    mockUserFindById.mockResolvedValue({ _id: "user123" });
    mockCanUserAuthenticate.mockResolvedValue(false);

    const result = await authorize.authorizeOCPPRequest("USER_TAG");
    expect(result.status).toBe("Invalid");
  });

  it("should block when payment check fails for DB idTag", async () => {
    mockIdTagFindOne.mockResolvedValue({
      idTag: "PAY_FAIL_TAG",
      isActive: true,
      status: "Accepted",
      expiryDate: null,
      userId: null,
    });
    mockCheckPaymentStatus.mockResolvedValue({
      allowed: false,
      status: "Blocked",
    });

    const result = await authorize.authorizeOCPPRequest("PAY_FAIL_TAG");
    expect(result.status).toBe("Blocked");
  });

  it("should include expiryDate and parentIdTag in response for valid DB tag", async () => {
    const expiry = new Date("2030-12-31");
    mockIdTagFindOne.mockResolvedValue({
      idTag: "FULL_TAG",
      isActive: true,
      status: "Accepted",
      expiryDate: expiry,
      parentIdTag: "PARENT001",
      userId: null,
    });

    const result = await authorize.authorizeOCPPRequest("FULL_TAG");
    expect(result.status).toBe("Accepted");
    expect(result.expiryDate).toBe(expiry.toISOString());
    expect(result.parentIdTag).toBe("PARENT001");
  });

  it("should accept in-memory authorized tags when not in DB", async () => {
    mockIdTagFindOne.mockResolvedValue(null);
    mockUserFindOne.mockResolvedValue(null);

    // TAG001 is in the authorizedTags set in authorize.js
    const result = await authorize.authorizeOCPPRequest("TAG001");
    expect(result.status).toBe("Accepted");
    expect(result).toHaveProperty("expiryDate");
  });

  it("should block in-memory tag when payment check fails", async () => {
    mockIdTagFindOne.mockResolvedValue(null);
    mockUserFindOne.mockResolvedValue(null);
    mockCheckPaymentStatus.mockResolvedValue({
      allowed: false,
      status: "Blocked",
    });

    const result = await authorize.authorizeOCPPRequest("TAG001");
    expect(result.status).toBe("Blocked");
  });

  it("should return Invalid for completely unknown tag", async () => {
    mockIdTagFindOne.mockResolvedValue(null);
    mockUserFindOne.mockResolvedValue(null);

    const result = await authorize.authorizeOCPPRequest("TOTALLY_UNKNOWN_XYZ");
    expect(result.status).toBe("Invalid");
  });
});

// ---------------------------------------------------------------------------
// In-memory tag management helpers
// ---------------------------------------------------------------------------
describe("Tag management helpers", () => {
  it("addAuthorizedTag should add a tag", () => {
    authorize.addAuthorizedTag("NEW_TAG");
    const tags = authorize.getAuthorizedTags();
    expect(tags).toContain("NEW_TAG");
  });

  it("addAuthorizedTag should remove tag from blocked list", () => {
    authorize.blockTag("FLIP_TAG");
    expect(authorize.getBlockedTags()).toContain("FLIP_TAG");

    authorize.addAuthorizedTag("FLIP_TAG");
    expect(authorize.getBlockedTags()).not.toContain("FLIP_TAG");
    expect(authorize.getAuthorizedTags()).toContain("FLIP_TAG");
  });

  it("removeAuthorizedTag should remove a tag", () => {
    authorize.addAuthorizedTag("REMOVE_ME");
    authorize.removeAuthorizedTag("REMOVE_ME");
    expect(authorize.getAuthorizedTags()).not.toContain("REMOVE_ME");
  });

  it("blockTag should add to blocked and remove from authorized", () => {
    authorize.addAuthorizedTag("BLOCK_ME");
    authorize.blockTag("BLOCK_ME");

    expect(authorize.getBlockedTags()).toContain("BLOCK_ME");
    expect(authorize.getAuthorizedTags()).not.toContain("BLOCK_ME");
  });

  it("getAuthorizedTags should return array", () => {
    const tags = authorize.getAuthorizedTags();
    expect(Array.isArray(tags)).toBe(true);
  });

  it("getBlockedTags should return array", () => {
    const tags = authorize.getBlockedTags();
    expect(Array.isArray(tags)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// saveAuthorization
// ---------------------------------------------------------------------------
describe("saveAuthorization", () => {
  it("should return null when chargePointId is missing", async () => {
    const result = await authorize.saveAuthorization(
      null,
      "TAG001",
      { status: "Accepted" },
      "Accepted"
    );
    expect(result).toBeNull();
  });

  it("should return null when idTag is missing", async () => {
    const result = await authorize.saveAuthorization(
      "CP001",
      null,
      { status: "Accepted" },
      "Accepted"
    );
    expect(result).toBeNull();
  });

  it("should return null when status is missing", async () => {
    const result = await authorize.saveAuthorization(
      "CP001",
      "TAG001",
      { status: "Accepted" },
      null
    );
    expect(result).toBeNull();
  });

  it("should save authorization with provided idTagInfo", async () => {
    mockIdTagModelFindOne.mockResolvedValue(null);

    const idTagInfo = { status: "Accepted", expiryDate: "2030-01-01" };
    const result = await authorize.saveAuthorization(
      "CP001",
      "TAG001",
      idTagInfo,
      "Accepted"
    );

    expect(result).not.toBeNull();
    expect(result.chargePointId).toBe("CP001");
    expect(result.idTag).toBe("TAG001");
  });

  it("should handle save errors gracefully", async () => {
    mockIdTagModelFindOne.mockResolvedValue(null);
    mockAuthorizationSave.mockRejectedValueOnce(new Error("DB error"));

    const result = await authorize.saveAuthorization(
      "CP001",
      "TAG001",
      { status: "Accepted" },
      "Accepted"
    );

    expect(result).toBeNull();
  });
});
