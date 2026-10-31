import express from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { askAssistant } from "../utils/assistant.js";
import { asyncHandler } from "../utils/http.js";
import { validate } from "../utils/validate.js";

const router = express.Router();

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1000),
      })
    )
    .min(1)
    .max(12)
    .refine((messages) => messages.at(-1)?.role === "user", {
      message: "must end with a user message",
    }),
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.CHAT_RATE_LIMIT) || 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many messages. Please wait a minute." },
});

router.post(
  "/",
  limiter,
  validate(chatSchema),
  asyncHandler(async (req, res) => {
    res.json(await askAssistant(req.valid.messages));
  })
);

export default router;
