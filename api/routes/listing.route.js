import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import Inquiry from "../models/inquiry.model.js";
import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";
import Visit from "../models/visit.model.js";
import { optionalUser, verifyToken } from "../utils/auth.js";
import { AMENITIES, CITIES, FACINGS, OCCUPANCIES } from "../utils/cities.js";
import { nearbyLandmarks } from "../utils/geo.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { rateFairness } from "../utils/insights.js";
import { buildQuery, searchSchema, SORTS } from "../utils/listingQuery.js";
import { notifySearchAlerts } from "../utils/notify.js";
import { buildProfile, rankListings } from "../utils/recommend.js";
import { objectId, validate, validateId } from "../utils/validate.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(here, "..", "uploads");

const router = express.Router();

const listingSchema = z
  .object({
    name: z.string().trim().min(5).max(80),
    description: z.string().trim().min(20).max(2000),
    address: z.string().trim().min(5).max(200),
    city: z.enum(CITIES),
    regularPrice: z.number().int().positive().max(1e10),
    discountPrice: z.number().int().min(0).max(1e10).default(0),
    bathrooms: z.number().int().min(1).max(10),
    bedrooms: z.number().int().min(1).max(10),
    furnished: z.boolean(),
    parking: z.boolean(),
    bachelorFriendly: z.boolean(),
    amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length).default([]),
    offer: z.boolean(),
    occupancy: z.enum(OCCUPANCIES).default("full"),
    carpetArea: z.number().int().min(50).max(20000),
    floor: z.number().int().min(0).max(100).default(0),
    totalFloors: z.number().int().min(0).max(100).default(0),
    balconies: z.number().int().min(0).max(6).default(0),
    facing: z.enum(FACINGS).or(z.literal("")).default(""),
    propertyAge: z.number().int().min(0).max(100).default(0),
    deposit: z.number().int().min(0).max(1e9).default(0),
    maintenance: z.number().int().min(0).max(1e7).default(0),
    availableFrom: z.string().datetime({ offset: true }).optional(),
    leaseMonths: z.number().int().min(1).max(120).default(11),
    foodPreference: z.enum(["any", "veg"]).default("any"),
    petsAllowed: z.boolean().default(false),
    gatedSociety: z.boolean().default(false),
    brokerageFree: z.boolean().default(true),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    imageUrls: z
      .array(z.string().min(1).max(500))
      .min(1, "add at least one photo")
      .max(6, "can have at most 6 photos"),
  })
  .refine((value) => !value.offer || value.discountPrice > 0, {
    path: ["discountPrice"],
    message: "is required for an offer",
  })
  .refine((value) => !value.offer || value.discountPrice < value.regularPrice, {
    path: ["discountPrice"],
    message: "must be lower than the regular price",
  });

const toDocument = ({ lat, lng, ...values }) => ({
  ...values,
  type: "rent",
  location: { type: "Point", coordinates: [lng, lat] },
});

const compareSchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(","))
    .pipe(z.array(objectId).min(1).max(4)),
});

router.get("/options", (req, res) => {
  res.json({
    cities: CITIES,
    amenities: AMENITIES,
    facings: FACINGS,
    demoSite: process.env.SEED_DEMO === "true",
  });
});

router.get(
  "/get",
  validate(searchSchema, "query"),
  asyncHandler(async (req, res) => {
    const { sort, limit, page, ...filters } = req.valid;
    const { query, understood, keywords } = buildQuery(filters);
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit),
      Listing.countDocuments(query),
    ]);
    res.json({
      listings,
      total,
      page,
      pages: Math.ceil(total / limit),
      understood,
      keywords,
    });
  })
);

// Light pins for the map view
router.get(
  "/map",
  validate(searchSchema, "query"),
  asyncHandler(async (req, res) => {
    const { sort, limit, page, ...filters } = req.valid;
    const { query } = buildQuery(filters);
    query.location = query.location || { $exists: true };
    const [pins, total] = await Promise.all([
      Listing.find(query)
        .select("name effectivePrice location bedrooms occupancy imageUrls address")
        .sort(SORTS[sort])
        .limit(300),
      Listing.countDocuments(query),
    ]);
    res.json({ pins, total });
  })
);

router.get(
  "/compare",
  validate(compareSchema, "query"),
  asyncHandler(async (req, res) => {
    const listings = await Listing.find({
      _id: { $in: req.valid.ids },
      type: "rent",
    });
    const ordered = req.valid.ids
      .map((id) => listings.find((item) => item._id.equals(id)))
      .filter(Boolean);
    const enriched = await Promise.all(
      ordered.map(async (listing) => ({
        ...listing.toObject(),
        fairness: await rateFairness(listing),
      }))
    );
    res.json(enriched);
  })
);

// Ranks listings by similarity to what the user saved and viewed
router.get(
  "/recommended",
  optionalUser,
  asyncHandler(async (req, res) => {
    const limit = 8;
    const user = req.user && (await User.findById(req.user.id));
    const history = user ? [...user.saved, ...user.recentViews] : [];
    const seen = await Listing.find({ _id: { $in: history } });
    if (seen.length === 0) {
      const latest = await Listing.find({ offer: true, type: "rent" })
        .sort({ createdAt: -1 })
        .limit(limit);
      return res.json({ personalized: false, listings: latest });
    }
    const profile = buildProfile(seen);
    const candidates = await Listing.find({
      _id: { $nin: history },
      type: "rent",
      userRef: { $ne: req.user.id },
      city: profile.city,
    })
      .sort({ createdAt: -1 })
      .limit(300);
    res.json({
      personalized: true,
      listings: rankListings(candidates, profile, limit),
    });
  })
);

router.get(
  "/similar/:id",
  validateId(),
  asyncHandler(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      throw new HttpError(404, "Listing not found");
    }
    const candidates = await Listing.find({
      _id: { $ne: listing._id },
      city: listing.city,
      type: "rent",
    })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(rankListings(candidates, buildProfile([listing]), 4));
  })
);

router.get(
  "/get/:id",
  validateId(),
  optionalUser,
  asyncHandler(async (req, res) => {
    const listing = await Listing.findOne({ _id: req.params.id, type: "rent" });
    if (!listing) {
      throw new HttpError(404, "Listing not found");
    }
    const owner = await User.findById(listing.userRef).select("username createdAt");
    if (req.user?.id !== listing.userRef) {
      await Listing.updateOne({ _id: listing._id }, { $inc: { views: 1 } });
    }
    if (req.user && listing.userRef !== req.user.id) {
      await User.findByIdAndUpdate(req.user.id, [
        {
          $set: {
            recentViews: {
              $slice: [
                {
                  $concatArrays: [
                    [listing._id],
                    {
                      $filter: {
                        input: { $ifNull: ["$recentViews", []] },
                        cond: { $ne: ["$$this", listing._id] },
                      },
                    },
                  ],
                },
                20,
              ],
            },
          },
        },
      ], { updatePipeline: true });
    }
    const [lng, lat] = listing.location?.coordinates || [];
    res.json({
      ...listing.toObject(),
      owner,
      fairness: await rateFairness(listing),
      nearby: lat === undefined ? [] : nearbyLandmarks(listing.city, lat, lng),
    });
  })
);

const findOwnListing = async (id, userId) => {
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new HttpError(404, "Listing not found");
  }
  if (listing.userRef !== userId) {
    throw new HttpError(403, "You can only change your own listings");
  }
  return listing;
};

router.post(
  "/create",
  verifyToken,
  validate(listingSchema),
  asyncHandler(async (req, res) => {
    const listing = await Listing.create({
      ...toDocument(req.valid),
      userRef: req.user.id,
    });
    await notifySearchAlerts(listing);
    res.status(201).json(listing);
  })
);

router.post(
  "/update/:id",
  validateId(),
  verifyToken,
  validate(listingSchema),
  asyncHandler(async (req, res) => {
    const listing = await findOwnListing(req.params.id, req.user.id);
    listing.set(toDocument(req.valid));
    await listing.save();
    res.json(listing);
  })
);

router.delete(
  "/delete/:id",
  validateId(),
  verifyToken,
  asyncHandler(async (req, res) => {
    const listing = await findOwnListing(req.params.id, req.user.id);
    await Promise.all([
      listing.deleteOne(),
      Inquiry.deleteMany({ listing: listing._id }),
      Visit.deleteMany({ listing: listing._id }),
      User.updateMany(
        {},
        { $pull: { saved: listing._id, recentViews: listing._id } }
      ),
    ]);
    res.json({ success: true, message: "Listing deleted" });
  })
);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const cloudinaryReady = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const EXTENSIONS = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(
        null,
        `${Date.now()}-${Math.round(Math.random() * 1e9)}${EXTENSIONS[file.mimetype]}`
      ),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new HttpError(400, "Only PNG, JPG and WEBP images are allowed"));
    }
  },
});

// Uses Cloudinary when configured, otherwise keeps the file in api/uploads
router.post(
  "/upload",
  verifyToken,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, "Please choose an image");
    }
    if (!cloudinaryReady()) {
      return res.json({ url: `/uploads/${req.file.filename}` });
    }
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "nestquestors",
      });
      res.json({ url: result.secure_url });
    } finally {
      await fs.promises.rm(req.file.path, { force: true });
    }
  })
);

export default router;
