import { z } from "zod";
import { CITIES, OCCUPANCIES } from "./cities.js";
import { parseSmartQuery } from "./smartSearch.js";

export const MAX_RESULTS = 48;

const flag = z.enum(["true", "false"]).transform((value) => value === "true");
const count = z.coerce.number().int().min(0);
const coordinate = z.coerce.number().min(-180).max(180);

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
  searchTerm: z.string().max(100).optional(),
  city: z.enum(CITIES).optional().or(z.literal("").transform(() => undefined)),
  occupancy: z.enum(OCCUPANCIES).optional(),
  bedrooms: count.optional(),
  minPrice: count.optional(),
  maxPrice: count.optional(),
  minArea: count.optional(),
  furnished: flag.optional(),
  parking: flag.optional(),
  bachelorFriendly: flag.optional(),
  offer: flag.optional(),
  petsAllowed: flag.optional(),
  brokerageFree: flag.optional(),
  gatedSociety: flag.optional(),
  south: coordinate.optional(),
  west: coordinate.optional(),
  north: coordinate.optional(),
  east: coordinate.optional(),
  lat: coordinate.optional(),
  lng: coordinate.optional(),
  radiusKm: z.coerce.number().min(0.5).max(50).optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "bedrooms", "area"])
    .default("newest"),
  limit: z.coerce.number().int().min(1).max(MAX_RESULTS).default(12),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { effectivePrice: 1 },
  price_desc: { effectivePrice: -1 },
  bedrooms: { bedrooms: -1, createdAt: -1 },
  area: { carpetArea: -1 },
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const EXACT_FIELDS = [
  "city",
  "occupancy",
  "furnished",
  "parking",
  "bachelorFriendly",
  "offer",
  "petsAllowed",
  "brokerageFree",
  "gatedSociety",
];

export const buildQuery = (input) => {
  const smart = parseSmartQuery(input.q);
  const options = {
    ...smart.filters,
    ...Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined)
    ),
  };
  const query = { type: "rent" };

  EXACT_FIELDS.forEach((field) => {
    if (options[field] !== undefined) query[field] = options[field];
  });
  if (options.bedrooms) query.bedrooms = options.bedrooms;
  if (options.minArea) query.carpetArea = { $gte: options.minArea };
  if (options.minPrice || options.maxPrice) {
    query.effectivePrice = {};
    if (options.minPrice) query.effectivePrice.$gte = options.minPrice;
    if (options.maxPrice) query.effectivePrice.$lte = options.maxPrice;
  }

  const { south, west, north, east, lat, lng, radiusKm } = options;
  if ([south, west, north, east].every((value) => value !== undefined)) {
    query.location = {
      $geoWithin: {
        $box: [
          [west, south],
          [east, north],
        ],
      },
    };
  } else if (lat !== undefined && lng !== undefined) {
    query.location = {
      $geoWithin: { $centerSphere: [[lng, lat], (radiusKm || 5) / 6378.1] },
    };
  }

  const keywords = [smart.keywords, options.searchTerm].filter(Boolean).join(" ");
  if (keywords) {
    const pattern = new RegExp(escapeRegex(keywords), "i");
    query.$or = [{ name: pattern }, { address: pattern }, { description: pattern }];
  }
  return { query, understood: smart.filters, keywords: smart.keywords };
};
