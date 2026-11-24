import crypto from "node:crypto";
import express from "express";
import { z } from "zod";
import validate from "../../middlewares/validateZod.js";
import { successResponse } from "../../common/responses/index.js";
import SupportTicket from "./supportTicket.model.js";

const router = express.Router();
const createTicketSchema = z.object({ body: z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(24).optional(),
  subject: z.string().trim().min(1).max(240),
  message: z.string().trim().min(1).max(5000),
}) });

router.post("/tickets", validate(createTicketSchema), async (req, res, next) => {
  try {
    const ticket = await SupportTicket.create({ ...req.body, request_code: `GST-${crypto.randomBytes(4).toString("hex").toUpperCase()}` });
    return successResponse(res, { requestCode: ticket.request_code, status: ticket.status }, "Đã tiếp nhận yêu cầu", 201);
  } catch (error) { next(error); }
});

export default router;
