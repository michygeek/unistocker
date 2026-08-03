import { RegisterForm } from "@/components/auth/register-form";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Shield, Users, Globe, Zap } from "lucide-react";

export const metadata: Metadata = { title: "Create Account — UniStocker" };

const PERKS = [
  { icon: Zap,    text: "Set up in under 2 minutes" },
  { icon: Users,  text: "Invite your team with roles" },
  { icon: Globe,  text: "Multi-branch support" },
  { icon: Shield, text: "Your data is secure & private" },
];

interface Props {
  searchParams: Promise<{ ref?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const { ref } = await searchParams;
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
            Start managing<br />smarter, <em className="amber">today.</em>
          </h2>
          <p className="auth-left-sub">
            Join hundreds of African businesses already<br />running on UniStocker — completely free.
          </p>
          <div className="auth-feature-list">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="auth-feature">
                <div className="auth-feature-icon amber">
                  <Icon size={15} color="#F5A823" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          <div className="auth-badge-row">
            {["No credit card", "Free forever plan", "PWA installable", "African-made"].map((b) => (
              <span key={b} className="auth-badge">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-mobile-bar">
          <Image src="/Uniwhite.png" alt="UniStocker" width={80} height={36} style={{ objectFit: "contain" }} />
          <div>
            <div className="auth-mobile-bar-name">UniStocker</div>
            <div className="auth-mobile-bar-sub">Free forever · Start today</div>
          </div>
        </div>
        <div className="auth-strip auth-strip-mobile" />

        <div className="auth-form-area" style={{ maxWidth: 500 }}>
          <div className="auth-free-badge">✦ FREE — No credit card required</div>
          <h1 className="auth-form-heading">Create your account</h1>
          <p className="auth-form-sub">Set up your business in under 2 minutes</p>

          <RegisterForm defaultReferralCode={ref} />

          <p className="auth-bottom-link">
            Already have an account?{" "}
            <Link href="/auth/login">Sign in</Link>
          </p>
          <Link href="/" className="auth-back">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
