import express from "express";
import { z } from "zod";
import SearchAlert from "../models/searchAlert.model.js";
import { verifyToken } from "../utils/auth.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { searchSchema } from "../utils/listingQuery.js";
import { validate, validateId } from "../utils/validate.js";

const router = express.Router();

const createSchema = z.object({
  label: z.string().trim().min(2).max(80),
  query: z.string().max(500),
});

router.use(verifyToken);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await SearchAlert.find({ user: req.user.id }).sort({ createdAt: -1 }));
  })
);

router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const parsed = searchSchema.safeParse(
      Object.fromEntries(new URLSearchParams(req.valid.query))
    );
    if (!parsed.success) {
      throw new HttpError(400, "This search can't be saved");
    }
    if ((await SearchAlert.countDocuments({ user: req.user.id })) >= 10) {
      throw new HttpError(400, "You can keep up to 10 alerts");
    }
    const alert = await SearchAlert.create({ ...req.valid, user: req.user.id });
    res.status(201).json(alert);
  })
);

router.delete(
  "/:id",
  validateId(),
  asyncHandler(async (req, res) => {
    const removed = await SearchAlert.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!removed) {
      throw new HttpError(404, "Alert not found");
    }
    res.json({ success: true });
  })
);

export default router;
