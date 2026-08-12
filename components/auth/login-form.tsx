"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { checkEmailVerification } from "@/lib/actions/auth";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

interface LoginFormProps {
  showRegisteredBanner?: boolean;
  showVerifiedBanner?: boolean;
}

export function LoginForm({ showRegisteredBanner, showVerifiedBanner }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<"invalid" | "unverified" | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    // Pre-check email verification before attempting sign-in (skipped in dev —
    // verification emails link to the production domain, so local accounts
    // can never complete this step on localhost)
    if (process.env.NODE_ENV === "production") {
      const { verified } = await checkEmailVerification(data.email);
      if (!verified) {
        setUnverifiedEmail(data.email);
        setServerError("unverified");
        return;
      }
    }

    const result = await signIn("credentials", { ...data, redirect: false });
    if (result?.error) {
      setServerError("invalid");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {showVerifiedBanner && (
        <div className="auth-registered-banner" style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.3)" }}>
          <div className="auth-registered-icon" style={{ background: "#0D9488" }}>
            <MailCheck size={12} color="white" />
          </div>
          <div>
            <p className="auth-registered-title" style={{ color: "#2DD4BF" }}>Email verified!</p>
            <p className="auth-registered-sub">Your account is active. Sign in below.</p>
          </div>
        </div>
      )}

      {showRegisteredBanner && !showVerifiedBanner && (
        <div className="auth-registered-banner">
          <div className="auth-registered-icon">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="auth-registered-title">Account created!</p>
            <p className="auth-registered-sub">Check your email for a verification link.</p>
          </div>
        </div>
      )}

      {serverError === "invalid" && (
        <div className="auth-error">Invalid email or password. Please try again.</div>
      )}
      {serverError === "unverified" && (
        <div className="auth-error" style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}>
          Please verify your email before signing in.{" "}
          <Link href={`/auth/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
            style={{ color: "#fbbf24", fontWeight: 700, textDecoration: "underline" }}>
            Resend link
          </Link>
        </div>
      )}

      <div className="auth-field">
        <label className="auth-label">Email address</label>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="auth-input"
        />
        {errors.email && <p className="auth-field-err">{errors.email.message}</p>}
      </div>

      <div className="auth-field">
        <label className="auth-label">Password</label>
        <div className="auth-pw-wrap">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="auth-input"
            style={{ paddingRight: 48 }}
          />
          <button
            type="button"
            className="auth-pw-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password && <p className="auth-field-err">{errors.password.message}</p>}
        <Link href="/auth/forgot-password" className="auth-forgot">Forgot password?</Link>
      </div>

      <button type="submit" disabled={isSubmitting} className="auth-btn" style={{ marginTop: 4 }}>
        {isSubmitting
          ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Loader2 size={17} className="animate-spin" /> Signing in…
            </span>
          : "Sign in"}
      </button>
    </form>
  );
}
