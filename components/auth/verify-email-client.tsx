"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { resendVerificationEmail } from "@/lib/actions/auth";

interface Props {
  email: string;
  isExpired: boolean;
}

export function VerifyEmailClient({ email, isExpired }: Props) {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleResend() {
    if (!email) return;
    startTransition(async () => {
      await resendVerificationEmail(email);
      setSent(true);
    });
  }

  return (
    <div className="auth-page" style={{ justifyContent: "center" }}>
      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto", padding: "40px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      }}>
        <Link href="/">
          <Image src="/Uniwhite.png" alt="UniStocker" width={120} height={48}
            style={{ objectFit: "contain", marginBottom: 40 }} />
        </Link>

        {isExpired ? (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(239,68,68,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", marginBottom: 24,
            }}>
              <AlertCircle size={32} style={{ color: "#f87171" }} />
            </div>
            <h1 className="auth-form-heading" style={{ marginBottom: 8 }}>Link expired</h1>
            <p className="auth-form-sub" style={{ marginBottom: 32 }}>
              Your verification link has expired. Request a new one below.
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(13,148,136,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", marginBottom: 24,
            }}>
              <Mail size={32} style={{ color: "#0D9488" }} />
            </div>
            <h1 className="auth-form-heading" style={{ marginBottom: 8 }}>Check your email</h1>
            <p className="auth-form-sub" style={{ marginBottom: 8 }}>
              We sent a verification link to
            </p>
            {email && (
              <p style={{ fontWeight: 700, color: "var(--text)", fontSize: 15, marginBottom: 32 }}>
                {email}
              </p>
            )}
            <p className="auth-form-sub" style={{ marginBottom: 32, fontSize: 13 }}>
              Click the link in the email to activate your account. The link expires in 24 hours.
            </p>
          </>
        )}

        {sent ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "12px 20px",
            borderRadius: 10, background: "rgba(13,148,136,0.12)",
            border: "1px solid rgba(13,148,136,0.3)", color: "#2DD4BF",
            fontSize: 14, fontWeight: 600,
          }}>
            <CheckCircle2 size={16} />
            New link sent — check your inbox
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={pending || !email}
            className="auth-btn"
            style={{ width: "100%", maxWidth: 320 }}
          >
            {pending
              ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Loader2 size={16} className="animate-spin" /> Sending…
                </span>
              : isExpired ? "Send new verification link" : "Resend verification email"
            }
          </button>
        )}

        <p className="auth-bottom-link" style={{ marginTop: 24 }}>
          Already verified? <Link href="/auth/login">Sign in</Link>
        </p>
        <Link href="/" className="auth-back" style={{ marginTop: 8 }}>← Back to home</Link>
      </div>
    </div>
  );
}
