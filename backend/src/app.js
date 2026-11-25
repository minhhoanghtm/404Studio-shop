import { maintenanceMiddleware } from "./middlewares/maintenance.middleware.js";
import apiTracingMiddleware from "./middlewares/apiTracing.middleware.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rootRouter from "./routes/index.js";
import errorHandler from "./middlewares/error.middleware.js";
import logger from "./common/logger.js";
import dotenv from "dotenv";
dotenv.config();
import { getCorsConfig } from "./configs/network.config.js";

const app = express();

// Trust reverse proxy (Nginx) for accurate client IP detection & rate limiting
app.set("trust proxy", 1);

// CORS Configuration strictly from ENV
export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const allowedOrigins = getCorsConfig(process.env);
  if (allowedOrigins.includes(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-anonymous-id",
    "x-anonymous-token",
    "x-session-id",
    "x-tab-id",
    "x-visitor-id",
    "visitor-id",
    "x-trace-id",
    "x-action-id",
    "x-frontend-route",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["x-trace-id", "x-request-id"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
); // secure HTTP headers
app.use(mongoSanitize()); // prevent NoSQL injection

// Payload parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Static resources mapping
app.use("/uploads", express.static("uploads"));

// REST APIs mapping
app.use(apiTracingMiddleware);
app.use("/api", maintenanceMiddleware, rootRouter);

// Centralized error routing
app.use(errorHandler);

export default app;
