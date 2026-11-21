import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { jest } from "@jest/globals";

process.env.DISABLE_RATE_LIMIT_FOR_TESTS = "true";

const authServiceMock = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  refreshAccessToken: jest.fn(),
  signOutAll: jest.fn(),
  sendOTP: jest.fn(),
  verifyOTP: jest.fn(),
  resetPassword: jest.fn(),
  register: jest.fn(),
  forgotPassword: jest.fn(),
  resetPasswordWithToken: jest.fn(),
  signInWithGoogle: jest.fn(),
};

jest.unstable_mockModule("../auth.service.js", () => ({
  default: authServiceMock,
}));

jest.unstable_mockModule("../../../middlewares/auth.middleware.js", () => ({
  protectedRoute: (req, _res, next) => {
    req.user = { userId: "user-1", jti: "jti-1" };
    next();
  },
  optionalProtectedRoute: (req, _res, next) => {
    req.user = null;
    next();
  },
}));

const { default: authRouter } = await import("../auth.route.js");
const { default: errorHandler } = await import("../../../middlewares/error.middleware.js");

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use(errorHandler);
  return app;
};

describe("Auth routes", () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  test("POST /api/auth/signUp validates request body", async () => {
    const response = await request(app)
      .post("/api/auth/signUp")
      .send({ email: "not-an-email", passWord: "123" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(authServiceMock.signUp).not.toHaveBeenCalled();
  });

  test("POST /api/auth/signUp returns created user", async () => {
    const user = { id: "user-1", email: "linh@example.com" };
    authServiceMock.signUp.mockResolvedValue(user);

    const response = await request(app)
      .post("/api/auth/signUp")
      .send({
        email: "linh@example.com",
        passWord: "Password123",
        firstName: "Linh",
        lastName: "Nguyen",
        sex: "female",
        termsAccepted: true,
        privacyAccepted: true,
        marketingAccepted: false,
        policyVersion: "1.0",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(user);
    expect(authServiceMock.signUp).toHaveBeenCalledWith({
      email: "linh@example.com",
      passWord: "Password123",
      firstName: "Linh",
      lastName: "Nguyen",
      sex: "female",
      termsAccepted: true,
      privacyAccepted: true,
      marketingAccepted: false,
      policyVersion: "1.0",
    });
  });

  test("POST /api/auth/signIn sets refresh token cookie", async () => {
    authServiceMock.signIn.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { _id: "user-1", fullName: "Linh Nguyen" },
    });

    const response = await request(app)
      .post("/api/auth/signIn")
      .send({ email: "linh@example.com", passWord: "Password123" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ accessToken: "access-token", userId: "user-1" });
    expect(response.headers["set-cookie"].join(";")).toContain("refreshToken=refresh-token");
    expect(authServiceMock.signIn).toHaveBeenCalledWith(
      "linh@example.com",
      "Password123",
      expect.any(String),
      undefined,
    );
  });

  test("POST /api/auth/signOut calls service and clears cookie", async () => {
    authServiceMock.signOut.mockResolvedValue();

    const response = await request(app)
      .post("/api/auth/signOut")
      .set("Cookie", ["refreshToken=refresh-token"]);

    expect(response.status).toBe(204);
    expect(authServiceMock.signOut).toHaveBeenCalledWith("refresh-token", undefined);
    expect(response.headers["set-cookie"].join(";")).toContain("refreshToken=");
  });

  test("POST /api/auth/logout alias revokes refresh token and clears cookie", async () => {
    authServiceMock.signOut.mockResolvedValue();

    const response = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: "body-rt" });

    expect(response.status).toBe(204);
    expect(authServiceMock.signOut).toHaveBeenCalledWith("body-rt", undefined);
    expect(response.headers["set-cookie"].join(";")).toContain("refreshToken=");
  });

  test("POST /api/auth/refresh with valid token returns rotated tokens", async () => {
    authServiceMock.refreshAccessToken.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-rotated-refresh-token",
      user: { _id: "user-1", fullName: "Linh Nguyen" },
    });

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "valid-rt" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe("new-access-token");
    expect(response.body.data.refreshToken).toBe("new-rotated-refresh-token");
    expect(response.headers["set-cookie"].join(";")).toContain("refreshToken=new-rotated-refresh-token");
  });

  test("POST /api/auth/refresh without token returns 401 REFRESH_MISSING", async () => {
    const { AppError } = await import("../../../common/exceptions/AppError.js");
    const err = new AppError("Thiếu refresh token", 401);
    err.code = "REFRESH_MISSING";
    authServiceMock.refreshAccessToken.mockRejectedValue(err);

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("REFRESH_MISSING");
  });

  test("POST /api/auth/refresh with invalid token returns 401 REFRESH_INVALID", async () => {
    const { AppError } = await import("../../../common/exceptions/AppError.js");
    const err = new AppError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn", 401);
    err.code = "REFRESH_INVALID";
    authServiceMock.refreshAccessToken.mockRejectedValue(err);

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "bad-token" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("REFRESH_INVALID");
  });

  test("POST /api/auth/refresh with expired token returns 401 REFRESH_EXPIRED", async () => {
    const { AppError } = await import("../../../common/exceptions/AppError.js");
    const err = new AppError("Refresh token đã hết hạn", 401);
    err.code = "REFRESH_EXPIRED";
    authServiceMock.refreshAccessToken.mockRejectedValue(err);

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "expired-token" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("REFRESH_EXPIRED");
  });

  test("POST /api/auth/register creates user and returns tokens", async () => {
    authServiceMock.register.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      user: { id: "user-2", fullName: "Test User", email: "test@example.com" },
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Test User",
        email: "test@example.com",
        password: "Password123",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe("new-access-token");
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  test("POST /api/auth/login logs in and returns tokens", async () => {
    authServiceMock.signIn.mockResolvedValue({
      accessToken: "login-access-token",
      refreshToken: "login-refresh-token",
      user: { id: "user-3", fullName: "Login User", email: "login@example.com" },
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        passWord: "Password123",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe("login-access-token");
  });

  test("POST /api/auth/forgot-password sends reset email", async () => {
    authServiceMock.forgotPassword.mockResolvedValue({
      message: "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.",
    });

    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "forgot@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("POST /api/auth/reset-password/:token resets password with token", async () => {
    authServiceMock.resetPasswordWithToken.mockResolvedValue({
      message: "Đặt lại mật khẩu thành công!",
    });

    const response = await request(app)
      .post("/api/auth/reset-password/sample-token-123")
      .send({ password: "NewPassword123" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("POST /api/auth/google logs in with Google credential", async () => {
    authServiceMock.signInWithGoogle.mockResolvedValue({
      accessToken: "google-access-token",
      refreshToken: "google-refresh-token",
      user: { id: "user-google", fullName: "Google User", email: "google@example.com" },
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: "google-dummy-credential-jwt" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe("google-access-token");
  });
});
