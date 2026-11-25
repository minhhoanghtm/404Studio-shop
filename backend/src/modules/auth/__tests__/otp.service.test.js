import { jest } from "@jest/globals";

const store = new Map();
const fakeRedis = {
  async get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },
  async set(key, value, mode, ttlSec) {
    const expiresAt = mode === "EX" && Number(ttlSec) > 0 ? Date.now() + Number(ttlSec) * 1000 : null;
    store.set(key, { value: String(value), expiresAt });
    return "OK";
  },
  async ttl(key) {
    const entry = store.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const rem = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    if (rem <= 0) {
      store.delete(key);
      return -2;
    }
    return rem;
  },
  async del(...keys) {
    let deleted = 0;
    for (const k of keys) {
      if (store.delete(k)) deleted += 1;
    }
    return deleted;
  },
  pipeline() {
    const ops = [];
    const pipe = {
      set: (k, v, m, t) => { ops.push(() => fakeRedis.set(k, v, m, t)); return pipe; },
      incr: (k) => {
        ops.push(async () => {
          const cur = Number((await fakeRedis.get(k)) || "0") + 1;
          const prev = store.get(k);
          store.set(k, { value: String(cur), expiresAt: prev?.expiresAt || null });
          return cur;
        });
        return pipe;
      },
      expire: (k, t) => {
        ops.push(async () => {
          const entry = store.get(k);
          if (entry) entry.expiresAt = Date.now() + Number(t) * 1000;
          return 1;
        });
        return pipe;
      },
      exec: async () => Promise.all(ops.map((fn) => fn().then((res) => [null, res]))),
    };
    return pipe;
  },
};

jest.unstable_mockModule("../../../configs/redis.js", () => ({
  default: () => fakeRedis,
  getRedisConnection: () => fakeRedis,
  closeRedisConnection: async () => {},
}));

const { default: otpService } = await import("../otp.service.js");

describe("Secure OTP Service", () => {
  const testPhone = "+84901234567";
  const purpose = "register";

  beforeEach(async () => {
    store.clear();
  });

  afterEach(async () => {
    await otpService.deleteOtp(testPhone, purpose, true);
  });

  test("sinh mã OTP 6 số ngẫu nhiên an toàn", () => {
    for (let i = 0; i < 20; i++) {
      const otp = otpService.generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  test("lưu mã OTP băm và xác thực thành công mã đúng", async () => {
    // Clear cooldown if any from previous test
    await otpService.deleteOtp(testPhone, purpose, true);
    const { otp } = await otpService.createAndStoreOtp(testPhone, purpose);

    expect(otp).toBeDefined();
    const verified = await otpService.verifyOtp(testPhone, purpose, otp);
    expect(verified).toBe(true);

    // Single-use check: Không thể dùng lại lần 2
    await expect(otpService.verifyOtp(testPhone, purpose, otp)).rejects.toThrow(
      "Mã OTP đã hết hạn hoặc không tồn tại"
    );
  });

  test("từ chối mã OTP sai và giảm số lượt thử còn lại", async () => {
    const { otp } = await otpService.createAndStoreOtp("+84901234568", purpose);

    await expect(
      otpService.verifyOtp("+84901234568", purpose, "000000")
    ).rejects.toThrow("Mã OTP không chính xác. Bạn còn 4 lần thử.");

    // Nhập đúng sau khi nhập sai
    const verified = await otpService.verifyOtp("+84901234568", purpose, otp);
    expect(verified).toBe(true);
  });

  test("hủy OTP sau 5 lần nhập sai liên tiếp", async () => {
    await otpService.createAndStoreOtp("+84901234569", purpose);

    // 4 lần nhập sai
    for (let i = 4; i >= 1; i--) {
      await expect(
        otpService.verifyOtp("+84901234569", purpose, "111111")
      ).rejects.toThrow();
    }

    // Lần 5: OTP_TOO_MANY_ATTEMPTS
    await expect(
      otpService.verifyOtp("+84901234569", purpose, "111111")
    ).rejects.toThrow("Bạn đã nhập sai OTP quá 5 lần. Mã đã bị hủy");
  });

  test("áp dụng cooldown 60s khi yêu cầu OTP mới quá nhanh", async () => {
    const id = "+84901234570";
    await otpService.createAndStoreOtp(id, purpose);

    // Gọi lại ngay lập tức
    await expect(otpService.createAndStoreOtp(id, purpose)).rejects.toThrow(
      "Vui lòng chờ"
    );
  });
});
