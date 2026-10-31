import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const visitSchema = new mongoose.Schema(
  {
    listing: { type: ObjectId, ref: "Listing", required: true, index: true },
    renter: { type: ObjectId, ref: "User", required: true, index: true },
    owner: { type: ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    slot: { type: String, enum: ["morning", "afternoon", "evening"], required: true },
    status: {
      type: String,
      enum: ["requested", "confirmed", "declined", "cancelled"],
      default: "requested",
    },
  },
  { timestamps: true }
);

const Visit = mongoose.model("Visit", visitSchema);

export default Visit;
