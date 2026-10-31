import mongoose from "mongoose";

const searchAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true },
    query: { type: String, required: true },
  },
  { timestamps: true }
);

const SearchAlert = mongoose.model("SearchAlert", searchAlertSchema);

export default SearchAlert;
