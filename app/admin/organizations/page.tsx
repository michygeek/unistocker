import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrgTable } from "@/components/admin/org-table";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Organizations — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminOrgsPage() {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/auth/login");

  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, createdAt: true,
      subscription: { select: { plan: true, status: true, trialEndsAt: true, currentPeriodEnd: true } },
      _count: { select: { users: true, products: true, sales: true, branches: true } },
    },
  });

  const serialized = orgs.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    subscription: o.subscription
      ? {
          ...o.subscription,
          trialEndsAt: o.subscription.trialEndsAt?.toISOString() ?? null,
          currentPeriodEnd: o.subscription.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
  }));

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
          Organizations
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
          {orgs.length} total organization{orgs.length !== 1 ? "s" : ""}
        </p>
      </div>
      <OrgTable orgs={serialized} />
    </div>
  );
}
