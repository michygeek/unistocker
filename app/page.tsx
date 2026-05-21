import Link from "next/link";
import Image from "next/image";
import {
  Package, BarChart3, Bell, Users, ShieldCheck,
  ArrowRight, CheckCircle,
  ShoppingCart, Globe, Smartphone, Star,
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const C = {
  mint:      "#DBE8D7",
  mint2:     "#C8D8C3",
  mintText:  "#0D1A14",
  mintText2: "#3A5244",
  mintText3: "#6A8A74",
  bg:        "#FFFFFF",
  bgAlt:     "#F8FAF8",
  text:      "#0D1A14",
  text2:     "#475569",
  text3:     "#94A3B8",
  border:    "rgba(13,26,20,0.08)",
  border2:   "rgba(13,26,20,0.14)",
  dark:      "#080D18",
  dark2:     "#0C1528",
  dText:     "#F1F5F9",
  dText2:    "#94A3B8",
  dText3:    "#475569",
  dBorder:   "rgba(255,255,255,0.07)",
  dBorder2:  "rgba(255,255,255,0.12)",
  accent:        "#0D9488",
  accent2:       "#0F766E",
  accentSub:     "rgba(13,148,136,0.10)",
  accentBright:  "#2DD4BF",
};

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.dark}; }
  .lp { color: ${C.text}; font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
  .lp a { text-decoration: none; }

  /* ── Keyframes ── */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(48px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(13,148,136,0.30); }
    50%       { box-shadow: 0 4px 40px rgba(13,148,136,0.58); }
  }
  @keyframes lineGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  .anim-0 { animation: fadeInUp 0.60s 0.00s ease both; }
  .anim-1 { animation: fadeInUp 0.60s 0.12s ease both; }
  .anim-2 { animation: fadeInUp 0.60s 0.22s ease both; }
  .anim-3 { animation: fadeInUp 0.60s 0.32s ease both; }
  .anim-4 { animation: fadeInUp 0.60s 0.42s ease both; }
  .anim-r { animation: slideInRight 0.65s 0.20s ease both; }
  .anim-float { animation: float 5.5s 1s ease-in-out infinite; }
  .anim-blink { animation: blink 2s ease-in-out infinite; }

  .lp-feat-card:nth-child(1) { animation: scaleIn 0.45s 0.00s ease both; }
  .lp-feat-card:nth-child(2) { animation: scaleIn 0.45s 0.06s ease both; }
  .lp-feat-card:nth-child(3) { animation: scaleIn 0.45s 0.12s ease both; }
  .lp-feat-card:nth-child(4) { animation: scaleIn 0.45s 0.18s ease both; }
  .lp-feat-card:nth-child(5) { animation: scaleIn 0.45s 0.24s ease both; }
  .lp-feat-card:nth-child(6) { animation: scaleIn 0.45s 0.30s ease both; }
  .lp-feat-card:nth-child(7) { animation: scaleIn 0.45s 0.36s ease both; }
  .lp-feat-card:nth-child(8) { animation: scaleIn 0.45s 0.42s ease both; }

  /* ══════════════════════════════════════════════
     NAV  (mint)
  ══════════════════════════════════════════════ */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(8,13,24,0.96);
    border-bottom: 1px solid ${C.dBorder};
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  }
  .lp-nav-inner {
    max-width: 1200px; margin: 0 auto; padding: 0 36px;
    height: 68px; display: flex; align-items: center;
  }
  .lp-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .lp-logo-box {
    width: 34px; height: 34px; border-radius: 10px;
    background: ${C.accent};
    display: flex; align-items: center; justify-content: center;
  }
  .lp-logo-text { font-weight: 800; font-size: 15px; color: ${C.dText}; letter-spacing: -0.02em; }
  .lp-nav-links { display: flex; align-items: center; gap: 2px; margin-left: 44px; }
  .lp-nav-link {
    font-size: 14px; color: ${C.dText2}; padding: 6px 14px;
    border-radius: 8px; transition: color 0.15s, background 0.15s; font-weight: 500;
  }
  .lp-nav-link:hover { color: ${C.dText}; background: rgba(255,255,255,0.06); }
  .lp-nav-auth { display: flex; align-items: center; gap: 10px; margin-left: auto; }
  .lp-signin {
    font-size: 14px; font-weight: 500; color: ${C.dText2};
    padding: 7px 14px; border-radius: 8px; transition: color 0.15s;
  }
  .lp-signin:hover { color: ${C.dText}; }
  .lp-nav-cta {
    font-size: 14px; font-weight: 600; color: #FFFFFF;
    background: ${C.accent}; padding: 8px 20px; border-radius: 8px;
    transition: background 0.15s; white-space: nowrap;
  }
  .lp-nav-cta:hover { background: ${C.accent2}; }

  /* ══════════════════════════════════════════════
     HERO  (dark)
  ══════════════════════════════════════════════ */
  .lp-hero {
    background: ${C.dark};
    padding: 148px 36px 108px;
    position: relative; overflow: hidden;
  }
  .lp-hero::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: ${C.accent};
  }
  /* Geometric rotated rectangle decoration */
  .lp-hero-geo {
    position: absolute; right: 5%; top: 10%;
    width: 520px; height: 520px; border-radius: 32px;
    border: 1px solid rgba(13,148,136,0.09);
    transform: rotate(14deg); pointer-events: none;
  }
  .lp-hero-geo::after {
    content: ''; position: absolute; inset: 28px; border-radius: 22px;
    border: 1px solid rgba(219,232,215,0.04);
  }
  .lp-hero-inner {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
    position: relative; z-index: 1;
  }
  .lp-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase;
    color: ${C.accentBright};
    background: rgba(45,212,191,0.08); border: 1px solid rgba(45,212,191,0.20);
    padding: 5px 14px; border-radius: 99px; margin-bottom: 22px;
  }
  .lp-h1 {
    font-size: clamp(40px, 5.2vw, 68px); font-weight: 900; line-height: 1.04;
    letter-spacing: -0.04em; color: ${C.dText}; margin-bottom: 24px;
  }
  .lp-h1 em { font-style: normal; color: ${C.accentBright}; }
  .lp-hero-sub {
    font-size: 18px; color: ${C.dText2}; line-height: 1.76;
    margin-bottom: 40px; max-width: 420px;
  }
  .lp-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }
  .lp-btn-pri {
    display: inline-flex; align-items: center; gap: 8px;
    background: ${C.accent}; color: #FFFFFF; font-weight: 700; font-size: 15px;
    padding: 14px 28px; border-radius: 10px; transition: all 0.18s;
    animation: glowPulse 3.5s ease-in-out infinite;
  }
  .lp-btn-pri:hover { background: ${C.accent2}; transform: translateY(-1px); }
  .lp-btn-sec {
    display: inline-flex; align-items: center; gap: 8px;
    border: 1.5px solid rgba(255,255,255,0.16); color: ${C.dText}; font-weight: 600;
    font-size: 15px; padding: 14px 28px; border-radius: 10px; transition: all 0.18s;
  }
  .lp-btn-sec:hover { border-color: rgba(255,255,255,0.30); background: rgba(255,255,255,0.05); }
  /* Proof stats bar */
  .lp-hero-proof {
    display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
    padding-top: 32px; border-top: 1px solid ${C.dBorder};
  }
  .lp-proof-stat { display: flex; flex-direction: column; gap: 3px; }
  .lp-proof-val { font-size: 22px; font-weight: 900; color: ${C.dText}; letter-spacing: -0.03em; line-height: 1; }
  .lp-proof-lbl { font-size: 12px; color: ${C.dText3}; font-weight: 500; }
  .lp-proof-sep { width: 1px; height: 30px; background: ${C.dBorder}; flex-shrink: 0; }

  /* ── Dashboard mockup ── */
  .lp-hero-right { position: relative; z-index: 1; }
  .lp-mockup-float { animation: float 5.5s 1s ease-in-out infinite; }
  .lp-mockup {
    border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 48px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(13,148,136,0.14);
  }
  .lp-mock-chrome {
    background: #040810; border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 12px 18px; display: flex; align-items: center; gap: 7px;
  }
  .lp-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .lp-mock-url {
    font-size: 11px; color: #334155; font-family: monospace;
    margin-left: 12px; background: rgba(255,255,255,0.04);
    padding: 3px 10px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.06);
  }
  .lp-mock-body { display: flex; }
  .lp-mock-sidebar {
    width: 56px; background: #060B15;
    border-right: 1px solid rgba(255,255,255,0.05);
    display: flex; flex-direction: column; align-items: center;
    padding: 14px 0; gap: 8px; flex-shrink: 0;
  }
  .lp-mock-sb-logo {
    width: 30px; height: 30px; border-radius: 8px;
    background: ${C.accent};
    display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
  }
  .lp-mock-sb-item {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.03);
  }
  .lp-mock-sb-item.on { background: rgba(13,148,136,0.18); border: 1px solid rgba(13,148,136,0.25); }
  .lp-mock-content { flex: 1; background: #F8FAFC; padding: 16px; }
  .lp-mock-toprow { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .lp-mock-page-title { font-size: 13px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em; }
  .lp-mock-live {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(13,148,136,0.10); border: 1px solid rgba(13,148,136,0.22);
    border-radius: 99px; padding: 3px 9px; font-size: 10px; font-weight: 700; color: #0D9488;
  }
  .lp-mock-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; margin-bottom: 8px; }
  .lp-mock-stat {
    background: #FFFFFF; border: 1px solid rgba(15,23,42,0.08);
    border-radius: 8px; padding: 10px 10px 8px;
    box-shadow: 0 1px 2px rgba(15,23,42,0.05);
  }
  .lp-mock-stat-val { font-size: 18px; font-weight: 900; color: #0F172A; letter-spacing: -0.03em; line-height: 1; }
  .lp-mock-stat-lbl { font-size: 10px; color: #64748B; margin-top: 2px; font-weight: 500; }
  .lp-mock-bar { height: 2px; border-radius: 2px; margin-top: 6px; }
  .lp-mock-rows { display: flex; flex-direction: column; gap: 5px; }
  .lp-mock-row {
    display: flex; align-items: center; gap: 8px;
    background: #FFFFFF; border: 1px solid rgba(15,23,42,0.07);
    border-radius: 7px; padding: 7px 10px;
    box-shadow: 0 1px 2px rgba(15,23,42,0.04);
  }
  .lp-mock-pill { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 4px; flex-shrink: 0; letter-spacing: 0.05em; }
  .lp-mock-row-txt { flex: 1; font-size: 11px; color: #475569; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lp-mock-row-time { font-size: 10px; color: #94A3B8; flex-shrink: 0; }

  /* ══════════════════════════════════════════════
     LOGOS  (white)
  ══════════════════════════════════════════════ */
  .lp-logos-strip {
    background: ${C.bg};
    border-bottom: 1px solid ${C.border};
    padding: 32px 36px;
  }
  .lp-logos-inner { max-width: 880px; margin: 0 auto; text-align: center; }
  .lp-logos-label {
    font-size: 11px; font-weight: 600; color: ${C.text3};
    letter-spacing: 0.10em; text-transform: uppercase; margin-bottom: 20px;
  }
  .lp-logos-row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; }
  .lp-logo-name {
    font-size: 13px; font-weight: 800; color: ${C.text3};
    letter-spacing: 0.04em; text-transform: uppercase;
    padding: 0 28px; position: relative;
  }
  .lp-logo-name + .lp-logo-name::before {
    content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 1px; height: 14px; background: ${C.border2};
  }

  /* ══════════════════════════════════════════════
     EYEBROWS + SHARED HEADINGS
  ══════════════════════════════════════════════ */
  .lp-eyebrow {
    display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.10em;
    text-transform: uppercase; color: ${C.accent};
    background: ${C.accentSub}; padding: 4px 12px; border-radius: 99px;
    border: 1px solid rgba(13,148,136,0.20); margin-bottom: 14px;
  }
  .lp-eyebrow-dark {
    display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.10em;
    text-transform: uppercase; color: ${C.accentBright};
    background: rgba(45,212,191,0.08); padding: 4px 12px; border-radius: 99px;
    border: 1px solid rgba(45,212,191,0.18); margin-bottom: 14px;
  }
  .lp-eyebrow-mint {
    display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.10em;
    text-transform: uppercase; color: ${C.accent2};
    background: rgba(13,148,136,0.10); padding: 4px 12px; border-radius: 99px;
    border: 1px solid rgba(13,148,136,0.22); margin-bottom: 14px;
  }
  .lp-section-title {
    font-size: clamp(28px, 3.4vw, 44px); font-weight: 900;
    letter-spacing: -0.035em; color: ${C.text}; margin-bottom: 12px; line-height: 1.08;
  }
  .lp-section-sub   { font-size: 16px; color: ${C.text2}; line-height: 1.72; }
  .lp-section-sub-c { font-size: 16px; color: ${C.text2}; line-height: 1.72; max-width: 460px; margin: 0 auto; }
  .lp-title-d    { color: ${C.dText}  !important; }
  .lp-sub-d      { color: ${C.dText2} !important; }
  .lp-title-mint { color: ${C.mintText}  !important; }
  .lp-sub-mint   { color: ${C.mintText2} !important; }

  /* ══════════════════════════════════════════════
     FEATURES  (white — asymmetric header)
  ══════════════════════════════════════════════ */
  .lp-features-section { padding: 100px 36px; background: ${C.bg}; }
  .lp-features-hd {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 32px; margin-bottom: 56px;
  }
  .lp-features-count {
    font-size: clamp(72px, 9vw, 112px); font-weight: 900; letter-spacing: -0.06em;
    color: rgba(13,26,20,0.04); line-height: 1; user-select: none; flex-shrink: 0;
  }

  .lp-feat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .lp-feat-card {
    background: ${C.bg}; border: 1.5px solid ${C.border}; border-radius: 16px;
    padding: 26px 22px; position: relative; overflow: hidden; cursor: default;
    transition: border-color 0.25s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
  }
  .lp-feat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: ${C.accent};
    transform: scaleX(0); transform-origin: left; transition: transform 0.30s ease;
  }
  .lp-feat-card:hover::before { transform: scaleX(1); }
  .lp-feat-card:hover {
    border-color: rgba(13,148,136,0.25); transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(13,148,136,0.10), 0 2px 8px rgba(13,26,20,0.05);
  }
  .lp-feat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .lp-feat-title { font-size: 14px; font-weight: 700; color: ${C.text}; margin-bottom: 8px; }
  .lp-feat-desc  { font-size: 13px; color: ${C.text2}; line-height: 1.65; }

  /* ══════════════════════════════════════════════
     HOW IT WORKS  (dark)
  ══════════════════════════════════════════════ */
  .lp-hiw-section {
    background: ${C.dark2};
    padding: 100px 36px;
    border-top: 1px solid rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .lp-hiw-hd { text-align: center; margin-bottom: 64px; }
  .lp-steps-wrap { max-width: 1000px; margin: 0 auto; position: relative; }
  .lp-steps-line {
    position: absolute; top: 23px;
    left: calc(12.5% + 24px); right: calc(12.5% + 24px);
    height: 1px; background: rgba(13,148,136,0.22);
    animation: lineGrow 1s 0.5s ease both;
  }
  .lp-steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
  .lp-step { padding: 0 20px; text-align: center; }
  .lp-step-num {
    width: 48px; height: 48px; border-radius: 12px;
    background: rgba(13,148,136,0.12); border: 1px solid rgba(13,148,136,0.28);
    color: ${C.accentBright}; font-weight: 800; font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 22px; position: relative;
    transition: background 0.25s, transform 0.25s;
  }
  .lp-step:hover .lp-step-num { background: rgba(13,148,136,0.20); transform: scale(1.08); }
  .lp-step-num::before {
    content: ''; position: absolute; inset: -5px; border-radius: 16px;
    border: 1px solid rgba(13,148,136,0.20); opacity: 0; transition: opacity 0.25s;
  }
  .lp-step:hover .lp-step-num::before { opacity: 1; }
  .lp-step-title { font-size: 15px; font-weight: 700; color: ${C.dText}; margin-bottom: 10px; }
  .lp-step-desc  { font-size: 13px; color: ${C.dText2}; line-height: 1.70; }

  /* ══════════════════════════════════════════════
     TESTIMONIALS  (mint)
  ══════════════════════════════════════════════ */
  .lp-testi-section {
    background: ${C.mint}; padding: 100px 36px;
    border-top: 1px solid ${C.mint2}; border-bottom: 1px solid ${C.mint2};
  }
  .lp-testi-hd { text-align: center; margin-bottom: 56px; }
  .lp-reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .lp-review-card {
    background: ${C.bg}; border-radius: 16px; padding: 28px 26px;
    display: flex; flex-direction: column; gap: 16px;
    position: relative; overflow: hidden;
    border-left: 3px solid ${C.accent};
    box-shadow: 0 2px 14px rgba(13,26,20,0.07);
    transition: transform 0.22s, box-shadow 0.22s;
  }
  .lp-review-card:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(13,26,20,0.12); }
  .lp-review-card::after {
    content: '\\201C'; position: absolute; bottom: -12px; right: 16px;
    font-size: 100px; font-weight: 900; line-height: 1;
    color: rgba(13,148,136,0.05); pointer-events: none; font-family: Georgia, serif;
  }
  .lp-stars { display: flex; gap: 3px; }
  .lp-review-quote { font-size: 14px; color: ${C.text2}; line-height: 1.80; flex: 1; position: relative; z-index: 1; }
  .lp-review-footer {
    display: flex; align-items: center; gap: 12px;
    padding-top: 14px; border-top: 1px solid ${C.border}; position: relative; z-index: 1;
  }
  .lp-review-avatar {
    width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
    background: ${C.accent};
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: #FFFFFF;
  }
  .lp-review-name { font-size: 13px; font-weight: 700; color: ${C.text}; }
  .lp-review-biz  { font-size: 11px; color: ${C.text3}; margin-top: 2px; }

  /* ══════════════════════════════════════════════
     PRICING  (white)
  ══════════════════════════════════════════════ */
  .lp-pricing-section { padding: 100px 36px; background: ${C.bg}; }
  .lp-pricing-hd { text-align: center; margin-bottom: 56px; }
  .lp-pricing-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; align-items: start; max-width: 960px; margin: 0 auto;
  }
  .lp-plan { border-radius: 20px; padding: 32px 28px; position: relative; display: flex; flex-direction: column; }
  .lp-plan-default {
    background: ${C.bg}; border: 1.5px solid ${C.border};
    transition: border-color 0.22s, box-shadow 0.22s;
  }
  .lp-plan-default:hover { border-color: rgba(13,148,136,0.25); box-shadow: 0 8px 32px rgba(13,148,136,0.07); }
  .lp-plan-hi {
    background: ${C.dark}; border: 1.5px solid rgba(13,148,136,0.35);
    box-shadow: 0 0 0 1px rgba(13,148,136,0.07), 0 24px 64px rgba(8,13,24,0.22);
  }
  .lp-plan-badge {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    background: ${C.accent}; color: #FFFFFF; font-size: 10px; font-weight: 800;
    padding: 4px 14px; border-radius: 99px; letter-spacing: 0.07em;
    text-transform: uppercase; white-space: nowrap;
  }
  .lp-plan-name   { font-size: 11px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase; margin-bottom: 18px; }
  .lp-plan-price  { font-size: 44px; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
  .lp-plan-period { font-size: 14px; margin-left: 4px; vertical-align: bottom; line-height: 2.8; }
  .lp-plan-desc   { font-size: 13px; margin: 10px 0 26px; line-height: 1.65; }
  .lp-plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; flex: 1; margin-bottom: 28px; }
  .lp-plan-feature { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; }
  .lp-plan-btn { display: block; text-align: center; padding: 13px 0; border-radius: 10px; font-size: 14px; font-weight: 700; transition: all 0.20s; }
  .lp-plan-btn-hi { background: ${C.accent}; color: #FFFFFF; }
  .lp-plan-btn-hi:hover { background: ${C.accent2}; }
  .lp-plan-btn-default { background: transparent; color: ${C.text2}; border: 1.5px solid ${C.border2}; }
  .lp-plan-btn-default:hover { border-color: rgba(13,148,136,0.30); color: ${C.accent}; background: rgba(13,148,136,0.04); }

  /* ══════════════════════════════════════════════
     CTA  (dark — horizontal)
  ══════════════════════════════════════════════ */
  .lp-cta-section {
    background: ${C.dark}; padding: 100px 36px;
    border-top: 1px solid rgba(255,255,255,0.04);
    position: relative; overflow: hidden;
  }
  .lp-cta-section::after {
    content: ''; position: absolute;
    bottom: 0; left: 0; right: 0; height: 2px;
    background: ${C.accent};
  }
  /* Ghost text decoration */
  .lp-cta-ghost {
    position: absolute; right: -20px; bottom: -50px;
    font-size: 260px; font-weight: 900; line-height: 1;
    color: rgba(219,232,215,0.022);
    letter-spacing: -0.06em; pointer-events: none;
    font-family: system-ui, -apple-system, sans-serif;
    user-select: none;
  }
  /* Decorative ring */
  .lp-cta-ring {
    position: absolute; right: 280px; top: 50%; transform: translateY(-50%);
    width: 260px; height: 260px; border-radius: 50%;
    border: 1px solid rgba(13,148,136,0.12); pointer-events: none;
  }
  .lp-cta-ring::before {
    content: ''; position: absolute; inset: 36px; border-radius: 50%;
    border: 1px solid rgba(13,148,136,0.08);
  }
  .lp-cta-inner {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr auto;
    gap: 80px; align-items: center; position: relative; z-index: 1;
  }
  .lp-cta-title {
    font-size: clamp(32px, 4vw, 54px); font-weight: 900;
    letter-spacing: -0.04em; color: ${C.dText}; line-height: 1.06; margin-bottom: 14px;
  }
  .lp-cta-title em { font-style: normal; color: ${C.accentBright}; }
  .lp-cta-sub { font-size: 17px; color: ${C.dText2}; line-height: 1.72; max-width: 480px; }
  .lp-cta-right { display: flex; flex-direction: column; gap: 14px; align-items: center; flex-shrink: 0; }
  .lp-btn-accent {
    display: inline-flex; align-items: center; gap: 8px;
    background: ${C.accent}; color: #FFFFFF; font-weight: 700; font-size: 15px;
    padding: 16px 36px; border-radius: 12px; transition: all 0.20s; white-space: nowrap;
  }
  .lp-btn-accent:hover { background: ${C.accent2}; transform: translateY(-2px); }
  .lp-cta-micro { font-size: 12px; color: ${C.dText3}; text-align: center; }

  /* ══════════════════════════════════════════════
     FOOTER  (mint — 3 cols)
  ══════════════════════════════════════════════ */
  .lp-footer {
    background: ${C.bg}; border-top: 1px solid ${C.border};
    padding: 56px 36px 44px;
  }
  .lp-footer-inner {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 56px; align-items: start;
  }
  .lp-footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .lp-footer-logo-box {
    width: 30px; height: 30px; border-radius: 8px;
    background: ${C.accent};
    display: flex; align-items: center; justify-content: center;
  }
  .lp-footer-name  { font-weight: 800; font-size: 15px; color: ${C.text}; letter-spacing: -0.02em; }
  .lp-footer-tagline { font-size: 13px; color: ${C.text3}; line-height: 1.65; max-width: 230px; margin-bottom: 20px; }
  .lp-footer-copy  { font-size: 12px; color: ${C.text3}; }
  .lp-footer-col-title {
    font-size: 11px; font-weight: 700; color: ${C.text2};
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;
  }
  .lp-footer-links { display: flex; flex-direction: column; gap: 10px; }
  .lp-footer-link  { font-size: 13px; color: ${C.text3}; transition: color 0.15s; }
  .lp-footer-link:hover { color: ${C.text}; }

  /* ══════════════════════════════════════════════
     UTILS
  ══════════════════════════════════════════════ */
  .lp-inner    { max-width: 1200px; margin: 0 auto; }
  .lp-inner-md { max-width: 1000px; margin: 0 auto; }
  .lp-center   { text-align: center; }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .lp-feat-grid { grid-template-columns: repeat(2, 1fr); }
    .lp-reviews-grid { grid-template-columns: 1fr 1fr; }
    .lp-pricing-grid { grid-template-columns: 1fr; max-width: 440px; }
    .lp-footer-inner { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 900px) {
    .lp-hero-inner { grid-template-columns: 1fr; }
    .lp-hero-right { display: none; }
    .lp-features-hd { flex-direction: column; gap: 4px; }
    .lp-steps-grid { grid-template-columns: repeat(2, 1fr); gap: 40px; }
    .lp-steps-line { display: none; }
    .lp-cta-inner { grid-template-columns: 1fr; gap: 40px; }
    .lp-cta-right { align-items: flex-start; }
    .lp-cta-ring { display: none; }
    .lp-btn-pri { animation: none; box-shadow: 0 4px 20px rgba(13,148,136,0.32); }
  }
  @media (max-width: 640px) {
    .lp-nav-links, .lp-signin { display: none; }
    .lp-hero { padding: 112px 20px 72px; }
    .lp-features-section, .lp-hiw-section, .lp-testi-section,
    .lp-pricing-section, .lp-cta-section { padding: 72px 20px; }
    .lp-logos-strip, .lp-footer { padding: 24px 20px; }
    .lp-feat-grid { grid-template-columns: 1fr; }
    .lp-steps-grid { grid-template-columns: 1fr; }
    .lp-reviews-grid { grid-template-columns: 1fr; }
    .lp-footer-inner { grid-template-columns: 1fr; gap: 32px; }
    .lp-btn-pri, .lp-btn-sec, .lp-btn-accent { font-size: 14px; padding: 13px 22px; }
    .lp-hero-proof { gap: 20px; }
    .lp-features-count { display: none; }
  }
`;

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="lp">
      <style>{CSS}</style>
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

/* ─── Nav ────────────────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <Link href="/" className="lp-logo">
          <div className="lp-logo-box">
            <Image src="/Uniwhite.png" alt="UniStocker" width={20} height={20} style={{ objectFit: "contain" }} />
          </div>
          <span className="lp-logo-text">UniStocker</span>
        </Link>
        <nav className="lp-nav-links">
          <a href="#features"     className="lp-nav-link">Features</a>
          <a href="#how-it-works" className="lp-nav-link">How it works</a>
          <a href="#pricing"      className="lp-nav-link">Pricing</a>
        </nav>
        <div className="lp-nav-auth">
          <Link href="/auth/login"    className="lp-signin">Sign in</Link>
          <Link href="/auth/register" className="lp-nav-cta">Get started free</Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-geo" />
      <div className="lp-hero-inner">
        {/* Left */}
        <div className="lp-hero-left">
          <div className="lp-hero-eyebrow anim-0">
            Inventory Management Platform
          </div>
          <h1 className="lp-h1 anim-1">
            Run your stock<br />like a <em>pro.</em>
          </h1>
          <p className="lp-hero-sub anim-2">
            Track stock, record sales, manage your team, and get real-time
            alerts — all from one clean dashboard. No spreadsheets needed.
          </p>
          <div className="lp-hero-btns anim-3">
            <Link href="/auth/register" className="lp-btn-pri">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/auth/login" className="lp-btn-sec">Sign in</Link>
          </div>
          <div className="lp-hero-proof anim-4">
            <div className="lp-proof-stat">
              <span className="lp-proof-val">500+</span>
              <span className="lp-proof-lbl">Businesses</span>
            </div>
            <div className="lp-proof-sep" />
            <div className="lp-proof-stat">
              <span className="lp-proof-val">₦2B+</span>
              <span className="lp-proof-lbl">Revenue tracked</span>
            </div>
            <div className="lp-proof-sep" />
            <div className="lp-proof-stat">
              <span className="lp-proof-val">4.9★</span>
              <span className="lp-proof-lbl">User rating</span>
            </div>
          </div>
        </div>

        {/* Right — mockup */}
        <div className="lp-hero-right">
          <div className="anim-r">
            <div className="lp-mockup-float">
              <div className="lp-mockup">
                <div className="lp-mock-chrome">
                  <span className="lp-dot" style={{ background: "#f87171" }} />
                  <span className="lp-dot" style={{ background: "#fbbf24" }} />
                  <span className="lp-dot" style={{ background: "#34d399" }} />
                  <span className="lp-mock-url">app.unistocker.com/dashboard</span>
                </div>
                <div className="lp-mock-body">
                  <div className="lp-mock-sidebar">
                    <div className="lp-mock-sb-logo">
                      <Image src="/Uniwhite.png" alt="" width={16} height={16} style={{ objectFit: "contain" }} />
                    </div>
                    <div className="lp-mock-sb-item on"><Package size={14} color="#2DD4BF" /></div>
                    <div className="lp-mock-sb-item"><BarChart3 size={14} color="#475569" /></div>
                    <div className="lp-mock-sb-item"><Bell size={14} color="#475569" /></div>
                    <div className="lp-mock-sb-item"><Users size={14} color="#475569" /></div>
                  </div>
                  <div className="lp-mock-content">
                    <div className="lp-mock-toprow">
                      <span className="lp-mock-page-title">Dashboard Overview</span>
                      <span className="lp-mock-live">
                        <span className="anim-blink" style={{ width: 6, height: 6, borderRadius: "50%", background: "#0D9488", display: "inline-block" }} />
                        Live
                      </span>
                    </div>
                    <div className="lp-mock-stats">
                      {[
                        { val: "248",    lbl: "Total Products", color: "#0D9488", w: "100%" },
                        { val: "₦1,842", lbl: "Today Revenue",  color: "#60a5fa", w: "72%"  },
                        { val: "6",      lbl: "Low Stock",      color: "#fbbf24", w: "40%"  },
                        { val: "4",      lbl: "Staff Online",   color: "#c084fc", w: "55%"  },
                      ].map((s) => (
                        <div key={s.lbl} className="lp-mock-stat">
                          <div className="lp-mock-stat-val">{s.val}</div>
                          <div className="lp-mock-stat-lbl">{s.lbl}</div>
                          <div className="lp-mock-bar" style={{ width: s.w, background: s.color, opacity: 0.6 }} />
                        </div>
                      ))}
                    </div>
                    <div className="lp-mock-rows">
                      {[
                        { pill: "STOCK IN", txt: "50 units — Wireless Mouse Pro",   time: "2m",  bg: "rgba(13,148,136,0.12)",  fg: "#0D9488" },
                        { pill: "SALE",     txt: "Receipt #4821 · ₦18,900",          time: "14m", bg: "rgba(96,165,250,0.12)",  fg: "#3b82f6" },
                        { pill: "ALERT",    txt: "USB-C Hub below minimum stock",    time: "1h",  bg: "rgba(251,191,36,0.12)",  fg: "#d97706" },
                      ].map((r, i) => (
                        <div key={i} className="lp-mock-row">
                          <span className="lp-mock-pill" style={{ background: r.bg, color: r.fg }}>{r.pill}</span>
                          <span className="lp-mock-row-txt">{r.txt}</span>
                          <span className="lp-mock-row-time">{r.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Logos ──────────────────────────────────────────────────────────────── */
function Logos() {
  const names = ["Supermart NG", "TechHub Lagos", "FoodPlus Abuja", "QuickStock GH", "RetailPro KE"];
  return (
    <div className="lp-logos-strip">
      <div className="lp-logos-inner">
        <p className="lp-logos-label">Trusted by growing businesses across Africa</p>
        <div className="lp-logos-row">
          {names.map((n) => <span key={n} className="lp-logo-name">{n}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ─── Features ───────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Package,      bg: "rgba(99,102,241,0.10)",  fg: "#6366f1", title: "Smart Inventory",  desc: "Add products, set reorder levels, and track every item's complete transaction history." },
  { icon: ShoppingCart, bg: "rgba(13,148,136,0.10)",  fg: "#0D9488", title: "Built-in POS",     desc: "Record sales in seconds. Stock updates automatically — no double entry." },
  { icon: Bell,         bg: "rgba(245,158,11,0.10)",  fg: "#f59e0b", title: "Real-Time Alerts", desc: "Push and email alerts for low stock, sales, or any stock change. Instantly." },
  { icon: BarChart3,    bg: "rgba(16,185,129,0.10)",  fg: "#10b981", title: "Profit Reports",   desc: "Revenue, cost, and profit side by side — daily, weekly, and monthly." },
  { icon: Users,        bg: "rgba(168,85,247,0.10)",  fg: "#a855f7", title: "Team Roles",       desc: "Role-based access for managers and staff. Every action logged by person." },
  { icon: Globe,        bg: "rgba(59,130,246,0.10)",  fg: "#3b82f6", title: "Multi-Branch",     desc: "Run multiple locations from one account with separate inventory per branch." },
  { icon: ShieldCheck,  bg: "rgba(239,68,68,0.10)",   fg: "#ef4444", title: "Audit Logs",       desc: "Every stock movement timestamped with who did it. Full accountability." },
  { icon: Smartphone,   bg: "rgba(251,146,60,0.10)",  fg: "#fb923c", title: "Works Offline",    desc: "Install as a PWA on any device. Data syncs automatically when back online." },
];

function Features() {
  return (
    <section id="features" className="lp-features-section">
      <div className="lp-inner">
        <div className="lp-features-hd">
          <div>
            <span className="lp-eyebrow">Features</span>
            <h2 className="lp-section-title">Everything you need,<br />nothing you don&apos;t.</h2>
            <p className="lp-section-sub">From a single shop to multiple branches — UniStocker grows with you.</p>
          </div>
          <div className="lp-features-count">08</div>
        </div>
        <div className="lp-feat-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feat-card">
              <div className="lp-feat-icon" style={{ background: f.bg }}>
                <f.icon size={18} color={f.fg} />
              </div>
              <div className="lp-feat-title">{f.title}</div>
              <div className="lp-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Create your account",  desc: "Sign up with your business name. You're instantly set up as owner with full access." },
    { n: "02", title: "Add your products",    desc: "Add items with prices, stock levels, and barcodes. One at a time or import via CSV." },
    { n: "03", title: "Invite your team",     desc: "Create accounts for managers and staff with exactly the permissions they need." },
    { n: "04", title: "Track everything",     desc: "Every sale and stock change is recorded live. Alerts fire before you run out." },
  ];
  return (
    <section id="how-it-works" className="lp-hiw-section">
      <div className="lp-hiw-hd">
        <span className="lp-eyebrow-dark">How it works</span>
        <h2 className="lp-section-title lp-title-d">Up and running in minutes</h2>
        <p className="lp-section-sub-c lp-sub-d">No training. No IT person. Just sign up and go.</p>
      </div>
      <div className="lp-steps-wrap">
        <div className="lp-steps-line" />
        <div className="lp-steps-grid">
          {steps.map((s) => (
            <div key={s.n} className="lp-step">
              <div className="lp-step-num">{s.n}</div>
              <div className="lp-step-title">{s.title}</div>
              <div className="lp-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ───────────────────────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    { name: "Emeka O.",  biz: "SuperMart Lagos", quote: "Before UniStocker I was using paper and Excel. Now I know exactly what's in stock at both shops without being there." },
    { name: "Fatima A.", biz: "FoodPlus Abuja",  quote: "The low stock alerts alone saved my business. I used to run out of fast-moving items without warning. Not anymore." },
    { name: "Kwame B.",  biz: "TechHub Accra",   quote: "Every transaction is logged with the staff name and time. The boss dashboard is everything I needed." },
  ];
  return (
    <section className="lp-testi-section">
      <div className="lp-testi-hd">
        <span className="lp-eyebrow-mint">Testimonials</span>
        <h2 className="lp-section-title lp-title-mint">Business owners love it</h2>
        <p className="lp-section-sub-c lp-sub-mint">Real results from real businesses across Africa.</p>
      </div>
      <div className="lp-inner-md">
        <div className="lp-reviews-grid">
          {reviews.map((r) => (
            <div key={r.name} className="lp-review-card">
              <div className="lp-stars">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p className="lp-review-quote">&ldquo;{r.quote}&rdquo;</p>
              <div className="lp-review-footer">
                <div className="lp-review-avatar">{r.name.charAt(0)}</div>
                <div>
                  <div className="lp-review-name">{r.name}</div>
                  <div className="lp-review-biz">{r.biz}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: "Starter", price: "Free", period: "", highlight: false,
      desc: "Perfect for a single-location business just getting started.",
      features: ["Up to 100 products", "2 staff accounts", "Sales tracking", "Basic reports", "Email notifications"],
      cta: "Get started free", href: "/auth/register",
    },
    {
      name: "Business", price: "$19", period: "/mo", highlight: true,
      desc: "For growing businesses that need more power and features.",
      features: ["Unlimited products", "10 staff accounts", "Multi-branch support", "Advanced profit reports", "Push + email notifications", "Activity audit logs"],
      cta: "Start free trial", href: "/auth/register",
    },
    {
      name: "Enterprise", price: "Custom", period: "", highlight: false,
      desc: "For large operations with custom requirements.",
      features: ["Everything in Business", "Unlimited branches & staff", "WhatsApp alerts", "API access", "Dedicated support"],
      cta: "Contact us", href: "mailto:hello@unistocker.app",
    },
  ];
  return (
    <section id="pricing" className="lp-pricing-section" style={{ borderTop: `1px solid ${C.border}` }}>
      <div className="lp-pricing-hd">
        <span className="lp-eyebrow">Pricing</span>
        <h2 className="lp-section-title">Simple, honest pricing</h2>
        <p className="lp-section-sub-c">No hidden fees. Start free. Cancel anytime.</p>
      </div>
      <div className="lp-pricing-grid">
        {plans.map((plan) => (
          <div key={plan.name} className={`lp-plan ${plan.highlight ? "lp-plan-hi" : "lp-plan-default"}`}>
            {plan.highlight && <div className="lp-plan-badge">Most popular</div>}
            <div className="lp-plan-name" style={{ color: plan.highlight ? C.accentBright : C.text3 }}>
              {plan.name}
            </div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span className="lp-plan-price" style={{ color: plan.highlight ? "#FFFFFF" : C.text }}>
                {plan.price}
              </span>
              {plan.period && (
                <span className="lp-plan-period" style={{ color: plan.highlight ? C.accentBright : C.text3 }}>
                  {plan.period}
                </span>
              )}
            </div>
            <p className="lp-plan-desc" style={{ color: plan.highlight ? "rgba(255,255,255,0.58)" : C.text2 }}>
              {plan.desc}
            </p>
            <ul className="lp-plan-features">
              {plan.features.map((f) => (
                <li key={f} className="lp-plan-feature">
                  <CheckCircle size={15} color={plan.highlight ? C.accentBright : C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: plan.highlight ? "rgba(255,255,255,0.70)" : C.text2 }}>{f}</span>
                </li>
              ))}
            </ul>
            <Link href={plan.href} className={`lp-plan-btn ${plan.highlight ? "lp-plan-btn-hi" : "lp-plan-btn-default"}`}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="lp-cta-section">
      <div className="lp-cta-ghost">GO</div>
      <div className="lp-cta-ring" />
      <div className="lp-cta-inner">
        <div>
          <h2 className="lp-cta-title">
            Ready to take <em>control</em><br />of your stock?
          </h2>
          <p className="lp-cta-sub">
            Join hundreds of businesses already managing smarter with UniStocker.
            Start free — no credit card needed.
          </p>
        </div>
        <div className="lp-cta-right">
          <Link href="/auth/register" className="lp-btn-accent">
            Create your free account <ArrowRight size={16} />
          </Link>
          <p className="lp-cta-micro">Free plan · Setup in under 2 minutes</p>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        {/* Brand */}
        <div>
          <div className="lp-footer-brand">
            <div className="lp-footer-logo-box">
              <Image src="/Uniwhite.png" alt="UniStocker" width={16} height={16} style={{ objectFit: "contain" }} />
            </div>
            <span className="lp-footer-name">UniStocker</span>
          </div>
          <p className="lp-footer-tagline">
            Inventory management built for African businesses that are ready to grow.
          </p>
          <p className="lp-footer-copy">&copy; {new Date().getFullYear()} UniStocker. All rights reserved.</p>
        </div>
        {/* Product */}
        <div>
          <p className="lp-footer-col-title">Product</p>
          <div className="lp-footer-links">
            <a href="#features"     className="lp-footer-link">Features</a>
            <a href="#how-it-works" className="lp-footer-link">How it works</a>
            <a href="#pricing"      className="lp-footer-link">Pricing</a>
            <Link href="/auth/register" className="lp-footer-link">Get started free</Link>
          </div>
        </div>
        {/* Company */}
        <div>
          <p className="lp-footer-col-title">Company</p>
          <div className="lp-footer-links">
            <a href="#" className="lp-footer-link">Privacy policy</a>
            <a href="#" className="lp-footer-link">Terms of service</a>
            <a href="mailto:hello@unistocker.app" className="lp-footer-link">Contact us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
