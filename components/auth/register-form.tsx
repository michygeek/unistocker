"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { registerUser } from "@/lib/actions/auth";

const schema = z
  .object({
    organizationName: z.string().min(2, "Organization name too short"),
    name: z.string().min(2, "Name too short"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Min. 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const fd = new FormData();
    // Don't send confirmPassword to the server action
    fd.append("organizationName", data.organizationName);
    fd.append("name", data.name);
    fd.append("email", data.email);
    fd.append("password", data.password);

    const result = await registerUser(fd);
    if ("error" in result && result.error) {
      const err = result.error as Record<string, string[]>;
      setServerError(Object.values(err).flat()[0] ?? "Registration failed");
    } else {
      router.push("/auth/login?registered=true");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverError && <div className="auth-error">{serverError}</div>}

      {/* Business name */}
      <div className="auth-field">
        <label className="auth-label">Business / Organization name</label>
        <input
          {...register("organizationName")}
          type="text"
          placeholder="e.g. Acme Stores Ltd"
          autoComplete="organization"
          className="auth-input"
        />
        {errors.organizationName && <p className="auth-field-err">{errors.organizationName.message}</p>}
      </div>

      <hr className="auth-divider" />
      <p className="auth-section-label">Your account details</p>

      {/* Name + Email */}
      <div className="auth-two-col">
        <div className="auth-field">
          <label className="auth-label">Full name</label>
          <input {...register("name")} type="text" placeholder="John Doe" autoComplete="name" className="auth-input" />
          {errors.name && <p className="auth-field-err">{errors.name.message}</p>}
        </div>
        <div className="auth-field">
          <label className="auth-label">Email address</label>
          <input {...register("email")} type="email" placeholder="you@company.com" autoComplete="email" className="auth-input" />
          {errors.email && <p className="auth-field-err">{errors.email.message}</p>}
        </div>
      </div>

      {/* Password + Confirm side by side */}
      <div className="auth-two-col">
        <div className="auth-field">
          <label className="auth-label">Password</label>
          <div className="auth-pw-wrap">
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="auth-input"
              style={{ paddingRight: 44 }}
            />
            <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="auth-field-err">{errors.password.message}</p>}
        </div>

        <div className="auth-field">
          <label className="auth-label">Confirm password</label>
          <div className="auth-pw-wrap">
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat password"
              autoComplete="new-password"
              className="auth-input"
              style={{ paddingRight: 44 }}
            />
            <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle confirm">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="auth-field-err">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="auth-btn" style={{ marginTop: 4 }}>
        {isSubmitting
          ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Loader2 size={17} className="animate-spin" /> Creating account…
            </span>
          : "Create free account"}
      </button>
    </form>
  );
}
