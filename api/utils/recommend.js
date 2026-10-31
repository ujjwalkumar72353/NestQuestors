const average = (values) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const mostCommon = (values) => {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
};

export const buildProfile = (listings) => ({
  city: mostCommon(listings.map((item) => item.city)),
  bedrooms: mostCommon(listings.map((item) => item.bedrooms)),
  furnishedShare: average(listings.map((item) => (item.furnished ? 1 : 0))),
  price: average(listings.map((item) => item.effectivePrice)),
});

// Higher is closer to what the renter has saved and viewed
export const scoreListing = (listing, profile) => {
  let score = 0;
  if (listing.city === profile.city) score += 4;
  score += Math.max(0, 2 - Math.abs(listing.bedrooms - profile.bedrooms));
  score += listing.furnished ? profile.furnishedShare : 1 - profile.furnishedShare;
  if (profile.price > 0) {
    const gap = Math.abs(listing.effectivePrice - profile.price) / profile.price;
    score += Math.max(0, 3 - gap * 3);
  }
  return score;
};

export const rankListings = (listings, profile, limit) =>
  listings
    .map((listing) => ({ listing, score: scoreListing(listing, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.listing);
