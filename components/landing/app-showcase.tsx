"use client";

import { useEffect, useState } from "react";
import {
  Package, Search, Plus, ShoppingCart, TrendingUp, Bot,
  AlertTriangle, CheckCircle2, Send, ArrowUpRight,
} from "lucide-react";

const TABS = [
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "pos",        label: "Sales & POS", icon: ShoppingCart },
  { key: "ai",         label: "AI Insights", icon: Bot },
  { key: "alerts",     label: "Alerts", icon: AlertTriangle },
] as const;

type TabKey = typeof TABS[number]["key"];

const DURATION = 4800;

export function AppShowcase() {
  const [active, setActive] = useState<TabKey>("inventory");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const i = TABS.findIndex((t) => t.key === prev);
        return TABS[(i + 1) % TABS.length].key;
      });
      setTick((t) => t + 1);
    }, DURATION);
    return () => clearInterval(id);
  }, []);

  const select = (key: TabKey) => {
    setActive(key);
    setTick((t) => t + 1);
  };

  return (
    <section id="app-showcase" className="lp-show-section">
      <div className="lp-show-hd">
        <span className="lp-eyebrow">Live product tour</span>
        <h2 className="lp-section-title">See UniStocker in motion</h2>
        <p className="lp-section-sub-c">
          Every screen updates in real time — this is the actual app, not a slideshow.
        </p>
      </div>

      <div className="lp-show-inner">
        <div className="lp-show-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => select(t.key)}
              className={`lp-show-tab ${active === t.key ? "on" : ""}`}
              type="button"
            >
              <t.icon size={15} />
              <span>{t.label}</span>
              {active === t.key && (
                <span key={tick} className="lp-show-tab-bar">
                  <span className="lp-show-tab-fill" style={{ animationDuration: `${DURATION}ms` }} />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="lp-show-panel">
          <div className="lp-show-chrome">
            <span className="lp-dot" style={{ background: "#f87171" }} />
            <span className="lp-dot" style={{ background: "#fbbf24" }} />
            <span className="lp-dot" style={{ background: "#34d399" }} />
            <span className="lp-show-url">app.unistocker.com/{active === "pos" ? "sales" : active}</span>
          </div>
          <div key={active} className="lp-show-body">
            {active === "inventory" && <InventoryPanel />}
            {active === "pos" && <PosPanel />}
            {active === "ai" && <AiPanel />}
            {active === "alerts" && <AlertsPanel />}
          </div>
        </div>
      </div>
    </section>
  );
}

function InventoryPanel() {
  const rows = [
    { name: "USB-C Hub 6-in-1", sku: "SKU-2281", stock: 42, status: "In stock", color: "#0C973A" },
    { name: "Wireless Mouse M2", sku: "SKU-1190", stock: 6, status: "Low", color: "#f59e0b" },
    { name: "Bluetooth Speaker", sku: "SKU-3305", stock: 0, status: "Out", color: "#ef4444" },
    { name: "Phone Case Clear",  sku: "SKU-0447", stock: 118, status: "In stock", color: "#0C973A" },
  ];
  return (
    <div className="lp-show-anim">
      <div className="lp-show-toolbar">
        <div className="lp-show-search"><Search size={13} /> Search products…</div>
        <div className="lp-show-addbtn"><Plus size={13} /> Add product</div>
      </div>
      <div className="lp-show-table">
        <div className="lp-show-trow lp-show-thead">
          <span>Product</span><span>SKU</span><span>Stock</span><span>Status</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.sku} className="lp-show-trow" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="lp-show-cell-main">{r.name}</span>
            <span className="lp-show-cell-mute">{r.sku}</span>
            <span className="lp-show-cell-mute">{r.stock}</span>
            <span className="lp-show-pill" style={{ color: r.color, background: `${r.color}1a` }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PosPanel() {
  const cart = [
    { name: "Indomie Noodles 70g", qty: 3, price: 450 },
    { name: "Bottled Water 75cl", qty: 2, price: 300 },
  ];
  const total = cart.reduce((s, c) => s + c.qty * c.price, 0);
  return (
    <div className="lp-show-anim lp-show-pos">
      <div className="lp-show-pos-left">
        {["Snacks", "Drinks", "Electronics", "Household"].map((cat, i) => (
          <div key={cat} className="lp-show-cat" style={{ animationDelay: `${i * 0.06}s` }}>{cat}</div>
        ))}
      </div>
      <div className="lp-show-pos-right">
        <div className="lp-show-cart-title"><ShoppingCart size={13} /> Current sale</div>
        {cart.map((c, i) => (
          <div key={c.name} className="lp-show-cart-row" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
            <span>{c.qty}× {c.name}</span>
            <span>₦{(c.qty * c.price).toLocaleString()}</span>
          </div>
        ))}
        <div className="lp-show-cart-total">
          <span>Total</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
        <div className="lp-show-checkout"><CheckCircle2 size={13} /> Complete sale</div>
      </div>
    </div>
  );
}

function AiPanel() {
  return (
    <div className="lp-show-anim lp-show-ai">
      <div className="lp-show-chat-msg user">
        <span>What should I restock this week?</span>
      </div>
      <div className="lp-show-chat-msg bot" style={{ animationDelay: "0.35s" }}>
        <div className="lp-show-chat-bot-hd"><Bot size={13} /> UniStocker AI</div>
        <p>Based on the last 90 days, restock these before Friday:</p>
        <div className="lp-show-ai-row" style={{ animationDelay: "0.55s" }}>
          <TrendingUp size={13} color="#0C973A" />
          <span>USB-C Hub — order 45 units · 87% confidence</span>
        </div>
        <div className="lp-show-ai-row" style={{ animationDelay: "0.68s" }}>
          <TrendingUp size={13} color="#0C973A" />
          <span>Bottled Water 75cl — order 120 units · 93% confidence</span>
        </div>
      </div>
      <div className="lp-show-chat-input">
        <span>Ask about revenue, stock, or staff…</span>
        <Send size={13} />
      </div>
    </div>
  );
}

function AlertsPanel() {
  const alerts = [
    { level: "CRITICAL", text: "Bluetooth Speaker — out of stock", color: "#ef4444" },
    { level: "WARNING",  text: "Wireless Mouse — runs out in 2 days", color: "#f59e0b" },
    { level: "WATCH",    text: "Phone Case Clear — trending above forecast", color: "#3b82f6" },
  ];
  return (
    <div className="lp-show-anim lp-show-alerts">
      {alerts.map((a, i) => (
        <div key={a.text} className="lp-show-alert-row" style={{ animationDelay: `${i * 0.1}s` }}>
          <span className="lp-show-alert-badge" style={{ color: a.color, background: `${a.color}1a`, borderColor: `${a.color}33` }}>
            {a.level}
          </span>
          <span className="lp-show-alert-text">{a.text}</span>
          <ArrowUpRight size={13} color="var(--text-3)" />
        </div>
      ))}
    </div>
  );
}
