import { db } from "@/lib/db";
import { sendPushNotification } from "./firebase-admin";
import { sendEmail, buildNotificationEmail } from "./email";
import type { NotificationPayload } from "@/types";
import { NotificationChannel } from "@prisma/client";

export async function createAndSendNotification(
  payload: NotificationPayload
): Promise<void> {
  const { userId, title, body, type, channel = NotificationChannel.BOTH, metadata, sentById } = payload;

  const notification = await db.notification.create({
    data: {
      title, body, type, channel, userId, sentById, status: "PENDING",
      metadata: metadata ? (metadata as object) : undefined,
    },
  });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, pushToken: true },
  });

  if (!user) return;

  let success = false;

  if ((channel === "PUSH" || channel === "BOTH") && user.pushToken) {
    success = await sendPushNotification(user.pushToken, title, body, {
      notificationId: notification.id,
      type,
    });
  }

  if (channel === "EMAIL" || channel === "BOTH") {
    const emailSent = await sendEmail(
      user.email,
      title,
      buildNotificationEmail(title, body)
    );
    success = success || emailSent;
  }

  await db.notification.update({
    where: { id: notification.id },
    data: { status: success ? "SENT" : "FAILED" },
  });
}

export async function notifyAllBossUsers(
  title: string,
  body: string,
  type: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const bossUsers = await db.user.findMany({
    where: { role: "BOSS", isActive: true },
    select: { id: true },
  });

  await Promise.all(
    bossUsers.map((user) =>
      createAndSendNotification({ userId: user.id, title, body, type, metadata })
    )
  );
}
