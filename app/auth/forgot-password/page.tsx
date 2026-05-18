import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { KeyRound, ShieldCheck, Clock, ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Forgot Password — UniStocker" };

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page">
      {/* ── Left brand panel ─────────────────────────────── */}
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
            Forgot your<br /><em>password?</em>
          </h2>
          <p className="auth-left-sub">
            No worries — it happens. Enter your email and
            we&apos;ll send you a secure link to create a new one.
          </p>
          <div className="auth-feature-list">
            {[
              { icon: KeyRound,    text: "Secure reset link via email" },
              { icon: Clock,       text: "Link expires after 1 hour" },
              { icon: ShieldCheck, text: "Your data stays protected" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="auth-feature">
                <div className="auth-feature-icon">
                  <Icon size={15} color="#2EBD78" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          <p style={{ fontSize: 12, color: "#3D6B5E" }}>
            Remember your password?{" "}
            <Link href="/auth/login" style={{ color: "#2EBD78", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="auth-right">
        {/* Mobile bar */}
        <div className="auth-mobile-bar">
          <Image src="/Uniwhite.png" alt="UniStocker" width={80} height={36} style={{ objectFit: "contain" }} />
          <div>
            <div className="auth-mobile-bar-name">UniStocker</div>
            <div className="auth-mobile-bar-sub">Password recovery</div>
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

          <h1 className="auth-form-heading">Reset your password</h1>
          <p className="auth-form-sub">
            Enter the email address for your account and we&apos;ll email you a reset link.
          </p>

          <ForgotPasswordForm />

          <Link href="/" className="auth-back" style={{ marginTop: 20 }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
