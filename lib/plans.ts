export type PlanType = "FREE" | "PRO" | "BUSINESS";

export interface PlanFeatures {
  products: number;             // max products (use Infinity for unlimited)
  staff: number;                // max staff accounts (including owner)
  branches: number;             // max branch locations
  ai: boolean;                  // AI features (forecasting, alerts, insights, weekly summaries)
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
  price: number;        // monthly price in ₦
  priceLabel: string;
  tagline: string;
  color: string;
  features: PlanFeatures;
  highlights: string[]; // bullet points shown in the plan card
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  FREE: {
    products: 10,
    staff: 1,
    branches: 1,
    ai: false,
    export: false,
    auditLogs: false,
    advancedReports: false,
    photoImport: false,
    multiLocationReports: false,
    trialDays: 0,
  },
  PRO: {
    products: 500,
    staff: 5,
    branches: 5,
    ai: true,
    export: true,
    auditLogs: false,
    advancedReports: true,
    photoImport: true,
    multiLocationReports: false,
    trialDays: 30,
  },
  BUSINESS: {
    products: Infinity,
    staff: 50,
    branches: 50,
    ai: true,
    export: true,
    auditLogs: true,
    advancedReports: true,
    photoImport: true,
    multiLocationReports: true,
    trialDays: 30,
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
      "Up to 10 products",
      "1 staff account (owner only)",
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
    id: "PRO",
    name: "Pro",
    price: 2999,
    priceLabel: "₦2,999",
    tagline: "For growing businesses with a team",
    color: "#0D9488",
    features: PLAN_FEATURES.PRO,
    highlights: [
      "Up to 500 products",
      "5 staff accounts (owner + 4 team members)",
      "Up to 5 branch locations",
      "Everything in Free",
      "Full inventory management & bulk operations",
      "Date-range sales & inventory reports",
      "Export reports to CSV / Excel",
      "AI demand forecasting — predict restocks before you run out",
      "Smart stock alerts — AI-powered critical stock warnings",
      "Business insights — chat with your data using AI",
      "Weekly AI-generated business performance summaries",
      "Push & email notifications for sales and stock events",
      "Product photo import from camera",
      "All staff can see their branch's full sales history",
      "30-day free trial, no card required",
    ],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: 6999,
    priceLabel: "₦6,999",
    tagline: "For large operations with multiple locations",
    color: "#7c3aed",
    features: PLAN_FEATURES.BUSINESS,
    highlights: [
      "Unlimited products",
      "Up to 50 staff accounts",
      "Up to 50 branch locations",
      "Everything in Pro",
      "Advanced AI analysis across all branches",
      "Multi-location analytics — compare branches side-by-side",
      "Full activity & audit logs — see every action by every user",
      "Cross-branch inventory visibility from one dashboard",
      "Per-branch performance reports with date ranges",
      "Priority support",
      "30-day free trial, no card required",
    ],
  },
];

export function getPlanById(id: PlanType): PlanInfo {
  return PLANS.find((p) => p.id === id)!;
}

export const PLAN_BADGE: Record<PlanType, { label: string; bg: string; color: string }> = {
  FREE:     { label: "FREE",     bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  PRO:      { label: "PRO",      bg: "rgba(13,148,136,0.20)",  color: "#0D9488" },
  BUSINESS: { label: "BUSINESS", bg: "rgba(124,58,237,0.20)",  color: "#a78bfa" },
};
