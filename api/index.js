import "./config/env.js";
import { connectDb, disconnectDb } from "./config/db.js";
import createApp from "./app.js";
import Listing from "./models/listing.model.js";
import { seedDemoData } from "./seed.js";

const port = process.env.PORT || 3002;

// Listings created before effectivePrice existed still need to be searchable
const backfillListings = () =>
  Listing.updateMany(
    { effectivePrice: { $exists: false } },
    [
      {
        $set: {
          effectivePrice: {
            $cond: [
              { $and: ["$offer", { $gt: ["$discountPrice", 0] }] },
              "$discountPrice",
              "$regularPrice",
            ],
          },
        },
      },
    ],
    { updatePipeline: true }
  );

const start = async () => {
  const { isLocal } = await connectDb();
  await backfillListings();
  const demoSite = process.env.SEED_DEMO === "true";
  if (isLocal || demoSite) {
    await seedDemoData({ publicSite: !isLocal });
  }
  const server = createApp().listen(port, () =>
    console.log(`Server running on port ${port}`)
  );

  const shutdown = async () => {
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  ["SIGINT", "SIGTERM", "SIGUSR2"].forEach((signal) =>
    process.once(signal, shutdown)
  );
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
