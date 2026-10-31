const number = new Intl.NumberFormat("en-IN");

export const OCCUPANCY_LABELS = {
  full: "Full home",
  private: "Private room",
  shared: "Shared room",
  pg: "PG",
};

export const SLOT_LABELS = {
  morning: "Morning (9 AM to 12 PM)",
  afternoon: "Afternoon (12 PM to 4 PM)",
  evening: "Evening (4 PM to 8 PM)",
};

export const formatPrice = (value) => {
  return `₹${number.format(value)}`;
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const describeFilter = (key, value) =>
  ({
    bedrooms: `${value} BHK`,
    occupancy: OCCUPANCY_LABELS[value],
    petsAllowed: "Pets allowed",
    brokerageFree: "No brokerage",
    gatedSociety: "Gated society",
    city: value,
    minPrice: `From ${formatPrice(value)}`,
    maxPrice: `Up to ${formatPrice(value)}`,
    furnished: value ? "Furnished" : "Unfurnished",
    parking: "Parking",
    bachelorFriendly: "Bachelor friendly",
    offer: "On offer",
  })[key];
