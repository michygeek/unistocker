import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrgSubscription } from "@/lib/subscription";
import { PLAN_FEATURES } from "@/lib/plans";
import { Header } from "@/components/layout/header";
import { BillingPage } from "@/components/billing/billing-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing & Plans" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function BillingPageRoute({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "BOSS") redirect("/settings");

  const orgId = session.user.organizationId;
  if (!orgId) redirect("/settings");

  const params = await searchParams;

  const [subscription, productCount, staffCount, branchCount] = await Promise.all([
    getOrgSubscription(orgId),
    db.product.count({ where: { organizationId: orgId, isActive: true } }),
    db.user.count({ where: { organizationId: orgId, isActive: true } }),
    db.branch.count({ where: { organizationId: orgId } }),
  ]);

  const features = PLAN_FEATURES[subscription.plan];

  const usage = {
    products: { used: productCount, max: features.products },
    staff:    { used: staffCount,   max: features.staff },
    branches: { used: branchCount,  max: features.branches },
  };

  return (
    <div>
      <Header title="Billing & Plans" />
      <div style={{ padding: "24px 20px" }}>
        <BillingPage
          subscription={subscription}
          usage={usage}
          successParam={params.success === "1"}
          errorParam={params.error}
        />
      </div>
    </div>
  );
}
