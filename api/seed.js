import { randomBytes } from "node:crypto";
import bcryptjs from "bcryptjs";
import Inquiry from "./models/inquiry.model.js";
import Listing from "./models/listing.model.js";
import User from "./models/user.model.js";
import { AMENITIES, CITIES, FACINGS } from "./utils/cities.js";
import { AREA_COORDINATES } from "./utils/geo.js";

export const DEMO_PASSWORD = "demo12345";
const LISTING_COUNT = 1200;

const PHOTOS = [
  "photo-1502672260266-1c1ef2d93688",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1493809842364-78817add7ffb",
  "photo-1484154218962-a197022b5858",
  "photo-1505691938895-1758d7feb511",
  "photo-1586023492125-27b2c045efd7",
  "photo-1554995207-c18c203602cb",
  "photo-1600585154340-be6161a56a0c",
  "photo-1512917774080-9991f1c4c750",
  "photo-1600607687939-ce8a6c25118c",
  "photo-1598928506311-c55ded91a20c",
].map(
  (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`
);

const STYLES = ["Sunny", "Modern", "Spacious", "Cozy", "Bright", "Quiet", "Airy", "Elegant"];
const VIEWS = ["a green courtyard", "the city skyline", "a quiet lane", "the society garden", "open sky"];
const KITCHENS = ["a modular kitchen with chimney", "a well-lit kitchen with storage", "an open kitchen with a breakfast counter"];
const NEARBY = ["cafes and restaurants", "grocery stores", "gyms and coworking spaces", "pharmacies and clinics", "bus stops and cab pickup points"];

// Fixed seed, so every fresh setup gets the same demo data
const createRandom = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const OCCUPANCY_LABELS = {
  private: "Private room",
  shared: "Shared room",
  pg: "PG stay",
};

const describe = (home, pick) => {
  const kind =
    home.occupancy === "full"
      ? `${home.bedrooms}BHK ${home.furnished ? "furnished" : "unfurnished"} home`
      : OCCUPANCY_LABELS[home.occupancy].replace("Private", "private").replace("Shared", "shared");
  const building = home.gatedSociety
    ? "a gated society with round-the-clock security"
    : "a well-kept residential building";
  const tenants = home.bachelorFriendly
    ? "Bachelors and working professionals are welcome, and the owner is comfortable with flat sharing."
    : "The owner prefers families or long-term tenants.";
  const pets = home.petsAllowed ? "Pets are allowed." : "Pets are not allowed.";
  const food = home.foodPreference === "veg" ? "This is a vegetarian-only home." : "There are no food restrictions.";
  const first = NEARBY.indexOf(pick(NEARBY));
  const nearby = [NEARBY[first], NEARBY[(first + 1) % NEARBY.length]];
  return [
    `This ${kind} in ${home.area} offers about ${home.carpetArea} sq ft of carpet area on floor ${home.floor} of ${home.totalFloors} in ${building}. The ${home.facing.toLowerCase()}-facing layout brings in natural light through the day, with views of ${pick(VIEWS)}.`,
    `Inside, you get ${pick(KITCHENS)}, ${home.bathrooms} bathroom${home.bathrooms > 1 ? "s" : ""} and ${home.balconies} balcon${home.balconies === 1 ? "y" : "ies"}. ${home.furnished ? "It comes ready to move in, with beds, wardrobes, a sofa and essential appliances." : "It's unfurnished, so you can set it up with your own furniture."}`,
    `${home.area} is a popular choice for working professionals, with ${nearby[0]} and ${nearby[1]} close by. ${tenants} ${pets} ${food}`,
    `The minimum lease is ${home.leaseMonths} months, with a ${home.deposit.toLocaleString("en-IN")} rupee security deposit and ${home.maintenance.toLocaleString("en-IN")} rupees monthly maintenance. ${home.brokerageFree ? "There is no brokerage, so you deal directly with the owner." : "A standard brokerage applies."}`,
  ].join("\n\n");
};

const buildListing = (index, owners, random) => {
  const pick = (items) => items[Math.floor(random() * items.length)];
  const city = CITIES[index % CITIES.length];
  const area = pick(Object.keys(AREA_COORDINATES[city]));
  const [areaLat, areaLng] = AREA_COORDINATES[city][area];
  const roll = random();
  const occupancy =
    roll < 0.6 ? "full" : roll < 0.75 ? "private" : roll < 0.9 ? "shared" : "pg";
  const isFullHome = occupancy === "full";
  const bedrooms = isFullHome ? 1 + Math.floor(random() * 4) : 1;
  const furnished = occupancy === "pg" || random() < 0.6;
  const base = isFullHome
    ? 9000 + bedrooms * 8000 + Math.floor(random() * 8000)
    : { private: 9000, shared: 5500, pg: 7000 }[occupancy] + Math.floor(random() * 5000);
  const regularPrice = Math.round(base / 500) * 500;
  const offer = random() < 0.2;
  const start = Math.floor(random() * PHOTOS.length);
  const carpetArea = isFullHome
    ? 320 + bedrooms * 330 + Math.floor(random() * 200)
    : 120 + Math.floor(random() * 160);
  const totalFloors = 4 + Math.floor(random() * 18);
  const home = {
    area,
    carpetArea,
    totalFloors,
    floor: 1 + Math.floor(random() * totalFloors),
    occupancy,
    bedrooms,
    bathrooms: isFullHome ? Math.max(1, bedrooms - Math.floor(random() * 2)) : 1,
    balconies: Math.floor(random() * 3),
    furnished,
    facing: pick(FACINGS),
    gatedSociety: random() < 0.55,
    bachelorFriendly: occupancy === "full" ? random() < 0.65 : true,
    petsAllowed: random() < 0.25,
    foodPreference: random() < 0.15 ? "veg" : "any",
    leaseMonths: pick([6, 11, 11, 11, 12]),
    deposit: regularPrice * pick([2, 2, 3]),
    maintenance: Math.round((isFullHome ? 1000 + bedrooms * 700 : 500) / 100) * 100,
    brokerageFree: random() < 0.8,
  };
  const name = isFullHome
    ? `${pick(STYLES)} ${bedrooms}BHK in ${area}`
    : `${pick(STYLES)} ${OCCUPANCY_LABELS[occupancy].replace("Private", "private").replace("Shared", "shared")} in ${area}`;
  const { area: _area, ...fields } = home;
  return {
    ...fields,
    name,
    description: describe(home, pick),
    address: `${10 + (index % 480)}, ${area}, ${city}`,
    city,
    regularPrice,
    discountPrice: offer ? Math.round((regularPrice * 0.9) / 500) * 500 : 0,
    parking: random() < 0.6,
    amenities: AMENITIES.filter(() => random() < 0.45),
    type: "rent",
    offer,
    propertyAge: Math.floor(random() * 15),
    availableFrom: new Date(Date.now() + Math.floor(random() * 45) * 86400000),
    imageUrls: [0, 1, 2, 3].map((step) => PHOTOS[(start + step) % PHOTOS.length]),
    location: {
      type: "Point",
      coordinates: [
        areaLng + (random() - 0.5) * 0.024,
        areaLat + (random() - 0.5) * 0.024,
      ],
    },
    views: Math.floor(random() * 400),
    userRef: owners[index % owners.length]._id.toString(),
  };
};

const findOrCreateUser = async (values) =>
  (await User.findOne({ email: values.email })) || User.create(values);

// Only ever fills a database with no listings. Public sites get an unguessable
// owner password, because the local demo password is written in this repository.
export const seedDemoData = async ({ publicSite = false } = {}) => {
  if ((await Listing.estimatedDocumentCount()) > 0) {
    return;
  }
  const secret = publicSite ? randomBytes(32).toString("hex") : DEMO_PASSWORD;
  const password = await bcryptjs.hash(secret, 10);
  const [owner, renter] = await Promise.all([
    findOrCreateUser({ username: "arjun_owner", email: "owner@demo.com", password }),
    findOrCreateUser({ username: "rohan_renter", email: "renter@demo.com", password }),
  ]);
  const random = createRandom(42);
  const docs = Array.from({ length: LISTING_COUNT }, (_, index) => {
    const listing = new Listing(buildListing(index, [owner], random));
    listing.effectivePrice =
      listing.offer && listing.discountPrice > 0
        ? listing.discountPrice
        : listing.regularPrice;
    return listing.toObject();
  });
  const listings = await Listing.insertMany(docs);
  await Inquiry.create({
    listing: listings[0]._id,
    sender: renter._id,
    owner: owner._id,
    message: "Hi, is this home available from next month?",
  });
  console.log(`Demo data ready: ${LISTING_COUNT} listings`);
};
