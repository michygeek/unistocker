"use client";

import { Building2, ChevronDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { switchActiveBranch } from "@/lib/actions/branches";

interface Branch {
  id: string;
  name: string;
  isActive: boolean;
}

interface BranchPickerProps {
  branches: Branch[];
  activeBranchId: string | null;
}

export function BranchPicker({ branches, activeBranchId }: BranchPickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeBranches = branches.filter((b) => b.isActive);
  const active = activeBranches.find((b) => b.id === activeBranchId);
  const label = active?.name ?? "All Branches";

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const select = async (id: string | null) => {
    setLoading(true);
    setOpen(false);
    await switchActiveBranch(id);
    router.refresh();
    setLoading(false);
  };

  const options = [
    { id: null as string | null, name: "All Branches" },
    ...activeBranches,
  ];

  return (
    <div ref={ref} style={{ position: "relative", margin: "6px 10px 4px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 2px 4px" }}>
        Branch Context
      </p>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.10)",
          background: activeBranchId ? "rgba(13,148,136,0.15)" : "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.85)",
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "all 0.15s",
          textAlign: "left",
        }}
      >
        <Building2 size={13} style={{ color: activeBranchId ? "var(--accent)" : "rgba(255,255,255,0.4)", flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {loading ? "Switching…" : label}
        </span>
        <ChevronDown
          size={12}
          style={{
            color: "rgba(255,255,255,0.35)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#0b1e1b",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 10,
            overflow: "hidden",
            zIndex: 200,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((b, i) => {
            const isActive = b.id === null ? activeBranchId === null : b.id === activeBranchId;
            return (
              <button
                key={b.id ?? "__all"}
                onClick={() => select(b.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 12px",
                  border: "none",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "var(--accent-fg)" : "rgba(255,255,255,0.65)",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Building2 size={12} style={{ flexShrink: 0, opacity: 0.7 }} />
                <span style={{ flex: 1 }}>{b.name}</span>
                {isActive && <Check size={12} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
