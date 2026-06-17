"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PWAInstallButton } from "@/components/pwa/install-button";

interface HeaderProps {
  title: string;
  unreadCount?: number;
}

export function Header({ title, unreadCount = 0 }: HeaderProps) {
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(var(--bg-card-rgb, 255,255,255), 0.82)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: "-0.02em",
          marginLeft: 48,
          whiteSpace: "nowrap",
        }}
        className="lg:ml-0"
      >
        {title}
      </h1>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Search */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: "center",
            gap: 8,
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "7px 14px",
            fontSize: 14,
            color: "var(--text-3)",
            width: 200,
            cursor: "text",
          }}
        >
          <Search size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
          <span>Search…</span>
        </div>

        {/* Install button — only shown on mobile where sidebar is hidden */}
        <div className="lg:hidden">
          <PWAInstallButton variant="header" />
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Link
          href="/notifications"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                width: 17,
                height: 17,
                background: "#ef4444",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 99,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--bg)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
