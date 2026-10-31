import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: "" },
    saved: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
    recentViews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
