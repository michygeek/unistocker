import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue/redis";
import { createAndSendNotification } from "@/lib/notifications";
import type { NotificationPayload } from "@/types";

const worker = new Worker(
  "notifications",
  async (job) => {
    console.log(`[NotificationWorker] Processing job ${job.id}: ${job.name}`);

    if (job.name === "send-notification") {
      const payload = job.data as NotificationPayload;
      await createAndSendNotification(payload);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`[NotificationWorker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
});

export default worker;
