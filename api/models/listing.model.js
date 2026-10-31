import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: "", index: true },
    regularPrice: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    effectivePrice: { type: Number, index: true },
    bathrooms: { type: Number, required: true },
    bedrooms: { type: Number, required: true },
    furnished: { type: Boolean, required: true },
    parking: { type: Boolean, required: true },
    bachelorFriendly: { type: Boolean, default: false },
    amenities: { type: [String], default: [] },
    type: { type: String, required: true, enum: ["rent", "sale"] },
    occupancy: {
      type: String,
      enum: ["full", "private", "shared", "pg"],
      default: "full",
      index: true,
    },
    carpetArea: { type: Number, default: 0 },
    floor: { type: Number, default: 0 },
    totalFloors: { type: Number, default: 0 },
    balconies: { type: Number, default: 0 },
    facing: { type: String, default: "" },
    propertyAge: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    maintenance: { type: Number, default: 0 },
    availableFrom: { type: Date },
    leaseMonths: { type: Number, default: 11 },
    foodPreference: { type: String, enum: ["any", "veg"], default: "any" },
    petsAllowed: { type: Boolean, default: false },
    gatedSociety: { type: Boolean, default: false },
    brokerageFree: { type: Boolean, default: true },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined },
    },
    views: { type: Number, default: 0 },
    offer: { type: Boolean, required: true },
    imageUrls: { type: [String], required: true },
    userRef: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

listingSchema.index({ city: 1, type: 1, effectivePrice: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ location: "2dsphere" });

listingSchema.pre("save", function setEffectivePrice() {
  this.effectivePrice =
    this.offer && this.discountPrice > 0 ? this.discountPrice : this.regularPrice;
});

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;
