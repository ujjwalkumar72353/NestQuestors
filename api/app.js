import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import { isProduction } from "./config/env.js";
import alertRouter from "./routes/alert.route.js";
import authRouter from "./routes/auth.route.js";
import chatRouter from "./routes/chat.route.js";
import inquiryRouter from "./routes/inquiry.route.js";
import insightsRouter from "./routes/insights.route.js";
import listingRouter from "./routes/listing.route.js";
import notificationRouter from "./routes/notification.route.js";
import userRouter from "./routes/user.route.js";
import visitRouter from "./routes/visit.route.js";

const here = path.dirname(fileURLToPath(import.meta.url));

const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            "data:",
            "https://images.unsplash.com",
            "https://tile.openstreetmap.org",
            "https://res.cloudinary.com",
            "https://firebasestorage.googleapis.com",
          ],
          upgradeInsecureRequests: null,
        },
      },
    })
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/api/health", (req, res) => res.json({ success: true }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts, try again later" },
  });
  app.use("/api/auth/signin", authLimiter);
  app.use("/api/auth/signup", authLimiter);

  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/listing", listingRouter);
  app.use("/api/inquiry", inquiryRouter);
  app.use("/api/visit", visitRouter);
  app.use("/api/notification", notificationRouter);
  app.use("/api/alert", alertRouter);
  app.use("/api/insights", insightsRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api", (req, res) =>
    res.status(404).json({ success: false, message: "Route not found" })
  );

  app.use("/uploads", express.static(path.join(here, "uploads")));

  if (isProduction) {
    const clientBuild = path.join(here, "..", "client", "dist");
    app.use(express.static(clientBuild));
    app.get("*", (req, res) =>
      res.sendFile(path.join(clientBuild, "index.html"))
    );
  }

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "This value is already in use" });
    }
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  });

  return app;
};

export default createApp;
