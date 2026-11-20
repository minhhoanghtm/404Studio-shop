import mongoose from "mongoose";
import Conversation from "../conversations/conversation.model.js";
import Message from "../messages/message.model.js";
import { getSocketIO } from "../../../sockets/index.js";

class GuestSupportService {
  /**
   * Initializes or resumes a guest support conversation.
   * Optionally copies up to 5 initial context messages from AI handoff.
   */
  async initGuestConversation({ name, phone, email, guestId, initialMessages = [], handoffContext = null }) {
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Find active conversation for this guest
    let conversation = await Conversation.findOne({
      guestId,
      type: "support",
      status: { $ne: "closed" },
    }).sort({ updatedAt: -1 });

    const isNew = !conversation;

    if (!conversation) {
      conversation = await Conversation.create({
        guestId,
        type: "support",
        status: "waiting_admin",
        source: initialMessages && initialMessages.length > 0 ? "ai_handoff" : "manual",
        guestInfo: {
          name: name ? String(name).trim() : "Khách Vãng Lai",
          phone: phone ? String(phone).trim() : null,
          email: email ? String(email).trim() : null,
        },
        metadata: {
          handoffContext,
          userAgent: "WebStorefront",
        },
        lastMessageAt: new Date(),
      });

      // If initialMessages provided (from AI handoff context), save up to 5 recent turns
      if (Array.isArray(initialMessages) && initialMessages.length > 0) {
        const recent = initialMessages.slice(-5);
        for (const item of recent) {
          await Message.create({
            conversationId: conversation._id,
            senderType: item.role === "user" ? "guest" : "ai",
            senderGuestId: item.role === "user" ? guestId : null,
            messageType: "text",
            content: item.text || item.content || String(item),
            metadata: { isHandoffContext: true },
          });
        }
      }
    } else {
      // Update contact details if provided
      if (name || phone || email) {
        conversation.guestInfo = {
          name: name ? String(name).trim() : conversation.guestInfo?.name || "Khách Vãng Lai",
          phone: phone ? String(phone).trim() : conversation.guestInfo?.phone,
          email: email ? String(email).trim() : conversation.guestInfo?.email,
        };
        await conversation.save();
      }
    }

    // Notify online admins via Socket.IO if available
    try {
      const io = getSocketIO();
      if (io) {
        io.to("admins").emit("conversation:updated", {
          conversationId: conversation._id,
          conversation,
          isNew,
        });
      }
    } catch {
      // Socket not yet initialized or offline
    }

    return {
      conversationId: String(conversation._id),
      guestId,
      conversation,
      isNew,
    };
  }

  /**
   * Sends a message from a guest user in support mode.
   */
  async sendGuestMessage({ guestId, conversationId, content, clientMessageId }) {
    if (!guestId || !conversationId || !content?.trim()) {
      throw new Error("guestId, conversationId và content là bắt buộc");
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error("conversationId không hợp lệ");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      guestId,
    });

    if (!conversation) {
      throw new Error("Không tìm thấy hội thoại của khách");
    }

    // Check duplicate clientMessageId
    if (clientMessageId) {
      const existing = await Message.findOne({
        conversationId,
        clientMessageId,
      });
      if (existing) {
        return { conversationId: String(conversationId), message: existing, conversation };
      }
    }

    const message = await Message.create({
      conversationId,
      senderType: "guest",
      senderGuestId: guestId,
      messageType: "text",
      content: content.trim(),
      clientMessageId: clientMessageId || null,
      metadata: { guestName: conversation.guestInfo?.name || "Khách Vãng Lai" },
    });

    conversation.lastMessageAt = new Date();
    conversation.status = "waiting_admin";
    await conversation.save();

    // Broadcast realtime event
    const messagePayload = {
      message: {
        _id: message._id,
        id: String(message._id),
        conversationId: String(conversationId),
        senderType: "guest",
        senderGuestId: guestId,
        content: message.content,
        createdAt: message.createdAt,
        guestName: conversation.guestInfo?.name || "Khách Vãng Lai",
      },
      conversation,
    };

    try {
      const io = getSocketIO();
      if (io) {
        io.to(`conversation:${conversationId}`).emit("message:new", messagePayload);
        io.to("admins").emit("message:new", messagePayload);
      }
    } catch {
      // Socket not initialized
    }

    return {
      conversationId: String(conversationId),
      message: messagePayload.message,
      conversation,
    };
  }

  /**
   * Retrieves messages for a guest conversation.
   */
  async getGuestMessages(conversationId, guestId) {
    if (!conversationId || !guestId) {
      throw new Error("conversationId và guestId là bắt buộc");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      guestId,
    });

    if (!conversation) {
      throw new Error("Hội thoại không tồn tại hoặc không thuộc về khách này");
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return {
      conversationId: String(conversationId),
      conversation,
      messages: messages.map((m) => ({
        id: String(m._id),
        _id: m._id,
        conversationId: String(m.conversationId),
        senderType: m.senderType,
        senderId: m.senderId,
        senderGuestId: m.senderGuestId,
        content: m.content,
        createdAt: m.createdAt,
        metadata: m.metadata,
      })),
    };
  }
}

export default new GuestSupportService();
