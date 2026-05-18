"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3, Users, Settings,
  Bell, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles?: UserRole[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",      label: "Dashboard",     icon: LayoutDashboard },
  { href: "/inventory",      label: "Inventory",     icon: Package },
  { href: "/sales",          label: "Sales",         icon: ShoppingCart },
  { href: "/reports",        label: "Reports",       icon: BarChart3,  roles: ["BOSS", "MANAGER"] },
  { href: "/notifications",  label: "Notifications", icon: Bell },
  { href: "/settings/staff", label: "Staff",         icon: Users,      roles: ["BOSS", "MANAGER"] },
  { href: "/settings",       label: "Settings",      icon: Settings },
];

interface SidebarProps {
  userRole: UserRole;
  userName?: string | null;
  userEmail?: string;
  organizationName?: string | null;
  unreadCount?: number;
}

export function Sidebar({ userRole, userName, userEmail, organizationName, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <Image src="/Uniwhite.png" alt="UniStocker" width={32} height={32} style={{ objectFit: "contain" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, color: "#fff", fontSize: 14, margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {organizationName ?? "UniStocker"}
          </p>
          <p style={{ fontSize: 11, color: "#4E8A78", margin: "3px 0 0" }}>
            powered by <span style={{ color: "#2EBD78", fontWeight: 600 }}>UniStocker</span>
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const count = item.href === "/notifications" ? unreadCount : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                fontSize: 14, fontWeight: 500, transition: "all 0.15s",
                background: active ? "#2EBD78" : "transparent",
                color: active ? "#fff" : "#7EB8A8",
              }}
              onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(46,189,120,0.1)"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; } }}
              onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#7EB8A8"; } }}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {count > 0 && (
                <span style={{
                  background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700,
                  padding: "2px 6px", borderRadius: 99, minWidth: 18, textAlign: "center",
                }}>
                  {count > 99 ? "99+" : count}
                </span>
              )}
              {active && <ChevronRight size={13} style={{ opacity: 0.7 }} />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #2EBD78, #1B3D4F)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
              {(userName ?? userEmail ?? "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName ?? "User"}
            </p>
            <p style={{ color: "#4E8A78", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", color: "#7EB8A8", fontSize: 14, fontWeight: 500,
            transition: "all 0.15s", textAlign: "left",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#7EB8A8"; }}
        >
          <LogOut size={16} />
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
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 50,
          width: 40, height: 40, background: "#2EBD78", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(46,189,120,0.4)",
        }}
        className="lg:hidden"
      >
        <Menu size={20} color="white" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex" }}>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{ position: "relative", width: 272, background: "#0F2030", display: "flex", flexDirection: "column", zIndex: 50 }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#7EB8A8" }}
            >
              <X size={20} />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex"
        style={{ width: 256, background: "#0F2030", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 30 }}
      >
        <NavContent />
      </aside>
    </>
  );
}
