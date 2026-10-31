import Listing from "../models/listing.model.js";

// Compares rent with similar homes in the same city
export const rateFairness = async (listing) => {
  const [peers] = await Listing.aggregate([
    {
      $match: {
        type: "rent",
        city: listing.city,
        bedrooms: listing.bedrooms,
        occupancy: listing.occupancy,
      },
    },
    { $group: { _id: null, average: { $avg: "$effectivePrice" }, count: { $sum: 1 } } },
  ]);
  if (!peers || peers.count < 5) {
    return null;
  }
  const difference = Math.round(
    ((listing.effectivePrice - peers.average) / peers.average) * 100
  );
  const label =
    difference <= -8 ? "Great value" : difference <= 8 ? "Fair rent" : "Above average";
  return {
    label,
    difference,
    average: Math.round(peers.average),
    sample: peers.count,
  };
};

export const cityInsights = async (city) => {
  const match = { type: "rent", city };
  const [byBedrooms, byArea, summary] = await Promise.all([
    Listing.aggregate([
      { $match: { ...match, occupancy: "full" } },
      {
        $group: {
          _id: "$bedrooms",
          average: { $avg: "$effectivePrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Listing.aggregate([
      { $match: { ...match, occupancy: "full", bedrooms: 2 } },
      {
        $addFields: {
          area: { $arrayElemAt: [{ $split: ["$address", ", "] }, 1] },
        },
      },
      { $group: { _id: "$area", average: { $avg: "$effectivePrice" }, count: { $sum: 1 } } },
      { $sort: { average: 1 } },
    ]),
    Listing.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          bachelor: { $sum: { $cond: ["$bachelorFriendly", 1, 0] } },
          noBrokerage: { $sum: { $cond: ["$brokerageFree", 1, 0] } },
          perSqft: {
            $avg: {
              $cond: [
                { $gt: ["$carpetArea", 0] },
                { $divide: ["$effectivePrice", "$carpetArea"] },
                null,
              ],
            },
          },
        },
      },
    ]),
  ]);
  const totals = summary[0] || { total: 0, bachelor: 0, noBrokerage: 0, perSqft: 0 };
  return {
    city,
    total: totals.total,
    bachelorShare: totals.total ? Math.round((totals.bachelor / totals.total) * 100) : 0,
    noBrokerageShare: totals.total ? Math.round((totals.noBrokerage / totals.total) * 100) : 0,
    rentPerSqft: Math.round(totals.perSqft || 0),
    byBedrooms: byBedrooms.map((row) => ({
      bedrooms: row._id,
      average: Math.round(row.average),
      count: row.count,
    })),
    byArea: byArea.map((row) => ({
      area: row._id,
      average: Math.round(row.average),
      count: row.count,
    })),
  };
};
