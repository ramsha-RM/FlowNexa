import crypto from "crypto";
import mongoose from "mongoose";

const COLLECTION_NAME = "rateLimits";

export default class MongoRateLimitStore {
  constructor(scope) {
    this.scope = scope;
    this.windowMs = 0;
    this.collectionPromise = null;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  keyFor(key) {
    const digest = crypto.createHash("sha256").update(key).digest("hex");
    return `${this.scope}:${digest}`;
  }

  async collection() {
    if (!mongoose.connection.db) {
      throw new Error("MongoDB must be connected before using the shared rate-limit store");
    }

    if (!this.collectionPromise) {
      this.collectionPromise = mongoose.connection.db
        .collection(COLLECTION_NAME)
        .createIndex({ resetTime: 1 }, { expireAfterSeconds: 0, name: "rate_limit_expiry" })
        .then(() => mongoose.connection.db.collection(COLLECTION_NAME))
        .catch((error) => {
          this.collectionPromise = null;
          throw error;
        });
    }

    return this.collectionPromise;
  }

  async increment(key) {
    const collection = await this.collection();
    const now = new Date();
    const resetTime = new Date(now.getTime() + this.windowMs);
    const activeWindow = { $gt: ["$resetTime", now] };
    const record = await collection.findOneAndUpdate(
      { _id: this.keyFor(key) },
      [
        {
          $set: {
            scope: this.scope,
            totalHits: {
              $cond: [
                activeWindow,
                { $add: [{ $ifNull: ["$totalHits", 0] }, 1] },
                1,
              ],
            },
            resetTime: { $cond: [activeWindow, "$resetTime", resetTime] },
          },
        },
      ],
      { upsert: true, returnDocument: "after", includeResultMetadata: false },
    );

    return { totalHits: record.totalHits, resetTime: record.resetTime };
  }

  async decrement(key) {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: this.keyFor(key), totalHits: { $gt: 0 } },
      { $inc: { totalHits: -1 } },
    );
  }

  async resetKey(key) {
    const collection = await this.collection();
    await collection.deleteOne({ _id: this.keyFor(key) });
  }

  async resetAll() {
    const collection = await this.collection();
    await collection.deleteMany({ scope: this.scope });
  }

  async get(key) {
    const collection = await this.collection();
    const record = await collection.findOne({ _id: this.keyFor(key) });
    return record ? { totalHits: record.totalHits, resetTime: record.resetTime } : undefined;
  }
}
