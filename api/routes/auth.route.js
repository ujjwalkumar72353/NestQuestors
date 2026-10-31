import express from "express";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import User from "../models/user.model.js";
import {
  endSession,
  optionalUser,
  startSession,
  verifyToken,
} from "../utils/auth.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { validate } from "../utils/validate.js";

const router = express.Router();

const email = z.string().trim().toLowerCase().email();
const signupSchema = z.object({
  username: z.string().trim().min(3).max(30),
  email,
  password: z.string().min(8, "must be at least 8 characters").max(72),
});
const signinSchema = z.object({ email, password: z.string().min(1) });

router.post(
  "/signup",
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const { username, email: address, password } = req.valid;
    if (await User.exists({ email: address })) {
      throw new HttpError(409, "This email is already registered");
    }
    if (await User.exists({ username })) {
      throw new HttpError(409, "This username is taken");
    }
    await User.create({
      username,
      email: address,
      password: await bcryptjs.hash(password, 10),
    });
    res.status(201).json({ success: true, message: "Account created" });
  })
);

router.post(
  "/signin",
  validate(signinSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.valid.email }).select(
      "+password"
    );
    const valid =
      user && (await bcryptjs.compare(req.valid.password, user.password));
    if (!valid) {
      throw new HttpError(401, "Invalid email or password");
    }
    startSession(res, user._id);
    const { password, ...profile } = user.toObject();
    res.json(profile);
  })
);

// Guests are normal here, so this answers with null instead of an error
router.get(
  "/session",
  optionalUser,
  asyncHandler(async (req, res) => {
    const user = req.user && (await User.findById(req.user.id));
    res.json(user || null);
  })
);

router.get(
  "/me",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      endSession(res);
      throw new HttpError(401, "Please sign in to continue");
    }
    res.json(user);
  })
);

router.post("/signout", (req, res) => {
  endSession(res);
  res.json({ success: true, message: "Signed out" });
});

export default router;
