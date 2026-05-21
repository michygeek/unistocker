"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("uni-theme", next ? "dark" : "light"); } catch {}
  };

  if (!mounted) return <div style={{ width: 72, height: 36 }} />;

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        borderRadius: 99,
        border: "1px solid var(--border-2)",
        background: "var(--bg-card)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {[
        { mode: "light", Icon: Sun },
        { mode: "dark",  Icon: Moon },
      ].map(({ mode, Icon }) => {
        const active = dark ? mode === "dark" : mode === "light";
        return (
          <span
            key={mode}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 99,
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#fff" : "var(--text-3)",
              transition: "all 0.2s",
              boxShadow: active ? "var(--shadow-accent)" : "none",
            }}
          >
            <Icon size={14} />
          </span>
        );
      })}
    </button>
  );
}
