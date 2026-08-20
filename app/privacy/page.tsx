import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How UniStocker collects, uses, and protects your data.",
};

const LAST_UPDATED = "19 August 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="legal">
      <style>{LEGAL_CSS}</style>
      <header className="legal-nav">
        <Link href="/" className="legal-back"><ArrowLeft size={15} /> Back to home</Link>
        <Link href="/" className="legal-logo">
          <div className="legal-logo-box">
            <Image src="/Uniwhite.png" alt="UniStocker" width={16} height={16} style={{ objectFit: "contain" }} />
          </div>
          <span>UniStocker</span>
        </Link>
      </header>

      <main className="legal-main">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        <p>
          UniStocker (&quot;UniStocker&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides inventory and sales
          management software for small and medium businesses. This Privacy Policy explains what
          information we collect when you use our website and application (the &quot;Service&quot;), how we
          use it, and the choices you have. By using UniStocker, you agree to the collection and use
          of information in accordance with this policy.
        </p>

        <h2>1. Information we collect</h2>
        <h3>1.1 Account information</h3>
        <p>
          When you register, we collect your name, email address, business name, and password
          (stored as a salted hash — we never store your password in plain text). If you invite
          staff, we also collect the account details you provide for them.
        </p>
        <h3>1.2 Business data</h3>
        <p>
          To provide the Service, we store the data you enter or generate while using UniStocker:
          products, stock levels, prices, sales and receipts, branches, staff activity logs, and
          any notes or images you upload (for example, product photos used for AI-assisted product
          entry).
        </p>
        <h3>1.3 Payment information</h3>
        <p>
          Paid subscriptions are processed by our payment partner, Paystack. UniStocker does not
          collect or store your full card details — Paystack handles payment collection directly
          and shares with us only what is necessary to activate and manage your subscription (for
          example, plan, status, and transaction reference).
        </p>
        <h3>1.4 Device and usage information</h3>
        <p>
          We automatically collect limited technical information such as browser type, device
          type, IP address, and pages visited, to keep the Service secure and to understand how it
          is used. If you enable push notifications, we store a device token (via Firebase Cloud
          Messaging) so we can deliver alerts to your device.
        </p>

        <h2>2. How we use your information</h2>
        <ul>
          <li>To create and maintain your account and business workspace</li>
          <li>To operate core features — inventory tracking, sales recording, reporting, and staff roles</li>
          <li>To send transactional emails (verification, password reset, low-stock and sales alerts) via our email provider, Resend</li>
          <li>To send push notifications you have opted into</li>
          <li>To generate AI-powered insights, forecasts, and photo-based product entry from the business data and images you provide</li>
          <li>To process subscription payments and manage billing</li>
          <li>To detect, investigate, and prevent fraud, abuse, or security incidents</li>
          <li>To improve and maintain the reliability of the Service</li>
        </ul>

        <h2>3. AI features and your data</h2>
        <p>
          Certain features (demand forecasting, smart stock alerts, the business assistant chat,
          and photo product entry) send relevant business data or images you provide to a
          third-party AI model provider in order to generate a response. We do not use your
          business data to train third-party foundation models, and we only send the minimum data
          needed to produce the requested insight.
        </p>

        <h2>4. Sharing your information</h2>
        <p>We do not sell your personal or business data. We share information only with:</p>
        <ul>
          <li><strong>Service providers</strong> who help us run UniStocker — including Paystack (payments), Resend (transactional email), Firebase (push notifications), and our hosting and database infrastructure providers — under obligations to protect your data.</li>
          <li><strong>Other members of your organisation</strong>, according to the role and permissions assigned to them (for example, an owner can see data a staff account cannot).</li>
          <li><strong>Legal authorities</strong>, where required by law, court order, or to protect the rights, property, or safety of UniStocker, our users, or others.</li>
        </ul>

        <h2>5. Data retention</h2>
        <p>
          We retain your account and business data for as long as your account is active. If you
          close your account, we will delete or anonymise your personal data within a reasonable
          period, except where we are required to retain records for legal, tax, or fraud-prevention
          purposes.
        </p>

        <h2>6. Data security</h2>
        <p>
          We use industry-standard measures to protect your data, including encrypted connections
          (HTTPS/TLS) in transit, hashed passwords, and role-based access controls that limit what
          staff accounts can see and do. No method of storage or transmission is 100% secure, but we
          work to continuously improve our safeguards.
        </p>

        <h2>7. Your rights and choices</h2>
        <ul>
          <li>You can access, correct, or export most of your business data directly within the app.</li>
          <li>You can request deletion of your account and associated personal data by contacting us.</li>
          <li>You can opt out of push notifications at any time from your device or notification settings.</li>
          <li>You can ask us what personal data we hold about you and request a copy.</li>
        </ul>

        <h2>8. Cookies and local storage</h2>
        <p>
          We use cookies and browser local storage for essential purposes only — keeping you
          signed in, remembering your theme preference, and enabling offline functionality (the
          Service can be installed as a Progressive Web App and works without an active internet
          connection). We do not use third-party advertising trackers.
        </p>

        <h2>9. Children&apos;s privacy</h2>
        <p>
          UniStocker is a business tool and is not directed at, or intended for use by, children.
          We do not knowingly collect personal information from anyone under the age of 18.
        </p>

        <h2>10. International data transfer</h2>
        <p>
          UniStocker is built for businesses in Nigeria and across Africa. Your data may be
          processed or stored on servers located outside your country by our infrastructure and
          service providers, who are contractually required to protect it consistently with this
          policy.
        </p>

        <h2>11. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will
          notify you by email or through a notice within the app. The &quot;Last updated&quot; date at the
          top of this page reflects the most recent revision.
        </p>

        <h2>12. Contact us</h2>
        <p>
          If you have questions about this Privacy Policy or how your data is handled, contact us
          at <a href="mailto:hello@unistocker.app">hello@unistocker.app</a>.
        </p>
      </main>
    </div>
  );
}

const LEGAL_CSS = `
  .legal { min-height: 100vh; background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; }
  .legal-nav {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 28px; border-bottom: 1px solid var(--border);
    background: var(--bg); backdrop-filter: blur(12px);
  }
  .legal-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; color: var(--text-2); }
  .legal-back:hover { color: var(--text); }
  .legal-logo { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; color: var(--text); letter-spacing: -0.02em; }
  .legal-logo-box { width: 26px; height: 26px; border-radius: 8px; background: #0C973A; display: flex; align-items: center; justify-content: center; }
  .legal-main { max-width: 760px; margin: 0 auto; padding: 56px 28px 100px; }
  .legal-main h1 { font-size: clamp(30px, 4vw, 42px); font-weight: 900; letter-spacing: -0.03em; margin-bottom: 6px; }
  .legal-updated { font-size: 13px; color: var(--text-3); margin-bottom: 36px; }
  .legal-main p { font-size: 15px; line-height: 1.75; color: var(--text-2); margin-bottom: 18px; }
  .legal-main h2 { font-size: 20px; font-weight: 800; letter-spacing: -0.015em; color: var(--text); margin: 40px 0 14px; }
  .legal-main h3 { font-size: 15.5px; font-weight: 700; color: var(--text); margin: 22px 0 8px; }
  .legal-main ul { margin: 0 0 18px; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
  .legal-main li { font-size: 15px; line-height: 1.7; color: var(--text-2); }
  .legal-main strong { color: var(--text); }
  .legal-main a { color: #0C973A; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
`;
