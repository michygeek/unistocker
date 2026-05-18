"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export function LoginForm({ showRegisteredBanner }: { showRegisteredBanner?: boolean }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const result = await signIn("credentials", { ...data, redirect: false });
    if (result?.error) {
      setServerError("Invalid email or password. Please try again.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {showRegisteredBanner && (
        <div className="auth-registered-banner">
          <div className="auth-registered-icon">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="auth-registered-title">Account created!</p>
            <p className="auth-registered-sub">Sign in below to access your dashboard.</p>
          </div>
        </div>
      )}

      {serverError && <div className="auth-error">{serverError}</div>}

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
