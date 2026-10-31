import express from "express";
import { z } from "zod";
import Listing from "../models/listing.model.js";
import Visit from "../models/visit.model.js";
import { verifyToken } from "../utils/auth.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { notifyUser } from "../utils/notify.js";
import { objectId, validate, validateId } from "../utils/validate.js";

const router = express.Router();

const createSchema = z.object({
  listing: objectId,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date"),
  slot: z.enum(["morning", "afternoon", "evening"]),
});
const statusSchema = z.object({
  status: z.enum(["confirmed", "declined", "cancelled"]),
});

const LISTING_FIELDS = "name address city imageUrls";

const describeDate = (date) =>
  date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

router.use(verifyToken);

router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const date = new Date(`${req.valid.date}T00:00:00.000Z`);
    const today = new Date().toISOString().slice(0, 10);
    if (Number.isNaN(date.getTime()) || req.valid.date <= today) {
      throw new HttpError(400, "Choose a future date");
    }
    const listing = await Listing.findOne({ _id: req.valid.listing, type: "rent" });
    if (!listing) {
      throw new HttpError(404, "Listing not found");
    }
    if (listing.userRef === req.user.id) {
      throw new HttpError(400, "This is your own listing");
    }
    const active = await Visit.exists({
      listing: listing._id,
      renter: req.user.id,
      status: { $in: ["requested", "confirmed"] },
    });
    if (active) {
      throw new HttpError(409, "You already have a visit for this home");
    }
    const visit = await Visit.create({
      listing: listing._id,
      renter: req.user.id,
      owner: listing.userRef,
      date,
      slot: req.valid.slot,
    });
    await notifyUser({
      user: listing.userRef,
      title: "New visit request",
      body: `${listing.name}, ${describeDate(date)} ${req.valid.slot}`,
      link: "/dashboard?tab=visits",
    });
    res.status(201).json(visit);
  })
);

router.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const visits = await Visit.find({ renter: req.user.id })
      .populate("listing", LISTING_FIELDS)
      .sort({ date: 1 });
    res.json(visits.filter((visit) => visit.listing));
  })
);

router.get(
  "/owner",
  asyncHandler(async (req, res) => {
    const visits = await Visit.find({ owner: req.user.id })
      .populate("listing", LISTING_FIELDS)
      .populate("renter", "username email")
      .sort({ date: 1 });
    res.json(visits.filter((visit) => visit.listing && visit.renter));
  })
);

router.post(
  "/:id/status",
  validateId(),
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const visit = await Visit.findById(req.params.id).populate("listing", "name");
    const isOwner = visit?.owner.equals(req.user.id);
    const isRenter = visit?.renter.equals(req.user.id);
    if (!isOwner && !isRenter) {
      throw new HttpError(404, "Visit not found");
    }
    const { status } = req.valid;
    const allowed = status === "cancelled" ? isRenter : isOwner;
    if (!allowed) {
      throw new HttpError(403, "You can't make this change");
    }
    if (["declined", "cancelled"].includes(visit.status)) {
      throw new HttpError(400, "This visit is already closed");
    }
    visit.status = status;
    await visit.save();
    await notifyUser({
      user: isOwner ? visit.renter : visit.owner,
      title: `Visit ${status}`,
      body: `${visit.listing?.name || "Home"}, ${describeDate(visit.date)} ${visit.slot}`,
      link: "/dashboard?tab=visits",
    });
    res.json(visit);
  })
);

export default router;
