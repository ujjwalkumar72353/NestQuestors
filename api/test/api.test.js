import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

process.env.JWT_SECRET = "test-secret";
process.env.AUTH_RATE_LIMIT = "10000";
process.env.CHAT_RATE_LIMIT = "10000";

const { default: createApp } = await import("../app.js");
const { default: User } = await import("../models/user.model.js");
const { default: Listing } = await import("../models/listing.model.js");
const http = await import("node:http");

let mongo, app, owner, renter, stranger;

const session = async (name) => {
  const agent = request.agent(app);
  const email = `${name}@test.com`;
  await agent
    .post("/api/auth/signup")
    .send({ username: name, email, password: "password123" })
    .expect(201);
  const signin = await agent
    .post("/api/auth/signin")
    .send({ email, password: "password123" })
    .expect(200);
  return { agent, id: signin.body._id, email };
};

const listing = (overrides = {}) => ({
  name: "Sunny 2BHK in Baner",
  description: "A bright home close to offices and food options.",
  address: "12, Baner, Pune",
  city: "Pune",
  regularPrice: 20000,
  discountPrice: 0,
  bathrooms: 2,
  bedrooms: 2,
  furnished: true,
  parking: true,
  bachelorFriendly: true,
  amenities: ["WiFi"],
  carpetArea: 900,
  deposit: 40000,
  maintenance: 2000,
  lat: 18.559,
  lng: 73.7868,
  offer: false,
  imageUrls: ["/uploads/a.jpg"],
  ...overrides,
});

const create = async (overrides) => {
  const res = await owner.agent
    .post("/api/listing/create")
    .send(listing(overrides))
    .expect(201);
  return res.body;
};

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  await User.syncIndexes();
  owner = await session("owner");
  renter = await session("renter");
  stranger = await session("stranger");
});

test("auth: bad input, wrong password and duplicates are rejected", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({ username: "ab", email: "bad", password: "x" })
    .expect(400);
  await request(app)
    .post("/api/auth/signin")
    .send({ email: owner.email, password: "wrong" })
    .expect(401);
  await request(app)
    .post("/api/auth/signin")
    .send({ email: { $gt: "" }, password: { $gt: "" } })
    .expect(400);
  await request(app)
    .post("/api/auth/signup")
    .send({ username: "other", email: "OWNER@test.com", password: "password123" })
    .expect(409);
});

test("auth: the unverified Google route no longer exists", async () => {
  await request(app)
    .post("/api/auth/google")
    .send({ email: owner.email, name: "x" })
    .expect(404);
});

test("auth: session cookie is httpOnly with sameSite and expiry", async () => {
  const res = await request(app)
    .post("/api/auth/signin")
    .send({ email: owner.email, password: "password123" })
    .expect(200);
  const cookie = res.headers["set-cookie"][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=/);
  assert.equal(JSON.stringify(res.body).includes("password"), false);
});

test("auth: me works and signout ends the session", async () => {
  await owner.agent.get("/api/auth/me").expect(200);
  await owner.agent.post("/api/auth/signout").expect(200);
  await owner.agent.get("/api/auth/me").expect(401);
});

test("auth: session answers guests without an error", async () => {
  const res = await request(app).get("/api/auth/session").expect(200);
  assert.equal(res.body, null);
  const signedIn = await owner.agent.get("/api/auth/session").expect(200);
  assert.equal(signedIn.body._id, owner.id);
  assert.equal(JSON.stringify(signedIn.body).includes("password"), false);
});

test("listing: requires login and valid data", async () => {
  await request(app).post("/api/listing/create").send(listing()).expect(401);
  await owner.agent
    .post("/api/listing/create")
    .send(listing({ imageUrls: [] }))
    .expect(400);
  await owner.agent
    .post("/api/listing/create")
    .send(listing({ offer: true, discountPrice: 25000 }))
    .expect(400);
});

test("listing: owner comes from the session, not the request", async () => {
  const res = await owner.agent
    .post("/api/listing/create")
    .send({ ...listing(), userRef: stranger.id })
    .expect(201);
  assert.equal(res.body.userRef, owner.id);
});

test("listing: only the owner can update or delete", async () => {
  const { _id } = await create();
  await stranger.agent
    .post(`/api/listing/update/${_id}`)
    .send(listing())
    .expect(403);
  await stranger.agent.delete(`/api/listing/delete/${_id}`).expect(403);
  await owner.agent
    .post(`/api/listing/update/${_id}`)
    .send(listing({ name: "Updated 2BHK home" }))
    .expect(200);
  await owner.agent.delete(`/api/listing/delete/${_id}`).expect(200);
  await request(app).get(`/api/listing/get/${_id}`).expect(404);
});

test("listing: missing and malformed ids return 404 without crashing", async () => {
  await owner.agent
    .delete("/api/listing/delete/507f1f77bcf86cd799439011")
    .expect(404);
  await request(app).get("/api/listing/get/not-an-id").expect(404);
});

test("listing: effective price follows offers on create and update", async () => {
  const created = await create({ offer: true, discountPrice: 15000 });
  assert.equal(created.effectivePrice, 15000);
  const updated = await owner.agent
    .post(`/api/listing/update/${created._id}`)
    .send(listing({ offer: false, discountPrice: 0 }))
    .expect(200);
  assert.equal(updated.body.effectivePrice, 20000);
});

test("search: filters, pagination and totals", async () => {
  await create();
  await create({ city: "Delhi", address: "4, Saket, Delhi" });
  await create({ bedrooms: 3 });
  const res = await request(app)
    .get("/api/listing/get?city=Pune&bedrooms=2&limit=1")
    .expect(200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.pages, 1);
  const all = await request(app).get("/api/listing/get?limit=2&page=2").expect(200);
  assert.equal(all.body.total, 3);
  assert.equal(all.body.listings.length, 1);
});

test("search: smart query filters results and reports what it understood", async () => {
  await create();
  await create({ regularPrice: 40000 });
  await create({ city: "Delhi", address: "4, Saket, Delhi" });
  const res = await request(app)
    .get("/api/listing/get")
    .query({ q: "2bhk in pune under 25k" })
    .expect(200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.understood.city, "Pune");
  assert.equal(res.body.understood.maxPrice, 25000);
});

test("rentals only: buy is rejected and old sale listings stay hidden", async () => {
  const created = await owner.agent
    .post("/api/listing/create")
    .send({ ...listing(), type: "sale" })
    .expect(201);
  assert.equal(created.body.type, "rent");

  const old = await create({ name: "Old sale listing" });
  await Listing.updateOne({ _id: old._id }, { type: "sale" });
  const search = await request(app).get("/api/listing/get").expect(200);
  assert.equal(search.body.total, 1);
  await request(app).get(`/api/listing/get/${old._id}`).expect(404);
  await renter.agent.post(`/api/user/saved/${old._id}`).expect(404);

  const mine = await owner.agent.get("/api/user/listings").expect(200);
  assert.equal(mine.body.length, 2);
});

test("search: bad regex, sort and huge limits are safe", async () => {
  await create();
  const regex = await request(app)
    .get("/api/listing/get")
    .query({ searchTerm: "(((" })
    .expect(200);
  assert.equal(regex.body.total, 0);
  await request(app).get("/api/listing/get?sort=password").expect(400);
  await request(app).get("/api/listing/get?limit=100000").expect(400);
});

test("saved: toggle, list and cleanup when a listing is deleted", async () => {
  const { _id } = await create();
  const on = await renter.agent.post(`/api/user/saved/${_id}`).expect(200);
  assert.equal(on.body.saved, true);
  const saved = await renter.agent.get("/api/user/saved").expect(200);
  assert.equal(saved.body.length, 1);
  await owner.agent.delete(`/api/listing/delete/${_id}`).expect(200);
  const after = await renter.agent.get("/api/user/saved").expect(200);
  assert.equal(after.body.length, 0);
});

test("recommend: strangers get offers, saved history personalizes results", async () => {
  const saved = await create();
  const close = await create({ regularPrice: 21000, name: "Close 2BHK match" });
  await create({
    name: "Costly 4BHK penthouse",
    bedrooms: 4,
    bathrooms: 4,
    regularPrice: 90000,
  });
  const cold = await request(app).get("/api/listing/recommended").expect(200);
  assert.equal(cold.body.personalized, false);

  await renter.agent.post(`/api/user/saved/${saved._id}`).expect(200);
  const res = await renter.agent.get("/api/listing/recommended").expect(200);
  assert.equal(res.body.personalized, true);
  assert.equal(res.body.listings[0]._id, close._id);
  assert.equal(res.body.listings[1].name, "Costly 4BHK penthouse");
  assert.ok(res.body.listings.every((item) => item._id !== saved._id));
});

test("recommend: viewing a listing feeds recommendations", async () => {
  const viewed = await create();
  await create({ name: "Another 2BHK match" });
  await renter.agent.get(`/api/listing/get/${viewed._id}`).expect(200);
  const res = await renter.agent.get("/api/listing/recommended").expect(200);
  assert.equal(res.body.personalized, true);
});

test("inquiry: renter messages owner, others can't read or mark it", async () => {
  const { _id } = await create();
  await request(app)
    .post("/api/inquiry")
    .send({ listing: _id, message: "Is this available?" })
    .expect(401);
  await owner.agent
    .post("/api/inquiry")
    .send({ listing: _id, message: "Is this available?" })
    .expect(400);
  await renter.agent
    .post("/api/inquiry")
    .send({ listing: _id, message: "Is this available?" })
    .expect(201);
  const inbox = await owner.agent.get("/api/inquiry/received").expect(200);
  assert.equal(inbox.body.length, 1);
  assert.equal(inbox.body[0].sender.username, "renter");
  assert.equal(JSON.stringify(inbox.body).includes("password"), false);
  await stranger.agent
    .post(`/api/inquiry/${inbox.body[0]._id}/read`)
    .expect(404);
  await owner.agent.post(`/api/inquiry/${inbox.body[0]._id}/read`).expect(200);
  const sent = await renter.agent.get("/api/inquiry/sent").expect(200);
  assert.equal(sent.body.length, 1);
});

test("account: profile, password and delete with full cleanup", async () => {
  const { _id } = await create();
  await renter.agent
    .post("/api/inquiry")
    .send({ listing: _id, message: "Is this available?" })
    .expect(201);
  await renter.agent.post(`/api/user/saved/${_id}`).expect(200);

  await owner.agent
    .post("/api/user/update")
    .send({ username: "newowner", email: owner.email })
    .expect(200);
  await owner.agent
    .post("/api/user/password")
    .send({ currentPassword: "nope", newPassword: "newpassword1" })
    .expect(400);
  await owner.agent
    .post("/api/user/delete")
    .send({ password: "wrong" })
    .expect(400);
  await owner.agent
    .post("/api/user/delete")
    .send({ password: "password123" })
    .expect(200);

  await request(app).get(`/api/listing/get/${_id}`).expect(404);
  const saved = await renter.agent.get("/api/user/saved").expect(200);
  assert.equal(saved.body.length, 0);
  const sent = await renter.agent.get("/api/inquiry/sent").expect(200);
  assert.equal(sent.body.length, 0);
});

test("upload: requires login, checks type and stores images", async () => {
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64"
  );
  await request(app)
    .post("/api/listing/upload")
    .attach("image", pixel, { filename: "a.png", contentType: "image/png" })
    .expect(401);
  await owner.agent
    .post("/api/listing/upload")
    .attach("image", Buffer.from("<svg>"), {
      filename: "a.svg",
      contentType: "image/svg+xml",
    })
    .expect(400);
  const res = await owner.agent
    .post("/api/listing/upload")
    .attach("image", pixel, { filename: "a.png", contentType: "image/png" })
    .expect(200);
  await request(app).get(res.body.url).expect(200);
});

test("seed data is searchable by price", async () => {
  const { seedDemoData } = await import("../seed.js");
  await mongoose.connection.dropDatabase();
  await User.syncIndexes();
  await seedDemoData();
  assert.equal(await Listing.countDocuments(), 1200);
  const res = await request(app)
    .get("/api/listing/get")
    .query({ q: "2bhk for rent in hyderabad under 40k" })
    .expect(200);
  assert.ok(res.body.total > 0);
  assert.ok(res.body.listings.every((item) => item.effectivePrice <= 40000));
  assert.equal(await Listing.countDocuments({ type: "sale" }), 0);
  const rich = await Listing.findOne({ occupancy: "pg" });
  assert.ok(rich.description.length > 400);
  assert.match(rich.name, /PG stay/);
  assert.ok(rich.deposit > 0 && rich.carpetArea > 0);
  assert.equal(rich.location.coordinates.length, 2);
});

test("map: pins respect bounds and filters", async () => {
  await create();
  await create({ city: "Delhi", address: "4, Saket, Delhi", lat: 28.52, lng: 77.2 });
  const puneOnly = await request(app)
    .get("/api/listing/map?south=18.4&west=73.6&north=18.7&east=73.9")
    .expect(200);
  assert.equal(puneOnly.body.pins.length, 1);
  assert.equal(JSON.stringify(puneOnly.body).includes("description"), false);
  const near = await request(app)
    .get("/api/listing/get?lat=28.52&lng=77.2&radiusKm=3")
    .expect(200);
  assert.equal(near.body.total, 1);
  assert.equal(near.body.listings[0].city, "Delhi");
});

test("details: nearby places, views and fair rent are returned", async () => {
  for (let index = 0; index < 5; index += 1) await create({ regularPrice: 20000 });
  const cheap = await create({ regularPrice: 12000 });
  const res = await renter.agent.get(`/api/listing/get/${cheap._id}`).expect(200);
  assert.ok(res.body.nearby.length > 0);
  assert.ok(res.body.nearby[0].km <= res.body.nearby.at(-1).km);
  assert.equal(res.body.fairness.label, "Great value");
  await owner.agent.get(`/api/listing/get/${cheap._id}`).expect(200);
  const after = await request(app).get(`/api/listing/get/${cheap._id}`).expect(200);
  assert.equal(after.body.views, 1);
});

test("filters: occupancy and smart PG search work", async () => {
  await create();
  await create({ name: "Friendly PG stay", occupancy: "pg" });
  const res = await request(app)
    .get("/api/listing/get")
    .query({ q: "pg in pune" })
    .expect(200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.understood.occupancy, "pg");
});

test("compare: returns homes in order and limits the count", async () => {
  const first = await create();
  const second = await create({ name: "Second 2BHK home" });
  const res = await request(app)
    .get(`/api/listing/compare?ids=${second._id},${first._id}`)
    .expect(200);
  assert.deepEqual(res.body.map((item) => item._id), [second._id, first._id]);
  const ids = Array(5).fill(first._id).join(",");
  await request(app).get(`/api/listing/compare?ids=${ids}`).expect(400);
});

test("visits: full request, confirm and cancel flow with permissions", async () => {
  const { _id } = await create();
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const body = { listing: _id, date, slot: "morning" };
  await owner.agent.post("/api/visit").send(body).expect(400);
  await renter.agent.post("/api/visit").send({ ...body, date: "2020-01-01" }).expect(400);
  const visit = await renter.agent.post("/api/visit").send(body).expect(201);
  await renter.agent.post("/api/visit").send(body).expect(409);

  await stranger.agent
    .post(`/api/visit/${visit.body._id}/status`)
    .send({ status: "confirmed" })
    .expect(404);
  await renter.agent
    .post(`/api/visit/${visit.body._id}/status`)
    .send({ status: "confirmed" })
    .expect(403);
  await owner.agent
    .post(`/api/visit/${visit.body._id}/status`)
    .send({ status: "confirmed" })
    .expect(200);
  const notes = await renter.agent.get("/api/notification").expect(200);
  assert.equal(notes.body[0].title, "Visit confirmed");
  const mine = await renter.agent.get("/api/visit/mine").expect(200);
  assert.equal(mine.body[0].status, "confirmed");
  await renter.agent
    .post(`/api/visit/${visit.body._id}/status`)
    .send({ status: "cancelled" })
    .expect(200);
  await renter.agent.post("/api/visit").send(body).expect(201);
});

test("alerts: matching new homes notify, others don't", async () => {
  await renter.agent
    .post("/api/alert")
    .send({ label: "Pune under 25k", query: "city=Pune&maxPrice=25000" })
    .expect(201);
  await create({ regularPrice: 40000 });
  let notes = await renter.agent.get("/api/notification").expect(200);
  assert.equal(notes.body.length, 0);
  await create({ regularPrice: 20000 });
  notes = await renter.agent.get("/api/notification").expect(200);
  assert.equal(notes.body.length, 1);
  assert.match(notes.body[0].title, /Pune under 25k/);
  await renter.agent.post("/api/notification/read").expect(200);
  const read = await renter.agent.get("/api/notification").expect(200);
  assert.ok(read.body.every((item) => item.read));
  await renter.agent
    .post("/api/alert")
    .send({ label: "Bad", query: "sort=password" })
    .expect(400);
  const alerts = await renter.agent.get("/api/alert").expect(200);
  await stranger.agent.delete(`/api/alert/${alerts.body[0]._id}`).expect(404);
  await renter.agent.delete(`/api/alert/${alerts.body[0]._id}`).expect(200);
});

test("analytics: owner sees their own totals only", async () => {
  const { _id } = await create();
  await renter.agent.get(`/api/listing/get/${_id}`).expect(200);
  await renter.agent.post(`/api/user/saved/${_id}`).expect(200);
  await renter.agent
    .post("/api/inquiry")
    .send({ listing: _id, message: "Is this available?" })
    .expect(201);
  const res = await owner.agent.get("/api/user/analytics").expect(200);
  assert.deepEqual(res.body.totals, {
    listings: 1,
    views: 1,
    saves: 1,
    inquiries: 1,
    visits: 0,
  });
  const other = await stranger.agent.get("/api/user/analytics").expect(200);
  assert.equal(other.body.totals.listings, 0);
});

test("insights: city averages and unknown cities", async () => {
  await create({ regularPrice: 20000 });
  await create({ regularPrice: 30000 });
  const res = await request(app).get("/api/insights/Pune").expect(200);
  assert.equal(res.body.total, 2);
  assert.equal(res.body.byBedrooms[0].average, 25000);
  assert.equal(res.body.byArea[0].area, "Baner");
  await request(app).get("/api/insights/Atlantis").expect(404);
});

test("recent: viewed homes are listed", async () => {
  const { _id } = await create();
  await renter.agent.get(`/api/listing/get/${_id}`).expect(200);
  const recent = await renter.agent.get("/api/user/recent").expect(200);
  assert.equal(recent.body[0]._id, _id);
});

test("chat: without a key it answers from search", async () => {
  delete process.env.OPENAI_API_KEY;
  await create();
  const res = await request(app)
    .post("/api/chat")
    .send({ messages: [{ role: "user", content: "2bhk in pune under 25k" }] })
    .expect(200);
  assert.equal(res.body.mode, "basic");
  assert.equal(res.body.listings.length, 1);
  await request(app).post("/api/chat").send({ messages: [] }).expect(400);
});

test("chat: runs OpenAI tool calls and returns homes found", async () => {
  const { _id } = await create();
  const requests = [];
  const mock = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const body = JSON.parse(raw);
      requests.push({ auth: req.headers.authorization, body });
      const first = requests.length === 1;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          output: first
            ? [
                { type: "reasoning", id: "rs_1", encrypted_content: "x" },
                {
                  type: "function_call",
                  call_id: "call_1",
                  name: "search_rentals",
                  arguments: JSON.stringify({ city: "Pune", maxPrice: 25000 }),
                },
              ]
            : [
                {
                  type: "message",
                  content: [{ type: "output_text", text: "Baner mein ek achha option hai." }],
                },
              ],
        })
      );
    });
  });
  await new Promise((resolve) => mock.listen(0, resolve));
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${mock.address().port}`;
  try {
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "Pune mein 25k tak ghar" }] })
      .expect(200);
    assert.equal(res.body.mode, "ai");
    assert.equal(res.body.reply, "Baner mein ek achha option hai.");
    assert.equal(res.body.listings[0]._id, _id);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].auth, "Bearer test-key");
    assert.deepEqual(requests[0].body.tools.map((tool) => tool.name), ["search_rentals", "get_rental", "area_insights"]);
    const replay = requests[1].body.input;
    assert.ok(replay.some((item) => item.type === "reasoning"));
    const output = replay.find((item) => item.type === "function_call_output");
    assert.equal(output.call_id, "call_1");
    assert.equal(JSON.parse(output.output)[0].rent, 20000);
  } finally {
    mock.close();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
  }
});

test("chat: an OpenAI failure falls back to search", async () => {
  await create();
  const mock = http.createServer((req, res) => {
    req.resume();
    res.statusCode = 500;
    res.end("{}");
  });
  await new Promise((resolve) => mock.listen(0, resolve));
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${mock.address().port}`;
  try {
    const res = await request(app)
      .post("/api/chat")
      .send({ messages: [{ role: "user", content: "2bhk in pune" }] })
      .expect(200);
    assert.equal(res.body.mode, "basic");
  } finally {
    mock.close();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
  }
});

test("unknown API routes return JSON 404", async () => {
  const res = await request(app).get("/api/nope").expect(404);
  assert.equal(res.body.success, false);
});
