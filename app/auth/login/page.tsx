import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package, Bell, BarChart3, Wifi } from "lucide-react";

export const metadata: Metadata = { title: "Sign In — UniStocker" };

const FEATURES = [
  { icon: Package,   text: "Track every product in real-time" },
  { icon: Bell,      text: "Instant low-stock alerts" },
  { icon: BarChart3, text: "Profit & sales reports" },
  { icon: Wifi,      text: "Works offline — install as app" },
];

interface Props {
  searchParams: Promise<{ registered?: string; verified?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { registered, verified } = await searchParams;

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
            Inventory that<br /><em>runs itself.</em>
          </h2>
          <p className="auth-left-sub">
            Track stock, record sales, manage your team<br />and get instant alerts — all from one place.
          </p>
          <div className="auth-feature-list">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="auth-feature">
                <div className="auth-feature-icon">
                  <Icon size={15} color="#64ED80" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          <div className="auth-stat-row">
            {[
              { val: "500+", lbl: "Businesses" },
              { val: "Free",  lbl: "To start" },
              { val: "PWA",   lbl: "Offline-ready" },
            ].map(({ val, lbl }) => (
              <div key={lbl}>
                <div className="auth-stat-val">{val}</div>
                <div className="auth-stat-lbl">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="auth-right">
        {/* Mobile bar */}
        <div className="auth-mobile-bar">
          <Image src="/Uniwhite.png" alt="UniStocker" width={80} height={36} style={{ objectFit: "contain" }} />
          <div>
            <div className="auth-mobile-bar-name">UniStocker</div>
            <div className="auth-mobile-bar-sub">Inventory that runs itself</div>
          </div>
        </div>
        <div className="auth-strip auth-strip-mobile" />

        <div className="auth-form-area">
          <h1 className="auth-form-heading">Welcome back</h1>
          <p className="auth-form-sub">Sign in to your account to continue</p>

          <LoginForm showRegisteredBanner={registered === "true"} showVerifiedBanner={verified === "1"} />

          <p className="auth-bottom-link">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register">Create one free</Link>
          </p>
          <Link href="/" className="auth-back">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
