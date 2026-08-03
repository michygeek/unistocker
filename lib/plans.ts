export type PlanType = "FREE" | "BUSINESS" | "ENTERPRISE";

export interface PlanFeatures {
  products: number;             // max products (use Infinity for unlimited)
  staff: number;                // max staff accounts (including owner)
  branches: number;             // max branch locations
  ai: boolean;                  // AI features (forecasting, alerts, insights, weekly summaries)
  aiRequestsPerDay: number | null; // interactive AI request cap per org/day (null = unlimited/custom)
  export: boolean;              // export reports to CSV/Excel
  auditLogs: boolean;           // activity & audit log access
  advancedReports: boolean;     // date-range picker in reports
  photoImport: boolean;         // product photo import from camera
  multiLocationReports: boolean; // cross-branch analytics
  trialDays: number;            // free trial length (0 = no trial)
}

interface PlanInfo {
  id: PlanType;
  name: string;
  price: number;        // monthly price in ₦ (0 for custom-priced plans)
  priceLabel: string;
  tagline: string;
  color: string;
  features: PlanFeatures;
  highlights: string[]; // bullet points shown in the plan card
  contactHref?: string; // present only on plans without self-serve checkout
}

export const YEARLY_DISCOUNT_PCT = 12;

export function yearlyPriceKobo(monthlyKobo: number): number {
  return Math.round(monthlyKobo * 12 * (1 - YEARLY_DISCOUNT_PCT / 100));
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  FREE: {
    products: 25,
    staff: 2,
    branches: 1,
    ai: false,
    aiRequestsPerDay: 0,
    export: false,
    auditLogs: false,
    advancedReports: false,
    photoImport: false,
    multiLocationReports: false,
    trialDays: 0,
  },
  BUSINESS: {
    products: 1000,
    staff: 10,
    branches: 10,
    ai: true,
    aiRequestsPerDay: 1,
    export: true,
    auditLogs: false,
    advancedReports: true,
    photoImport: true,
    multiLocationReports: false,
    trialDays: 0,
  },
  ENTERPRISE: {
    products: Infinity,
    staff: Infinity,
    branches: Infinity,
    ai: true,
    aiRequestsPerDay: null,
    export: true,
    auditLogs: true,
    advancedReports: true,
    photoImport: true,
    multiLocationReports: true,
    trialDays: 0,
  },
};

export const PLANS: PlanInfo[] = [
  {
    id: "FREE",
    name: "Free Forever",
    price: 0,
    priceLabel: "₦0",
    tagline: "Get started at no cost, forever",
    color: "#64748b",
    features: PLAN_FEATURES.FREE,
    highlights: [
      "Up to 25 products",
      "2 staff accounts (1 owner + 1 team member)",
      "1 branch location",
      "Add & manage products with categories",
      "Manual stock adjustments (in/out)",
      "Barcode scanning for quick sales",
      "Sales recording with receipt generation",
      "Print & share receipts (WhatsApp/image)",
      "Basic 7-day sales overview on dashboard",
      "Low stock alerts on dashboard",
      "PWA — works on mobile, installable",
    ],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: 4999,
    priceLabel: "₦4,999",
    tagline: "Everything a growing shop needs, in one plan",
    color: "#7c3aed",
    features: PLAN_FEATURES.BUSINESS,
    highlights: [
      "Up to 1,000 products",
      "Up to 10 staff accounts",
      "Up to 10 branch locations",
      "Everything in Free, plus:",
      "Full inventory management & bulk operations",
      "Date-range sales & inventory reports",
      "Export reports to CSV/Excel",
      "AI demand forecasting — predict restocks before you run out",
      "Smart stock alerts — AI-powered critical stock warnings",
      "Business insights — chat with your data using AI",
      "Weekly AI-generated business performance summaries",
      "Push & email notifications for sales and stock events",
      "Product photo import from camera",
      "All staff can see their branch's full sales history",
      "AI usage: 1 request/day, primary account only",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 0,
    priceLabel: "Custom",
    tagline: "For operations that have outgrown a self-serve plan",
    color: "#f59e0b",
    features: PLAN_FEATURES.ENTERPRISE,
    contactHref: "mailto:balogunmikes@gmail.com?subject=UniStocker%20Enterprise%20Inquiry",
    highlights: [
      "Unlimited products, staff accounts, and branch locations",
      "Advanced AI analysis across all branches",
      "Multi-location analytics — compare branches side-by-side",
      "Full activity & audit logs — see every action by every user",
      "Cross-branch inventory visibility from one dashboard",
      "Per-branch performance reports with date ranges",
      "Custom AI usage volume, scoped to your actual needs",
      "Priority support & dedicated onboarding",
      "Custom integrations available on request",
    ],
  },
];

export function getPlanById(id: PlanType): PlanInfo {
  return PLANS.find((p) => p.id === id)!;
}

export const PLAN_BADGE: Record<PlanType, { label: string; bg: string; color: string }> = {
  FREE:       { label: "FREE",       bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  BUSINESS:   { label: "BUSINESS",   bg: "rgba(124,58,237,0.20)",  color: "#a78bfa" },
  ENTERPRISE: { label: "ENTERPRISE", bg: "rgba(245,158,11,0.20)",  color: "#f59e0b" },
};
