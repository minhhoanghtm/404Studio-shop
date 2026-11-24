import mongoose from "mongoose";
import { getRedisConnection } from "../../configs/redis.js";
import UserEvent from "./userEvent.model.js";
import User from "../users/user.model.js";
import { PRESENCE_STATUS, USER_ACTIVITY_CONFIG } from "./tracking.constants.js";

const KEY_PREFIX_TAB = "webfashion:presence:session:";
const KEY_ACTIVE_SESSIONS = "webfashion:presence:active-sessions";
const TAB_TTL_SECONDS = Math.ceil(USER_ACTIVITY_CONFIG.heartbeatGraceMs / 1000); // 90 seconds

/**
 * Che giấu email theo chuẩn bảo mật & quyền riêng tư (Masked Email)
 * Ví dụ: customer@404studio.vn -> c******r@404studio.vn
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== "string" || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}${"*".repeat(Math.max(1, local.length - 2))}${last}@${domain}`;
};

/**
 * Lọc các trường tài khoản được phép hiển thị (Allowlist Sanitization)
 * Tuyệt đối không trả về password, password hash, tokens hay thông tin thanh toán
 */
export const sanitizeUserAccount = (user) => {
  if (!user) return null;
  const email = user.email || null;
  const userId = user._id ? user._id.toString() : (user.userId ? String(user.userId) : null);
  return {
    userId,
    fullName: user.fullName || "Thành viên",
    username: email ? email.split("@")[0] : null,
    email: maskEmail(email),
    avatarUrl: user.avatar_url || null,
    role: user.role || "user",
    status: user.status || "active",
    createdAt: user.createdAt || null,
  };
};

class PresenceService {
  /**
   * Cập nhật nhịp tim (Heartbeat) và trạng thái hiện diện thời gian thực của người dùng
   * Lưu trữ trên Redis có TTL = 45 giây; KHÔNG ghi bản ghi sự kiện thừa thãi vào MongoDB.
   */
  async updateHeartbeat(data, reqUser) {
    const {
      visitorId,
      visitor_id,
      session_id,
      tab_id,
      page,
      anonymous_id,
      status,
      current_route,
      previous_route,
      idle_duration_sec,
      session_duration_sec,
      entry_source,
      traffic_channel,
      last_action,
      last_api,
      visible,
      timestamp,
    } = data;

    const redis = getRedisConnection();
    if (!redis) {
      return { success: false, warning: "Redis unavailable" };
    }

    const resolvedVisitorId =
      visitorId ||
      visitor_id ||
      session_id ||
      anonymous_id ||
      `visitor_${Date.now()}`;
    const resolvedSessionId = session_id || resolvedVisitorId;
    const resolvedTabId = tab_id || "tab_main";
    const resolvedPage = page || current_route || "/";
    const rawStatus = (typeof status === "string" ? status : "active").toLowerCase();

    const userId = reqUser?._id ? reqUser._id.toString() : (reqUser?.userId || reqUser?.id || null);
    const userRole = reqUser?.role || "guest";
    const userType = userId ? "user" : "guest";
    const resolvedAnonymousId = anonymous_id || resolvedVisitorId;

    let userAccount = null;
    let resolvedUserDisplay = "Khách vãng lai";
    let resolvedUserRole = userRole;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const userDoc = await User.findById(userId)
          .select("_id fullName name email role status avatar_url createdAt")
          .lean();
        if (userDoc) {
          userAccount = sanitizeUserAccount(userDoc);
          resolvedUserDisplay = userDoc.fullName || userDoc.name || userAccount.fullName || "Thành viên";
          resolvedUserRole = userAccount.role;
        } else {
          resolvedUserDisplay = `User ${userId.slice(-6)}`;
        }
      } catch (userErr) {
        console.warn("[Presence] Lỗi khi tra cứu tài khoản User:", userErr.message);
        resolvedUserDisplay = `User ${userId.slice(-6)}`;
      }
    }

    const now = Date.now();
    const lastSeen = timestamp
      ? (typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime())
      : now;

    // Cập nhật hành trình trang (Session Page Journey) trong Redis
    const historyKey = `presence:history:${resolvedVisitorId}`;
    let pageHistory = [];
    try {
      const rawHistory = await redis.get(historyKey);
      if (rawHistory) {
        pageHistory = JSON.parse(rawHistory);
      }
    } catch {}

    const lastItem = pageHistory.length > 0 ? pageHistory[pageHistory.length - 1] : null;
    const nowIso = new Date(now).toISOString();

    if (lastItem && lastItem.page === resolvedPage) {
      lastItem.lastSeenAt = nowIso;
      lastItem.durationSec = Math.max(1, Math.round((now - new Date(lastItem.enteredAt).getTime()) / 1000));
      lastItem.status = rawStatus;
    } else {
      if (lastItem) {
        lastItem.lastSeenAt = nowIso;
        lastItem.durationSec = Math.max(1, Math.round((now - new Date(lastItem.enteredAt).getTime()) / 1000));
      }
      pageHistory.push({
        page: resolvedPage,
        enteredAt: nowIso,
        lastSeenAt: nowIso,
        durationSec: 1,
        status: rawStatus,
      });
      if (pageHistory.length > 50) {
        pageHistory = pageHistory.slice(-50);
      }
    }

    const sessionStartedAt = pageHistory[0]?.enteredAt || nowIso;

    // 1. Lưu Redis theo key presence:{visitorId} với TTL 45 giây (User & Guest)
    const presenceKey = `presence:${resolvedVisitorId}`;
    const presenceData = {
      visitorId: resolvedVisitorId,
      type: userType, // 'user' | 'guest'
      userId: userId || null,
      displayName: userId ? resolvedUserDisplay : "Khách vãng lai",
      page: resolvedPage,
      status: rawStatus, // 'active' | 'idle' | 'away' | 'background'
      lastSeen,
      sessionStartedAt,
      pageCount: pageHistory.length,
      deviceType: data.deviceType || (visible !== false ? "Desktop" : "Unknown"),
      anonymousId: resolvedAnonymousId,
    };

    const multi = redis.multi();
    multi.set(presenceKey, JSON.stringify(presenceData), "EX", 45);
    multi.set(historyKey, JSON.stringify(pageHistory), "EX", 86400);
    multi.sadd("presence:active-visitors", resolvedVisitorId);
    multi.expire("presence:active-visitors", 86400);

    // 2. Hỗ trợ legacy multi-tab sessions nếu payload có session_id hoặc tab_id (cho backwards compatibility)
    if (session_id || tab_id) {
      const tabPayload = {
        sessionId: resolvedSessionId,
        tabId: resolvedTabId,
        userId: userId || null,
        userDisplay: resolvedUserDisplay,
        account: userAccount || null,
        anonymousId: resolvedAnonymousId,
        userRole: resolvedUserRole,
        userType: userId ? "authenticated" : "guest",
        status: rawStatus.toUpperCase(),
        currentRoute: resolvedPage,
        previousRoute: previous_route || null,
        idleDurationSec: typeof idle_duration_sec === "number" ? Math.max(0, idle_duration_sec) : 0,
        sessionDurationSec: typeof session_duration_sec === "number" ? Math.max(0, session_duration_sec) : 0,
        entrySource: entry_source || "Direct / Unknown",
        trafficChannel: traffic_channel || "Direct",
        lastAction: last_action || "active_viewing",
        lastApi: last_api || null,
        visible: visible !== false,
        lastHeartbeatAt: now,
        timestamp: lastSeen,
      };

      const tabKey = `${KEY_PREFIX_TAB}${resolvedSessionId}:tab:${resolvedTabId}`;
      const tabsSetKey = `${KEY_PREFIX_TAB}${resolvedSessionId}:tabs`;

      multi.set(tabKey, JSON.stringify(tabPayload), "EX", TAB_TTL_SECONDS);
      multi.sadd(KEY_ACTIVE_SESSIONS, resolvedSessionId);
      multi.sadd(tabsSetKey, resolvedTabId);
      multi.expire(tabsSetKey, TAB_TTL_SECONDS + 30);
      multi.expire(KEY_ACTIVE_SESSIONS, 86400); // 24h safety refresh
    }

    await multi.exec();

    // Do not start a lazy Socket.IO import from isolated unit tests; it creates
    // a module handle after Jest teardown. Production still broadcasts normally.
    if (process.env.NODE_ENV !== "test") try {
      const { getSocketIO } = await import("../../sockets/index.js");
      const io = getSocketIO();
      if (io) {
        io.to("admin-room").emit("presence:updated", presenceData);
      }
    } catch {
      // Bỏ qua nếu socket chưa khởi tạo (vd: môi trường unit test)
    }

    return { success: true };
  }

  /**
   * Tách danh tính tài khoản khi người dùng đăng xuất (Logout Disassociation)
   */
  async disassociateUserSession({ session_id, tab_id, visitorId, visitor_id }) {
    const redis = getRedisConnection();
    if (!redis) return { success: false };

    const resolvedVid = visitorId || visitor_id || session_id;
    try {
      if (resolvedVid) {
        const raw = await redis.get(`presence:${resolvedVid}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            parsed.type = "guest";
            parsed.userId = null;
            parsed.displayName = "Khách vãng lai";
            parsed.lastSeen = Date.now();
            await redis.set(`presence:${resolvedVid}`, JSON.stringify(parsed), "EX", 45);
          } catch {}
        }
      }

      if (session_id) {
        const tabsSetKey = `${KEY_PREFIX_TAB}${session_id}:tabs`;
        const tabIds = tab_id ? [tab_id] : await redis.smembers(tabsSetKey);

        for (const tid of tabIds) {
          const tabKey = `${KEY_PREFIX_TAB}${session_id}:tab:${tid}`;
          const raw = await redis.get(tabKey);
          if (raw) {
            const tab = JSON.parse(raw);
            tab.userId = null;
            tab.account = null;
            tab.userType = "guest";
            tab.userRole = "guest";
            tab.userDisplay = "Khách vãng lai";
            tab.lastHeartbeatAt = Date.now();
            await redis.set(tabKey, JSON.stringify(tab), "EX", TAB_TTL_SECONDS);

            try {
              const { getSocketIO } = await import("../../sockets/index.js");
              const io = getSocketIO();
              if (io) {
                io.to("admin-room").emit("presence:updated", tab);
              }
            } catch {}
          }
        }
      }
      return { success: true };
    } catch (err) {
      console.warn("[Presence] Lỗi khi tách danh tính session:", err.message);
      return { success: false };
    }
  }

  /**
   * Xử lý khi tab đóng hoặc rời trang (Beacon leave)
   */
  async handleTabLeave(data) {
    const { session_id, tab_id, visitorId, visitor_id, reason, final_timings } = data;
    const redis = getRedisConnection();
    if (!redis) return { success: false };

    const resolvedVid = visitorId || visitor_id || session_id;
    try {
      if (resolvedVid) {
        await redis.del(`presence:${resolvedVid}`);
        await redis.srem("presence:active-visitors", resolvedVid);
      }

      if (session_id && tab_id) {
        const tabKey = `${KEY_PREFIX_TAB}${session_id}:tab:${tab_id}`;
        const tabsSetKey = `${KEY_PREFIX_TAB}${session_id}:tabs`;

        await redis.del(tabKey);
        await redis.srem(tabsSetKey, tab_id);

        // Kiểm tra xem session còn tab nào khác không
        const remainingTabs = await redis.smembers(tabsSetKey);
        let sessionEnded = false;
        if (!remainingTabs || remainingTabs.length === 0) {
          await redis.srem(KEY_ACTIVE_SESSIONS, session_id);
          await redis.del(tabsSetKey);
          sessionEnded = true;
        }

        // Phát thông báo tab leave tới Admin room qua Socket.IO
        try {
          const { getSocketIO } = await import("../../sockets/index.js");
          const io = getSocketIO();
          if (io) {
            io.to("admin-room").emit("presence:leave", {
              sessionId: session_id,
              tabId: tab_id,
              reason: reason || "tab_closed",
              sessionEnded,
            });
          }
        } catch {}
      }

      return { success: true };
    } catch (err) {
      console.warn("[Presence] Lỗi khi xử lý tab leave:", err.message);
      return { success: false };
    }
  }

  /**
   * Tổng hợp danh sách phiên người dùng đang hoạt động (Live Sessions) cho Admin
   */
  async getLiveSessions({ statusFilter, routeFilter, limit = 50 }) {
    const redis = getRedisConnection();
    if (!redis) {
      return {
        sessions: [],
        counts: {
          total: 0,
          active: 0,
          idle: 0,
          away: 0,
          background: 0,
          disconnected: 0,
          guestCount: 0,
          authenticatedCount: 0,
        },
        redisConnected: false,
      };
    }

    const aggregatedSessions = [];
    const processedSessionIds = new Set();
    const staleSessionsToRemove = [];

    // 1. Thu thập các phiên multi-tab từ KEY_ACTIVE_SESSIONS (ưu tiên tổng hợp đa tab)
    const sessionIds = await redis.smembers(KEY_ACTIVE_SESSIONS);
    if (sessionIds && sessionIds.length > 0) {
      for (const sid of sessionIds) {
        const tabsSetKey = `${KEY_PREFIX_TAB}${sid}:tabs`;
        const tabIds = await redis.smembers(tabsSetKey);

        if (!tabIds || tabIds.length === 0) {
          staleSessionsToRemove.push(sid);
          continue;
        }

        const tabKeys = tabIds.map((tid) => `${KEY_PREFIX_TAB}${sid}:tab:${tid}`);
        const tabsDataRaw = await redis.mget(...tabKeys);

        const activeTabs = [];
        const expiredTabIds = [];

        for (let i = 0; i < tabIds.length; i++) {
          const raw = tabsDataRaw[i];
          if (raw) {
            try {
              activeTabs.push(JSON.parse(raw));
            } catch {
              expiredTabIds.push(tabIds[i]);
            }
          } else {
            expiredTabIds.push(tabIds[i]);
          }
        }

        if (expiredTabIds.length > 0) {
          await redis.srem(tabsSetKey, ...expiredTabIds);
        }

        if (activeTabs.length === 0) {
          staleSessionsToRemove.push(sid);
          continue;
        }

        // Xác định trạng thái tổng thể phiên từ nhiều tab:
        // ACTIVE > PASSIVE_VIEWING > IDLE > AWAY > BACKGROUND > DISCONNECTED
        let overallStatus = PRESENCE_STATUS.DISCONNECTED;
        if (activeTabs.some((t) => t.status === PRESENCE_STATUS.ACTIVE)) {
          overallStatus = PRESENCE_STATUS.ACTIVE;
        } else if (activeTabs.some((t) => t.status === PRESENCE_STATUS.PASSIVE_VIEWING)) {
          overallStatus = PRESENCE_STATUS.PASSIVE_VIEWING;
        } else if (activeTabs.some((t) => t.status === PRESENCE_STATUS.IDLE)) {
          overallStatus = PRESENCE_STATUS.IDLE;
        } else if (activeTabs.some((t) => t.status === PRESENCE_STATUS.AWAY)) {
          overallStatus = PRESENCE_STATUS.AWAY;
        } else if (activeTabs.some((t) => t.status === PRESENCE_STATUS.BACKGROUND)) {
          overallStatus = PRESENCE_STATUS.BACKGROUND;
        }

        const primaryTab =
          activeTabs.find((t) => t.status === overallStatus) || activeTabs[0];

        const isAuth = primaryTab.userType === "authenticated" || Boolean(primaryTab.userId);

        aggregatedSessions.push({
          sessionId: sid,
          visitorId: sid,
          tabCount: activeTabs.length,
          userId: primaryTab.userId || null,
          displayName: primaryTab.userDisplay || (isAuth ? "Thành Viên" : "Khách vãng lai"),
          userDisplay: primaryTab.userDisplay || (isAuth ? "Thành Viên" : "Khách vãng lai"),
          account: primaryTab.account || null,
          anonymousId: primaryTab.anonymousId || null,
          type: isAuth ? "user" : "guest",
          userType: primaryTab.userType || (isAuth ? "authenticated" : "guest"),
          isAnonymous: !isAuth,
          userRole: primaryTab.userRole || "guest",
          overallStatus,
          status: overallStatus.toLowerCase(),
          currentRoute: primaryTab.currentRoute || "/",
          page: primaryTab.currentRoute || "/",
          previousRoute: primaryTab.previousRoute,
          idleDurationSec: primaryTab.idleDurationSec,
          sessionDurationSec: primaryTab.sessionDurationSec,
          entrySource: primaryTab.entrySource,
          trafficChannel: primaryTab.trafficChannel,
          lastAction: primaryTab.lastAction,
          lastApi: primaryTab.lastApi,
          lastHeartbeatAt: primaryTab.lastHeartbeatAt,
          lastSeen: primaryTab.lastHeartbeatAt
            ? new Date(primaryTab.lastHeartbeatAt).toISOString()
            : new Date().toISOString(),
          tabs: activeTabs.map((t) => ({
            tabId: t.tabId,
            status: t.status,
            currentRoute: t.currentRoute,
            idleDurationSec: t.idleDurationSec,
            visible: t.visible,
          })),
        });
        processedSessionIds.add(sid);
      }

      if (staleSessionsToRemove.length > 0) {
        await redis.srem(KEY_ACTIVE_SESSIONS, ...staleSessionsToRemove);
      }
    }

    // 2. Thu thập visitor sessions từ presence:active-visitors và keys presence:*
    const visitorIdsSet = new Set(await redis.smembers("presence:active-visitors") || []);
    try {
      const presenceKeysFound = await redis.keys("presence:*");
      if (Array.isArray(presenceKeysFound)) {
        for (const k of presenceKeysFound) {
          if (
            !k.startsWith("presence:history:") &&
            !k.includes(":history:") &&
            !k.includes(":active-") &&
            !k.includes(":tabs") &&
            !k.includes(":tab:")
          ) {
            const vid = k.replace(/^presence:/, "");
            if (vid && !processedSessionIds.has(vid)) visitorIdsSet.add(vid);
          }
        }
      }
    } catch {}

    const visitorIds = Array.from(visitorIdsSet).filter((id) => !processedSessionIds.has(id));
    const expiredVisitorIds = [];

    if (visitorIds.length > 0) {
      const keysToFetch = visitorIds.map((id) => `presence:${id}`);
      const rawData = await redis.mget(...keysToFetch);

      for (let i = 0; i < visitorIds.length; i++) {
        const raw = rawData[i];
        const vid = visitorIds[i];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
              expiredVisitorIds.push(vid);
              continue;
            }
            const isUser = parsed.type === "user" || Boolean(parsed.userId);
            const userType = isUser ? "authenticated" : "guest";
            const statusLower = (parsed.status || "active").toLowerCase();
            const statusUpper = (parsed.status || "active").toUpperCase();
            const lastSeenIso = parsed.lastSeen
              ? (typeof parsed.lastSeen === "string" ? parsed.lastSeen : new Date(parsed.lastSeen).toISOString())
              : new Date().toISOString();
            const lastSeenMs = parsed.lastSeen
              ? (typeof parsed.lastSeen === "number" ? parsed.lastSeen : new Date(parsed.lastSeen).getTime())
              : Date.now();

            aggregatedSessions.push({
              sessionId: vid,
              visitorId: vid,
              userId: parsed.userId || null,
              displayName: parsed.displayName || (isUser ? "Thành Viên" : "Khách vãng lai"),
              userDisplay: parsed.displayName || (isUser ? "Thành Viên" : "Khách vãng lai"),
              account: null,
              anonymousId: parsed.anonymousId || null,
              type: isUser ? "user" : "guest",
              userType,
              isAnonymous: !isUser,
              userRole: isUser ? "user" : "guest",
              overallStatus: statusUpper,
              status: statusLower,
              page: parsed.page || "/",
              currentRoute: parsed.page || "/",
              lastSeen: lastSeenIso,
              lastHeartbeatAt: lastSeenMs,
              deviceType: parsed.deviceType || "Desktop",
              tabCount: 1,
            });
            processedSessionIds.add(vid);
          } catch {
            expiredVisitorIds.push(vid);
          }
        } else {
          expiredVisitorIds.push(vid);
        }
      }

      if (expiredVisitorIds.length > 0) {
        await redis.srem("presence:active-visitors", ...expiredVisitorIds);
      }
    }

    // 3. Tra cứu danh tính thực tế từ MongoDB Users cho các phiên đã xác thực (Real Data Correlation)
    const authUserIds = [...new Set(aggregatedSessions.map((s) => s.userId).filter(Boolean))];
    if (authUserIds.length > 0) {
      try {
        const validIds = authUserIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        if (validIds.length > 0) {
          const userDocs = await User.find({ _id: { $in: validIds } })
            .select("_id fullName name email role status avatar_url createdAt")
            .lean();
          const userMap = new Map();
          userDocs.forEach((u) => {
            const sanitized = sanitizeUserAccount(u);
            sanitized.fullName = u.fullName || u.name || sanitized.fullName;
            userMap.set(u._id.toString(), sanitized);
          });

          for (const s of aggregatedSessions) {
            if (s.userId && userMap.has(s.userId)) {
              const acc = userMap.get(s.userId);
              s.account = acc;
              s.displayName = acc.fullName;
              s.userDisplay = acc.fullName;
              s.userRole = acc.role;
              s.userType = "authenticated";
              s.type = "user";
              s.isAnonymous = false;
            } else if (s.userId) {
              s.displayName = s.displayName || `User ${s.userId.slice(-6)}`;
              s.userDisplay = s.displayName;
              s.userType = "authenticated";
              s.type = "user";
              s.isAnonymous = false;
            }
          }
        }
      } catch (err) {
        console.warn("[Presence] Lỗi khi batch query User từ MongoDB:", err.message);
      }
    }

    // 4. Tính toán số lượng counts
    const counts = {
      total: aggregatedSessions.length,
      active: 0,
      idle: 0,
      away: 0,
      background: 0,
      disconnected: 0,
      guestCount: 0,
      authenticatedCount: 0,
    };

    for (const s of aggregatedSessions) {
      if (s.type === "user" || s.userType === "authenticated") {
        counts.authenticatedCount++;
      } else {
        counts.guestCount++;
      }

      const st = (s.status || "").toLowerCase();
      if (st === "active") counts.active++;
      else if (st === "idle") counts.idle++;
      else if (st === "away") counts.away++;
      else if (st === "background") counts.background++;
      else counts.disconnected++;
    }

    // 5. Lọc theo điều kiện truy vấn nếu có
    let filteredSessions = aggregatedSessions;
    if (statusFilter && statusFilter !== "ALL") {
      const sfLower = statusFilter.toLowerCase();
      filteredSessions = filteredSessions.filter(
        (s) =>
          (s.status || "").toLowerCase() === sfLower ||
          (s.overallStatus || "").toUpperCase() === statusFilter.toUpperCase()
      );
    }

    if (routeFilter) {
      const rfLower = routeFilter.toLowerCase();
      filteredSessions = filteredSessions.filter((s) =>
        (s.page || s.currentRoute || "").toLowerCase().includes(rfLower)
      );
    }

    // 6. Sắp xếp session ưu tiên: active -> idle -> away -> background
    const statusOrder = {
      active: 1,
      ACTIVE: 1,
      passive_viewing: 2,
      PASSIVE_VIEWING: 2,
      idle: 3,
      IDLE: 3,
      away: 4,
      AWAY: 4,
      background: 5,
      BACKGROUND: 5,
      disconnected: 6,
      DISCONNECTED: 6,
    };

    filteredSessions.sort(
      (a, b) =>
        (statusOrder[a.status] || statusOrder[a.overallStatus] || 99) -
          (statusOrder[b.status] || statusOrder[b.overallStatus] || 99) ||
        (b.lastHeartbeatAt || 0) - (a.lastHeartbeatAt || 0)
    );

    return {
      sessions: filteredSessions.slice(0, limit),
      counts,
      redisConnected: true,
    };
  }

  /**
   * Lấy chi tiết dòng thời gian hành trình (User Journey Timeline) của một phiên
   */
  async getSessionTimeline(sessionId) {
    if (!sessionId) {
      return { success: false, message: "Cần cung cấp sessionId" };
    }

    const cleanSessionId = typeof sessionId === "string" ? sessionId.replace(/^history:/, "") : sessionId;
    const redis = getRedisConnection();
    let liveTabs = [];
    let pageHistory = [];
    let livePresence = null;

    if (redis) {
      try {
        const rawHistory = await redis.get(`presence:history:${cleanSessionId}`);
        if (rawHistory) pageHistory = JSON.parse(rawHistory);
      } catch {}
      try {
        const rawPresence = await redis.get(`presence:${cleanSessionId}`);
        if (rawPresence) {
          const parsed = JSON.parse(rawPresence);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            livePresence = parsed;
          }
        }
      } catch {}

      const tabsSetKey = `${KEY_PREFIX_TAB}${cleanSessionId}:tabs`;
      const tabIds = await redis.smembers(tabsSetKey);
      if (tabIds && tabIds.length > 0) {
        const keys = tabIds.map((tid) => `${KEY_PREFIX_TAB}${cleanSessionId}:tab:${tid}`);
        const raw = await redis.mget(...keys);
        liveTabs = raw
          .filter(Boolean)
          .map((item) => {
            try {
              let clean = typeof item === "string" ? item.trim() : "";
              if (clean.startsWith("'") && clean.endsWith("'")) {
                clean = clean.slice(1, -1);
              }
              return JSON.parse(clean);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      }
    }

    // Lấy toàn bộ sự kiện đã lưu trong MongoDB cho session này theo thứ tự thời gian tăng dần
    const events = await UserEvent.find({
      $or: [{ session_id: cleanSessionId }, { session_id: sessionId }],
    })
      .sort({ createdAt: 1 })
      .lean();

    // Xác định userId từ livePresence, liveTabs hoặc từ các sự kiện đã lưu
    let sessionUserId = livePresence?.userId || liveTabs.find((t) => t.userId)?.userId || null;
    if (!sessionUserId) {
      const eventWithUser = events.find((e) => e.user_id);
      if (eventWithUser) {
        sessionUserId = eventWithUser.user_id.toString();
      }
    }

    let sessionAccount = null;
    let userType = sessionUserId ? "authenticated" : "guest";
    let userDisplay = livePresence?.displayName || (sessionUserId ? `User ${sessionUserId.slice(-6)}` : "Khách vãng lai");

    if (sessionUserId) {
      try {
        if (mongoose.Types.ObjectId.isValid(sessionUserId)) {
          const userDoc = await User.findById(sessionUserId)
            .select("_id fullName name email role status avatar_url createdAt")
            .lean();
          if (userDoc) {
            sessionAccount = sanitizeUserAccount(userDoc);
            userDisplay = sessionAccount.fullName;
          } else {
            sessionAccount = {
              error: "Không thể tải thông tin tài khoản",
              userId: sessionUserId,
            };
          }
        } else {
          sessionAccount = {
            error: "Không thể tải thông tin tài khoản",
            userId: sessionUserId,
          };
        }
      } catch (userErr) {
        sessionAccount = {
          error: "Không thể tải thông tin tài khoản",
          userId: sessionUserId,
        };
      }
    }

    // Tính toán khoảng thời gian trôi qua giữa các bước (+seconds) và liên kết API
    const timeline = [];
    let previousTimestamp = null;
    let sessionStartedAt = null;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const evTime = new Date(ev.createdAt).getTime();

      if (!sessionStartedAt) {
        sessionStartedAt = evTime;
      }

      const elapsedFromStartSec = Math.floor((evTime - sessionStartedAt) / 1000);
      const deltaFromPrevSec = previousTimestamp ? Math.floor((evTime - previousTimestamp) / 1000) : 0;
      previousTimestamp = evTime;

      timeline.push({
        eventId: ev.event_id || ev._id.toString(),
        eventType: ev.event_type,
        actionId: ev.action_id || null,
        traceId: ev.trace_id || null,
        tabId: ev.tab_id || null,
        durationMs: ev.duration_ms || null,
        timestamp: ev.createdAt,
        elapsedFromStartSec,
        deltaFromPrevSec,
        pathname: ev.context?.pathname || null,
        fromPath: ev.context?.fromPath || null,
        toPath: ev.context?.toPath || null,
        entrySource: ev.context?.entrySource || null,
        navigationType: ev.context?.navigationType || null,
        api: ev.context?.api || null,
        meta: ev.meta || {},
        persisted: true,
      });
    }

    const firstSeenTime = pageHistory[0]?.enteredAt
      ? new Date(pageHistory[0].enteredAt).getTime()
      : (sessionStartedAt || (livePresence?.lastSeen ? new Date(livePresence.lastSeen).getTime() : Date.now()));
    const lastSeenTime = livePresence?.lastSeen
      ? new Date(livePresence.lastSeen).getTime()
      : (pageHistory[pageHistory.length - 1]?.lastSeenAt
          ? new Date(pageHistory[pageHistory.length - 1].lastSeenAt).getTime()
          : Date.now());
    const totalDurationSec = Math.max(1, Math.round((lastSeenTime - firstSeenTime) / 1000));

    return {
      success: true,
      sessionId,
      visitorId: sessionId,
      liveTabs,
      eventCount: events.length,
      sessionStartedAt: pageHistory[0]?.enteredAt || (sessionStartedAt ? new Date(sessionStartedAt) : new Date(firstSeenTime)),
      totalDurationSec,
      userType,
      userId: sessionUserId || null,
      userDisplay,
      displayName: userDisplay,
      account: sessionAccount,
      deviceType: livePresence?.deviceType || "Desktop",
      currentStatus: livePresence?.status || (liveTabs.length > 0 ? "active" : "disconnected"),
      currentPage: livePresence?.page || pageHistory[pageHistory.length - 1]?.page || "/",
      pageHistory,
      timeline,
    };
  }

  /**
   * Quản trị viên buộc đăng xuất / kết thúc phiên làm việc (Admin Force Logout & Session Termination)
   */
  async terminateSession({ sessionId, visitorId, reason, adminUser }) {
    const redis = getRedisConnection();
    const resolvedVid = visitorId || sessionId;
    if (!resolvedVid) {
      return { success: false, message: "Thiếu sessionId hoặc visitorId" };
    }

    let targetUserId = null;
    let targetDisplayName = "Khách vãng lai";

    if (redis) {
      try {
        const raw = await redis.get(`presence:${resolvedVid}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          targetUserId = parsed.userId || null;
          targetDisplayName = parsed.displayName || targetDisplayName;
        }
        await redis.del(`presence:${resolvedVid}`);
        await redis.del(`presence:history:${resolvedVid}`);
        await redis.srem("presence:active-visitors", resolvedVid);

        // Xóa multi-tab session nếu có
        const tabsSetKey = `${KEY_PREFIX_TAB}${resolvedVid}:tabs`;
        const tabIds = await redis.smembers(tabsSetKey);
        if (tabIds && tabIds.length > 0) {
          for (const tid of tabIds) {
            await redis.del(`${KEY_PREFIX_TAB}${resolvedVid}:tab:${tid}`);
          }
          await redis.del(tabsSetKey);
        }
        await redis.srem(KEY_ACTIVE_SESSIONS, resolvedVid);
      } catch (redisErr) {
        console.warn("[Presence] Lỗi khi xóa session khỏi Redis:", redisErr.message);
      }
    }

    // Phát sự kiện Socket.IO để client lập tức đăng xuất / kết thúc phiên
    if (process.env.NODE_ENV !== "test") {
      try {
        const { getSocketIO } = await import("../../sockets/index.js");
        const io = getSocketIO();
        if (io) {
          if (targetUserId) {
            io.to(`user:${targetUserId}`).emit("auth:force_logout", {
              visitorId: resolvedVid,
              userId: targetUserId,
              message: "Phiên đăng nhập đã bị Quản trị viên kết thúc.",
            });
          }
          io.emit("presence:session_terminated", {
            visitorId: resolvedVid,
            sessionId: resolvedVid,
            userId: targetUserId,
            reason: reason || "admin_terminated",
            message: "Phiên làm việc đã bị Quản trị viên kết thúc.",
          });
          io.to("admin-room").emit("presence:leave", {
            sessionId: resolvedVid,
            reason: "admin_terminated",
            sessionEnded: true,
          });
        }
      } catch (socketErr) {
        console.warn("[Presence] Lỗi khi phát Socket terminate session:", socketErr.message);
      }
    }

    return {
      success: true,
      message: `Đã kết thúc phiên của ${targetDisplayName}`,
      terminatedSessionId: resolvedVid,
      targetUserId,
    };
  }

  /**
   * Thống kê tổng hợp hoạt động trang, thời gian tương tác (Page Dwell & Active Time)
   */
  async getActivityAnalytics({ startDate, endDate }) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 86400 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    // 1. Tổng hợp thời gian trên từng trang từ các event page_view / page_leave
    const pageAggregation = await UserEvent.aggregate([
      {
        $match: {
          ...dateFilter,
          event_type: { $in: ["page_view", "page_enter", "page_leave"] },
          "context.pathname": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$context.pathname",
          views: { $sum: 1 },
          avgDwellSec: {
            $avg: {
              $cond: [
                { $gt: ["$duration_ms", 0] },
                { $divide: ["$duration_ms", 1000] },
                { $divide: [{ $ifNull: ["$context.timing.dwellMs", 0] }, 1000] },
              ],
            },
          },
          avgActiveSec: {
            $avg: {
              $divide: [{ $ifNull: ["$context.timing.activeMs", 0] }, 1000],
            },
          },
          avgIdleSec: {
            $avg: {
              $divide: [{ $ifNull: ["$context.timing.idleMs", 0] }, 1000],
            },
          },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 15 },
    ]);

    // 2. Thống kê nguồn truy cập (Acquisition Sources)
    const trafficSources = await UserEvent.aggregate([
      {
        $match: {
          ...dateFilter,
          event_type: "session_start",
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$context.entrySource", "Direct / Unknown"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 3. Thống kê độ trễ và độ tin cậy của API từ api_trace
    const apiMetrics = await UserEvent.aggregate([
      {
        $match: {
          ...dateFilter,
          event_type: { $in: ["api_trace", "api_slow", "api_error"] },
          "context.api.endpoint": { $exists: true },
        },
      },
      {
        $group: {
          _id: "$context.api.endpoint",
          count: { $sum: 1 },
          avgLatencyMs: { $avg: "$context.api.durationMs" },
          slowCount: {
            $sum: {
              $cond: [{ $eq: ["$event_type", "api_slow"] }, 1, 0],
            },
          },
          errorCount: {
            $sum: {
              $cond: [{ $eq: ["$event_type", "api_error"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // 4. Thống kê tỷ lệ bỏ dở giỏ hàng & thanh toán
    const checkoutFunnel = await UserEvent.aggregate([
      {
        $match: {
          ...dateFilter,
          event_type: {
            $in: [
              "add_to_cart",
              "checkout_started",
              "reservation_created",
              "order_placed",
              "checkout_abandoned",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$event_type",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      period: { start, end },
      pageAnalytics: pageAggregation.map((p) => ({
        pathname: p._id,
        views: p.views,
        avgDwellSec: Math.round((p.avgDwellSec || 0) * 10) / 10,
        avgActiveSec: Math.round((p.avgActiveSec || 0) * 10) / 10,
        avgIdleSec: Math.round((p.avgIdleSec || 0) * 10) / 10,
      })),
      trafficSources: trafficSources.map((s) => ({
        source: s._id,
        count: s.count,
      })),
      apiMetrics: apiMetrics.map((a) => ({
        endpoint: a._id,
        count: a.count,
        avgLatencyMs: Math.round(a.avgLatencyMs || 0),
        slowCount: a.slowCount,
        errorCount: a.errorCount,
      })),
      checkoutFunnel: checkoutFunnel.reduce((acc, it) => {
        acc[it._id] = it.count;
        return acc;
      }, {}),
    };
  }
}

export default new PresenceService();
