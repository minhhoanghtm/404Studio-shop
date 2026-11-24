import { beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";
import mongoose from "mongoose";

const mockFindById = jest.fn();
const mockUpdateById = jest.fn();
const mockUserFindById = jest.fn();
const mockMessageCreate = jest.fn();
const mockGetSocketIO = jest.fn();

jest.unstable_mockModule("../conversation.repository.js", () => ({
  default: {
    findById: mockFindById,
    updateById: mockUpdateById,
  },
}));

jest.unstable_mockModule("../../../users/user.model.js", () => ({
  default: {
    findById: mockUserFindById,
  },
}));

jest.unstable_mockModule("../../messages/message.model.js", () => ({
  default: {
    create: mockMessageCreate,
  },
}));

jest.unstable_mockModule("../../../../sockets/index.js", () => ({
  getSocketIO: mockGetSocketIO,
}));

let conversationService;

beforeAll(async () => {
  ({ default: conversationService } = await import("../conversation.service.js"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("conversationService.assignConversation", () => {
  const fakeConvId = new mongoose.Types.ObjectId().toString();
  const fakeAdminId = new mongoose.Types.ObjectId().toString();
  const fakeCustomerId = new mongoose.Types.ObjectId().toString();

  test("assigns conversation, creates system message, and emits socket events with staff name", async () => {
    // 1. Mock existing conversation lookup
    mockFindById.mockResolvedValue({
      _id: fakeConvId,
      customerId: fakeCustomerId,
      assignedAdminId: null,
      status: "waiting_admin",
    });

    // 2. Mock updateById
    const updatedDoc = {
      _id: fakeConvId,
      customerId: fakeCustomerId,
      assignedAdminId: fakeAdminId,
      type: "support",
      status: "waiting_customer",
      toObject: () => ({
        _id: fakeConvId,
        customerId: fakeCustomerId,
        assignedAdminId: fakeAdminId,
        type: "support",
        status: "waiting_customer",
      }),
    };
    mockUpdateById.mockResolvedValue(updatedDoc);

    // 3. Mock User.findById for admin
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: fakeAdminId,
          fullName: "Nguyễn Văn A",
          role: "admin",
        }),
      }),
    });

    // 4. Mock Message.create
    const createdSystemMsg = {
      _id: new mongoose.Types.ObjectId().toString(),
      conversationId: fakeConvId,
      senderType: "system",
      senderId: fakeAdminId,
      messageType: "system",
      content: "Nhân viên Nguyễn Văn A đã tham gia cuộc trò chuyện",
      createdAt: new Date(),
      metadata: { action: "staff_joined", staffId: fakeAdminId, staffName: "Nhân viên Nguyễn Văn A" },
    };
    mockMessageCreate.mockResolvedValue(createdSystemMsg);

    // 5. Mock Socket.IO
    const emittedEvents = [];
    const createMockTarget = () => {
      const target = {
        to: jest.fn(() => target),
        emit: jest.fn((event, data) => {
          emittedEvents.push({ event, data });
        }),
      };
      return target;
    };
    const mockTarget = createMockTarget();
    mockGetSocketIO.mockReturnValue({
      to: jest.fn(() => mockTarget),
    });

    // Act
    const result = await conversationService.assignConversation(fakeConvId, fakeAdminId);

    // Assert
    expect(mockUpdateById).toHaveBeenCalledWith(
      fakeConvId,
      expect.objectContaining({
        assignedAdminId: fakeAdminId,
        type: "support",
        status: "waiting_customer",
      })
    );

    // Assert system message creation
    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: fakeConvId,
        senderType: "system",
        senderId: fakeAdminId,
        messageType: "system",
        content: "Nhân viên Nguyễn Văn A đã tham gia cuộc trò chuyện",
      })
    );

    // Assert return object contains systemMessage and assignedAdminName
    expect(result.assignedAdminName).toBe("Nhân viên Nguyễn Văn A");
    expect(result.systemMessage).toEqual(createdSystemMsg);

    // Assert socket events emitted
    const messageNewEvent = emittedEvents.find((e) => e.event === "message:new");
    expect(messageNewEvent).toBeDefined();
    expect(messageNewEvent.data.message.content).toBe("Nhân viên Nguyễn Văn A đã tham gia cuộc trò chuyện");

    const staffJoinedEvent = emittedEvents.find((e) => e.event === "staff:joined");
    expect(staffJoinedEvent).toBeDefined();
    expect(staffJoinedEvent.data.staffName).toBe("Nhân viên Nguyễn Văn A");
    expect(staffJoinedEvent.data.message).toBe("Nhân viên Nguyễn Văn A đã tham gia cuộc trò chuyện");

    const convUpdatedEvent = emittedEvents.find((e) => e.event === "conversation:updated");
    expect(convUpdatedEvent).toBeDefined();
    expect(convUpdatedEvent.data.assignedAdminName).toBe("Nhân viên Nguyễn Văn A");
  });
});
