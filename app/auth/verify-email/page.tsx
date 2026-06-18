import { VerifyEmailClient } from "@/components/auth/verify-email-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify your email — UniStocker" };

interface Props {
  searchParams: Promise<{ email?: string; expired?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email, expired } = await searchParams;
  return <VerifyEmailClient email={email ?? ""} isExpired={expired === "1"} />;
}
