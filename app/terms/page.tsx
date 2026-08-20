import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of UniStocker.",
};

const LAST_UPDATED = "19 August 2026";

export default function TermsPage() {
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
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of UniStocker&apos;s website
          and application (the &quot;Service&quot;), operated by UniStocker (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By creating an
          account or using the Service, you agree to be bound by these Terms. If you are using the
          Service on behalf of a business, you are agreeing on its behalf and confirming you have
          the authority to do so.
        </p>

        <h2>1. Your account</h2>
        <p>
          You must provide accurate information when creating an account and keep your login
          credentials confidential. You are responsible for all activity that happens under your
          account, including actions taken by staff accounts you create or invite. Notify us
          immediately at <a href="mailto:hello@unistocker.app">hello@unistocker.app</a> if you suspect
          unauthorised access.
        </p>

        <h2>2. Plans, billing, and payment</h2>
        <p>
          UniStocker offers a Free plan and paid subscription plans (Business and Enterprise) with
          the limits and features described on our pricing page. Paid subscriptions are billed in
          advance on a monthly or yearly basis and processed securely through Paystack. By
          subscribing to a paid plan, you authorise us to charge the applicable fees to your chosen
          payment method on a recurring basis until you cancel.
        </p>
        <p>
          Fees are non-refundable except where required by law. If a payment fails, we may suspend
          access to paid features until the balance is settled, while preserving your underlying
          data for a reasonable grace period.
        </p>

        <h2>3. Changes to plans and pricing</h2>
        <p>
          We may change our plans, features, or pricing from time to time. We will give you
          reasonable notice of material changes that affect a plan you are subscribed to. Continued
          use of the Service after a change takes effect constitutes acceptance of the change.
        </p>

        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation</li>
          <li>Attempt to gain unauthorised access to any part of the Service, other accounts, or our infrastructure</li>
          <li>Upload malicious code, or content that infringes another party&apos;s intellectual property or privacy rights</li>
          <li>Interfere with, disrupt, or place excessive load on the Service (for example, through automated scraping or abuse of the API)</li>
          <li>Resell, sublicense, or provide access to the Service to third parties outside your own organisation without our written consent</li>
        </ul>

        <h2>5. Your data and content</h2>
        <p>
          You retain ownership of all business data you input into UniStocker — products, sales,
          staff records, and any files you upload. You grant us a limited licence to host, process,
          and display this data solely to operate and improve the Service for you, including to
          generate AI-powered insights as described in our <Link href="/privacy">Privacy Policy</Link>.
          You are responsible for ensuring you have the right to upload any content (including
          product photos) you submit to the Service.
        </p>

        <h2>6. AI-generated content</h2>
        <p>
          Features such as demand forecasts, stock alerts, business insights, and AI-assisted
          product entry are generated automatically and are provided for informational and
          operational assistance only. They may occasionally be inaccurate or incomplete. You are
          responsible for reviewing AI-generated suggestions (including prices, reorder quantities,
          and product details) before relying on them for business decisions.
        </p>

        <h2>7. Availability and support</h2>
        <p>
          We aim to keep the Service available and reliable, including offline functionality via
          our Progressive Web App, but we do not guarantee uninterrupted or error-free operation.
          We may perform maintenance, and we may update or change features to improve the Service
          over time.
        </p>

        <h2>8. Suspension and termination</h2>
        <p>
          We may suspend or terminate your access to the Service if you breach these Terms, engage
          in fraudulent or abusive activity, or fail to pay applicable fees, after reasonable notice
          where practicable. You may cancel your account at any time from your billing settings or
          by contacting us; cancellation takes effect at the end of your current billing period.
        </p>

        <h2>9. Disclaimer of warranties</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind,
          whether express or implied, including — to the extent permitted by law — warranties of
          merchantability, fitness for a particular purpose, and non-infringement.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, UniStocker will not be liable for any indirect,
          incidental, special, or consequential damages, or for loss of profits, revenue, or
          business data, arising from your use of, or inability to use, the Service. Our total
          liability for any claim relating to the Service will not exceed the amount you paid us in
          the twelve months preceding the claim.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to
          its conflict of law principles. Any disputes arising from these Terms or your use of the
          Service will be subject to the exclusive jurisdiction of the courts of Nigeria.
        </p>

        <h2>12. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. If we make material changes, we will notify
          you by email or through a notice within the app before they take effect. Continued use of
          the Service after changes take effect constitutes acceptance of the updated Terms.
        </p>

        <h2>13. Contact us</h2>
        <p>
          If you have questions about these Terms, contact us at{" "}
          <a href="mailto:hello@unistocker.app">hello@unistocker.app</a>.
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
  .legal-main ul { margin: 0 0 18px; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
  .legal-main li { font-size: 15px; line-height: 1.7; color: var(--text-2); }
  .legal-main strong { color: var(--text); }
  .legal-main a { color: #0C973A; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
`;
