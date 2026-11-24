import express from "express";
import {
  initGuestConversation,
  sendGuestMessage,
  getGuestMessages,
  getStaffStatus,
} from "./guestSupport.controller.js";

const guestSupportRouter = express.Router();

guestSupportRouter.post("/init", initGuestConversation);
guestSupportRouter.post("/send", sendGuestMessage);
guestSupportRouter.get("/messages/:conversationId", getGuestMessages);
guestSupportRouter.get("/staff-status", getStaffStatus);

export default guestSupportRouter;
