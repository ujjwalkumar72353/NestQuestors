import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSmartQuery } from "../utils/smartSearch.js";

const cases = [
  ["2bhk furnished in hyderabad under 25k for bachelors", { bedrooms: 2, furnished: true, city: "Hyderabad", maxPrice: 25000, bachelorFriendly: true }],
  ["1 bhk for rent in bangalore", { bedrooms: 1, city: "Bengaluru" }],
  ["3 bedroom flat in gurgaon under 60k", { bedrooms: 3, city: "Gurugram", maxPrice: 60000 }],
  ["2bhk to buy in pune", { bedrooms: 2, city: "Pune" }],
  ["unfurnished home with parking in pune", { furnished: false, parking: true, city: "Pune" }],
  ["rent between 15k and 30k in delhi", { minPrice: 15000, maxPrice: 30000, city: "Delhi" }],
  ["apartment above 50k in mumbai", { minPrice: 50000, city: "Mumbai" }],
  ["discount offers in noida", { offer: true, city: "Noida" }],
  ["budget 18000 chennai", { maxPrice: 18000, city: "Chennai" }],
  ["pg in hyderabad", { occupancy: "pg", city: "Hyderabad" }],
  ["looking for flatmates in pune", { occupancy: "shared", city: "Pune" }],
  ["pet friendly gated society no brokerage delhi", { petsAllowed: true, gatedSociety: true, brokerageFree: true, city: "Delhi" }],
];

for (const [query, expected] of cases) {
  test(`understands: ${query}`, () => {
    assert.deepEqual(parseSmartQuery(query).filters, expected);
  });
}

test("keeps area names as keywords", () => {
  const { filters, keywords } = parseSmartQuery("2bhk near hitech city in hyderabad");
  assert.equal(filters.city, "Hyderabad");
  assert.equal(keywords, "hitech city");
});

test("handles empty input", () => {
  assert.deepEqual(parseSmartQuery(""), { filters: {}, keywords: "" });
});
