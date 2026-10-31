import assert from "node:assert/strict";
import { test } from "node:test";
import { buildProfile, rankListings } from "../utils/recommend.js";

const home = (id, overrides = {}) => ({
  id,
  city: "Pune",
  type: "rent",
  bedrooms: 2,
  furnished: true,
  effectivePrice: 20000,
  ...overrides,
});

test("ranks the closest home first", () => {
  const profile = buildProfile([home("a"), home("b", { bedrooms: 2 })]);
  const ranked = rankListings(
    [
      home("far", { city: "Delhi", effectivePrice: 90000 }),
      home("price", { effectivePrice: 40000 }),
      home("close", { effectivePrice: 21000 }),
    ],
    profile,
    3
  );
  assert.deepEqual(ranked.map((item) => item.id), ["close", "price", "far"]);
});

test("respects the limit", () => {
  const profile = buildProfile([home("a")]);
  assert.equal(rankListings([home("b"), home("c")], profile, 1).length, 1);
});
