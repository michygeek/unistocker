import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StaffManagement } from "@/components/settings/staff-management";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Staff Management" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role === "STAFF") redirect("/settings");

  const staff = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, branch: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col flex-1">
      <Header title="Staff Management" />
      <div className="flex-1 p-6 animate-in">
        <StaffManagement staff={staff} currentUserId={session.user.id} currentUserRole={session.user.role} />
      </div>
    </div>
  );
}
