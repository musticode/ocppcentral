import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock models
const mockChargePointFind = vi.fn();
const mockCompanyFindOne = vi.fn();

vi.mock("../../model/ocpp/ChargePoint.js", () => {
  return {
    default: {
      find: vi.fn(() => ({
        populate: vi.fn().mockImplementation(() => mockChargePointFind()),
      })),
    },
  };
});

vi.mock("../../model/management/Company.js", () => {
  return {
    default: {
      findOne: vi.fn(() => ({
        select: vi.fn().mockImplementation((...args) => mockCompanyFindOne(...args)),
      })),
    },
  };
});

// Import service
import { ChargePointService } from "../../service/management/chargePointService.js";

describe("ChargePointService.getAllChargePoints", () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChargePointService();
  });

  it("should return all charge points if companyId is not provided", async () => {
    mockChargePointFind.mockResolvedValue([{ id: "cp-1" }, { id: "cp-2" }]);

    const result = await service.getAllChargePoints(null);

    expect(result).toHaveLength(2);
    expect(mockCompanyFindOne).not.toHaveBeenCalled();
  });

  it("should return all charge points if companyId is empty string", async () => {
    mockChargePointFind.mockResolvedValue([{ id: "cp-1" }]);

    const result = await service.getAllChargePoints("");

    expect(result).toHaveLength(1);
    expect(mockCompanyFindOne).not.toHaveBeenCalled();
  });

  it("should query by company object ID if valid companyId is provided", async () => {
    mockCompanyFindOne.mockResolvedValue({ _id: "mongo-company-id-123" });
    mockChargePointFind.mockResolvedValue([{ id: "cp-company" }]);

    const result = await service.getAllChargePoints("company-uuid-123");

    expect(result).toHaveLength(1);
    expect(mockCompanyFindOne).toHaveBeenCalled();
  });

  it("should throw error if companyId is provided but company is not found", async () => {
    mockCompanyFindOne.mockResolvedValue(null);

    await expect(service.getAllChargePoints("non-existent-uuid")).rejects.toThrow(
      "Company non-existent-uuid not found"
    );
  });
});
