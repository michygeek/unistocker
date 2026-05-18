import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) return null; // stop retrying after 3 attempts
    return Math.min(times * 500, 2000);
  },
});

redisConnection.on("error", (err) => {
  // Log once, don't crash the app
  if (err.message.includes("WRONGPASS") || err.message.includes("ECONNREFUSED")) {
    console.warn("[Redis] Connection failed — queue jobs disabled:", err.message);
  }
});
