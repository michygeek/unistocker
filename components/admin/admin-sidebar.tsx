"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Building2, CreditCard, Users, LogOut, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/admin",               label: "Overview",       icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations",  icon: Building2 },
  { href: "/admin/subscriptions", label: "Subscriptions",  icon: CreditCard },
  { href: "/admin/users",         label: "Users",          icon: Users },
];

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 240, position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 30,
      background: "#060B15", borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Brand */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Image src="/Uniwhite.png" alt="UniStocker" width={18} height={18} style={{ objectFit: "contain" }} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: "#fff", fontSize: 14, lineHeight: 1.2 }}>UniStocker</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>Super Admin</p>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
          <ShieldCheck size={11} style={{ color: "#a78bfa" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.04em" }}>PLATFORM ADMIN</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        <style>{`.admin-link:not(.active):hover { background: rgba(255,255,255,0.05) !important; color: #fff !important; }`}</style>
        {NAV.map((item) => {
          const isExact = item.href === "/admin";
          const active = isExact ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-link${active ? " active" : ""}`}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500,
                background: active ? "rgba(124,58,237,0.20)" : "transparent",
                color: active ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                border: active ? "1px solid rgba(124,58,237,0.30)" : "1px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px 10px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ padding: "8px 10px", marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminEmail}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", color: "rgba(255,255,255,0.35)",
            fontSize: 14, fontWeight: 500, transition: "all 0.15s", textAlign: "left",
          }}
          className="admin-signout"
        >
          <style>{`.admin-signout:hover { background: rgba(239,68,68,0.10) !important; color: #f87171 !important; }`}</style>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
