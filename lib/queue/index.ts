import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const notificationQueue = new Queue("notifications", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const activityQueue = new Queue("activity-logs", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  },
});

export const stockCheckQueue = new Queue("stock-check", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 50 },
  },
});

// Wrap all queue adds in try/catch so a Redis failure never breaks the main request
export async function addNotificationJob(payload: {
  userId: string;
  title: string;
  body: string;
  type: string;
  channel?: string;
  metadata?: Record<string, unknown>;
  sentById?: string;
}) {
  try {
    return await notificationQueue.add("send-notification", payload, { priority: 1 });
  } catch {
    console.warn("[Queue] Failed to add notification job — Redis unavailable");
  }
}

export async function addActivityLogJob(payload: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    return await activityQueue.add("log-activity", payload);
  } catch {
    console.warn("[Queue] Failed to add activity log job — Redis unavailable");
  }
}

export async function addStockCheckJob(productId: string) {
  try {
    return await stockCheckQueue.add("check-low-stock", { productId }, {
      jobId: `stock-check-${productId}`,
      delay: 1000,
    });
  } catch {
    console.warn("[Queue] Failed to add stock check job — Redis unavailable");
  }
}
