"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "Is UniStocker really free to start?",
    a: "Yes. The Free Forever plan gives you up to 25 products, 2 staff accounts, and 1 branch with no card required and no expiry date. Upgrade only when you actually outgrow it.",
  },
  {
    q: "Does it work without an internet connection?",
    a: "UniStocker installs as a PWA on any phone or computer. You can keep recording sales and checking stock while offline — everything syncs automatically the moment you're back online.",
  },
  {
    q: "Can I manage more than one shop location?",
    a: "Yes. Business and Enterprise plans support multiple branches under one account, each with its own inventory, staff, and sales — while you still see everything from a single dashboard.",
  },
  {
    q: "How accurate is the AI demand forecasting?",
    a: "It analyses up to 90 days of your real sales history — weekday and weekend patterns, spikes, and burn rate — then gives you an exact reorder quantity, date, and a confidence score so you know how much to trust each prediction.",
  },
  {
    q: "Is my business data safe?",
    a: "Your data is encrypted in transit, access is controlled by role-based permissions, and every action is logged. We never sell your business data. See our Privacy Policy for the full details.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Subscriptions are billed securely through Paystack — cards, bank transfer, and USSD are all supported for Nigerian businesses.",
  },
  {
    q: "Can I cancel or change my plan anytime?",
    a: "Yes, there's no lock-in contract. Upgrade, downgrade, or cancel whenever you like from your billing settings — you'll keep access until the end of your current billing period.",
  },
  {
    q: "Do my staff need training to use it?",
    a: "No. The interface is built to be self-explanatory for anyone comfortable using a phone. Most teams are recording sales within minutes of getting their login.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="lp-faq-section">
      <div className="lp-faq-hd">
        <span className="lp-eyebrow">FAQ</span>
        <h2 className="lp-section-title">Questions, answered</h2>
        <p className="lp-section-sub-c">Everything you need to know before you get started.</p>
      </div>
      <div className="lp-faq-list">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className={`lp-faq-item ${isOpen ? "on" : ""}`}>
              <button
                type="button"
                className="lp-faq-q"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span>{item.q}</span>
                <Plus size={16} className="lp-faq-icon" />
              </button>
              <div className="lp-faq-a-wrap">
                <p className="lp-faq-a">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
