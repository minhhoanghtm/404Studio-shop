import { beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockGetSystemSettings = jest.fn();
const mockVerify = jest.fn();
const mockUserFindById = jest.fn();

jest.unstable_mockModule("../../common/utils/featureFlags.js", () => ({
  getSystemSettings: mockGetSystemSettings,
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { verify: mockVerify },
}));

jest.unstable_mockModule("../../modules/users/user.model.js", () => ({
  default: { findById: mockUserFindById },
}));

let maintenanceMiddleware;

beforeAll(async () => {
  ({ maintenanceMiddleware } = await import("../maintenance.middleware.js"));
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ACCESS_TOKEN_SECRET = "test-secret";
});

describe("maintenanceMiddleware", () => {
  const createMockReqRes = (path = "/products", headers = {}) => {
    const req = {
      path,
      headers,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    return { req, res, next };
  };

  test("allows requests through when maintenanceMode is false", async () => {
    mockGetSystemSettings.mockResolvedValue({ maintenanceMode: false });
    const { req, res, next } = createMockReqRes("/products");

    await maintenanceMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("allows exempt paths like /settings even when maintenanceMode is true", async () => {
    mockGetSystemSettings.mockResolvedValue({ maintenanceMode: true });
    const { req, res, next } = createMockReqRes("/settings");

    await maintenanceMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("blocks guest visitors with 503 when maintenanceMode is true", async () => {
    mockGetSystemSettings.mockResolvedValue({
      maintenanceMode: true,
      maintenanceMessage: "Website đang bảo trì nâng cấp.",
      maintenanceUntil: "2026-11-22T16:00:00.000Z",
    });
    const { req, res, next } = createMockReqRes("/products");

    await maintenanceMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: "MAINTENANCE",
        message: "Website đang bảo trì nâng cấp.",
        maintenanceUntil: "2026-11-22T16:00:00.000Z",
      })
    );
  });

  test("blocks regular customers (non-admin token) with 503 when maintenanceMode is true", async () => {
    mockGetSystemSettings.mockResolvedValue({ maintenanceMode: true });
    mockVerify.mockReturnValue({ userId: "customer-1", role: "customer" });
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: "customer-1", role: "customer", status: "active" }),
      }),
    });

    const { req, res, next } = createMockReqRes("/products", {
      authorization: "Bearer customer-token",
    });

    await maintenanceMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });

  test("allows admin accounts (role: 'admin') through when maintenanceMode is true", async () => {
    mockGetSystemSettings.mockResolvedValue({ maintenanceMode: true });
    mockVerify.mockReturnValue({ userId: "admin-1", role: "admin" });
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: "admin-1", role: "admin", status: "active" }),
      }),
    });

    const { req, res, next } = createMockReqRes("/products", {
      authorization: "Bearer admin-token",
    });

    await maintenanceMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
