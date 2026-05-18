import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue/redis";
import { db } from "@/lib/db";

const worker = new Worker(
  "activity-logs",
  async (job) => {
    if (job.name !== "log-activity") return;

    const { userId, action, entity, entityId, description, metadata, ipAddress } = job.data;

    await db.activityLog.create({
      data: { userId, action, entity, entityId, description, metadata, ipAddress },
    });
  },
  {
    connection: redisConnection,
    concurrency: 10,
  }
);

worker.on("failed", (job, err) => {
  console.error(`[ActivityWorker] Job ${job?.id} failed:`, err.message);
});

export default worker;
