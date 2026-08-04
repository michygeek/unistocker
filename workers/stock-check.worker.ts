import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue/redis";
import { db } from "@/lib/db";
import { notifyAllBossUsers, createAndSendNotification } from "@/lib/notifications";

const worker = new Worker(
  "stock-check",
  async (job) => {
    if (job.name !== "check-low-stock") return;

    const { productId } = job.data as { productId: string };

    const product = await db.product.findUnique({
      where: { id: productId },
      include: { createdBy: true },
    });

    if (!product) return;

    if (product.quantity <= product.lowStockAlert && product.organizationId) {
      const title = `Low Stock Alert: ${product.name}`;
      const body = `${product.name} has only ${product.quantity} units left (threshold: ${product.lowStockAlert}).`;

      await notifyAllBossUsers(product.organizationId, title, body, "LOW_STOCK", {
        productId: product.id,
        productName: product.name,
        quantity: product.quantity,
        threshold: product.lowStockAlert,
      });

      await createAndSendNotification({
        userId: product.createdById,
        title,
        body,
        type: "LOW_STOCK",
        channel: "PUSH",
        metadata: { productId: product.id },
      });
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("failed", (job, err) => {
  console.error(`[StockCheckWorker] Job ${job?.id} failed:`, err.message);
});

export default worker;
