"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  Users, Settings, Bell, LogOut, Menu, X, TrendingUp, AlertTriangle, Lightbulb,
} from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@prisma/client";

const NAV = [
  { href: "/dashboard",      label: "Dashboard",     icon: LayoutDashboard },
  { href: "/inventory",      label: "Inventory",     icon: Package },
  { href: "/sales",          label: "Sales",         icon: ShoppingCart },
  { href: "/reports",        label: "Reports",       icon: BarChart3,  roles: ["BOSS","MANAGER"] },
  { href: "/notifications",  label: "Notifications", icon: Bell },
  { href: "/settings/staff", label: "Staff",         icon: Users,      roles: ["BOSS","MANAGER"] },
  { href: "/settings",       label: "My Account",    icon: Settings },
] as const;

const AI_NAV = [
  { href: "/dashboard/ai/forecasting",  label: "Demand Forecasting", icon: TrendingUp },
  { href: "/dashboard/ai/stock-alerts", label: "Smart Stock Alerts", icon: AlertTriangle },
  { href: "/dashboard/ai/insights",     label: "Business Insights",  icon: Lightbulb },
] as const;

interface Props {
  userRole: UserRole;
  userName?: string | null;
  userEmail?: string;
  organizationName?: string | null;
  unreadCount?: number;
}

const S = {
  sidebar:     { background: "var(--sidebar)", width: 256, height: "100%", display: "flex", flexDirection: "column" as const },
  brand:       { padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 },
  logoBox:     { width: 36, height: 36, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  orgName:     { fontWeight: 700, color: "#fff", fontSize: 14, margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  poweredBy:   { fontSize: 10, color: "rgba(255,255,255,0.28)", margin: "3px 0 0", letterSpacing: "0.02em" },
  nav:         { flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column" as const, gap: 1, overflowY: "auto" as const },
  footer:      { padding: "10px 10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" },
  userRow:     { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", marginBottom: 2 },
  avatar:      { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #0D9488, #042F2E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText:  { color: "#FFFFFF", fontSize: 13, fontWeight: 700 },
  userName:    { color: "#fff", fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  userEmail:   { color: "rgba(255,255,255,0.30)", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
};

function NavLink({ href, label, Icon, active, badge }: { href: string; label: string; Icon: React.ComponentType<{size?: number}>; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 10, textDecoration: "none",
        fontSize: 13.5, fontWeight: 500, transition: "all 0.15s",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "var(--accent-fg)" : "var(--sidebar-text)",
        boxShadow: active ? "var(--shadow-accent)" : "none",
        position: "relative",
      }}
      className="sidebar-link"
    >
      <Icon size={16} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{
          background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700,
          padding: "2px 6px", borderRadius: 99, minWidth: 18, textAlign: "center",
        }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ userRole, userName, userEmail, organizationName, unreadCount = 0 }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = NAV.filter((i) => !("roles" in i) || (i.roles as readonly string[]).includes(userRole));

  const Content = () => (
    <div style={S.sidebar}>
      {/* Brand */}
      <div style={S.brand}>
        <div style={S.logoBox}>
          <Image src="/Uniwhite.png" alt="UniStocker" width={22} height={22} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={S.orgName}>{organizationName ?? "UniStocker"}</p>
          <p style={S.poweredBy}>UniStocker · Inventory Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        <style>{`.sidebar-link:not([style*="background: var(--accent)"]):hover{background:rgba(255,255,255,0.06)!important;color:#fff!important}`}</style>
        {visible.map((item) => {
          const hasChild = visible.some(
            (other) => other.href !== item.href && other.href.startsWith(item.href + "/")
          );
          const active = pathname === item.href || (!hasChild && pathname.startsWith(item.href + "/"));
          return (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={active}
              badge={item.href === "/notifications" ? unreadCount : undefined}
            />
          );
        })}

        {/* AI Features section */}
        <div style={{ marginTop: 12, marginBottom: 4 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 12px" }}>
            AI Features
          </p>
        </div>
        {AI_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={active}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div style={S.footer}>
        <div style={S.userRow}>
          <div style={S.avatar}>
            <span style={S.avatarText}>{(userName ?? userEmail ?? "U").charAt(0).toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={S.userName}>{userName ?? "User"}</p>
            <p style={S.userEmail}>{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="signout-btn"
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", color: "rgba(255,255,255,0.38)",
            fontSize: 13.5, fontWeight: 500, transition: "all 0.15s", textAlign: "left",
          }}
        >
          <style>{`.signout-btn:hover{background:rgba(239,68,68,0.12)!important;color:#f87171!important}`}</style>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden"
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 50,
          width: 40, height: 40, background: "var(--accent)", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: "pointer", boxShadow: "var(--shadow-accent)",
        }}
      >
        <Menu size={20} style={{ color: "var(--accent-fg)" }} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex" }}>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{ position: "relative", width: 264, zIndex: 50, display: "flex", flexDirection: "column" }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: 6, zIndex: 10 }}
            >
              <X size={18} />
            </button>
            <Content />
          </aside>
        </div>
      )}

      {/* Desktop */}
      <aside className="hidden lg:block" style={{ width: 256, position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 30 }}>
        <Content />
      </aside>
    </>
  );
}
