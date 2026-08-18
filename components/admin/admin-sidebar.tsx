"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Building2, CreditCard, Users, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/admin",               label: "Overview",       icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations",  icon: Building2 },
  { href: "/admin/subscriptions", label: "Subscriptions",  icon: CreditCard },
  { href: "/admin/users",         label: "Users",          icon: Users },
] as const;

const S = {
  sidebar:    { background: "var(--sidebar)", width: 256, height: "100%", display: "flex", flexDirection: "column" as const },
  brand:      { padding: "20px 16px 16px", borderBottom: "1px solid var(--sidebar-hi)" },
  logoBox:    { width: 34, height: 34, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  orgName:    { margin: 0, fontWeight: 800, color: "#fff", fontSize: 14, lineHeight: 1.2 },
  sub:        { margin: 0, fontSize: 10, color: "var(--sidebar-text)", letterSpacing: "0.04em" },
  nav:        { flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column" as const, gap: 2, overflowY: "auto" as const },
  footer:     { padding: "10px 10px 16px", borderTop: "1px solid var(--sidebar-hi)" },
  email:      { margin: 0, fontSize: 12, fontWeight: 600, color: "var(--sidebar-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
};

function NavLink({ href, label, Icon, active, onClick }: { href: string; label: string; Icon: React.ComponentType<{ size?: number }>; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="admin-link"
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
        borderRadius: 10, textDecoration: "none", fontSize: 14.5, fontWeight: 500,
        background: active ? "var(--accent)" : "transparent",
        color: active ? "var(--accent-fg)" : "var(--sidebar-text)",
        boxShadow: active ? "var(--shadow-accent)" : "none",
        transition: "all 0.15s",
      }}
      data-active={active}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const Content = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div style={S.sidebar}>
      {/* Brand */}
      <div style={S.brand}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={S.logoBox}>
            <Image src="/Uniwhite.png" alt="UniStocker" width={18} height={18} style={{ objectFit: "contain" }} />
          </div>
          <div>
            <p style={S.orgName}>UniStocker</p>
            <p style={S.sub}>Super Admin</p>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "var(--accent-sub)", border: "1px solid var(--accent-glow)" }}>
          <ShieldCheck size={11} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em" }}>PLATFORM ADMIN</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        <style>{`.admin-link[data-active="false"]:hover { background: var(--sidebar-hi) !important; color: #fff !important; }`}</style>
        {NAV.map((item) => {
          const isExact = item.href === "/admin";
          const active = isExact ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} active={active} onClick={onLinkClick} />
          );
        })}
      </nav>

      {/* Footer */}
      <div style={S.footer}>
        <div style={{ padding: "8px 10px", marginBottom: 4 }}>
          <p style={S.email}>{adminEmail}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="admin-signout"
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", color: "var(--sidebar-text)",
            fontSize: 14.5, fontWeight: 500, transition: "all 0.15s", textAlign: "left",
          }}
        >
          <style>{`.admin-signout:hover { background: rgba(239,68,68,0.12) !important; color: #f87171 !important; }`}</style>
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
              style={{ position: "absolute", top: 14, right: 14, background: "var(--sidebar-hi)", border: "none", cursor: "pointer", color: "var(--sidebar-text)", borderRadius: 8, padding: 6, zIndex: 10 }}
            >
              <X size={18} />
            </button>
            <Content onLinkClick={() => setMobileOpen(false)} />
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
