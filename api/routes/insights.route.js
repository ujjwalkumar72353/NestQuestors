import express from "express";
import { CITIES } from "../utils/cities.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { cityInsights } from "../utils/insights.js";

const router = express.Router();

router.get(
  "/:city",
  asyncHandler(async (req, res) => {
    if (!CITIES.includes(req.params.city)) {
      throw new HttpError(404, "City not found");
    }
    res.json(await cityInsights(req.params.city));
  })
);

export default router;
