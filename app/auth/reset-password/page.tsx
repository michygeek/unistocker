import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LockKeyhole, ShieldCheck, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Reset Password — UniStocker" };

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  /* Validate the token before rendering the form */
  let invalid = false;
  let expired = false;

  if (!token || !email) {
    invalid = true;
  } else {
    const record = await db.verificationToken.findUnique({ where: { token } });
    if (!record || record.identifier !== decodeURIComponent(email)) {
      invalid = true;
    } else if (record.expires < new Date()) {
      expired = true;
    }
  }

  return (
    <div className="auth-page">
      {/* ── Left panel ───────────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
        <div className="auth-dots" />

        <div className="auth-left-logo">
          <Image src="/Uniwhite.png" alt="UniStocker" width={120} height={48} style={{ objectFit: "contain", objectPosition: "left" }} />
        </div>

        <div className="auth-left-body">
          <h2 className="auth-left-headline">
            Create a<br /><em>new password.</em>
          </h2>
          <p className="auth-left-sub">
            Choose something strong and memorable.<br />
            You won&apos;t need to reset it again for a while.
          </p>
          <div className="auth-feature-list">
            {[
              { icon: LockKeyhole,  text: "Use at least 8 characters" },
              { icon: ShieldCheck,  text: "Mix letters, numbers & symbols" },
              { icon: ShieldCheck,  text: "Don't reuse old passwords" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="auth-feature">
                <div className="auth-feature-icon">
                  <Icon size={15} color="#64ED80" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          <p style={{ fontSize: 12, color: "#3D6B4C" }}>
            Remember your password?{" "}
            <Link href="/auth/login" style={{ color: "#64ED80", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-mobile-bar">
          <Image src="/Uniwhite.png" alt="UniStocker" width={80} height={36} style={{ objectFit: "contain" }} />
          <div>
            <div className="auth-mobile-bar-name">UniStocker</div>
            <div className="auth-mobile-bar-sub">Set a new password</div>
          </div>
        </div>
        <div className="auth-strip auth-strip-mobile" />

        <div className="auth-form-area">
          <Link href="/auth/login" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#9ca3af", textDecoration: "none", marginBottom: 28,
          }}>
            <ArrowLeft size={14} /> Back to sign in
          </Link>

          {invalid || expired ? (
            /* Invalid / expired token state */
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <LockKeyhole size={24} color="#ef4444" />
              </div>
              <h1 className="auth-form-heading" style={{ textAlign: "center" }}>
                {expired ? "Link expired" : "Invalid link"}
              </h1>
              <p className="auth-form-sub" style={{ textAlign: "center", marginBottom: 28 }}>
                {expired
                  ? "This reset link has expired. Reset links are valid for 1 hour."
                  : "This reset link is invalid or has already been used."}
              </p>
              <Link href="/auth/forgot-password" className="auth-btn" style={{
                display: "block", textAlign: "center", textDecoration: "none", padding: "13px", borderRadius: "10px",
              }}>
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="auth-form-heading">Set new password</h1>
              <p className="auth-form-sub">
                Choose a strong password for{" "}
                <strong style={{ color: "#374151" }}>{decodeURIComponent(email!)}</strong>
              </p>
              <ResetPasswordForm token={token!} email={decodeURIComponent(email!)} />
            </>
          )}

          <Link href="/" className="auth-back" style={{ marginTop: 20 }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
