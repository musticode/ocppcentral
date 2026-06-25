import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock User Model
const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();

vi.mock("../../model/management/User.js", () => {
  return {
    default: {
      findOne: (...args) => mockUserFindOne(...args),
      create: (...args) => mockUserCreate(...args),
    },
  };
});

// Mock google-auth-library
const mockVerifyIdToken = vi.fn();
vi.mock("google-auth-library", () => {
  class MockOAuth2Client {
    constructor(clientId) {
      this.clientId = clientId;
    }
    verifyIdToken(...args) {
      return mockVerifyIdToken(...args);
    }
  }
  return {
    OAuth2Client: MockOAuth2Client,
  };
});

// Import the service under test
import { loginOrCreateGoogleUser } from "../../service/management/authService.js";

describe("Google OAuth Service Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should authenticate using a mock Google token in non-production environment", async () => {
    process.env.NODE_ENV = "development";
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      _id: "mock-id-123",
      name: "Mock User 999",
      email: "mockuser_999@example.com",
      role: "customer",
      googleId: "mock-google-id-999",
      save: vi.fn().mockResolvedValue(true),
    });

    const result = await loginOrCreateGoogleUser("mock-google-token-999");

    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Mock User 999");
    expect(result.user.email).toBe("mockuser_999@example.com");
    expect(result.user.role).toBe("customer");
    expect(result.token).toBeDefined();
  });

  it("should authenticate using real Google ID token verification", async () => {
    process.env.NODE_ENV = "production";
    process.env.GOOGLE_CLIENT_ID = "real-google-client-id-abc";

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-sub-123",
        email: "realuser@example.com",
        name: "Real User",
      }),
    });

    mockUserFindOne.mockResolvedValue({
      _id: "user-id-456",
      name: "Real User",
      email: "realuser@example.com",
      role: "customer",
      googleId: "google-sub-123",
      save: vi.fn().mockResolvedValue(true),
    });

    const result = await loginOrCreateGoogleUser("valid-google-id-token");

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("realuser@example.com");
    expect(result.user.name).toBe("Real User");
    expect(result.token).toBeDefined();
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "valid-google-id-token",
      audience: "real-google-client-id-abc",
    });
  });

  it("should link existing user by email when googleId is not present", async () => {
    process.env.NODE_ENV = "development";
    
    // Find by googleId returns null (new Google ID), but find by email returns the existing user
    const mockSave = vi.fn().mockResolvedValue(true);
    mockUserFindOne
      .mockResolvedValueOnce(null) // first find by googleId
      .mockResolvedValueOnce({
        _id: "existing-user-id",
        name: "Existing User",
        email: "existing@example.com",
        role: "operator",
        save: mockSave,
      }); // second find by email

    const result = await loginOrCreateGoogleUser("mock-google-token-existing");

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("existing@example.com");
    expect(result.user.role).toBe("operator"); // preserves role
    expect(result.token).toBeDefined();
    expect(mockSave).toHaveBeenCalled();
  });
});
