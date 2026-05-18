import Link from "next/link";
import Image from "next/image";
import {
  Package, BarChart3, Bell, Users, ShieldCheck,
  ArrowRight, CheckCircle, TrendingUp,
  ShoppingCart, Globe, Smartphone, Zap, Star,
} from "lucide-react";

/* ── Brand theme tokens ────────────────────────────────────────────────── */
const C = {
  bg:       "#0B1820",
  bgAlt:    "#0F2030",
  bgCard:   "#0F2A3A",
  border:   "#1B3D4F",
  borderSub:"#1F4A5C",
  text:     "#f1f5f9",
  textMuted:"#7EB8A8",
  textDim:  "#3D6B5E",
  accent:   "#2EBD78",
  accentDk: "#22A865",
  accentLt: "#5ECE9B",
  amber:    "#F5A823",
  white:    "#ffffff",
};

const PAGE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; }
  .lp { background: ${C.bg}; color: ${C.text}; font-family: system-ui, -apple-system, sans-serif; }
  .lp a { text-decoration: none; }

  /* Nav */
  .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(7,7,26,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid ${C.border}; }
  .lp-nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 28px;
    height: 64px; display: flex; align-items: center; gap: 0; }
  .lp-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .lp-logo-icon { width: 34px; height: 34px; border-radius: 9px;
    background: ${C.accent}; display: flex; align-items: center; justify-content: center; }
  .lp-logo-text { font-weight: 700; font-size: 15px; color: ${C.white}; }
  .lp-nav-links { display: flex; align-items: center; gap: 6px; margin-left: 36px; }
  .lp-nav-link { font-size: 14px; color: ${C.textMuted}; padding: 6px 12px;
    border-radius: 6px; transition: color 0.15s, background 0.15s; }
  .lp-nav-link:hover { color: ${C.white}; background: rgba(255,255,255,0.06); }
  .lp-nav-auth { display: flex; align-items: center; gap: 10px; margin-left: auto; }
  .lp-signin { font-size: 14px; font-weight: 500; color: ${C.textMuted}; padding: 7px 14px;
    border-radius: 7px; transition: color 0.15s; }
  .lp-signin:hover { color: ${C.white}; }
  .lp-cta-btn { font-size: 14px; font-weight: 600; color: ${C.white};
    background: ${C.accent}; padding: 8px 18px; border-radius: 8px;
    transition: background 0.15s; white-space: nowrap; }
  .lp-cta-btn:hover { background: ${C.accentDk}; }

  /* Hero */
  .lp-hero { padding: 120px 24px 80px; text-align: center;
    background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(46,189,120,0.15) 0%, transparent 70%); }
  .lp-badge { display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid rgba(46,189,120,0.4); background: rgba(46,189,120,0.1);
    color: ${C.accentLt}; font-size: 11px; font-weight: 700; letter-spacing: 0.07em;
    text-transform: uppercase; padding: 5px 14px; border-radius: 99px; margin-bottom: 28px; }
  .lp-h1 { font-size: clamp(36px, 5.5vw, 58px); font-weight: 800; line-height: 1.08;
    letter-spacing: -0.03em; color: ${C.white}; margin-bottom: 20px; }
  .lp-h1 span { color: ${C.accentLt}; }
  .lp-sub { font-size: 18px; color: ${C.textMuted}; line-height: 1.7;
    max-width: 500px; margin: 0 auto 36px; }
  .lp-hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 14px; }
  .lp-btn-primary { display: inline-flex; align-items: center; gap: 8px;
    background: ${C.accent}; color: ${C.white}; font-weight: 600; font-size: 15px;
    padding: 13px 28px; border-radius: 10px;
    box-shadow: 0 0 28px rgba(99,102,241,0.35); transition: background 0.15s; }
  .lp-btn-primary:hover { background: ${C.accentDk}; }
  .lp-btn-secondary { display: inline-flex; align-items: center; gap: 8px;
    border: 1.5px solid ${C.border}; color: ${C.textMuted}; font-weight: 600;
    font-size: 15px; padding: 13px 28px; border-radius: 10px;
    transition: border-color 0.15s, color 0.15s; }
  .lp-btn-secondary:hover { border-color: ${C.borderSub}; color: ${C.text}; }
  .lp-micro { font-size: 12px; color: ${C.textDim}; }

  /* Dashboard preview */
  .lp-preview { max-width: 860px; margin: 52px auto 0; padding: 0 24px; }
  .lp-preview-wrap { border: 1px solid ${C.border}; border-radius: 16px;
    overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.5); }
  .lp-browser-bar { background: #0f0f28; border-bottom: 1px solid ${C.border};
    padding: 10px 16px; display: flex; align-items: center; gap: 6px; }
  .lp-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .lp-browser-url { font-size: 11px; color: ${C.textDim}; font-family: monospace; margin-left: 10px; }
  .lp-stats { display: grid; grid-template-columns: repeat(4, 1fr); background: ${C.bgCard}; }
  .lp-stat { padding: 20px; border-right: 1px solid ${C.border}; }
  .lp-stat:last-child { border-right: none; }
  .lp-stat-val { font-size: 22px; font-weight: 700; color: ${C.white}; margin: 8px 0 3px; }
  .lp-stat-lbl { font-size: 11px; color: ${C.textDim}; }
  .lp-activity { border-top: 1px solid ${C.border}; background: ${C.bgCard}; }
  .lp-activity-row { display: flex; align-items: center; gap: 12px;
    padding: 11px 20px; border-top: 1px solid rgba(255,255,255,0.03); }
  .lp-activity-row:first-child { border-top: none; }
  .lp-badge-pill { font-size: 10px; font-weight: 700; padding: 3px 8px;
    border-radius: 5px; flex-shrink: 0; }
  .lp-activity-text { flex: 1; font-size: 13px; color: ${C.textMuted};
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lp-activity-time { font-size: 11px; color: ${C.textDim}; flex-shrink: 0; }

  /* Section shared */
  .lp-section { padding: 80px 24px; }
  .lp-section-alt { background: ${C.bgAlt}; border-top: 1px solid ${C.border}; border-bottom: 1px solid ${C.border}; }
  .lp-section-title { font-size: clamp(26px,4vw,38px); font-weight: 800;
    letter-spacing: -0.025em; color: ${C.white}; margin-bottom: 12px; }
  .lp-section-sub { font-size: 16px; color: ${C.textMuted}; }
  .lp-section-head { text-align: center; margin-bottom: 52px; }

  /* Logos */
  .lp-logos { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 40px; }
  .lp-logo-name { font-size: 13px; font-weight: 600; color: ${C.border}; }

  /* Feature cards */
  .lp-features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
  .lp-feature-card { background: ${C.bgCard}; border: 1px solid ${C.border};
    border-radius: 12px; padding: 22px 18px; transition: border-color 0.2s; }
  .lp-feature-card:hover { border-color: rgba(99,102,241,0.4); }
  .lp-feature-icon { width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
  .lp-feature-title { font-size: 14px; font-weight: 700; color: ${C.white}; margin-bottom: 6px; }
  .lp-feature-desc { font-size: 13px; color: ${C.textMuted}; line-height: 1.6; }

  /* Steps */
  .lp-steps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 36px; }
  .lp-step-num { width: 40px; height: 40px; border-radius: 10px; background: ${C.accent};
    color: white; font-weight: 700; font-size: 15px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
  .lp-step-title { font-size: 15px; font-weight: 700; color: ${C.white}; margin-bottom: 6px; }
  .lp-step-desc { font-size: 13px; color: ${C.textMuted}; line-height: 1.65; }

  /* Testimonials */
  .lp-reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
  .lp-review-card { background: ${C.bgCard}; border: 1px solid ${C.border}; border-radius: 12px; padding: 24px; }
  .lp-stars { display: flex; gap: 2px; margin-bottom: 14px; }
  .lp-review-quote { font-size: 14px; color: #9ca3af; line-height: 1.7; margin-bottom: 16px; }
  .lp-review-divider { border-top: 1px solid ${C.border}; padding-top: 14px; }
  .lp-review-name { font-size: 13px; font-weight: 700; color: ${C.white}; }
  .lp-review-biz { font-size: 12px; color: ${C.textDim}; margin-top: 2px; }

  /* Pricing */
  .lp-pricing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; align-items: start; }
  .lp-plan { border-radius: 14px; padding: 28px 24px; position: relative; display: flex; flex-direction: column; }
  .lp-plan-default { background: ${C.bgCard}; border: 1px solid ${C.border}; }
  .lp-plan-highlight { background: ${C.accent}; border: 2px solid #818cf8;
    box-shadow: 0 0 48px rgba(99,102,241,0.25); }
  .lp-plan-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
    background: #f59e0b; color: #78350f; font-size: 10px; font-weight: 800;
    padding: 4px 12px; border-radius: 99px; letter-spacing: 0.06em;
    text-transform: uppercase; white-space: nowrap; }
  .lp-plan-name { font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; margin-bottom: 14px; }
  .lp-plan-price { font-size: 40px; font-weight: 800; }
  .lp-plan-period { font-size: 14px; margin-left: 4px; }
  .lp-plan-desc { font-size: 13px; margin: 8px 0 22px; line-height: 1.55; }
  .lp-plan-features { list-style: none; display: flex; flex-direction: column; gap: 10px; flex: 1; margin-bottom: 24px; }
  .lp-plan-feature { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; }
  .lp-plan-btn { display: block; text-align: center; padding: 11px 0;
    border-radius: 8px; font-size: 14px; font-weight: 600; }

  /* CTA */
  .lp-cta-wrap { max-width: 560px; margin: 0 auto; text-align: center; }

  /* Footer */
  .lp-footer { border-top: 1px solid ${C.border}; background: ${C.bgAlt}; padding: 28px 24px; }
  .lp-footer-inner { max-width: 1100px; margin: 0 auto;
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
  .lp-footer-logo { display: flex; align-items: center; gap: 8px; }
  .lp-footer-logo-icon { width: 26px; height: 26px; border-radius: 6px;
    background: ${C.accent}; display: flex; align-items: center; justify-content: center; }
  .lp-footer-links { display: flex; gap: 24px; }
  .lp-footer-link { font-size: 13px; color: ${C.textMuted}; transition: color 0.15s; }
  .lp-footer-link:hover { color: ${C.white}; }

  /* Responsive */
  @media (max-width: 640px) {
    .lp-nav-links { display: none; }
    .lp-signin { display: none; }
    .lp-stats { grid-template-columns: repeat(2, 1fr); }
    .lp-stat:nth-child(2) { border-right: none; }
    .lp-stat:nth-child(3) { border-top: 1px solid ${C.border}; border-right: 1px solid ${C.border}; }
    .lp-stat:nth-child(4) { border-top: 1px solid ${C.border}; }
  }
`;

export default function LandingPage() {
  return (
    <div className="lp">
      <style>{PAGE_CSS}</style>
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

/* ── Nav ───────────────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <Link href="/" className="lp-logo">
          <Image src="/Uniwhite.png" alt="UniStocker" width={28} height={28} style={{ objectFit: "contain" }} />
          <span className="lp-logo-text">UniStocker</span>
        </Link>

        <nav className="lp-nav-links">
          <a href="#features"    className="lp-nav-link">Features</a>
          <a href="#how-it-works"className="lp-nav-link">How it works</a>
          <a href="#pricing"     className="lp-nav-link">Pricing</a>
        </nav>

        <div className="lp-nav-auth">
          <Link href="/auth/login"    className="lp-signin">Sign in</Link>
          <Link href="/auth/register" className="lp-cta-btn">Get started free</Link>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="lp-hero">
      <div style={{ maxWidth: 660, margin: "0 auto" }}>
        <div className="lp-badge">
          <Zap size={11} />
          Built for African businesses
        </div>

        <h1 className="lp-h1">
          Inventory that{" "}
          <span>runs itself.</span>
        </h1>

        <p className="lp-sub">
          Track stock, record sales, manage your team, and get real-time alerts —
          all from one clean dashboard. No spreadsheets.
        </p>

        <div className="lp-hero-btns">
          <Link href="/auth/register" className="lp-btn-primary">
            Start for free <ArrowRight size={16} />
          </Link>
          <Link href="/auth/login" className="lp-btn-secondary">
            Sign in to your account
          </Link>
        </div>
        <p className="lp-micro">No credit card required · Ready in under 2 minutes</p>
      </div>

      {/* Dashboard preview */}
      <div className="lp-preview">
        <div className="lp-preview-wrap">
          <div className="lp-browser-bar">
            <span className="lp-dot" style={{ background: "#f87171" }} />
            <span className="lp-dot" style={{ background: "#fbbf24" }} />
            <span className="lp-dot" style={{ background: "#34d399" }} />
            <span className="lp-browser-url">app.unistocker.com/dashboard</span>
          </div>

          <div className="lp-stats">
            {[
              { label: "Total Products", value: "248",    icon: Package,    color: C.accentLt },
              { label: "Today's Sales",  value: "$1,842", icon: TrendingUp, color: "#34d399" },
              { label: "Low Stock",      value: "6 items",icon: Bell,       color: "#fbbf24" },
              { label: "Staff Online",   value: "4",      icon: Users,      color: "#c084fc" },
            ].map((s) => (
              <div key={s.label} className="lp-stat">
                <s.icon size={17} color={s.color} />
                <div className="lp-stat-val">{s.value}</div>
                <div className="lp-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="lp-activity">
            {[
              { badge: "STOCK IN", text: "50 units added — Wireless Mouse",       time: "2m ago",  bg: "rgba(52,211,153,0.12)",  fg: "#34d399" },
              { badge: "SALE",     text: "Receipt #4821 · $189.00 · James",        time: "14m ago", bg: "rgba(99,102,241,0.15)",  fg: C.accentLt },
              { badge: "ALERT",    text: "USB-C Hub is below minimum stock level", time: "1h ago",  bg: "rgba(251,191,36,0.12)",  fg: "#fbbf24" },
            ].map((row, i) => (
              <div key={i} className="lp-activity-row">
                <span className="lp-badge-pill" style={{ background: row.bg, color: row.fg }}>{row.badge}</span>
                <span className="lp-activity-text">{row.text}</span>
                <span className="lp-activity-time">{row.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Logos ─────────────────────────────────────────────────────────────── */
function Logos() {
  const names = ["Supermart NG", "TechHub Lagos", "FoodPlus Abuja", "QuickStock GH", "RetailPro KE"];
  return (
    <section className="lp-section" style={{ padding: "28px 24px", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>
          Trusted by growing businesses across Africa
        </p>
        <div className="lp-logos">
          {names.map((name) => <span key={name} className="lp-logo-name">{name}</span>)}
        </div>
      </div>
    </section>
  );
}

/* ── Features ──────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Package,      bg: "#312e81", title: "Smart Inventory",  desc: "Add products, set reorder levels, and track every item's complete transaction history." },
  { icon: ShoppingCart, bg: "#164e63", title: "Built-in POS",     desc: "Record sales in seconds. Stock updates automatically — no double entry." },
  { icon: Bell,         bg: "#78350f", title: "Real-Time Alerts", desc: "Push and email alerts for low stock, sales, or any stock change. Instantly." },
  { icon: BarChart3,    bg: "#14532d", title: "Profit Reports",   desc: "Revenue, cost, and profit side by side — daily, weekly, and monthly." },
  { icon: Users,        bg: "#4c1d95", title: "Team Roles",       desc: "Role-based access for managers and staff. Every action logged by person." },
  { icon: Globe,        bg: "#1e3a5f", title: "Multi-Branch",     desc: "Run multiple locations from one account with separate inventory per branch." },
  { icon: ShieldCheck,  bg: "#7f1d1d", title: "Audit Logs",       desc: "Every stock movement timestamped with who did it. Full accountability." },
  { icon: Smartphone,   bg: "#134e4a", title: "Works Offline",    desc: "Install as a PWA on any device. Data syncs automatically when back online." },
];

function Features() {
  return (
    <section id="features" className="lp-section">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="lp-section-head">
          <h2 className="lp-section-title">Everything in one place</h2>
          <p className="lp-section-sub">From a single shop to multiple branches — UniStocker grows with you.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: f.bg }}>
                <f.icon size={16} color="white" />
              </div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ──────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: 1, title: "Create your account",  desc: "Sign up with your business name. You're instantly set up as owner with full access." },
    { n: 2, title: "Add your products",    desc: "Add items with prices, stock levels, and photos. One at a time or in bulk." },
    { n: 3, title: "Invite your team",     desc: "Create accounts for managers and staff with exactly the permissions they need." },
    { n: 4, title: "Track everything",     desc: "Every sale and stock change is recorded live. Alerts fire before you run out." },
  ];
  return (
    <section id="how-it-works" className="lp-section lp-section-alt">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="lp-section-head">
          <h2 className="lp-section-title">Up and running in minutes</h2>
          <p className="lp-section-sub">No training. No IT person. Just sign up and go.</p>
        </div>
        <div className="lp-steps-grid">
          {steps.map((s) => (
            <div key={s.n}>
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

/* ── Testimonials ──────────────────────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    { name: "Emeka O.",  biz: "SuperMart Lagos", quote: "Before UniStocker I was using paper and Excel. Now I know exactly what's in stock at both shops without being there." },
    { name: "Fatima A.", biz: "FoodPlus Abuja",  quote: "The low stock alerts alone saved my business. I used to run out of fast-moving items without warning. Not anymore." },
    { name: "Kwame B.",  biz: "TechHub Accra",   quote: "Every transaction is logged with the staff name and time. The boss dashboard is everything I needed." },
  ];
  return (
    <section className="lp-section">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="lp-section-head">
          <h2 className="lp-section-title">Business owners love it</h2>
          <p className="lp-section-sub">Real results from real businesses.</p>
        </div>
        <div className="lp-reviews-grid">
          {reviews.map((r) => (
            <div key={r.name} className="lp-review-card">
              <div className="lp-stars">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p className="lp-review-quote">&ldquo;{r.quote}&rdquo;</p>
              <div className="lp-review-divider">
                <div className="lp-review-name">{r.name}</div>
                <div className="lp-review-biz">{r.biz}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ───────────────────────────────────────────────────────────── */
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
    <section id="pricing" className="lp-section lp-section-alt">
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="lp-section-head">
          <h2 className="lp-section-title">Simple, honest pricing</h2>
          <p className="lp-section-sub">No hidden fees. Cancel anytime.</p>
        </div>
        <div className="lp-pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`lp-plan ${plan.highlight ? "lp-plan-highlight" : "lp-plan-default"}`}>
              {plan.highlight && <div className="lp-plan-badge">Most popular</div>}
              <div className="lp-plan-name" style={{ color: plan.highlight ? "#c7d2fe" : C.textDim }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span className="lp-plan-price" style={{ color: plan.highlight ? C.white : C.white }}>{plan.price}</span>
                {plan.period && <span className="lp-plan-period" style={{ color: plan.highlight ? "#c7d2fe" : C.textDim }}>{plan.period}</span>}
              </div>
              <p className="lp-plan-desc" style={{ color: plan.highlight ? "#c7d2fe" : C.textMuted }}>{plan.desc}</p>
              <ul className="lp-plan-features">
                {plan.features.map((f) => (
                  <li key={f} className="lp-plan-feature">
                    <CheckCircle size={15} color={plan.highlight ? "#a5b4fc" : C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: plan.highlight ? "#e0e7ff" : C.textMuted }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className="lp-plan-btn"
                style={{
                  background: plan.highlight ? C.white : C.accent,
                  color: plan.highlight ? C.accent : C.white,
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ───────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="lp-section">
      <div className="lp-cta-wrap">
        <h2 className="lp-section-title">Ready to take control of your stock?</h2>
        <p className="lp-section-sub" style={{ margin: "14px auto 36px", maxWidth: 460 }}>
          Join hundreds of businesses already managing smarter with UniStocker.
        </p>
        <Link href="/auth/register" className="lp-btn-primary" style={{ margin: "0 auto" }}>
          Create your free account <ArrowRight size={16} />
        </Link>
        <p className="lp-micro" style={{ marginTop: 16 }}>No credit card · Setup in under 2 minutes</p>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-logo">
          <Image src="/Uniwhite.png" alt="UniStocker" width={22} height={22} style={{ objectFit: "contain" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: C.white }}>UniStocker</span>
        </div>
        <p style={{ fontSize: 12, color: C.textDim }}>
          &copy; {new Date().getFullYear()} UniStocker. Built for African businesses.
        </p>
        <div className="lp-footer-links">
          {[["Privacy", "#"], ["Terms", "#"], ["Contact", "mailto:hello@unistocker.app"]].map(([label, href]) => (
            <a key={label} href={href} className="lp-footer-link">{label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
