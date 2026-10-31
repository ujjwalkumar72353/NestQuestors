import { CITIES } from "./cities.js";

const ALIASES = {
  bangalore: "Bengaluru",
  blr: "Bengaluru",
  gurgaon: "Gurugram",
  hyd: "Hyderabad",
  bombay: "Mumbai",
  madras: "Chennai",
  "new delhi": "Delhi",
};

const UNITS = { k: 1e3, thousand: 1e3, l: 1e5, lac: 1e5, lakh: 1e5, lakhs: 1e5, cr: 1e7, crore: 1e7 };
const AMOUNT = "(\\d+(?:\\.\\d+)?)\\s*(k|thousand|lakhs?|lac|l|crore|cr)?\\b";

const toAmount = (value, unit) =>
  Math.round(Number(value) * (UNITS[unit?.toLowerCase()] || 1));

const STOP_WORDS =
  /\b(i|need|want|looking|for|rent|rental|rented|lease|buy|sale|purchase|a|an|the|in|at|near|with|and|to|find|me|flat|flats|apartment|apartments|house|houses|home|homes|room|rooms|property|properties|please|on|of|place|bachelors?|friendly|allowed|ok)\b/g;

// Turns everyday wording into listing filters. Whatever it can't place stays as keywords.
export const parseSmartQuery = (input = "") => {
  let text = ` ${input.toLowerCase().replace(/[₹,]/g, " ")} `;
  const filters = {};
  const take = (pattern, apply) => {
    const match = text.match(pattern);
    if (match) {
      apply(match);
      text = text.replace(match[0], " ");
    }
  };

  take(
    new RegExp(`\\b(?:between|from)\\s*${AMOUNT}\\s*(?:and|to|-)\\s*${AMOUNT}`),
    (m) => {
      filters.minPrice = toAmount(m[1], m[2] || m[4]);
      filters.maxPrice = toAmount(m[3], m[4]);
    }
  );
  take(
    new RegExp(`\\b(?:under|below|upto|up to|within|less than|max|budget(?: of)?)\\s*${AMOUNT}`),
    (m) => {
      filters.maxPrice = toAmount(m[1], m[2]);
    }
  );
  take(new RegExp(`\\b(?:above|over|more than|min)\\s*${AMOUNT}`), (m) => {
    filters.minPrice = toAmount(m[1], m[2]);
  });
  take(/\b(\d)\s*(?:bhk|bed(?:room)?s?)\b/, (m) => {
    filters.bedrooms = Number(m[1]);
  });
  take(/\b(?:pg|paying guest|hostel)\b/, () => {
    filters.occupancy = "pg";
  });
  take(/\b(?:shared room|sharing|flatmates?|roommates?)\b/, () => {
    filters.occupancy = "shared";
  });
  take(/\b(?:private room|single room)\b/, () => {
    filters.occupancy = "private";
  });
  take(/\bun-?furnished\b/, () => {
    filters.furnished = false;
  });
  take(/\b(?:fully |semi[- ])?furnished\b/, () => {
    filters.furnished = true;
  });
  take(/\b(?:car )?parking\b/, () => {
    filters.parking = true;
  });
  take(/\bbachelors?\b/, () => {
    filters.bachelorFriendly = true;
  });
  take(/\b(?:pets?|dogs?|cats?)(?: friendly| allowed)?\b/, () => {
    filters.petsAllowed = true;
  });
  take(/\b(?:no brokerage|without broker|brokerage free|no broker)\b/, () => {
    filters.brokerageFree = true;
  });
  take(/\bgated(?: society| community)?\b/, () => {
    filters.gatedSociety = true;
  });
  take(/\b(?:offers?|deals?|discount(?:ed)?)\b/, () => {
    filters.offer = true;
  });

  const names = [
    ...Object.entries(ALIASES),
    ...CITIES.map((city) => [city.toLowerCase(), city]),
  ];
  for (const [name, city] of names) {
    if (text.includes(` ${name} `)) {
      filters.city = city;
      text = text.replace(name, " ");
      break;
    }
  }

  const keywords = text.replace(STOP_WORDS, " ").replace(/\s+/g, " ").trim();
  return { filters, keywords };
};
