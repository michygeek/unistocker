import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ReferralsPanel } from "@/components/settings/referrals-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Referrals" };
export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "BOSS") redirect("/settings");

  const orgId = session.user.organizationId;
  if (!orgId) redirect("/settings");

  const [org, referredOrgs, unreadCount] = await Promise.all([
    db.organization.findUnique({ where: { id: orgId }, select: { referralCode: true, referralPoints: true } }),
    db.organization.findMany({
      where: { referredByOrgId: orgId },
      select: { id: true, name: true, createdAt: true, referralRewardGiven: true },
      orderBy: { createdAt: "desc" },
    }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
  ]);

  if (!org) return null;

  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Referrals" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px", maxWidth: 640 }}>
        <ReferralsPanel
          referralCode={org.referralCode}
          referralPoints={org.referralPoints}
          referredOrgs={referredOrgs.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
          origin={origin}
        />
      </div>
    </div>
  );
}
