import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { paystackVerify } from "@/lib/paystack";
import { activateSubscription } from "@/lib/actions/billing";
import type { PlanType } from "@/lib/plans";

interface Props {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}

export default async function BillingCallbackPage({ searchParams }: Props) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  if (!reference) redirect("/billing?error=no_reference");

  const session = await auth();
  if (!session?.user?.organizationId) redirect("/billing?error=auth");

  const result = await paystackVerify(reference);

  if (!result.status || result.data.status !== "success") {
    redirect("/billing?error=payment_failed");
  }

  const metadata = result.data.metadata as Record<string, string> | undefined;
  const plan = (metadata?.plan ?? null) as PlanType | null;
  const orgIdFromMeta = metadata?.organizationId;

  // Guard: metadata must match the logged-in org
  if (!plan || plan === "FREE" || orgIdFromMeta !== session.user.organizationId) {
    redirect("/billing?error=invalid_payment");
  }

  await activateSubscription(session.user.organizationId, plan);
  redirect("/billing?success=1");
}
