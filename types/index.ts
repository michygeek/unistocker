import { UserRole, TransactionType, NotificationChannel, NotificationStatus } from "@prisma/client";

export type { UserRole, TransactionType, NotificationChannel, NotificationStatus };

export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
  image?: string | null;
  branchId?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
}

export interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  lowStockCount: number;
  recentActivity: ActivityLogItem[];
}

export interface ActivityLogItem {
  id: string;
  action: string;
  entity: string;
  description: string;
  createdAt: Date;
  user: { name: string | null; email: string };
}

export interface ProductWithCategory {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockAlert: number;
  imageUrl: string | null;
  barcode: string | null;
  isActive: boolean;
  category: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  createdBy: { name: string | null; email: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleWithItems {
  id: string;
  receiptNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  notes: string | null;
  createdAt: Date;
  user: { name: string | null; email: string };
  branch: { name: string } | null;
  saleItems: SaleItemDetail[];
}

export interface SaleItemDetail {
  id: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
  product: { name: string; sku: string };
}

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: string;
  channel?: NotificationChannel;
  metadata?: Record<string, unknown>;
  sentById?: string;
}

export interface QueueJobData {
  type: "NOTIFICATION" | "ACTIVITY_LOG" | "LOW_STOCK_CHECK";
  payload: Record<string, unknown>;
}

export type Permission =
  | "products:read"
  | "products:write"
  | "products:delete"
  | "sales:read"
  | "sales:write"
  | "staff:read"
  | "staff:write"
  | "staff:delete"
  | "reports:read"
  | "settings:write"
  | "logs:read";
