import Link from "next/link";
import Image from "next/image";
import {
  Package, BarChart3, Bell, Users, ShieldCheck,
  ArrowRight, CheckCircle,
  ShoppingCart, Globe, Smartphone,
  TrendingUp, AlertTriangle, MessageSquare, Camera, Bot, Zap,
  Wifi, Banknote, HeartHandshake,
} from "lucide-react";
import { InstallPromptPopup } from "@/components/pwa/install-prompt-popup";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AppShowcase } from "@/components/landing/app-showcase";
import { FAQ } from "@/components/landing/faq";

/* ─── Static (theme-independent) accents ───────────────────────────────── */
const ACCENT = "#0C973A";
const ACCENT_2 = "#0A7B30";

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp {
    color: var(--text); font-family: system-ui, -apple-system, sans-serif; line-height: 1.5;
    font-size: 16px;
    background: var(--bg);
    /* section-alternation tokens, layered on top of the app's global theme vars */
    --lp-soft: #F3FAF8;
    --lp-soft-border: #DCEEE8;
    --lp-nav-bg: rgba(255,255,255,0.82);
    --lp-glow: rgba(12,151,58,0.10);
  }
  .dark .lp {
    --lp-soft: rgba(100,237,128,0.045);
    --lp-soft-border: rgba(100,237,128,0.14);
    --lp-nav-bg: rgba(15,23,42,0.82);
    --lp-glow: rgba(100,237,128,0.14);
  }
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
    0%, 100% { box-shadow: 0 4px 20px rgba(12,151,58,0.24); }
    50%       { box-shadow: 0 4px 40px rgba(12,151,58,0.46); }
  }
  @keyframes lineGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes showFill {
    from { width: 0%; }
    to   { width: 100%; }
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
     MARQUEE (announcement strip)
  ══════════════════════════════════════════════ */
  .lp-marquee {
    position: fixed; top: 0; left: 0; right: 0; z-index: 101;
    height: 32px; overflow: hidden;
    background: #0566FF;
    display: flex; align-items: center;
  }
  .lp-marquee-track {
    display: flex; align-items: center; flex-wrap: nowrap;
    white-space: nowrap; width: max-content;
    animation: lpMarqueeScroll 24s linear infinite;
  }
  .lp-marquee-item {
    display: inline-flex; align-items: center; gap: 9px;
    font-size: 12.5px; font-weight: 600; color: #FFFFFF; letter-spacing: 0.01em;
    padding: 0 20px;
  }
  .lp-marquee-item svg { flex-shrink: 0; opacity: 0.85; }
  .lp-marquee-dot { opacity: 0.5; }
  @keyframes lpMarqueeScroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .lp-marquee-track { animation: none; }
  }

  /* ══════════════════════════════════════════════
     NAV
  ══════════════════════════════════════════════ */
  .lp-nav {
    position: fixed; top: 32px; left: 0; right: 0; z-index: 100;
    background: var(--lp-nav-bg);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  }
  .lp-nav-inner {
    max-width: 1360px; margin: 0 auto; padding: 0 36px;
    height: 68px; display: flex; align-items: center;
  }
  .lp-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .lp-logo-box {
    width: 34px; height: 34px; border-radius: 10px;
    background: ${ACCENT};
    display: flex; align-items: center; justify-content: center;
  }
  .lp-logo-text { font-weight: 800; font-size: 17px; color: var(--text); letter-spacing: -0.02em; }
  .lp-nav-links { display: flex; align-items: center; gap: 2px; margin-left: 44px; }
  .lp-nav-link {
    font-size: 14px; line-height: 1.86; color: var(--text-2); padding: 6px 14px;
    border-radius: 8px; transition: color 0.15s, background 0.15s; font-weight: 500;
  }
  .lp-nav-link:hover { color: var(--text); background: var(--bg-card-2); }
  .lp-nav-auth { display: flex; align-items: center; gap: 14px; margin-left: auto; }
  .lp-signin {
    font-size: 14px; line-height: 1.86; font-weight: 500; color: var(--text-2);
    padding: 7px 14px; border-radius: 8px; transition: color 0.15s;
  }
  .lp-signin:hover { color: var(--text); }
  .lp-nav-cta {
    font-size: 14px; line-height: 1.86; font-weight: 600; color: #FFFFFF;
    background: ${ACCENT}; padding: 8px 20px; border-radius: 8px;
    transition: background 0.15s; white-space: nowrap;
  }
  .lp-nav-cta:hover { background: ${ACCENT_2}; }

  /* ══════════════════════════════════════════════
     HERO
  ══════════════════════════════════════════════ */
  .lp-hero {
    background: var(--bg);
    padding: 148px 36px 108px;
    position: relative; overflow: hidden;
  }
  .lp-hero::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: ${ACCENT};
  }
  .lp-hero::after {
    content: ''; position: absolute;
    top: -240px; right: -160px; width: 640px; height: 640px; border-radius: 50%;
    background: radial-gradient(circle, var(--lp-glow) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-hero-geo {
    position: absolute; right: 5%; top: 10%;
    width: 520px; height: 520px; border-radius: 32px;
    border: 1px solid rgba(12,151,58,0.14);
    transform: rotate(14deg); pointer-events: none;
  }
  .lp-hero-geo::after {
    content: ''; position: absolute; inset: 28px; border-radius: 22px;
    border: 1px solid var(--border);
  }
  .lp-hero-inner {
    max-width: 800px; margin: 0 auto;
    position: relative; z-index: 1; text-align: center;
  }
  .lp-hero-left { display: flex; flex-direction: column; align-items: center; }
  .lp-h1 {
    font-size: clamp(38px, 4.6vw, 56px); font-weight: 900; line-height: 1.14;
    letter-spacing: -0.04em; color: var(--text); margin-bottom: 24px;
  }
  .lp-h1 em { font-style: normal; color: ${ACCENT}; }
  .lp-hero-sub {
    font-size: 18px; color: var(--text-2); line-height: 1.6;
    margin-bottom: 40px; max-width: 560px;
  }
  .lp-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; justify-content: center; }
  .lp-btn-pri {
    display: inline-flex; align-items: center; gap: 8px;
    background: ${ACCENT}; color: #FFFFFF; font-weight: 700; font-size: 24px; line-height: 1.5;
    padding: 14px 28px; border-radius: 10px; transition: all 0.18s;
    animation: glowPulse 3.5s ease-in-out infinite;
  }
  .lp-btn-pri:hover { background: ${ACCENT_2}; transform: translateY(-1px); }
  .lp-btn-sec {
    display: inline-flex; align-items: center; gap: 8px;
    border: 1.5px solid var(--border-2); color: var(--text); font-weight: 600;
    font-size: 24px; line-height: 1.5; padding: 14px 28px; border-radius: 10px; transition: all 0.18s;
  }
  .lp-btn-sec:hover { border-color: rgba(12,151,58,0.35); background: var(--accent-sub); }
  .lp-hero-proof {
    display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
    padding-top: 32px; border-top: 1px solid var(--border);
  }
  .lp-proof-stat { display: flex; flex-direction: column; gap: 3px; }
  .lp-proof-val { font-size: 24px; font-weight: 900; color: var(--text); letter-spacing: -0.03em; line-height: 1; }
  .lp-proof-lbl { font-size: 13px; color: var(--text-3); font-weight: 500; }
  .lp-proof-sep { width: 1px; height: 30px; background: var(--border); flex-shrink: 0; }

  /* ══════════════════════════════════════════════
     EYEBROWS + SHARED HEADINGS
  ══════════════════════════════════════════════ */
  .lp-eyebrow {
    display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.10em;
    text-transform: uppercase; color: ${ACCENT_2};
    background: var(--accent-sub); padding: 4px 12px; border-radius: 99px;
    border: 1px solid rgba(12,151,58,0.22); margin-bottom: 14px;
  }
  .lp-section-title {
    font-size: clamp(26px, 2.6vw, 32px); font-weight: 900;
    letter-spacing: -0.035em; color: var(--text); margin-bottom: 12px; line-height: 1.09;
  }
  .lp-section-sub   { font-size: 18px; color: var(--text-2); line-height: 1.6; }
  .lp-section-sub-c { font-size: 18px; color: var(--text-2); line-height: 1.6; max-width: 480px; margin: 0 auto; }

  /* ══════════════════════════════════════════════
     FEATURES  (asymmetric header)
  ══════════════════════════════════════════════ */
  .lp-features-section { padding: 100px 36px; background: var(--bg); }
  .lp-features-hd {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 32px; margin-bottom: 56px;
  }
  .lp-features-count {
    font-size: clamp(72px, 9vw, 112px); font-weight: 900; letter-spacing: -0.06em;
    color: var(--border-2); line-height: 1; user-select: none; flex-shrink: 0;
  }

  .lp-feat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .lp-feat-card {
    background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 16px;
    padding: 26px 22px; position: relative; overflow: hidden; cursor: default;
    transition: border-color 0.25s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
  }
  .lp-feat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: ${ACCENT};
    transform: scaleX(0); transform-origin: left; transition: transform 0.30s ease;
  }
  .lp-feat-card:hover::before { transform: scaleX(1); }
  .lp-feat-card:hover {
    border-color: rgba(12,151,58,0.30); transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(12,151,58,0.10), var(--shadow);
  }
  .lp-feat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .lp-feat-title { font-size: 15.5px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .lp-feat-desc  { font-size: 16px; color: var(--text-2); line-height: 1.8; }

  /* ══════════════════════════════════════════════
     HOW IT WORKS
  ══════════════════════════════════════════════ */
  .lp-hiw-section {
    background: var(--lp-soft);
    padding: 100px 36px;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .lp-hiw-hd { text-align: center; margin-bottom: 64px; }
  .lp-steps-wrap { max-width: 1100px; margin: 0 auto; position: relative; }
  .lp-steps-line {
    position: absolute; top: 23px;
    left: calc(12.5% + 24px); right: calc(12.5% + 24px);
    height: 1px; background: rgba(12,151,58,0.28);
    animation: lineGrow 1s 0.5s ease both;
  }
  .lp-steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
  .lp-step { padding: 0 20px; text-align: center; }
  .lp-step-num {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--bg-card); border: 1px solid rgba(12,151,58,0.30);
    color: ${ACCENT}; font-weight: 800; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 22px; position: relative;
    transition: background 0.25s, transform 0.25s; box-shadow: var(--shadow);
  }
  .lp-step:hover .lp-step-num { background: var(--accent-sub); transform: scale(1.08); }
  .lp-step-title { font-size: 16.5px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
  .lp-step-desc  { font-size: 16px; color: var(--text-2); line-height: 1.8; }

  /* ══════════════════════════════════════════════
     APP SHOWCASE (animated)
  ══════════════════════════════════════════════ */
  .lp-show-section { padding: 100px 36px; background: var(--bg); }
  .lp-show-hd { text-align: center; margin-bottom: 44px; }
  .lp-show-inner { max-width: 1100px; margin: 0 auto; }
  .lp-show-tabs { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 22px; }
  .lp-show-tab {
    position: relative; display: flex; align-items: center; gap: 7px;
    font-size: 14.5px; font-weight: 600; color: var(--text-2);
    background: var(--bg-card); border: 1.5px solid var(--border);
    padding: 9px 16px; border-radius: 99px; cursor: pointer;
    transition: color 0.2s, background 0.2s, border-color 0.2s; overflow: hidden;
  }
  .lp-show-tab:hover { border-color: var(--border-2); color: var(--text); }
  .lp-show-tab.on { color: #FFFFFF; background: ${ACCENT}; border-color: ${ACCENT}; }
  .lp-show-tab-bar { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; background: rgba(255,255,255,0.28); }
  .lp-show-tab-fill { display: block; height: 100%; width: 0%; background: #fff; animation-name: showFill; animation-timing-function: linear; animation-fill-mode: forwards; }
  .lp-show-panel { border-radius: 18px; overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-lg); background: var(--bg-card); }
  .lp-show-chrome { background: #0B1120; padding: 12px 18px; display: flex; align-items: center; gap: 7px; }
  .lp-show-url { font-size: 11px; color: #64748B; font-family: monospace; margin-left: 12px; background: rgba(255,255,255,0.06); padding: 3px 10px; border-radius: 5px; }
  .lp-show-body { background: var(--bg-card-2); padding: 28px; min-height: 320px; }
  .lp-show-anim { animation: fadeInUp 0.4s ease both; }

  .lp-show-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
  .lp-show-search { flex: 1; display: flex; align-items: center; gap: 8px; font-size: 14.5px; color: var(--text-3); background: var(--bg-input); border: 1px solid var(--border); border-radius: 10px; padding: 9px 14px; }
  .lp-show-addbtn { display: flex; align-items: center; gap: 6px; font-size: 14.5px; font-weight: 700; color: #FFFFFF; background: ${ACCENT}; padding: 9px 16px; border-radius: 10px; white-space: nowrap; }
  .lp-show-table { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  .lp-show-trow { display: grid; grid-template-columns: 2fr 1fr 0.6fr 0.9fr; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 14.5px; animation: fadeInUp 0.4s ease both; }
  .lp-show-trow:last-child { border-bottom: none; }
  .lp-show-thead { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); background: var(--bg-card-2); animation: none; }
  .lp-show-cell-main { color: var(--text); font-weight: 600; }
  .lp-show-cell-mute { color: var(--text-2); }
  .lp-show-pill { font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 99px; width: fit-content; }

  .lp-show-pos { display: grid; grid-template-columns: 1fr 1.1fr; gap: 20px; }
  .lp-show-pos-left { display: flex; flex-direction: column; gap: 8px; }
  .lp-show-cat { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 14px; font-size: 14.5px; font-weight: 600; color: var(--text); text-align: center; animation: fadeInUp 0.4s ease both; }
  .lp-show-pos-right { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
  .lp-show-cart-title { display: flex; align-items: center; gap: 7px; font-size: 14.5px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .lp-show-cart-row { display: flex; justify-content: space-between; font-size: 14.5px; color: var(--text-2); animation: fadeInUp 0.4s ease both; }
  .lp-show-cart-total { display: flex; justify-content: space-between; font-size: 16.5px; font-weight: 800; color: var(--text); padding-top: 10px; border-top: 1px solid var(--border); margin-top: 4px; }
  .lp-show-checkout { display: flex; align-items: center; justify-content: center; gap: 7px; background: ${ACCENT}; color: #FFFFFF; font-size: 14.5px; font-weight: 700; padding: 11px; border-radius: 10px; margin-top: 6px; }

  .lp-show-ai { display: flex; flex-direction: column; gap: 12px; max-width: 520px; margin: 0 auto; }
  .lp-show-chat-msg.user { align-self: flex-end; background: ${ACCENT}; color: #FFFFFF; font-size: 14.5px; padding: 10px 16px; border-radius: 14px 14px 3px 14px; animation: fadeInUp 0.4s ease both; }
  .lp-show-chat-msg.bot { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px 14px 14px 3px; padding: 14px 16px; animation: fadeInUp 0.4s ease both; }
  .lp-show-chat-bot-hd { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: ${ACCENT}; margin-bottom: 8px; }
  .lp-show-chat-msg.bot p { font-size: 14.5px; color: var(--text-2); margin-bottom: 10px; }
  .lp-show-ai-row { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--text); background: var(--bg-card-2); border-radius: 8px; padding: 8px 10px; margin-top: 6px; animation: fadeInUp 0.4s ease both; }
  .lp-show-chat-input { display: flex; align-items: center; justify-content: space-between; background: var(--bg-input); border: 1px solid var(--border); border-radius: 99px; padding: 10px 16px; font-size: 14.5px; color: var(--text-3); }

  .lp-show-alerts { display: flex; flex-direction: column; gap: 10px; max-width: 560px; margin: 0 auto; }
  .lp-show-alert-row { display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; animation: fadeInUp 0.4s ease both; }
  .lp-show-alert-badge { font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: 6px; border: 1px solid transparent; letter-spacing: 0.05em; flex-shrink: 0; }
  .lp-show-alert-text { flex: 1; font-size: 14.5px; color: var(--text); font-weight: 500; }

  /* ══════════════════════════════════════════════
     HUMAN / RELATABLE SECTION
  ══════════════════════════════════════════════ */
  .lp-human-section { padding: 100px 36px; background: var(--bg); overflow: hidden; }
  .lp-human-inner { max-width: 1360px; margin: 0 auto; display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 64px; align-items: center; }
  .lp-human-art { display: flex; align-items: center; justify-content: center; position: relative; }
  .lp-human-art-glow {
    position: absolute; inset: -10%; border-radius: 50%;
    background: radial-gradient(circle, var(--lp-glow) 0%, transparent 72%);
    pointer-events: none;
  }
  .lp-human-points { display: flex; flex-direction: column; gap: 20px; margin-top: 30px; }
  .lp-human-point { display: flex; align-items: flex-start; gap: 14px; }
  .lp-human-point-icon {
    width: 36px; height: 36px; border-radius: 10px; background: var(--accent-sub);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${ACCENT};
  }
  .lp-human-point-text { font-size: 16px; color: var(--text-2); line-height: 1.8; padding-top: 5px; }
  .lp-human-point-text strong { color: var(--text); display: block; font-size: 16px; margin-bottom: 3px; font-weight: 700; }

  /* ══════════════════════════════════════════════
     PRICING
  ══════════════════════════════════════════════ */
  .lp-pricing-section { padding: 100px 36px; background: var(--bg); }
  .lp-pricing-hd { text-align: center; margin-bottom: 56px; }
  .lp-pricing-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; align-items: start; max-width: 1080px; margin: 0 auto;
  }
  .lp-plan { border-radius: 20px; padding: 32px 28px; position: relative; display: flex; flex-direction: column; }
  .lp-plan-default {
    background: var(--bg-card); border: 1.5px solid var(--border);
    transition: border-color 0.22s, box-shadow 0.22s;
  }
  .lp-plan-default:hover { border-color: rgba(12,151,58,0.30); box-shadow: 0 8px 32px rgba(12,151,58,0.09); }
  .lp-plan-hi {
    background: var(--sidebar); border: 1.5px solid rgba(12,151,58,0.40);
    box-shadow: 0 0 0 1px rgba(12,151,58,0.10), 0 24px 64px rgba(8,13,24,0.28);
  }
  .lp-plan-badge {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    background: ${ACCENT}; color: #FFFFFF; font-size: 10px; font-weight: 800;
    padding: 4px 14px; border-radius: 99px; letter-spacing: 0.07em;
    text-transform: uppercase; white-space: nowrap;
  }
  .lp-plan-name   { font-size: 12px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase; margin-bottom: 18px; }
  .lp-plan-price  { font-size: 46px; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
  .lp-plan-period { font-size: 15px; margin-left: 4px; vertical-align: bottom; line-height: 2.8; }
  .lp-plan-desc   { font-size: 16px; margin: 10px 0 26px; line-height: 1.8; }
  .lp-plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; flex: 1; margin-bottom: 28px; }
  .lp-plan-feature { display: flex; align-items: flex-start; gap: 10px; font-size: 14.5px; }
  .lp-plan-btn { display: block; text-align: center; padding: 13px 0; border-radius: 10px; font-size: 15px; font-weight: 700; transition: all 0.20s; }
  .lp-plan-btn-hi { background: ${ACCENT}; color: #FFFFFF; }
  .lp-plan-btn-hi:hover { background: ${ACCENT_2}; }
  .lp-plan-btn-default { background: transparent; color: var(--text-2); border: 1.5px solid var(--border-2); }
  .lp-plan-btn-default:hover { border-color: rgba(12,151,58,0.35); color: ${ACCENT}; background: var(--accent-sub); }

  /* ══════════════════════════════════════════════
     FAQ
  ══════════════════════════════════════════════ */
  .lp-faq-section { padding: 100px 36px; background: var(--lp-soft); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .lp-faq-hd { text-align: center; margin-bottom: 48px; }
  .lp-faq-list { max-width: 840px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
  .lp-faq-item { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; transition: border-color 0.2s; }
  .lp-faq-item.on { border-color: rgba(12,151,58,0.32); }
  .lp-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px; background: transparent; border: none; text-align: left; font-size: 16px; font-weight: 700; color: var(--text); cursor: pointer; }
  .lp-faq-icon { color: ${ACCENT}; flex-shrink: 0; transition: transform 0.25s; }
  .lp-faq-item.on .lp-faq-icon { transform: rotate(45deg); }
  .lp-faq-a-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.25s ease; }
  .lp-faq-item.on .lp-faq-a-wrap { grid-template-rows: 1fr; }
  .lp-faq-a { overflow: hidden; font-size: 16px; color: var(--text-2); line-height: 1.8; padding: 0 22px; }
  .lp-faq-item.on .lp-faq-a { padding-bottom: 20px; }

  /* ══════════════════════════════════════════════
     CTA (accent banner — always brand green, theme-independent)
  ══════════════════════════════════════════════ */
  .lp-cta-section {
    background: linear-gradient(135deg, ${ACCENT_2} 0%, ${ACCENT} 100%);
    padding: 100px 36px;
    position: relative; overflow: hidden;
  }
  .lp-cta-ring {
    position: absolute; right: 280px; top: 50%; transform: translateY(-50%);
    width: 260px; height: 260px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.14); pointer-events: none;
  }
  .lp-cta-ring::before {
    content: ''; position: absolute; inset: 36px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.10);
  }
  .lp-cta-inner {
    max-width: 1360px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr auto;
    gap: 80px; align-items: center; position: relative; z-index: 1;
  }
  .lp-cta-title {
    font-size: clamp(32px, 4vw, 54px); font-weight: 900;
    letter-spacing: -0.04em; color: #FFFFFF; line-height: 1.06; margin-bottom: 14px;
  }
  .lp-cta-title em { font-style: normal; color: #0F172A; }
  .lp-cta-sub { font-size: 18px; color: rgba(255,255,255,0.85); line-height: 1.6; max-width: 480px; }
  .lp-cta-right { display: flex; flex-direction: column; gap: 14px; align-items: center; flex-shrink: 0; }
  .lp-btn-accent {
    display: inline-flex; align-items: center; gap: 8px;
    background: #FFFFFF; color: ${ACCENT_2}; font-weight: 700; font-size: 24px; line-height: 1.5;
    padding: 16px 36px; border-radius: 12px; transition: all 0.20s; white-space: nowrap;
  }
  .lp-btn-accent:hover { background: #F0FDF4; transform: translateY(-2px); }
  .lp-cta-micro { font-size: 13px; color: rgba(255,255,255,0.75); text-align: center; }

  /* ══════════════════════════════════════════════
     FOOTER
  ══════════════════════════════════════════════ */
  .lp-footer {
    background: var(--bg); border-top: 1px solid var(--border);
    padding: 56px 36px 44px;
  }
  .lp-footer-inner {
    max-width: 1360px; margin: 0 auto;
    display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 56px; align-items: start;
  }
  .lp-footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .lp-footer-logo-box {
    width: 30px; height: 30px; border-radius: 8px;
    background: ${ACCENT};
    display: flex; align-items: center; justify-content: center;
  }
  .lp-footer-name  { font-weight: 800; font-size: 16px; color: var(--text); letter-spacing: -0.02em; }
  .lp-footer-tagline { font-size: 16px; color: var(--text-3); line-height: 1.8; max-width: 240px; margin-bottom: 20px; }
  .lp-footer-social { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .lp-footer-social-link {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-3); background: var(--bg-card-2); border: 1px solid var(--border);
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }
  .lp-footer-social-link:hover { color: ${ACCENT}; border-color: rgba(12,151,58,0.35); background: var(--accent-sub); }
  .lp-footer-copy  { font-size: 13px; color: var(--text-3); }
  .lp-footer-col-title {
    font-size: 12px; font-weight: 700; color: var(--text-2);
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;
  }
  .lp-footer-links { display: flex; flex-direction: column; gap: 10px; }
  .lp-footer-link  { font-size: 14px; line-height: 1.86; color: var(--text-3); transition: color 0.15s; }
  .lp-footer-link:hover { color: var(--text); }

  /* ══════════════════════════════════════════════
     HERO — AI CHIPS
  ══════════════════════════════════════════════ */
  .lp-hero-ai-chips {
    display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; justify-content: center;
  }
  .lp-hero-ai-chip {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600; color: var(--text-2);
    background: var(--bg-card-2); border: 1px solid var(--border);
    padding: 5px 12px; border-radius: 99px; transition: all 0.18s;
  }
  .lp-hero-ai-chip svg { color: ${ACCENT}; }
  .lp-hero-ai-chip:hover { background: var(--accent-sub); border-color: rgba(12,151,58,0.30); color: var(--text); }

  /* ══════════════════════════════════════════════
     AI FEATURES SECTION
  ══════════════════════════════════════════════ */
  .lp-ai-section {
    background: var(--lp-soft);
    padding: 100px 36px;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    position: relative; overflow: hidden;
  }
  .lp-ai-section::before {
    content: ''; position: absolute;
    top: -180px; left: 50%; transform: translateX(-50%);
    width: 700px; height: 400px; border-radius: 50%;
    background: radial-gradient(ellipse at center, var(--lp-glow) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-ai-hd { text-align: center; margin-bottom: 64px; position: relative; z-index: 1; }
  .lp-ai-badge {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase;
    color: ${ACCENT_2};
    background: var(--accent-sub); border: 1px solid rgba(12,151,58,0.26);
    padding: 5px 16px; border-radius: 99px; margin-bottom: 20px;
  }
  .lp-ai-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 16px; max-width: 1100px; margin: 0 auto;
    position: relative; z-index: 1;
  }
  .lp-ai-card {
    border-radius: 18px; padding: 32px 28px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 16px;
    transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
    position: relative; overflow: hidden;
  }
  .lp-ai-card::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, ${ACCENT}, transparent);
    opacity: 0; transition: opacity 0.25s;
  }
  .lp-ai-card:hover::after { opacity: 1; }
  .lp-ai-card:hover {
    border-color: rgba(12,151,58,0.28);
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg), 0 0 0 1px rgba(12,151,58,0.08);
  }
  .lp-ai-card-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: var(--accent-sub); border: 1px solid rgba(12,151,58,0.24);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .lp-ai-card-row { display: flex; align-items: flex-start; gap: 18px; }
  .lp-ai-card-title { font-size: 18.5px; font-weight: 800; color: var(--text); margin-bottom: 6px; letter-spacing: -0.02em; }
  .lp-ai-card-desc  { font-size: 16px; color: var(--text-2); line-height: 1.8; }
  .lp-ai-card-bullets { display: flex; flex-direction: column; gap: 7px; padding-top: 4px; }
  .lp-ai-bullet {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; color: var(--text-2);
  }
  .lp-ai-bullet::before {
    content: ''; width: 5px; height: 5px; border-radius: 50%;
    background: ${ACCENT}; flex-shrink: 0; opacity: 0.80;
  }
  .lp-ai-demo-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--accent-sub); border: 1px solid rgba(12,151,58,0.24);
    border-radius: 8px; padding: 6px 12px;
    font-size: 13px; font-weight: 700; color: ${ACCENT_2};
    width: fit-content;
  }
  .lp-ai-cta-row {
    display: flex; align-items: center; justify-content: center; gap: 16px;
    margin-top: 56px; flex-wrap: wrap; position: relative; z-index: 1;
  }
  .lp-ai-cta-label {
    font-size: 16px; color: var(--text-2);
  }
  .lp-ai-cta-label strong { color: var(--text); }

  /* ══════════════════════════════════════════════
     UTILS
  ══════════════════════════════════════════════ */
  .lp-inner    { max-width: 1360px; margin: 0 auto; }
  .lp-inner-md { max-width: 1100px; margin: 0 auto; }
  .lp-center   { text-align: center; }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .lp-feat-grid { grid-template-columns: repeat(2, 1fr); }
    .lp-pricing-grid { grid-template-columns: 1fr; max-width: 440px; }
    .lp-footer-inner { grid-template-columns: 1fr 1fr; }
    .lp-human-inner { grid-template-columns: 1fr; }
    .lp-human-art { order: -1; }
  }
  @media (max-width: 900px) {
    .lp-features-hd { flex-direction: column; gap: 4px; }
    .lp-steps-grid { grid-template-columns: repeat(2, 1fr); gap: 40px; }
    .lp-steps-line { display: none; }
    .lp-cta-inner { grid-template-columns: 1fr; gap: 40px; }
    .lp-cta-right { align-items: flex-start; }
    .lp-cta-ring { display: none; }
    .lp-btn-pri { animation: none; box-shadow: 0 4px 20px rgba(12,151,58,0.30); }
    .lp-ai-grid { grid-template-columns: 1fr; }
    .lp-show-pos { grid-template-columns: 1fr; }
    .lp-show-trow { grid-template-columns: 2fr 0.8fr 0.9fr; }
    .lp-show-trow span:nth-child(2) { display: none; }
  }
  @media (max-width: 640px) {
    .lp-marquee { height: 28px; }
    .lp-marquee-item { font-size: 11.5px; padding: 0 20px; }
    .lp-nav { top: 28px; }
    .lp-nav-links, .lp-signin { display: none; }
    .lp-hero { padding: 112px 20px 72px; }
    .lp-features-section, .lp-hiw-section,
    .lp-pricing-section, .lp-cta-section, .lp-ai-section,
    .lp-show-section, .lp-human-section, .lp-faq-section { padding: 72px 20px; }
    .lp-footer { padding: 24px 20px; }
    .lp-feat-grid { grid-template-columns: 1fr; }
    .lp-steps-grid { grid-template-columns: 1fr; }
    .lp-footer-inner { grid-template-columns: 1fr; gap: 32px; }
    .lp-btn-pri, .lp-btn-sec, .lp-btn-accent { font-size: 15px; padding: 13px 22px; }
    .lp-hero-proof { gap: 20px; }
    .lp-features-count { display: none; }
    .lp-ai-card-row { flex-direction: column; gap: 12px; }
    .lp-hero-ai-chips { display: none; }
    .lp-show-tabs { gap: 6px; }
    .lp-show-tab span { display: none; }
    .lp-show-body { padding: 18px; }
  }
`;

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="lp">
      <style>{CSS}</style>
      <Marquee />
      <Nav />
      <Hero />
      <AIFeatures />
      <AppShowcase />
      <Features />
      <HowItWorks />
      <HumanSection />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
      <InstallPromptPopup />
    </div>
  );
}

/* ─── Marquee ────────────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  { icon: Zap,     text: "New: AI Demand Forecasting is live" },
  { icon: Camera,  text: "Snap a photo — auto-fill product details" },
  { icon: Bot,     text: "Ask your AI Business Assistant anything, anytime" },
  { icon: Banknote, text: "Naira-first — no currency guesswork" },
];
function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="lp-marquee">
      <div className="lp-marquee-track">
        {items.map((it, i) => (
          <span className="lp-marquee-item" key={i}>
            <it.icon size={12} />
            {it.text}
            <span className="lp-marquee-dot">•</span>
          </span>
        ))}
      </div>
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
          <a href="#ai-features"   className="lp-nav-link">AI Features</a>
          <a href="#features"      className="lp-nav-link">Features</a>
          <a href="#how-it-works"  className="lp-nav-link">How it works</a>
          <a href="#pricing"       className="lp-nav-link">Pricing</a>
          <a href="#faq"           className="lp-nav-link">FAQ</a>
        </nav>
        <div className="lp-nav-auth">
          <ThemeToggle />
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
        <div className="lp-hero-left">
          <h1 className="lp-h1 anim-1">
            Your stock,<br />now <em>thinks</em> for itself.
          </h1>
          <p className="lp-hero-sub anim-2">
            Track stock, record sales, and manage your team — plus get AI
            demand forecasts, smart stockout warnings, and a business
            assistant that answers any question in plain English.
          </p>
          <div className="lp-hero-btns anim-3">
            <Link href="/auth/register" className="lp-btn-pri">
              Start for free <ArrowRight size={16} />
            </Link>
            <a href="#ai-features" className="lp-btn-sec">See AI features</a>
          </div>
          <div className="lp-hero-ai-chips anim-3">
            <span className="lp-hero-ai-chip"><TrendingUp size={11} /> Demand Forecasting</span>
            <span className="lp-hero-ai-chip"><AlertTriangle size={11} /> Smart Stock Alerts</span>
            <span className="lp-hero-ai-chip"><MessageSquare size={11} /> Business Chat</span>
            <span className="lp-hero-ai-chip"><Camera size={11} /> Photo Product Entry</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── AI Features ───────────────────────────────────────────────────────── */
function AIFeatures() {
  const cards = [
    {
      icon: TrendingUp,
      title: "Demand Forecasting",
      desc: "AI analyses 90 days of sales patterns — weekday/weekend trends, spikes, and burn rate — then predicts exactly how much stock you'll need over the next 7, 14, and 30 days.",
      bullets: [
        "Exact reorder quantity and date per product",
        "Confidence score so you know when to trust it",
        "Plain English reasoning for every prediction",
        "Batch-run across all products at once",
      ],
      demo: "Order 45 units by Jun 3 · 87% confidence",
    },
    {
      icon: AlertTriangle,
      title: "Smart Stock Alerts",
      desc: "Goes beyond simple reorder levels. AI monitors live sales velocity — and warns you before you hit the threshold, not after. Even catches when your reorder level is set too low.",
      bullets: [
        "CRITICAL / WARNING / WATCH / HEALTHY status",
        "\"Runs out in X days\" on every product",
        "Suggests corrected reorder levels with one-click update",
        "Auto-refreshes every 6 hours in the background",
      ],
      demo: "USB-C Hub · runs out in 2 days · CRITICAL",
    },
    {
      icon: Bot,
      title: "AI Business Assistant",
      desc: "A chat panel built into your dashboard. Ask anything in plain English — or Pidgin. Get direct, data-backed answers with real numbers from your live business data.",
      bullets: [
        "Answers questions about revenue, profit, and stock",
        "Live business context injected automatically",
        "Quick-question chips for common queries",
        "Automated weekly narrative report every Monday",
      ],
      demo: "\"What were my top products this week?\"",
    },
    {
      icon: Camera,
      title: "Photo Product Entry",
      desc: "Take or upload a photo of any product — its label, packaging, or barcode. AI reads the image and pre-fills the entire Add Product form. Review, tweak, save.",
      bullets: [
        "Detects name, category, brand, and barcode",
        "Suggests realistic Nigerian market prices",
        "Highlights which fields were filled by AI",
        "Batch import up to 20 products at once",
      ],
      demo: "Identified: Indomie Noodles 70g · 94% confidence",
    },
  ];

  return (
    <section id="ai-features" className="lp-ai-section">
      <div className="lp-ai-hd">
        <div className="lp-ai-badge">
          <Zap size={11} /> AI-Powered
        </div>
        <h2 className="lp-section-title" style={{ marginBottom: 14 }}>
          Your inventory, now<br />with a brain.
        </h2>
        <p className="lp-section-sub-c">
          Four AI features built into UniStocker — no extra tools, no setup, no guesswork.
          Just smarter decisions, automatically.
        </p>
      </div>

      <div className="lp-ai-grid">
        {cards.map((card) => (
          <div key={card.title} className="lp-ai-card">
            <div className="lp-ai-card-row">
              <div className="lp-ai-card-icon">
                <card.icon size={22} color={ACCENT} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="lp-ai-card-title">{card.title}</div>
                <div className="lp-ai-card-desc">{card.desc}</div>
              </div>
            </div>
            <div className="lp-ai-card-bullets">
              {card.bullets.map((b) => (
                <div key={b} className="lp-ai-bullet">{b}</div>
              ))}
            </div>
            <div className="lp-ai-demo-pill">
              <span style={{ fontSize: 13 }}>▶</span>
              <span>{card.demo}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="lp-ai-cta-row">
        <p className="lp-ai-cta-label">
          All AI features are built in — <strong>no setup, no extra tools</strong>, no guesswork.
        </p>
        <Link href="/auth/register" className="lp-btn-pri" style={{ fontSize: 14, padding: "12px 28px", animation: "none" }}>
          Try it free <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Package,      bg: "rgba(99,102,241,0.10)",  fg: "#6366f1", title: "Smart Inventory",  desc: "Add products, set reorder levels, and track every item's complete transaction history." },
  { icon: ShoppingCart, bg: "rgba(12,151,58,0.10)",  fg: "#0C973A", title: "Built-in POS",     desc: "Record sales in seconds. Stock updates automatically — no double entry." },
  { icon: Bell,         bg: "rgba(245,158,11,0.10)",  fg: "#f59e0b", title: "Real-Time Alerts", desc: "Push and email alerts for low stock, sales, or any stock change. Instantly." },
  { icon: BarChart3,    bg: "rgba(16,185,129,0.10)",  fg: "#10b981", title: "Profit Reports",   desc: "Revenue, cost, and profit side by side — daily, weekly, and monthly." },
  { icon: Users,        bg: "rgba(168,85,247,0.10)",  fg: "#a855f7", title: "Team Roles",       desc: "Role-based access for managers and staff. Every action logged by person." },
  { icon: Globe,        bg: "rgba(5,102,255,0.10)",  fg: "#0566FF", title: "Multi-Branch",     desc: "Run multiple locations from one account with separate inventory per branch." },
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
        <span className="lp-eyebrow">How it works</span>
        <h2 className="lp-section-title">Up and running in minutes</h2>
        <p className="lp-section-sub-c">No training. No IT person. Just sign up and go.</p>
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

/* ─── Human section — illustration + relatable copy ─────────────────────── */
function HumanSection() {
  const points = [
    { icon: Wifi,           title: "No IT department needed",   text: "Install it like an app on any Android phone or laptop. If your staff can use WhatsApp, they can use UniStocker." },
    { icon: Banknote,       title: "Naira-first, built locally", text: "Pricing, receipts, and payments are all in Naira from day one — powered by Paystack, no currency guesswork." },
    { icon: HeartHandshake, title: "Support that understands you", text: "We built this for shops, pharmacies, and supermarkets across Nigeria — not a generic global tool bolted on afterward." },
  ];
  return (
    <section className="lp-human-section">
      <div className="lp-human-inner">
        <div className="lp-human-art">
          <div className="lp-human-art-glow" />
          <ShopkeeperIllustration />
        </div>
        <div>
          <span className="lp-eyebrow">Built for real businesses</span>
          <h2 className="lp-section-title">
            Run by people who<br />know what a stock count is.
          </h2>
          <p className="lp-section-sub" style={{ maxWidth: 460 }}>
            UniStocker was built around how small and growing businesses actually
            operate day to day — a shop owner checking stock between customers,
            a staff member ringing up a sale on a busy Saturday, a manager
            reviewing yesterday&apos;s numbers before opening.
          </p>
          <div className="lp-human-points">
            {points.map((p) => (
              <div key={p.title} className="lp-human-point">
                <div className="lp-human-point-icon"><p.icon size={17} /></div>
                <div className="lp-human-point-text">
                  <strong>{p.title}</strong>
                  {p.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShopkeeperIllustration() {
  return (
    <svg width="360" height="360" viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "relative", zIndex: 1, maxWidth: "100%", height: "auto" }}>
      {/* Shelf */}
      <rect x="30" y="60" width="120" height="20" rx="4" fill="var(--bg-card-2)" stroke="var(--border-2)" />
      <rect x="42" y="30" width="26" height="30" rx="4" fill="#0C973A" opacity="0.85" />
      <rect x="74" y="24" width="26" height="36" rx="4" fill="#6366f1" opacity="0.75" />
      <rect x="106" y="34" width="26" height="26" rx="4" fill="#f59e0b" opacity="0.80" />

      {/* Counter */}
      <rect x="20" y="250" width="320" height="70" rx="14" fill="var(--bg-card)" stroke="var(--border)" />
      <rect x="20" y="250" width="320" height="10" rx="5" fill="#0C973A" opacity="0.9" />

      {/* Person body */}
      <rect x="140" y="150" width="80" height="110" rx="26" fill="#0C973A" />
      <circle cx="180" cy="118" r="34" fill="#0A7B30" />

      {/* Arm holding phone */}
      <rect x="205" y="168" width="20" height="70" rx="10" fill="#0A7B30" />

      {/* Phone */}
      <rect x="212" y="150" width="46" height="80" rx="10" fill="var(--bg-card)" stroke="var(--border-2)" strokeWidth="2" />
      <rect x="220" y="162" width="30" height="4" rx="2" fill="#0C973A" opacity="0.5" />
      <rect x="220" y="172" width="18" height="30" rx="3" fill="var(--bg-card-2)" />
      <rect x="223" y="196" width="4" height="4" fill="#0C973A" />
      <rect x="229" y="190" width="4" height="10" fill="#0C973A" />
      <rect x="235" y="184" width="4" height="16" fill="#0C973A" />
      <rect x="220" y="208" width="30" height="4" rx="2" fill="var(--border-2)" />
      <rect x="220" y="216" width="20" height="4" rx="2" fill="var(--border-2)" />

      {/* Boxes on counter */}
      <rect x="60" y="222" width="34" height="30" rx="5" fill="#f59e0b" opacity="0.85" />
      <rect x="100" y="214" width="34" height="38" rx="5" fill="#6366f1" opacity="0.75" />

      {/* Floating chart badge */}
      <g>
        <rect x="250" y="70" width="78" height="52" rx="12" fill="var(--bg-card)" stroke="var(--border)" />
        <path d="M262 108 L276 92 L290 100 L304 78" stroke="#0C973A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="304" cy="78" r="4" fill="#0C973A" />
      </g>
    </svg>
  );
}

/* ─── Pricing ────────────────────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: "Free Forever", price: "₦0", period: "", highlight: false,
      desc: "Get started at no cost, forever — no card, no expiry.",
      features: [
        "Up to 25 products",
        "2 staff accounts (1 owner + 1 team member)",
        "1 branch location",
        "Basic inventory management",
        "Sales recording & receipts",
        "7-day dashboard overview",
        "Low stock alerts",
        "Works offline (PWA)",
      ],
      cta: "Start Free — No Card Required", href: "/auth/register",
    },
    {
      name: "Business", price: "₦4,999", period: "/month", highlight: true,
      desc: "Everything a growing shop needs, in one plan. Yearly billing saves 12%.",
      features: [
        "Up to 1,000 products",
        "Up to 10 staff accounts",
        "Up to 10 branch locations",
        "Everything in Free",
        "Full inventory management & bulk operations",
        "Date-range sales & inventory reports",
        "Export reports to CSV / Excel",
        "AI demand forecasting",
        "AI smart stock alerts",
        "AI business insights — chat with your data",
        "Weekly AI-generated business summaries",
        "Product photo import via AI",
        "Push & email notifications",
        "Earn referral points — get paid for every signup",
      ],
      cta: "Subscribe Now", href: "/auth/register",
    },
    {
      name: "Enterprise", price: "Custom", period: "", highlight: false,
      desc: "For operations that have outgrown a self-serve plan.",
      features: [
        "Unlimited products, staff, and branches",
        "Advanced AI analysis across all branches",
        "Multi-location analytics",
        "Full activity & audit logs",
        "Cross-branch inventory view",
        "Per-branch performance reports",
        "Custom AI usage volume",
        "Priority support & dedicated onboarding",
      ],
      cta: "Book a Call", href: "mailto:balogunmikes@gmail.com?subject=UniStocker%20Enterprise%20Inquiry",
    },
  ];
  return (
    <section id="pricing" className="lp-pricing-section" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="lp-pricing-hd">
        <span className="lp-eyebrow">Pricing</span>
        <h2 className="lp-section-title">Simple, honest pricing</h2>
        <p className="lp-section-sub-c">No hidden fees. Pay monthly or save 12% with yearly billing.</p>
      </div>
      <div className="lp-pricing-grid">
        {plans.map((plan) => (
          <div key={plan.name} className={`lp-plan ${plan.highlight ? "lp-plan-hi" : "lp-plan-default"}`}>
            {plan.highlight && <div className="lp-plan-badge">Most popular</div>}
            <div className="lp-plan-name" style={{ color: plan.highlight ? "#64ED80" : "var(--text-3)" }}>
              {plan.name}
            </div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span className="lp-plan-price" style={{ color: plan.highlight ? "#FFFFFF" : "var(--text)" }}>
                {plan.price}
              </span>
              {plan.period && (
                <span className="lp-plan-period" style={{ color: plan.highlight ? "#64ED80" : "var(--text-3)" }}>
                  {plan.period}
                </span>
              )}
            </div>
            <p className="lp-plan-desc" style={{ color: plan.highlight ? "rgba(255,255,255,0.62)" : "var(--text-2)" }}>
              {plan.desc}
            </p>
            <ul className="lp-plan-features">
              {plan.features.map((f) => (
                <li key={f} className="lp-plan-feature">
                  <CheckCircle size={15} color={plan.highlight ? "#64ED80" : ACCENT} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: plan.highlight ? "rgba(255,255,255,0.72)" : "var(--text-2)" }}>{f}</span>
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
      <div className="lp-cta-ring" />
      <div className="lp-cta-inner">
        <div>
          <h2 className="lp-cta-title">
            Ready to take <em>control</em><br />of your stock?
          </h2>
          <p className="lp-cta-sub">
            Join businesses already managing smarter with UniStocker.
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

/* ─── Social icons (lucide-react ships no brand icons) ──────────────────── */
function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82c-.9-.98-1.44-2.24-1.53-3.62h-3.14v13.7c0 1.68-1.36 3.04-3.04 3.04a3.04 3.04 0 0 1 0-6.08c.32 0 .62.05.9.14V9.86a6.2 6.2 0 0 0-.9-.07 6.2 6.2 0 1 0 6.2 6.2V9.4a9.3 9.3 0 0 0 4.51 1.16V7.42c-1.06 0-2.04-.32-2.86-.87a5.72 5.72 0 0 1-.94-.73z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14.5 21v-7.6h2.55l.38-2.96h-2.93V8.55c0-.86.24-1.44 1.47-1.44h1.57V4.46c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.18H8.99v2.96h2.47V21h3.04z" />
    </svg>
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
          <div className="lp-footer-social">
            <a href="https://www.tiktok.com/@unistocker_app" target="_blank" rel="noopener noreferrer" aria-label="UniStocker on TikTok" className="lp-footer-social-link">
              <TikTokIcon />
            </a>
            <a href="https://www.instagram.com/unistocker_app" target="_blank" rel="noopener noreferrer" aria-label="UniStocker on Instagram" className="lp-footer-social-link">
              <InstagramIcon />
            </a>
            <a href="https://www.facebook.com/share/18T66jJhaz/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="UniStocker on Facebook" className="lp-footer-social-link">
              <FacebookIcon />
            </a>
          </div>
          <p className="lp-footer-copy">&copy; {new Date().getFullYear()} UniStocker. All rights reserved.</p>
        </div>
        {/* Product */}
        <div>
          <p className="lp-footer-col-title">Product</p>
          <div className="lp-footer-links">
            <a href="#features"     className="lp-footer-link">Features</a>
            <a href="#how-it-works" className="lp-footer-link">How it works</a>
            <a href="#pricing"      className="lp-footer-link">Pricing</a>
            <a href="#faq"          className="lp-footer-link">FAQ</a>
            <Link href="/auth/register" className="lp-footer-link">Get started free</Link>
          </div>
        </div>
        {/* Company */}
        <div>
          <p className="lp-footer-col-title">Company</p>
          <div className="lp-footer-links">
            <Link href="/privacy" className="lp-footer-link">Privacy policy</Link>
            <Link href="/terms"   className="lp-footer-link">Terms of service</Link>
            <a href="mailto:hello@unistocker.app" className="lp-footer-link">Contact us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
