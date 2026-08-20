"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { resetPassword } from "@/lib/actions/auth";
import Link from "next/link";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const fd = new FormData();
    fd.append("token", token);
    fd.append("email", email);
    fd.append("password", data.password);
    const result = await resetPassword(fd);
    if ("error" in result && result.error) {
      setServerError(result.error as string);
    } else {
      setDone(true);
    }
  };

  if (done) {
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
          Password updated!
        </h3>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, margin: "0 0 24px" }}>
          Your password has been changed successfully.<br />
          Sign in with your new password to continue.
        </p>
        <Link href="/auth/login" className="auth-btn" style={{
          display: "block", textAlign: "center", textDecoration: "none", padding: "13px", borderRadius: "10px",
        }}>
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverError && <div className="auth-error">{serverError}</div>}

      <div className="auth-field">
        <label className="auth-label">New password</label>
        <div className="auth-pw-wrap">
          <input
            {...register("password")}
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="auth-input"
            style={{ paddingRight: 48 }}
            autoFocus
          />
          <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password && <p className="auth-field-err">{errors.password.message}</p>}
      </div>

      <div className="auth-field">
        <label className="auth-label">Confirm new password</label>
        <div className="auth-pw-wrap">
          <input
            {...register("confirmPassword")}
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            className="auth-input"
            style={{ paddingRight: 48 }}
          />
          <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle confirm password">
            {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="auth-field-err">{errors.confirmPassword.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="auth-btn" style={{ marginTop: 4 }}>
        {isSubmitting
          ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Loader2 size={17} className="animate-spin" /> Saving…
            </span>
          : "Set new password"}
      </button>
    </form>
  );
}
