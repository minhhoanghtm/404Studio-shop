import guestSupportService from "./guestSupport.service.js";
import { successResponse, errorResponse } from "../../../common/responses/index.js";
import { getSocketIO } from "../../../sockets/index.js";

export const initGuestConversation = async (req, res, next) => {
  try {
    const { name, phone, email, guestId, initialMessages, handoffContext } = req.body;
    const result = await guestSupportService.initGuestConversation({
      name,
      phone,
      email,
      guestId,
      initialMessages,
      handoffContext,
    });
    return successResponse(res, result, "Khởi tạo phiên hỗ trợ khách thành công", 200);
  } catch (error) {
    next(error);
  }
};

export const sendGuestMessage = async (req, res, next) => {
  try {
    const { guestId, conversationId, content, clientMessageId } = req.body;
    const result = await guestSupportService.sendGuestMessage({
      guestId,
      conversationId,
      content,
      clientMessageId,
    });
    return successResponse(res, result, "Gửi tin nhắn khách thành công", 200);
  } catch (error) {
    next(error);
  }
};

export const getGuestMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const guestId = req.query.guestId || req.headers["x-guest-id"];
    const result = await guestSupportService.getGuestMessages(conversationId, guestId);
    return successResponse(res, result, "Lấy lịch sử tin nhắn thành công", 200);
  } catch (error) {
    next(error);
  }
};

export const getStaffStatus = async (_req, res, next) => {
  try {
    let isStaffOnline = false;
    let onlineStaffCount = 0;

    try {
      const io = getSocketIO();
      if (io) {
        const adminRoom = io.sockets.adapter.rooms.get("admins");
        if (adminRoom && adminRoom.size > 0) {
          isStaffOnline = true;
          onlineStaffCount = adminRoom.size;
        }
      }
    } catch {
      // Socket not ready
    }

    return successResponse(
      res,
      {
        isStaffOnline,
        onlineStaffCount,
        statusText: isStaffOnline
          ? "Nhân viên đang online"
          : "Hiện chưa có nhân viên, để lại tin nhắn, chúng tôi sẽ phản hồi sớm",
      },
      "Trạng thái nhân viên tư vấn",
      200
    );
  } catch (error) {
    next(error);
  }
};
