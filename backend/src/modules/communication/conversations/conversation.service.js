import mongoose from "mongoose";
import conversationRepository from "./conversation.repository.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/communication.errors.js";
import { validateCreateConversationDto } from "../validators/communication.validator.js";
import User from "../../users/user.model.js";
import Message from "../messages/message.model.js";

const customerPopulate = [
  {
    path: "customerId",
    select: "fullName email avatar_url",
  },
  {
    path: "assignedAdminId",
    select: "fullName email",
  },
];

const assertObjectId = (id, field = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError(`${field} is invalid`);
  }
};

class ConversationService {
  async createConversation(payload, options = {}) {
    const data = validateCreateConversationDto(payload);
    assertObjectId(data.customerId, "customerId");

    if (data.assignedAdminId) assertObjectId(data.assignedAdminId, "assignedAdminId");

    return conversationRepository.create(
      {
        ...data,
        lastMessageAt: null,
      },
      options
    );
  }

  async getOrCreateCustomerAiConversation(customerId, metadata = {}) {
    assertObjectId(customerId, "customerId");

    const existing = await conversationRepository.findOne({
      customerId,
      type: "ai",
      status: { $ne: "closed" },
    });

    if (existing) return existing;

    return this.createConversation({
      customerId,
      type: "ai",
      status: "open",
      source: "manual",
      metadata,
    });
  }

  async getConversationById(id, actor = {}) {
    assertObjectId(id, "conversationId");

    const conversation = await conversationRepository.findById(id, customerPopulate);
    if (!conversation) throw new NotFoundError("Conversation not found");

    if (actor.role !== "admin" && String(conversation.customerId?._id || conversation.customerId) !== String(actor.userId)) {
      throw new ForbiddenError("You do not have permission to access this conversation");
    }

    return conversation;
  }

  async listCustomerConversations(customerId, query = {}) {
    assertObjectId(customerId, "customerId");

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = { customerId };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      conversationRepository.find(filter, { skip, limit, populate: customerPopulate }),
      conversationRepository.count(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listAdminConversations(query = {}, adminId = null) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.assigned === "unassigned") filter.assignedAdminId = null;
    if (query.assigned === "my" && adminId) filter.assignedAdminId = adminId;

    const [items, total] = await Promise.all([
      conversationRepository.find(filter, { skip, limit, populate: customerPopulate }),
      conversationRepository.count(filter),
    ]);

    let livePresenceMap = new Map();
    try {
      const presenceServiceModule = await import("../../tracking/presence.service.js");
      const presenceService = presenceServiceModule.default;
      if (presenceService) {
        const live = await presenceService.getLiveSessions({ limit: 100 });
        if (live?.sessions && Array.isArray(live.sessions)) {
          for (const s of live.sessions) {
            if (s.userId) livePresenceMap.set(String(s.userId), s);
            if (s.visitorId) livePresenceMap.set(String(s.visitorId), s);
            if (s.sessionId) livePresenceMap.set(String(s.sessionId), s);
            if (s.anonymousId) livePresenceMap.set(String(s.anonymousId), s);
          }
        }
      }
    } catch {
      // Ignore if Redis or presence is not available
    }

    const conversationIds = items.map((c) => c._id);
    let latestMessagesMap = new Map();
    let unreadCountsMap = new Map();
    let customerMessageCountsMap = new Map();

    if (conversationIds.length > 0 && typeof Message?.aggregate === "function") {
      try {
        const validMatch = {
          conversationId: { $in: conversationIds },
          "metadata.isEphemeral": { $ne: true },
          content: {
            $not: /^⚠️ (?:Thao tác không hợp lệ|Thao tác thêm vào giỏ hàng này đã được thực thi|Chữ ký xác thực hành động không hợp lệ|Yêu cầu xác nhận thêm giỏ hàng đã hết hạn)/i,
          },
        };

        const [latestMsgs, lastAdminMsgs, customerMsgs] = await Promise.all([
          Message.aggregate([
            { $match: validMatch },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: "$conversationId",
                lastMessage: { $first: "$content" },
                lastMessageSender: { $first: "$senderType" },
                lastMessageAt: { $first: "$createdAt" },
              },
            },
          ]),
          Message.aggregate([
            {
              $match: {
                conversationId: { $in: conversationIds },
                senderType: { $in: ["admin", "ai"] },
                "metadata.isEphemeral": { $ne: true },
              },
            },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: "$conversationId",
                lastAdminAt: { $first: "$createdAt" },
              },
            },
          ]),
          typeof Message?.find === "function"
            ? Message.find({
                conversationId: { $in: conversationIds },
                senderType: { $in: ["user", "guest"] },
                "metadata.isEphemeral": { $ne: true },
              })
                .select("conversationId createdAt")
                .lean()
            : Promise.resolve([]),
        ]);

        if (Array.isArray(latestMsgs)) {
          for (const m of latestMsgs) {
            latestMessagesMap.set(String(m._id), m);
          }
        }

        const lastAdminAtMap = new Map();
        if (Array.isArray(lastAdminMsgs)) {
          for (const adm of lastAdminMsgs) {
            lastAdminAtMap.set(String(adm._id), adm.lastAdminAt);
          }
        }

        if (Array.isArray(customerMsgs)) {
          for (const cm of customerMsgs) {
            const cIdStr = String(cm.conversationId);
            customerMessageCountsMap.set(
              cIdStr,
              (customerMessageCountsMap.get(cIdStr) || 0) + 1
            );

            const lastAdminAt = lastAdminAtMap.get(cIdStr);
            if (!lastAdminAt || new Date(cm.createdAt) > new Date(lastAdminAt)) {
              unreadCountsMap.set(cIdStr, (unreadCountsMap.get(cIdStr) || 0) + 1);
            }
          }
        }
      } catch (aggErr) {
        // Fallback gracefully if aggregation fails
      }
    }

    const enrichedItems = items.map((conv) => {
      const plain = conv.toObject ? conv.toObject() : { ...conv };
      const convIdStr = String(plain._id);

      const latestMsgInfo = latestMessagesMap.get(convIdStr);
      if (latestMsgInfo) {
        plain.lastMessage = latestMsgInfo.lastMessage;
        plain.lastMessageSender =
          latestMsgInfo.lastMessageSender === "user" || latestMsgInfo.lastMessageSender === "guest"
            ? "customer"
            : latestMsgInfo.lastMessageSender;
        if (latestMsgInfo.lastMessageAt) {
          plain.lastMessageAt = latestMsgInfo.lastMessageAt;
        }
      } else {
        plain.lastMessage = "";
        plain.lastMessageSender = null;
      }

      plain.customerMessageCount = customerMessageCountsMap.get(convIdStr) || 0;
      plain.unreadCount = unreadCountsMap.get(convIdStr) || 0;
      if (plain.status === "waiting_admin" && plain.unreadCount === 0) {
        plain.unreadCount = Math.max(plain.customerMessageCount, 1);
      }
      const custId = plain.customerId?._id
        ? String(plain.customerId._id)
        : plain.customerId
        ? String(plain.customerId)
        : null;
      const guestId = plain.guestId || plain.metadata?.visitorId || null;

      const matchedSession =
        (custId && livePresenceMap.get(custId)) ||
        (guestId && livePresenceMap.get(guestId)) ||
        null;

      if (matchedSession) {
        const isOnline = ["active", "idle", "away", "background"].includes(
          (matchedSession.status || "").toLowerCase()
        );
        plain.isOnline = isOnline;
        plain.presenceStatus = matchedSession.status || "active";
        plain.lastActiveAt =
          matchedSession.lastSeen || matchedSession.lastHeartbeatAt || new Date();
      } else {
        plain.isOnline = false;
        plain.presenceStatus = "offline";
        plain.lastActiveAt =
          plain.lastMessageAt || plain.updatedAt || plain.createdAt || new Date();
      }

      return plain;
    });

    return { items: enrichedItems, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async assignConversation(conversationId, adminId) {
    const existing = await this.getConversationById(conversationId, { role: "admin" });
    assertObjectId(adminId, "adminId");

    const updated = await conversationRepository.updateById(conversationId, {
      assignedAdminId: adminId,
      type: "support",
      status: "waiting_customer",
      lastMessageAt: new Date(),
    });

    // Lookup staff/admin info to construct the announcement name
    let staffName = "Tư vấn viên";
    try {
      const adminUser = await User.findById(adminId).select("fullName name email").lean();
      const rawName = (adminUser?.fullName || adminUser?.name || "").trim();
      if (rawName) {
        staffName = rawName.toLowerCase().startsWith("nhân viên")
          ? rawName
          : `Nhân viên ${rawName}`;
      } else {
        staffName = "Nhân viên hỗ trợ";
      }
    } catch {
      staffName = "Nhân viên hỗ trợ";
    }

    const notificationContent = staffName.toLowerCase().startsWith("nhân viên")
      ? `${staffName} đã tham gia cuộc trò chuyện`
      : `Nhân viên ${staffName} đã tham gia cuộc trò chuyện`;

    // Persist a system message for customer and admin chat histories
    let systemMessage = null;
    try {
      systemMessage = await Message.create({
        conversationId,
        senderType: "system",
        senderId: adminId,
        messageType: "system",
        content: notificationContent,
        metadata: {
          action: "staff_joined",
          staffId: String(adminId),
          staffName,
          isSystemNotification: true,
        },
      });
    } catch (err) {
      console.error("Failed to persist staff joined system message:", err.message);
    }

    // Broadcast real-time notifications via Socket.IO
    try {
      const { getSocketIO } = await import("../../../sockets/index.js");
      const io = getSocketIO();
      if (io) {
        const messagePayload = {
          message: systemMessage
            ? {
                _id: String(systemMessage._id),
                id: String(systemMessage._id),
                conversationId: String(conversationId),
                senderType: "system",
                messageType: "system",
                content: systemMessage.content,
                createdAt: systemMessage.createdAt,
                metadata: systemMessage.metadata,
              }
            : {
                _id: `sys_${Date.now()}`,
                id: `sys_${Date.now()}`,
                conversationId: String(conversationId),
                senderType: "system",
                messageType: "system",
                content: notificationContent,
                createdAt: new Date().toISOString(),
                metadata: { action: "staff_joined", staffId: String(adminId), staffName },
              },
          conversation: updated,
          staffName,
        };

        let target = io.to(`conversation:${conversationId}`).to("admins");
        if (existing?.customerId) {
          const custId = existing.customerId._id || existing.customerId;
          target = target.to(`customer:${custId}`);
        }
        target.emit("message:new", messagePayload);

        target.emit("staff:joined", {
          conversationId: String(conversationId),
          staffId: String(adminId),
          staffName,
          message: notificationContent,
        });

        io.to("admins").emit("conversation:updated", {
          conversationId: String(conversationId),
          conversation: updated,
          assignedAdminId: String(adminId),
          assignedAdminName: staffName,
        });
      }
    } catch (socketErr) {
      console.error("Failed to emit staff joined socket notification:", socketErr.message);
    }

    const resObj = updated?.toObject ? updated.toObject() : { ...updated };
    resObj.systemMessage = systemMessage;
    resObj.assignedAdminName = staffName;
    return resObj;
  }

  async transferConversation(conversationId, adminId) {
    return this.assignConversation(conversationId, adminId);
  }

  async closeConversation(conversationId, actor = {}) {
    assertObjectId(conversationId, "conversationId");
    const existing = await this.getConversationById(conversationId, actor);
    const updated = await conversationRepository.updateById(conversationId, { status: "closed" });

    let staffName = "Nhân viên tư vấn";
    if (actor?.userId) {
      try {
        const staffUser = await User.findById(actor.userId).select("name fullName role").lean();
        if (staffUser) {
          staffName = (staffUser.name || staffUser.fullName || "").trim();
          if (staffName && !staffName.toLowerCase().startsWith("nhân viên")) {
            staffName = `Nhân viên ${staffName}`;
          }
        }
      } catch {
        // fallback
      }
    } else if (existing?.assignedAdminId) {
      try {
        const adminId = existing.assignedAdminId._id || existing.assignedAdminId;
        const staffUser = await User.findById(adminId).select("name fullName role").lean();
        if (staffUser) {
          staffName = (staffUser.name || staffUser.fullName || "").trim();
          if (staffName && !staffName.toLowerCase().startsWith("nhân viên")) {
            staffName = `Nhân viên ${staffName}`;
          }
        }
      } catch {
        // fallback
      }
    }

    const notificationContent = `${staffName} đã kết thúc phiên tư vấn`;
    let systemMessage = null;
    try {
      systemMessage = await Message.create({
        conversationId,
        senderType: "system",
        senderId: actor?.userId || null,
        messageType: "system",
        content: notificationContent,
        metadata: {
          action: "conversation_closed",
          staffId: actor?.userId ? String(actor.userId) : null,
          staffName,
          isSystemNotification: true,
        },
      });
    } catch (err) {
      console.error("Failed to persist conversation closed system message:", err.message);
    }

    try {
      const { getSocketIO } = await import("../../../sockets/index.js");
      const io = getSocketIO();
      if (io) {
        const messagePayload = {
          message: systemMessage
            ? {
                _id: String(systemMessage._id),
                id: String(systemMessage._id),
                conversationId: String(conversationId),
                senderType: "system",
                messageType: "system",
                content: systemMessage.content,
                createdAt: systemMessage.createdAt,
                metadata: systemMessage.metadata,
              }
            : {
                _id: `sys_${Date.now()}`,
                id: `sys_${Date.now()}`,
                conversationId: String(conversationId),
                senderType: "system",
                messageType: "system",
                content: notificationContent,
                createdAt: new Date().toISOString(),
                metadata: { action: "conversation_closed", staffName },
              },
          conversation: updated,
          staffName,
        };

        let target = io.to(`conversation:${conversationId}`).to("admins");
        if (existing?.customerId) {
          const custId = existing.customerId._id || existing.customerId;
          target = target.to(`customer:${custId}`);
        }
        target.emit("message:new", messagePayload);

        target.emit("conversation:closed", {
          conversationId: String(conversationId),
          closedBy: staffName,
          message: notificationContent,
        });

        io.to("admins").emit("conversation:updated", {
          conversationId: String(conversationId),
          conversation: updated,
          status: "closed",
        });
      }
    } catch (socketErr) {
      console.error("Failed to emit conversation closed socket notification:", socketErr.message);
    }

    const resObj = updated?.toObject ? updated.toObject() : { ...updated };
    resObj.systemMessage = systemMessage;
    return resObj;
  }

  async reopenConversation(conversationId, actor = {}) {
    assertObjectId(conversationId, "conversationId");
    const existing = await this.getConversationById(conversationId, actor);
    const updated = await conversationRepository.updateById(conversationId, { status: "open" });

    let staffName = "Nhân viên tư vấn";
    if (actor?.userId) {
      try {
        const staffUser = await User.findById(actor.userId).select("name fullName role").lean();
        if (staffUser) {
          staffName = (staffUser.name || staffUser.fullName || "").trim();
          if (staffName && !staffName.toLowerCase().startsWith("nhân viên")) {
            staffName = `Nhân viên ${staffName}`;
          }
        }
      } catch {
        // fallback
      }
    }

    const notificationContent = `${staffName} đã mở lại phiên tư vấn`;
    let systemMessage = null;
    try {
      systemMessage = await Message.create({
        conversationId,
        senderType: "system",
        senderId: actor?.userId || null,
        messageType: "system",
        content: notificationContent,
        metadata: {
          action: "conversation_reopened",
          staffId: actor?.userId ? String(actor.userId) : null,
          staffName,
          isSystemNotification: true,
        },
      });
    } catch (err) {
      console.error("Failed to persist conversation reopened system message:", err.message);
    }

    try {
      const { getSocketIO } = await import("../../../sockets/index.js");
      const io = getSocketIO();
      if (io) {
        const messagePayload = {
          message: systemMessage
            ? {
                _id: String(systemMessage._id),
                id: String(systemMessage._id),
                conversationId: String(conversationId),
                senderType: "system",
                messageType: "system",
                content: systemMessage.content,
                createdAt: systemMessage.createdAt,
                metadata: systemMessage.metadata,
              }
            : {
                _id: `sys_${Date.now()}`,
                id: `sys_${Date.now()}`,
                conversationId: String(conversationId),
                senderType: "system",
                messageType: "system",
                content: notificationContent,
                createdAt: new Date().toISOString(),
                metadata: { action: "conversation_reopened", staffName },
              },
          conversation: updated,
          staffName,
        };

        let target = io.to(`conversation:${conversationId}`).to("admins");
        if (existing?.customerId) {
          const custId = existing.customerId._id || existing.customerId;
          target = target.to(`customer:${custId}`);
        }
        target.emit("message:new", messagePayload);

        target.emit("conversation:reopened", {
          conversationId: String(conversationId),
          reopenedBy: staffName,
          message: notificationContent,
        });

        io.to("admins").emit("conversation:updated", {
          conversationId: String(conversationId),
          conversation: updated,
          status: "open",
        });
      }
    } catch (socketErr) {
      console.error("Failed to emit conversation reopened socket notification:", socketErr.message);
    }

    const resObj = updated?.toObject ? updated.toObject() : { ...updated };
    resObj.systemMessage = systemMessage;
    return resObj;
  }

  async updateConversationMetadata(conversationId, metadata = {}) {
    assertObjectId(conversationId, "conversationId");
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    conversation.metadata = {
      ...(conversation.metadata || {}),
      ...metadata,
    };
    return conversationRepository.updateById(conversationId, {
      metadata: conversation.metadata,
    });
  }

  async markLastMessage(conversationId, date = new Date(), status) {
    const update = { lastMessageAt: date };
    if (status) update.status = status;
    return conversationRepository.updateById(conversationId, update);
  }
}

export default new ConversationService();
