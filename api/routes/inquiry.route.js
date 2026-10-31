import express from "express";
import { z } from "zod";
import Inquiry from "../models/inquiry.model.js";
import Listing from "../models/listing.model.js";
import { verifyToken } from "../utils/auth.js";
import { notifyUser } from "../utils/notify.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { objectId, validate, validateId } from "../utils/validate.js";

const router = express.Router();

const createSchema = z.object({
  listing: objectId,
  message: z.string().trim().min(5, "is too short").max(1000),
});

const LISTING_FIELDS = "name city imageUrls";
const USER_FIELDS = "username email";

router.use(verifyToken);

router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const listing = await Listing.findById(req.valid.listing);
    if (!listing) {
      throw new HttpError(404, "Listing not found");
    }
    if (listing.userRef === req.user.id) {
      throw new HttpError(400, "This is your own listing");
    }
    await Inquiry.create({
      listing: listing._id,
      sender: req.user.id,
      owner: listing.userRef,
      message: req.valid.message,
    });
    await notifyUser({
      user: listing.userRef,
      title: "New message from a renter",
      body: listing.name,
      link: "/dashboard?tab=inbox",
    });
    res.status(201).json({ success: true, message: "Message sent to the owner" });
  })
);

router.get(
  "/received",
  asyncHandler(async (req, res) => {
    const inquiries = await Inquiry.find({ owner: req.user.id })
      .populate("listing", LISTING_FIELDS)
      .populate("sender", USER_FIELDS)
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(inquiries.filter((item) => item.listing && item.sender));
  })
);

router.get(
  "/sent",
  asyncHandler(async (req, res) => {
    const inquiries = await Inquiry.find({ sender: req.user.id })
      .populate("listing", LISTING_FIELDS)
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(inquiries.filter((item) => item.listing));
  })
);

router.post(
  "/:id/read",
  validateId(),
  asyncHandler(async (req, res) => {
    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { read: true },
      { returnDocument: "after" }
    );
    if (!inquiry) {
      throw new HttpError(404, "Message not found");
    }
    res.json({ success: true });
  })
);

export default router;
