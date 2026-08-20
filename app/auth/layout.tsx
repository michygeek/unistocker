import type { ReactNode } from "react";

const AUTH_CSS = `
  /* ── Reset ────────────────────────────────────────── */
  .auth-page *, .auth-page *::before, .auth-page *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Page shell ───────────────────────────────────── */
  .auth-page {
    min-height: 100dvh;
    display: flex;
    font-family: system-ui, -apple-system, sans-serif;
    background: #fff;
  }

  /* ── Left brand panel (≥900px only) ──────────────── */
  .auth-left {
    display: none;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    background: linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0D2E2B 100%);
    position: relative;
    overflow: hidden;
  }
  @media (min-width: 900px) { .auth-left { display: flex; flex: 0 0 45%; } }

  /* decorative blobs */
  .auth-blob { position: absolute; border-radius: 50%; pointer-events: none; }
  .auth-blob-1 { width: 320px; height: 320px; background: radial-gradient(circle, rgba(12,151,58,0.20) 0%, transparent 70%); top: -80px; right: -80px; }
  .auth-blob-2 { width: 200px; height: 200px; background: radial-gradient(circle, rgba(245,168,35,0.10) 0%, transparent 70%); bottom: 80px; left: -60px; }
  .auth-blob-3 { width: 140px; height: 140px; background: radial-gradient(circle, rgba(100,237,128,0.12) 0%, transparent 70%); bottom: 220px; right: 40px; }
  .auth-dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }

  .auth-left-logo { position: relative; z-index: 1; }

  .auth-left-body {
    position: relative; z-index: 1; flex: 1;
    display: flex; flex-direction: column; justify-content: center;
    padding: 40px 0;
  }
  .auth-left-headline {
    font-size: clamp(28px, 2.8vw, 38px); font-weight: 800;
    color: #fff; line-height: 1.12; letter-spacing: -0.03em; margin-bottom: 10px;
  }
  .auth-left-headline em       { font-style: normal; color: #64ED80; }
  .auth-left-headline em.amber { font-style: normal; color: #F5A823; }

  .auth-left-sub { font-size: 15px; color: #7AB08C; line-height: 1.6; margin-bottom: 36px; }

  .auth-feature-list { display: flex; flex-direction: column; gap: 14px; }
  .auth-feature { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500; color: #94C0A3; }
  .auth-feature-icon {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    background: rgba(12,151,58,0.15);
    display: flex; align-items: center; justify-content: center;
  }
  .auth-feature-icon.amber { background: rgba(245,168,35,0.12); }

  .auth-left-footer { position: relative; z-index: 1; }
  .auth-stat-row { display: flex; gap: 24px; }
  .auth-stat-val { font-size: 20px; font-weight: 800; color: #fff; }
  .auth-stat-lbl { font-size: 11px; color: #4E8A62; margin-top: 2px; }

  .auth-badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .auth-badge {
    font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 99px;
    border: 1px solid rgba(100,237,128,0.25); color: #64ED80;
    background: rgba(12,151,58,0.10);
  }

  /* ── Accent strip ─────────────────────────────────── */
  .auth-strip {
    height: 3px;
    background: linear-gradient(90deg, #0C973A 0%, #F5A823 50%, #1E293B 100%);
    flex-shrink: 0;
  }
  .auth-strip-mobile { display: block; }
  @media (min-width: 900px) { .auth-strip-mobile { display: none; } }

  /* ── Right form panel ─────────────────────────────── */
  .auth-right {
    flex: 1; display: flex; flex-direction: column;
    background: #ffffff; overflow-y: auto;
  }

  /* Mobile brand bar (hidden ≥900px) */
  .auth-mobile-bar {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 24px 16px;
    background: linear-gradient(135deg, #0F172A, #1E293B);
    flex-shrink: 0;
  }
  @media (min-width: 900px) { .auth-mobile-bar { display: none; } }
  .auth-mobile-bar-name { font-weight: 700; font-size: 16px; color: #fff; }
  .auth-mobile-bar-sub  { font-size: 11px; color: #4E8A62; margin-top: 1px; }

  /* ── Form area ────────────────────────────────────── */
  .auth-form-area {
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    padding: 40px 36px; max-width: 460px; width: 100%; margin: 0 auto;
  }
  @media (max-width: 480px) { .auth-form-area { padding: 28px 20px; } }

  .auth-form-heading {
    font-size: 26px; font-weight: 800; color: #0F172A;
    letter-spacing: -0.02em; margin-bottom: 4px;
  }
  .auth-form-sub { font-size: 14px; color: #6b7280; margin-bottom: 24px; }

  /* ── Inputs ───────────────────────────────────────── */
  .auth-input {
    width: 100%; padding: 13px 16px; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: #f9fafb;
    color: #111827; font-size: 15px; outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    -webkit-appearance: none; font-family: inherit;
  }
  .auth-input::placeholder { color: #9ca3af; }
  .auth-input:focus {
    border-color: #0C973A; background: #fff;
    box-shadow: 0 0 0 3px rgba(12,151,58,0.12);
  }
  .auth-input:-webkit-autofill,
  .auth-input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #f9fafb inset;
    -webkit-text-fill-color: #111827;
  }

  .auth-label {
    display: block; font-size: 13px; font-weight: 600;
    color: #374151; margin-bottom: 7px;
  }
  .auth-field { margin-bottom: 18px; }
  .auth-field-err { color: #ef4444; font-size: 12px; margin-top: 5px; }

  /* ── Alerts ───────────────────────────────────────── */
  .auth-error {
    background: #fef2f2; border: 1px solid #fecaca;
    color: #dc2626; padding: 11px 14px; border-radius: 9px;
    font-size: 14px; margin-bottom: 18px;
  }
  .auth-success {
    background: #f0fdf4; border: 1px solid #bbf7d0;
    color: #15803d; padding: 11px 14px; border-radius: 9px;
    font-size: 14px; margin-bottom: 18px;
  }

  /* ── Password visibility toggle ───────────────────── */
  .auth-pw-wrap { position: relative; }
  .auth-pw-toggle {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #9ca3af; padding: 4px; line-height: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .auth-pw-toggle:hover { color: #6b7280; }

  /* ── Primary CTA button ───────────────────────────── */
  .auth-btn {
    width: 100%; padding: 14px; border-radius: 10px;
    background: #0C973A; color: #FFFFFF;
    font-size: 15px; font-weight: 700; border: none; cursor: pointer;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    letter-spacing: -0.01em; font-family: inherit;
    box-shadow: 0 4px 14px rgba(12,151,58,0.30);
  }
  .auth-btn:hover  { background: #0A7B30; box-shadow: 0 6px 18px rgba(12,151,58,0.38); }
  .auth-btn:active { transform: scale(0.98); }
  .auth-btn:disabled { background: rgba(12,151,58,0.45); box-shadow: none; cursor: not-allowed; color: #fff; }

  /* ── Navigation links ─────────────────────────────── */
  .auth-bottom-link { text-align: center; margin-top: 22px; font-size: 14px; color: #6b7280; }
  .auth-bottom-link a { color: #0C973A; font-weight: 600; text-decoration: none; }
  .auth-bottom-link a:hover { color: #0A7B30; }

  .auth-back {
    display: block; text-align: center;
    margin-top: 10px; font-size: 13px; color: #9ca3af; text-decoration: none;
  }
  .auth-back:hover { color: #6b7280; }

  .auth-forgot {
    display: block; text-align: right;
    font-size: 13px; color: #0C973A; font-weight: 600;
    text-decoration: none; margin-top: 6px;
  }
  .auth-forgot:hover { color: #0A7B30; }

  /* ── Misc ─────────────────────────────────────────── */
  .auth-divider { border: none; border-top: 1.5px solid #f3f4f6; margin: 20px 0 16px; }

  .auth-section-label {
    display: block; font-size: 10px; font-weight: 700; color: #9ca3af;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;
  }

  .auth-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 420px) { .auth-two-col { grid-template-columns: 1fr; } }

  .auth-free-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(12,151,58,0.08); border: 1px solid rgba(12,151,58,0.22);
    color: #0C973A; font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 99px; margin-bottom: 18px;
    letter-spacing: 0.04em;
  }

  /* ── Registered success banner ────────────────────── */
  .auth-registered-banner {
    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;
    padding: 14px 16px; margin-bottom: 20px;
    display: flex; align-items: flex-start; gap: 10px;
  }
  .auth-registered-icon {
    width: 20px; height: 20px; border-radius: 50%; background: #0C973A;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }
  .auth-registered-title { font-size: 14px; font-weight: 700; color: #15803d; margin-bottom: 2px; }
  .auth-registered-sub   { font-size: 13px; color: #16a34a; }
`;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{AUTH_CSS}</style>
      {children}
    </>
  );
}
