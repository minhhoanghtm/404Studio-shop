import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import aiChatService from "../aiChat.service.js";
import messageService from "../../messages/message.service.js";
import conversationService from "../../conversations/conversation.service.js";

describe("Customer Invalid Action & Ephemeral Error Handling Suite", () => {
  let createMessageSpy;
  let markLastMessageSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    createMessageSpy = jest.spyOn(messageService, "createMessage").mockResolvedValue({
      _id: "persisted-msg-123",
      content: "Persisted",
    });
    markLastMessageSpy = jest.spyOn(conversationService, "markLastMessage").mockResolvedValue({});
  });

  test("TC-01: _createEphemeralTurn returns in-memory messages without saving to DB", () => {
    const { userMessage, aiMessage } = aiChatService._createEphemeralTurn({
      userId: "user-abc-1",
      conversation: { _id: "conv-1" },
      userContent: "Xác nhận",
      aiContent: "⚠️ Thao tác không hợp lệ: Yêu cầu xác nhận không thuộc về phiên đăng nhập của bạn.",
      userMetadata: {},
      aiMetadata: { actionResult: { code: "CROSS_USER_FORBIDDEN" } },
    });

    expect(userMessage).toBeDefined();
    expect(userMessage.content).toBe("Xác nhận");
    expect(userMessage.metadata.isEphemeral).toBe(true);

    expect(aiMessage).toBeDefined();
    expect(aiMessage.content).toContain("⚠️ Thao tác không hợp lệ: Yêu cầu xác nhận không thuộc về phiên đăng nhập của bạn.");
    expect(aiMessage.metadata.isEphemeral).toBe(true);

    // CRITICAL: messageService.createMessage must NOT be called
    expect(createMessageSpy).not.toHaveBeenCalled();
    expect(markLastMessageSpy).not.toHaveBeenCalled();
  });

  test("TC-02: CROSS_USER_FORBIDDEN returns error to customer but does not persist to DB or notify staff", async () => {
    const mockConversation = {
      _id: "conv-cross-1",
      metadata: {
        pendingAction: {
          actionId: "action-target-1",
          userId: "user-attacker-victim-different",
          actionType: "add_to_cart",
        },
      },
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };

    jest.spyOn(conversationService, "getConversationById").mockResolvedValue(mockConversation);

    const result = await aiChatService.sendMessage(
      "user-logged-in-current",
      {
        content: "Xác nhận",
        conversationId: "conv-cross-1",
        confirmAction: {
          actionId: "action-target-1",
          userId: "other-user-session",
          actionType: "add_to_cart",
        },
      },
      { role: "user" }
    );

    // 1. Response must return to customer with warning
    expect(result.actionResult.success).toBe(false);
    expect(result.actionResult.code).toBe("CROSS_USER_FORBIDDEN");
    expect(result.actionResult.message).toContain("⚠️ Thao tác không hợp lệ: Yêu cầu xác nhận không thuộc về phiên đăng nhập của bạn.");
    expect(result.aiMessage.content).toContain("⚠️ Thao tác không hợp lệ: Yêu cầu xác nhận không thuộc về phiên đăng nhập của bạn.");

    // 2. Error must NOT be saved to DB or sent to staff
    expect(createMessageSpy).not.toHaveBeenCalled();
    expect(markLastMessageSpy).not.toHaveBeenCalled();
  });

  test("TC-03: REPLAY_BLOCKED returns replay warning to customer without persisting to DB", async () => {
    const mockConversation = {
      _id: "conv-replay-1",
      metadata: {
        executedActionIds: ["action-already-executed"],
        pendingAction: null,
      },
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };

    jest.spyOn(conversationService, "getConversationById").mockResolvedValue(mockConversation);

    const result = await aiChatService.sendMessage(
      "user-logged-in-current",
      {
        content: "Xác nhận lại",
        conversationId: "conv-replay-1",
        confirmAction: {
          actionId: "action-already-executed",
          userId: "user-logged-in-current",
          actionType: "add_to_cart",
        },
      },
      { role: "user" }
    );

    // 1. Response returned to customer
    expect(result.actionResult.code).toBe("REPLAY_BLOCKED");
    expect(result.aiMessage.content).toContain("chống lặp lại");

    // 2. NOT saved to DB
    expect(createMessageSpy).not.toHaveBeenCalled();
    expect(markLastMessageSpy).not.toHaveBeenCalled();
  });

  test("TC-04: EXPIRED pendingAction returns expiration warning to customer without saving to DB", async () => {
    const mockConversation = {
      _id: "conv-expired-1",
      metadata: {
        pendingAction: {
          actionId: "action-old-1",
          userId: "user-logged-in-current",
          actionType: "add_to_cart",
          expiresAt: Date.now() - 60000, // Expired 1 min ago
        },
      },
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };

    jest.spyOn(conversationService, "getConversationById").mockResolvedValue(mockConversation);

    const result = await aiChatService.sendMessage(
      "user-logged-in-current",
      {
        content: "Xác nhận",
        conversationId: "conv-expired-1",
        confirmAction: {
          actionId: "action-old-1",
          userId: "user-logged-in-current",
          actionType: "add_to_cart",
          expiresAt: Date.now() - 60000,
        },
      },
      { role: "user" }
    );

    expect(result.actionResult.code).toBe("EXPIRED");
    expect(result.aiMessage.content).toContain("hết hạn");

    // NOT saved to DB
    expect(createMessageSpy).not.toHaveBeenCalled();
    expect(markLastMessageSpy).not.toHaveBeenCalled();
  });
});
