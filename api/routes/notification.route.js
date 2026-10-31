import express from "express";
import Notification from "../models/notification.model.js";
import { verifyToken } from "../utils/auth.js";
import { asyncHandler } from "../utils/http.js";

const router = express.Router();

router.use(verifyToken);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  })
);

router.post(
  "/read",
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true });
  })
);

export default router;
