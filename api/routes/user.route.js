import express from "express";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import Inquiry from "../models/inquiry.model.js";
import Listing from "../models/listing.model.js";
import Notification from "../models/notification.model.js";
import SearchAlert from "../models/searchAlert.model.js";
import User from "../models/user.model.js";
import Visit from "../models/visit.model.js";
import { endSession, verifyToken } from "../utils/auth.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { validate, validateId } from "../utils/validate.js";

const router = express.Router();

const profileSchema = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().toLowerCase().email(),
  avatar: z.string().max(500).optional(),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "must be at least 8 characters").max(72),
});
const deleteSchema = z.object({ password: z.string().min(1) });

router.use(verifyToken);

const requirePassword = async (userId, password) => {
  const user = await User.findById(userId).select("+password");
  if (!(await bcryptjs.compare(password, user.password))) {
    throw new HttpError(400, "Password is incorrect");
  }
  return user;
};

router.post(
  "/update",
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user.id, req.valid, {
      returnDocument: "after",
      runValidators: true,
    });
    res.json(user);
  })
);

router.post(
  "/password",
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const user = await requirePassword(req.user.id, req.valid.currentPassword);
    user.password = await bcryptjs.hash(req.valid.newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password changed" });
  })
);

// Deleting an account removes the listings and conversations tied to it
router.post(
  "/delete",
  validate(deleteSchema),
  asyncHandler(async (req, res) => {
    await requirePassword(req.user.id, req.valid.password);
    const listings = await Listing.find({ userRef: req.user.id }).select("_id");
    const ids = listings.map((listing) => listing._id);
    await Promise.all([
      Listing.deleteMany({ userRef: req.user.id }),
      Inquiry.deleteMany({
        $or: [
          { sender: req.user.id },
          { owner: req.user.id },
          { listing: { $in: ids } },
        ],
      }),
      Visit.deleteMany({
        $or: [
          { renter: req.user.id },
          { owner: req.user.id },
          { listing: { $in: ids } },
        ],
      }),
      Notification.deleteMany({ user: req.user.id }),
      SearchAlert.deleteMany({ user: req.user.id }),
      User.updateMany(
        {},
        { $pull: { saved: { $in: ids }, recentViews: { $in: ids } } }
      ),
    ]);
    await User.findByIdAndDelete(req.user.id);
    endSession(res);
    res.json({ success: true, message: "Account deleted" });
  })
);

router.get(
  "/listings",
  asyncHandler(async (req, res) => {
    const listings = await Listing.find({ userRef: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(listings);
  })
);

router.get(
  "/recent",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).populate("recentViews");
    res.json(
      user.recentViews.filter((item) => item?.type === "rent").slice(0, 8)
    );
  })
);

router.get(
  "/analytics",
  asyncHandler(async (req, res) => {
    const listings = await Listing.find({ userRef: req.user.id }).select(
      "name views effectivePrice"
    );
    const ids = listings.map((listing) => listing._id);
    const [saves, inquiries, visits] = await Promise.all([
      User.aggregate([
        { $unwind: "$saved" },
        { $match: { saved: { $in: ids } } },
        { $group: { _id: "$saved", total: { $sum: 1 } } },
      ]),
      Inquiry.aggregate([
        { $match: { listing: { $in: ids } } },
        { $group: { _id: "$listing", total: { $sum: 1 } } },
      ]),
      Visit.aggregate([
        { $match: { listing: { $in: ids } } },
        { $group: { _id: "$listing", total: { $sum: 1 } } },
      ]),
    ]);
    const lookup = (rows) =>
      new Map(rows.map((row) => [row._id.toString(), row.total]));
    const saveCount = lookup(saves);
    const inquiryCount = lookup(inquiries);
    const visitCount = lookup(visits);
    const rows = listings
      .map((listing) => ({
        _id: listing._id,
        name: listing.name,
        views: listing.views,
        saves: saveCount.get(listing._id.toString()) || 0,
        inquiries: inquiryCount.get(listing._id.toString()) || 0,
        visits: visitCount.get(listing._id.toString()) || 0,
      }))
      .sort((a, b) => b.views - a.views);
    const sum = (key) => rows.reduce((total, row) => total + row[key], 0);
    res.json({
      totals: {
        listings: rows.length,
        views: sum("views"),
        saves: sum("saves"),
        inquiries: sum("inquiries"),
        visits: sum("visits"),
      },
      top: rows.slice(0, 5),
    });
  })
);

router.get(
  "/saved",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).populate("saved");
    res.json(
      user.saved.filter((listing) => listing?.type === "rent").reverse()
    );
  })
);

router.post(
  "/saved/:id",
  validateId(),
  asyncHandler(async (req, res) => {
    if (!(await Listing.exists({ _id: req.params.id, type: "rent" }))) {
      throw new HttpError(404, "Listing not found");
    }
    const user = await User.findById(req.user.id);
    const isSaved = user.saved.some((id) => id.equals(req.params.id));
    const update = isSaved
      ? { $pull: { saved: req.params.id } }
      : { $addToSet: { saved: req.params.id } };
    const updated = await User.findByIdAndUpdate(req.user.id, update, {
      returnDocument: "after",
    });
    res.json({ saved: !isSaved, savedIds: updated.saved });
  })
);

export default router;
