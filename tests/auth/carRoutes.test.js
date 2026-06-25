import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock authMiddleware to do nothing or simulate authentication role injection
vi.mock("../../middleware/authMiddleware.js", () => {
  return {
    authenticate: (req, res, next) => next(),
    authorize: (...roles) => (req, res, next) => next(),
  };
});

// Mock carService
const mockListCars = vi.fn();
const mockGetCarStats = vi.fn();

vi.mock("../../service/management/carService.js", () => {
  return {
    default: {
      listCars: (...args) => mockListCars(...args),
      getCarStats: (...args) => mockGetCarStats(...args),
    },
  };
});

import carRouter from "../../routes/car.js";

describe("Car Route Handlers Role Restrictions", () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      query: {},
      userId: "mock-user-123",
      userRole: "customer",
      user: {
        companyId: "mock-company-uuid",
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  // Extract handlers from router stack
  const getCarsRoute = carRouter.stack.find(
    (layer) => layer.route && layer.route.path === "/" && layer.route.methods.get
  );
  const getCarsHandler = getCarsRoute.route.stack[getCarsRoute.route.stack.length - 1].handle;

  const getStatsRoute = carRouter.stack.find(
    (layer) => layer.route && layer.route.path === "/stats" && layer.route.methods.get
  );
  const getStatsHandler = getStatsRoute.route.stack[getStatsRoute.route.stack.length - 1].handle;

  describe("GET / (list cars)", () => {
    it("should restrict listing to user's own cars for customer role", async () => {
      req.userRole = "customer";
      req.query = { userId: "some-other-user", companyId: "some-company" };
      mockListCars.mockResolvedValue([]);

      await getCarsHandler(req, res);

      expect(mockListCars).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "mock-user-123", // Overridden from query
          companyId: undefined,    // Cleared from query
        })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("should restrict listing to operator's company for operator role", async () => {
      req.userRole = "operator";
      req.query = { userId: "user-1", companyId: "different-company" };
      mockListCars.mockResolvedValue([]);

      await getCarsHandler(req, res);

      expect(mockListCars).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1", // Preserved
          companyId: "mock-company-uuid", // Overridden from operator's profile
        })
      );
    });

    it("should not restrict listing for admin role", async () => {
      req.userRole = "admin";
      req.query = { userId: "user-2", companyId: "company-2" };
      mockListCars.mockResolvedValue([]);

      await getCarsHandler(req, res);

      expect(mockListCars).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-2", // Preserved
          companyId: "company-2", // Preserved
        })
      );
    });
  });

  describe("GET /stats", () => {
    it("should restrict statistics to user's own cars for customer role", async () => {
      req.userRole = "customer";
      req.query = { userId: "some-other-user", companyId: "some-company" };
      mockGetCarStats.mockResolvedValue({});

      await getStatsHandler(req, res);

      expect(mockGetCarStats).toHaveBeenCalledWith("mock-user-123", undefined);
    });

    it("should restrict statistics to operator's company for operator role", async () => {
      req.userRole = "operator";
      req.query = { userId: "user-1", companyId: "different-company" };
      mockGetCarStats.mockResolvedValue({});

      await getStatsHandler(req, res);

      expect(mockGetCarStats).toHaveBeenCalledWith("user-1", "mock-company-uuid");
    });

    it("should not restrict statistics for admin role", async () => {
      req.userRole = "admin";
      req.query = { userId: "user-2", companyId: "company-2" };
      mockGetCarStats.mockResolvedValue({});

      await getStatsHandler(req, res);

      expect(mockGetCarStats).toHaveBeenCalledWith("user-2", "company-2");
    });
  });
});
