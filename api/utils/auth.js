import jwt from "jsonwebtoken";
import { isProduction } from "../config/env.js";

const COOKIE = "access_token";
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
};

export const startSession = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: MAX_AGE });
};

export const endSession = (res) => res.clearCookie(COOKIE, cookieOptions);

const readUserId = (req) => {
  try {
    return jwt.verify(req.cookies[COOKIE], process.env.JWT_SECRET).id;
  } catch {
    return null;
  }
};

export const verifyToken = (req, res, next) => {
  const id = readUserId(req);
  if (!id) {
    return res
      .status(401)
      .json({ success: false, message: "Please sign in to continue" });
  }
  req.user = { id };
  next();
};

export const optionalUser = (req, res, next) => {
  const id = readUserId(req);
  if (id) req.user = { id };
  next();
};
