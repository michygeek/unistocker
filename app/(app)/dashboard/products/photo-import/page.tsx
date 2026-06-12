import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { BatchPhotoImport } from "@/components/ai/batch-photo-import";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Batch Photo Import" };
export const dynamic = "force-dynamic";

export default async function PhotoImportPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role === "STAFF") redirect("/inventory");

  const [categories, unreadCount] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Batch Photo Import" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px" }}>
        <BatchPhotoImport categories={categories} />
      </div>
    </div>
  );
}
