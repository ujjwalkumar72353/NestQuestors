// End-to-end check of the production build in real Chrome, with two users side by side.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";
import { chromium } from "playwright";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3199;
const BASE = `http://localhost:${PORT}`;
const PASSWORD = "password123";
const SHOTS = process.env.E2E_SHOTS || path.join(root, "test-results");
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const steps = [];
const step = async (name, fn) => {
  await fn();
  steps.push(name);
  console.log(`  ok  ${name}`);
};

const waitForServer = async () => {
  for (let i = 0; i < 100; i += 1) {
    try {
      if ((await fetch(`${BASE}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Server did not start");
};

const newUser = async (browser, errors, label) => {
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${label}: ${error.message}`));
  page.on("console", (entry) => {
    const expected = /status of 40[0-9]/.test(entry.text());
    if (entry.type() === "error" && !expected) errors.push(`${label}: ${entry.text()}`);
  });
  return page;
};

const signUp = async (page, username, email) => {
  await page.goto(`${BASE}/sign-up`);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/sign-in");
};

const signIn = async (page, email, password = PASSWORD) => {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
};

const makeListing = (index) => ({
  name: `Filler 1BHK home ${index}`,
  description: "A simple filler home used to test paging in search results.",
  address: `${index}, Saket, Delhi`,
  city: "Delhi",
  regularPrice: 15000 + index,
  discountPrice: 0,
  bathrooms: 1,
  bedrooms: 1,
  furnished: false,
  parking: false,
  bachelorFriendly: false,
  amenities: [],
  offer: false,
  carpetArea: 500,
  lat: 28.5245,
  lng: 77.2066,
  imageUrls: ["/uploads/missing.jpg"],
});

const run = async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const uploads = path.join(root, "api", "uploads");
  const before = new Set(fs.existsSync(uploads) ? fs.readdirSync(uploads) : []);
  const mongo = await MongoMemoryServer.create();
  const server = spawn("node", ["api/index.js"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
      MONGO: mongo.getUri("e2e"),
      JWT_SECRET: "e2e-secret",
      AUTH_RATE_LIMIT: "1000",
    },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const errors = [];

  try {
    await waitForServer();
    const owner = await newUser(browser, errors, "owner");
    const renter = await newUser(browser, errors, "renter");
    const stranger = await newUser(browser, errors, "stranger");
    let listingUrl;

    await step("private pages send guests to sign in", async () => {
      await owner.goto(`${BASE}/dashboard`);
      await owner.waitForURL("**/sign-in");
    });

    await step("owner signs up and returns to the page they wanted", async () => {
      await signUp(owner, "arjun_owner", "arjun@e2e.com");
      await owner.goto(`${BASE}/create-listing`);
      await owner.waitForURL("**/sign-in");
      await signIn(owner, "arjun@e2e.com");
      await owner.waitForURL("**/create-listing");
    });

    await step("wrong password shows an error", async () => {
      const guest = await newUser(browser, errors, "guest");
      await guest.goto(`${BASE}/sign-in`);
      await signIn(guest, "arjun@e2e.com", "wrong-password");
      await guest.getByText("Invalid email or password").waitFor();
      await guest.context().close();
    });

    await step("a listing needs a photo", async () => {
      await owner.getByLabel("Title").fill("Sunny 2BHK near Hitech City");
      await owner.getByLabel("Description").fill("Bright furnished home close to offices and cafes.");
      await owner.getByLabel("Address").fill("12, Hitech City, Hyderabad");
      await owner.getByLabel("City").selectOption("Hyderabad");
      await owner.getByLabel("Bedrooms").fill("2");
      await owner.getByLabel("Rent (₹ per month)").fill("24000");
      await owner.getByLabel("Security deposit (₹)").fill("48000");
      await owner.getByLabel("Maintenance (₹ per month)").fill("2000");
      await owner.getByLabel("Carpet area (sq ft)").fill("950");
      await owner.getByRole("checkbox", { name: "Furnished" }).check();
      await owner.getByRole("checkbox", { name: "Parking" }).check();
      await owner.getByRole("button", { name: "WiFi" }).click();
      await owner.getByRole("button", { name: "Publish listing" }).click();
      await owner.getByText("Add at least one photo").waitFor();
    });

    await step("owner uploads a photo and publishes", async () => {
      const file = path.join(os.tmpdir(), "nestquestors-e2e.png");
      fs.writeFileSync(file, PIXEL);
      await owner.getByLabel("Add photos").setInputFiles(file);
      await owner.getByRole("button", { name: "Remove photo" }).waitFor();
      fs.rmSync(file);
      await owner.getByRole("button", { name: "Publish listing" }).click();
      await owner.getByText("Pin the home on the map").waitFor();
      await owner.getByRole("application", { name: "Click to pin the home" }).click();
      await owner.getByText(/Pinned at/).waitFor();
      await owner.getByRole("button", { name: "Publish listing" }).click();
      await owner.waitForURL("**/listing/*");
      listingUrl = owner.url();
      await owner.getByRole("heading", { name: "Sunny 2BHK near Hitech City" }).waitFor();
      await owner.getByText("₹24,000").first().waitFor();
      await owner.waitForFunction(() => document.querySelector("main img")?.naturalWidth > 0);
      await owner.getByText("₹74,000").waitFor();
      await owner.getByRole("application", { name: "Location of this home" }).waitFor();
      await owner.getByText("Financial District").waitFor();
    });

    await step("owner cannot message their own listing", async () => {
      await owner.getByRole("link", { name: "Edit your listing" }).waitFor();
      assert.equal(await owner.getByRole("button", { name: "Contact owner" }).count(), 0);
    });

    await step("smart search understands plain words", async () => {
      await renter.goto(BASE);
      await renter.getByLabel("Describe the home you want").fill("2bhk furnished in hyderabad under 30k");
      await renter.getByRole("button", { name: "Search", exact: true }).click();
      await renter.waitForURL("**/search?q=*");
      const understood = renter.getByLabel("What we understood");
      for (const chip of ["2 BHK", "Hyderabad", "Furnished", "Up to ₹30,000"]) {
        await understood.getByText(chip).waitFor();
      }
      await renter.getByText("1 rentals found").waitFor();
      assert.equal(await renter.getByText("Rent or buy").count(), 0);
      await renter.getByRole("heading", { name: "Sunny 2BHK near Hitech City" }).waitFor();
    });

    await step("a budget too low shows the empty state", async () => {
      await renter.goto(`${BASE}/search?q=${encodeURIComponent("2bhk in hyderabad under 10k")}`);
      await renter.getByText("No homes match this search").waitFor();
    });

    await step("guests are asked to sign in to save", async () => {
      await renter.goto(listingUrl);
      await renter.getByRole("button", { name: /^Save / }).first().click();
      await renter.waitForURL("**/sign-in");
    });

    await step("renter signs up and sees non-personal picks first", async () => {
      await signUp(renter, "rohan_renter", "rohan@e2e.com");
      await signIn(renter, "rohan@e2e.com");
      await renter.getByRole("heading", { name: "Find a home that says yes to bachelors" }).waitFor();
      await renter.getByRole("heading", { name: "Great deals right now" }).waitFor();
    });

    await step("owner adds more homes for paging", async () => {
      const results = await owner.evaluate(async (listings) => {
        const statuses = [];
        for (const listing of listings) {
          const res = await fetch("/api/listing/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(listing),
          });
          statuses.push(res.status);
        }
        return statuses;
      }, Array.from({ length: 14 }, (_, index) => makeListing(index + 1)));
      assert.ok(results.every((status) => status === 201));
      await owner.evaluate(() =>
        fetch("/api/listing/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bright 2BHK in Gachibowli",
            description: "A close match for homes around Hitech City, ready to move in.",
            address: "9, Gachibowli, Hyderabad",
            city: "Hyderabad",
            regularPrice: 25000,
            discountPrice: 0,
            bathrooms: 2,
            bedrooms: 2,
            furnished: true,
            parking: true,
            bachelorFriendly: true,
            amenities: [],
            offer: false,
            carpetArea: 980,
            lat: 17.4401,
            lng: 78.3489,
            imageUrls: ["/uploads/missing.jpg"],
          }),
        })
      );
    });

    await step("filters, sort and pagination work", async () => {
      await renter.goto(`${BASE}/search?city=Delhi`);
      await renter.getByText("14 rentals found").waitFor();
      await renter.getByLabel("Sort by").selectOption("price_desc");
      await renter.getByRole("heading", { name: "Filler 1BHK home 14" }).waitFor();
      await renter.getByRole("button", { name: "Next" }).click();
      await renter.getByText("Page 2 of 2").waitFor();
      await renter.getByRole("button", { name: "Clear all" }).click();
      await renter.getByText("16 rentals found").waitFor();
    });

    await step("renter saves a home and sees it on the saved page", async () => {
      await renter.goto(listingUrl);
      await renter.getByRole("button", { name: "Save Sunny 2BHK near Hitech City" }).click();
      await renter.getByRole("button", { name: "Remove Sunny 2BHK near Hitech City" }).waitFor();
      await renter.getByRole("link", { name: "Saved" }).click();
      await renter.getByRole("heading", { name: "Sunny 2BHK near Hitech City" }).waitFor();
    });

    await step("recommendations follow what the renter saved", async () => {
      await renter.getByRole("link", { name: "NestQuestors" }).click();
      await renter.getByRole("heading", { name: "Recommended for you" }).waitFor();
      await renter.getByRole("heading", { name: "Bright 2BHK in Gachibowli" }).first().waitFor();
    });

    await step("listing page shows similar homes", async () => {
      await renter.goto(listingUrl);
      await renter.getByRole("heading", { name: "Similar homes" }).waitFor();
      await renter.getByRole("heading", { name: "Bright 2BHK in Gachibowli" }).waitFor();
    });

    await step("renter messages the owner", async () => {
      await renter.getByLabel("Message").fill("Can I visit this Saturday?");
      await renter.getByRole("button", { name: "Contact owner" }).click();
      await renter.getByText("Message sent to the owner").waitFor();
    });

    await step("owner reads the message in the inbox", async () => {
      await owner.goto(`${BASE}/dashboard`);
      await owner.getByRole("tab", { name: "Inbox" }).click();
      await owner.getByText("Can I visit this Saturday?").waitFor();
      await owner.getByRole("button", { name: "Mark as read" }).click();
      await owner.getByRole("button", { name: "Mark as read" }).waitFor({ state: "detached" });
    });

    await step("renter sees the sent message", async () => {
      await renter.goto(`${BASE}/dashboard`);
      await renter.getByRole("tab", { name: "Sent" }).click();
      await renter.getByText("Can I visit this Saturday?").waitFor();
    });

    await step("map view shows homes as price pins", async () => {
      await renter.goto(`${BASE}/search?view=map&city=Hyderabad`);
      await renter.locator(".price-pin, .cluster-pin").first().waitFor();
      await renter.getByText("Showing 2 of 2 on the map").waitFor();
      await renter.screenshot({ path: path.join(SHOTS, "e2e-map.png") });
    });

    await step("renter books a visit and the owner confirms it", async () => {
      await renter.goto(listingUrl);
      await renter.getByRole("button", { name: "Request visit" }).click();
      await renter.getByText("Visit requested").waitFor();
      await owner.goto(`${BASE}/dashboard?tab=visits`);
      await owner.getByRole("button", { name: "Confirm visit" }).click();
      await owner.getByText("confirmed", { exact: true }).waitFor();
      await renter.goto(BASE);
      await renter.getByRole("button", { name: /^Notifications, 1 unread/ }).click();
      await renter.getByText("Visit confirmed").waitFor();
    });

    await step("compare shows homes side by side", async () => {
      await renter.goto(`${BASE}/search?city=Hyderabad`);
      await renter.getByRole("button", { name: "Add to compare: Sunny 2BHK near Hitech City" }).click();
      await renter.getByRole("button", { name: "Add to compare: Bright 2BHK in Gachibowli" }).click();
      await renter.getByRole("link", { name: "Compare", exact: true }).click();
      await renter.getByRole("heading", { name: "Compare rentals" }).waitFor();
      await renter.getByRole("rowheader", { name: "Monthly rent" }).waitFor();
      await renter.evaluate(() => localStorage.removeItem("compare"));
    });

    await step("saved search notifies about a new matching home", async () => {
      await renter.goto(`${BASE}/search?city=Pune`);
      await renter.getByRole("button", { name: "Save search" }).click();
      await renter.getByText("We'll notify you about new matches").waitFor();
      await owner.evaluate((listing) =>
        fetch("/api/listing/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(listing),
        })
      , { ...makeListing(99), name: "New home in Baner", city: "Pune", address: "2, Baner, Pune", lat: 18.559, lng: 73.7868 });
      await renter.goto(BASE);
      await renter.getByRole("button", { name: /^Notifications, 1 unread/ }).click();
      await renter.getByText('New match for "Pune"').waitFor();
    });

    await step("rent insights show city numbers", async () => {
      await stranger.goto(`${BASE}/insights?city=Hyderabad`);
      await stranger.getByRole("heading", { name: "2BHK rent by area" }).waitFor();
      await stranger.getByRole("link", { name: "Gachibowli" }).waitFor();
      await stranger.getByText("Rentals listed", { exact: true }).waitFor();
    });

    await step("owner sees analytics", async () => {
      await owner.goto(`${BASE}/dashboard`);
      await owner.getByText("Top listings").waitFor();
      await owner.getByRole("cell", { name: "Sunny 2BHK near Hitech City" }).waitFor();
    });

    await step("chat assistant finds homes without an AI key", async () => {
      await stranger.goto(BASE);
      await stranger.getByRole("button", { name: "Open rental assistant" }).click();
      await stranger.getByLabel("Message the assistant").fill("2bhk in hyderabad");
      await stranger.getByRole("button", { name: "Send message" }).click();
      await stranger.getByText(/I found 2 rentals/).waitFor();
      await stranger.getByRole("region", { name: "Rental assistant" }).getByRole("link").first().click();
      await stranger.waitForURL("**/listing/*");
      await stranger.getByRole("button", { name: "Close rental assistant" }).click();
    });

    await step("owner edits the listing into an offer", async () => {
      await owner.goto(`${BASE}/dashboard?tab=listings`);
      await owner.getByRole("link", { name: "Edit Sunny 2BHK near Hitech City" }).click();
      await owner.getByRole("checkbox", { name: "On offer" }).check();
      await owner.getByLabel("Offer rent (₹ per month)").fill("22000");
      await owner.getByRole("button", { name: "Save changes" }).click();
      await owner.waitForURL("**/listing/*");
      await owner.getByText("₹22,000").first().waitFor();
      await owner.getByText("Save ₹2,000 every month").waitFor();
    });

    await step("someone else cannot open the edit page", async () => {
      await renter.goto(`${listingUrl.replace("/listing/", "/edit-listing/")}`);
      await renter.waitForURL("**/dashboard");
    });

    await step("dark mode switches and persists", async () => {
      await renter.goto(BASE);
      await renter.getByRole("button", { name: "Switch to dark mode" }).click();
      await renter.reload();
      await renter.getByRole("button", { name: "Switch to light mode" }).waitFor();
      await renter.screenshot({ path: path.join(SHOTS, "dark-home.png") });
    });

    await step("phone layout works with no sideways scroll", async () => {
      await stranger.setViewportSize({ width: 390, height: 800 });
      for (const url of [BASE, `${BASE}/search`, listingUrl, `${BASE}/sign-up`]) {
        await stranger.goto(url);
        await stranger.waitForLoadState("networkidle");
        const overflow = await stranger.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        );
        assert.ok(overflow <= 0, `${url} overflows by ${overflow}px`);
      }
      await stranger.goto(`${BASE}/search`);
      await stranger.getByRole("button", { name: "Filters" }).click();
      await stranger.getByRole("dialog").getByLabel("City").selectOption("Delhi");
      await stranger.getByRole("button", { name: "Show homes" }).click();
      await stranger.getByText("14 rentals found").waitFor();
      await stranger.getByRole("button", { name: "Menu" }).click();
      await stranger.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "About" }).click();
      await stranger.waitForURL("**/about");
    });

    await step("unknown pages and listings show a friendly page", async () => {
      await stranger.goto(`${BASE}/nope`);
      await stranger.getByRole("heading", { name: "Page not found" }).waitFor();
      await stranger.goto(`${BASE}/listing/507f1f77bcf86cd799439011`);
      await stranger.getByRole("heading", { name: "Listing not found" }).waitFor();
    });

    await step("profile and password can be changed", async () => {
      await renter.goto(`${BASE}/profile`);
      await renter.getByLabel("Username").fill("rohan_new");
      await renter.getByRole("button", { name: "Save details" }).click();
      await renter.getByText("Profile updated").waitFor();
      await renter.getByLabel("Current password").fill(PASSWORD);
      await renter.getByLabel("New password").fill("newpassword1");
      await renter.getByRole("button", { name: "Change password" }).click();
      await renter.getByText("Password changed").waitFor();
    });

    await step("sign out, then sign in with the new password", async () => {
      await renter.getByRole("button", { name: "Account menu" }).click();
      await renter.getByRole("button", { name: "Sign out" }).click();
      await renter.getByRole("link", { name: "Sign in" }).click();
      await signIn(renter, "rohan@e2e.com", "newpassword1");
      await renter.getByRole("button", { name: "Account menu" }).waitFor();
    });

    await step("owner deletes a listing", async () => {
      owner.once("dialog", (dialog) => dialog.accept());
      await owner.goto(`${BASE}/dashboard?tab=listings`);
      await owner.getByRole("button", { name: "Delete Sunny 2BHK near Hitech City" }).click();
      await owner.getByText("Listing deleted").waitFor();
      await renter.goto(`${BASE}/saved`);
      await renter.getByText("No saved homes yet").waitFor();
    });

    await step("renter deletes their account", async () => {
      await renter.goto(`${BASE}/profile`);
      await renter.getByLabel("Confirm with your password").fill("newpassword1");
      await renter.getByRole("button", { name: "Delete my account" }).click();
      await renter.getByRole("heading", { name: "Find a home that says yes to bachelors" }).waitFor();
      await renter.getByRole("link", { name: "Sign in" }).waitFor();
    });

    const real = errors.filter((text) => !/missing\.jpg/.test(text));
    assert.deepEqual(real, [], "browser console must stay clean");
    console.log(`\n${steps.length} steps passed, no browser errors`);
  } catch (error) {
    if (process.env.E2E_DEBUG) {
      for (const context of browser.contexts()) {
        for (const page of context.pages()) {
          console.log("URL", page.url(), (await page.locator("body").innerText()).slice(0, 300).replace(/\n/g, " | "));
        }
      }
      console.log("ERRORS", errors.slice(0, 6));
    }
    throw error;
  } finally {
    await browser.close();
    server.kill();
    await mongo.stop();
    if (fs.existsSync(uploads)) {
      fs.readdirSync(uploads)
        .filter((file) => !before.has(file))
        .forEach((file) => fs.rmSync(path.join(uploads, file)));
    }
  }
};

run().catch((error) => {
  console.error(`\nFAILED after: ${steps.at(-1) || "start"}\n`, error.message);
  process.exit(1);
});
