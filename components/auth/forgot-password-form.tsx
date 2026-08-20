"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/auth";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const fd = new FormData();
    fd.append("email", data.email);
    const result = await requestPasswordReset(fd);
    if ("error" in result && result.error) {
      setServerError(result.error as string);
    } else {
      setSentEmail(data.email);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(12,151,58,0.10)", border: "2px solid rgba(12,151,58,0.30)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <CheckCircle size={26} color="#0C973A" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F2030", margin: "0 0 8px" }}>
          Check your email
        </h3>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, margin: "0 0 24px" }}>
          If <strong style={{ color: "#374151" }}>{sentEmail}</strong> is registered,
          you&apos;ll receive a reset link within a few minutes.
          Check your spam folder if you don&apos;t see it.
        </p>
        <Link href="/auth/login" className="auth-btn" style={{
          display: "block", textAlign: "center", textDecoration: "none",
          padding: "13px", borderRadius: "10px",
        }}>
          Back to sign in
        </Link>
        <button
          onClick={() => setSent(false)}
          style={{ background: "none", border: "none", cursor: "pointer", marginTop: 12, fontSize: 13, color: "#9ca3af" }}
        >
          Didn&apos;t receive it? Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverError && <div className="auth-error">{serverError}</div>}

      <div className="auth-field">
        <label className="auth-label">Email address</label>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="auth-input"
          autoFocus
        />
        {errors.email && <p className="auth-field-err">{errors.email.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="auth-btn" style={{ marginTop: 4 }}>
        {isSubmitting
          ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Loader2 size={17} className="animate-spin" /> Sending link…
            </span>
          : "Send reset link"}
      </button>
    </form>
  );
}
