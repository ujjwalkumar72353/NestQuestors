import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const inquirySchema = new mongoose.Schema(
  {
    listing: { type: ObjectId, ref: "Listing", required: true },
    sender: { type: ObjectId, ref: "User", required: true, index: true },
    owner: { type: ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Inquiry = mongoose.model("Inquiry", inquirySchema);

export default Inquiry;
