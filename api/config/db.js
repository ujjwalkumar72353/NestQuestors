import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { isProduction } from "./env.js";

const here = path.dirname(fileURLToPath(import.meta.url));
let localServer = null;

// With no MONGO, development runs on a local MongoDB kept in .data/
const startLocalMongo = async () => {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const dbPath = path.join(here, "..", "..", ".data");
  fs.mkdirSync(dbPath, { recursive: true });
  for (let attempt = 1; ; attempt += 1) {
    try {
      localServer = await MongoMemoryServer.create({
        instance: { dbPath, storageEngine: "wiredTiger", dbName: "nestquestors" },
      });
      return localServer.getUri();
    } catch (error) {
      // A restart can begin while the previous mongod is still releasing .data/
      if (attempt >= 20 || !error.message.includes("DBPathInUse")) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
};

export const connectDb = async () => {
  let uri = process.env.MONGO;
  if (!uri) {
    if (isProduction) {
      throw new Error("MONGO is required in production");
    }
    uri = await startLocalMongo();
    console.log("No MONGO set, using local MongoDB in .data/");
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
  return { isLocal: Boolean(localServer) };
};

export const disconnectDb = async () => {
  await mongoose.disconnect();
  if (localServer) {
    await localServer.stop();
  }
};
