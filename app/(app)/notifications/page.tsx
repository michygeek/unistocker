import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { NotificationsList } from "@/components/notifications/notifications-list";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await db.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="flex flex-col flex-1">
      <Header title="Notifications" />
      <div className="flex-1 p-6 animate-in">
        <NotificationsList notifications={notifications} />
      </div>
    </div>
  );
}
