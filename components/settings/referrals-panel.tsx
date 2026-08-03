"use client";

import { useState } from "react";
import { Copy, Check, Gift, Users } from "lucide-react";
import { NAIRA_PER_POINT } from "@/lib/referral-constants";

interface ReferredOrg {
  id: string;
  name: string;
  createdAt: string;
  referralRewardGiven: boolean;
}

interface Props {
  referralCode: string;
  referralPoints: number;
  referredOrgs: ReferredOrg[];
  origin: string;
}

export function ReferralsPanel({ referralCode, referralPoints, referredOrgs, origin }: Props) {
  const [copied, setCopied] = useState(false);
  const link = `${origin}/auth/register?ref=${referralCode}`;

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Code + link card */}
      <div className="uni-card" style={{ padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
          Your referral code
        </p>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.08em", color: "var(--text)", fontFamily: "monospace" }}>
          {referralCode}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            style={{ flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-2)", fontSize: 12.5 }}
          />
          <button
            onClick={copy}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: "none", background: "#0D9488", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
          Share this link. When someone signs up and their business pays for Business, you get 10 points.
        </p>
      </div>

      {/* Points balance */}
      <div className="uni-card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Gift size={22} style={{ color: "#f59e0b" }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text)" }}>{referralPoints} pts</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            = ₦{(referralPoints * NAIRA_PER_POINT).toLocaleString()} off your next subscription payment — apply it at checkout on the{" "}
            <a href="/billing" style={{ color: "#0D9488", fontWeight: 600 }}>Billing page</a>.
          </p>
        </div>
      </div>

      {/* Referral history */}
      <div className="uni-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={15} style={{ color: "var(--text-2)" }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Your referrals</h2>
        </div>
        {referredOrgs.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            No referrals yet — share your code to start earning points.
          </p>
        ) : (
          <div>
            {referredOrgs.map((o) => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{o.name}</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: "var(--text-muted)" }}>
                    Joined {new Date(o.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                  background: o.referralRewardGiven ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                  color: o.referralRewardGiven ? "#10b981" : "var(--text-muted)",
                }}>
                  {o.referralRewardGiven ? "Converted" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
