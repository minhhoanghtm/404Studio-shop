import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  phone: { type: String, trim: true, maxlength: 24 },
  subject: { type: String, required: true, trim: true, maxlength: 240 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["pending", "open", "closed"], default: "pending", index: true },
  request_code: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

export default mongoose.model("support_tickets", supportTicketSchema);
