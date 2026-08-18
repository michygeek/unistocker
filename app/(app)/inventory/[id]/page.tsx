import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ForecastCard } from "@/components/ai/forecast-card";
import { format, differenceInDays } from "date-fns";
import { Package, Tag, Barcode, ArrowLeft, Plus, Minus, RefreshCw, TrendingDown, TrendingUp, Clock, AlertTriangle, CalendarClock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product?.name ?? "Product" };
}

const TX_ICON: Record<string, React.ReactNode> = {
  STOCK_IN:   <Plus size={13} />,
  STOCK_OUT:  <Minus size={13} />,
  ADJUSTMENT: <RefreshCw size={13} />,
  RETURN:     <TrendingUp size={13} />,
  SALE:       <TrendingDown size={13} />,
};

const TX_STYLE: Record<string, { bg: string; color: string }> = {
  STOCK_IN:   { bg: "var(--accent-sub)",       color: "var(--accent)" },
  STOCK_OUT:  { bg: "rgba(251,146,60,0.10)",  color: "#fb923c"       },
  ADJUSTMENT: { bg: "rgba(59,130,246,0.10)",  color: "var(--info)"   },
  RETURN:     { bg: "rgba(168,85,247,0.10)",  color: "#c084fc"       },
  SALE:       { bg: "rgba(239,68,68,0.10)",   color: "var(--danger)" },
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;

  const [product, transactions, unreadCount, stockPrediction, latestForecast] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        createdBy: { select: { name: true, email: true } },
      },
    }),
    db.inventoryTransaction.findMany({
      where: { productId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({ where: { userId: session.user.id, readAt: null, status: "SENT" } }),
    db.stockPrediction.findUnique({ where: { productId: id } }),
    db.demandForecast.findFirst({ where: { productId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!product || (product.organizationId ?? "none") !== (session.user.organizationId ?? "none")) notFound();

  const costPrice = Number(product.costPrice);
  const sellingPrice = Number(product.sellingPrice);
  const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
  const isLowStock = product.quantity <= product.lowStockAlert;
  const canEdit = session.user.role === "BOSS" || session.user.role === "MANAGER";

  const ppc = product.piecesPerCarton;
  const cartons = ppc && ppc > 0 ? Math.floor(product.quantity / ppc) : null;
  const loosePieces = ppc && ppc > 0 ? product.quantity % ppc : null;
  const qtyDisplay = ppc && ppc > 0
    ? (cartons === 0 ? `${loosePieces} pcs` : loosePieces === 0 ? `${cartons} ctn` : `${cartons} ctn + ${loosePieces} pcs`)
    : `${product.quantity} units`;

  const expiryDays = product.expirationDate ? differenceInDays(new Date(product.expirationDate), new Date()) : null;
  const expiryColor = expiryDays === null ? null : expiryDays <= 0 ? "var(--danger)" : expiryDays <= 30 ? "var(--danger)" : expiryDays <= 60 ? "var(--warning)" : "var(--accent)";

  const serialisedForecast = latestForecast ? {
    id: latestForecast.id,
    next7Days: latestForecast.next7Days,
    next14Days: latestForecast.next14Days,
    next30Days: latestForecast.next30Days,
    reorderQty: latestForecast.reorderQty,
    reorderByDate: latestForecast.reorderByDate.toISOString(),
    confidence: latestForecast.confidence,
    reasoning: latestForecast.reasoning,
    createdAt: latestForecast.createdAt.toISOString(),
  } : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Header title="Product Details" unreadCount={unreadCount} />
      <div className="animate-in" style={{ flex: 1, padding: "24px", maxWidth: 900, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Back + actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <Link href="/inventory" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to Inventory
          </Link>
          {canEdit && (
            <Link href={`/inventory/${id}/edit`} className="uni-btn uni-btn-primary">
              Edit Product
            </Link>
          )}
        </div>

        {/* Main card */}
        <div className="uni-card" style={{ overflow: "hidden" }}>
          {/* Product info */}
          <div style={{ display: "flex", gap: 20, padding: 20, flexWrap: "wrap" }}>
            {/* Image */}
            <div style={{ flexShrink: 0 }}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} style={{ width: 120, height: 120, borderRadius: 16, objectFit: "cover", border: "1px solid var(--border)" }} />
              ) : (
                <div style={{ width: 120, height: 120, borderRadius: 16, background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                  <Package size={36} style={{ color: "var(--text-3)" }} />
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>{product.name}</h1>
                  <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-3)", marginTop: 4 }}>SKU: {product.sku}</p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                  background: product.isActive ? "var(--accent-sub)" : "var(--bg-input)",
                  color: product.isActive ? "var(--accent)" : "var(--text-3)",
                }}>
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {product.description && (
                <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12 }}>{product.description}</p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {product.category && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "var(--accent-sub)", color: "var(--accent)" }}>
                    <Tag size={11} /> {product.category.name}
                  </span>
                )}
                {product.barcode && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "monospace", padding: "4px 10px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                    <Barcode size={11} /> {product.barcode}
                  </span>
                )}
                {product.branch && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "rgba(168,85,247,0.10)", color: "#c084fc" }}>
                    {product.branch.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--border)" }}>
            {[
              { label: "Cost Price",    value: `₦${costPrice.toFixed(2)}`,   color: "var(--text)" },
              { label: "Selling Price", value: `₦${sellingPrice.toFixed(2)}`, color: "var(--accent)" },
              { label: "Margin",        value: `${margin.toFixed(1)}%`,       color: "#34d399" },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "16px 20px", borderRight: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{stat.label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
            {/* Dynamic stock status */}
            <div style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>In Stock</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: isLowStock ? "var(--danger)" : "var(--text)" }}>{qtyDisplay}</p>
              {ppc && ppc > 0 && (
                <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{product.quantity} pieces total</p>
              )}
              {stockPrediction ? (
                <p style={{ fontSize: 12, marginTop: 2, fontWeight: 600, color:
                  stockPrediction.urgencyLevel === "CRITICAL" ? "var(--danger)" :
                  stockPrediction.urgencyLevel === "WARNING" ? "var(--warning)" :
                  stockPrediction.urgencyLevel === "WATCH" ? "var(--info)" : "var(--accent)" }}>
                  <Clock style={{ display: "inline", width: 10, height: 10, marginRight: 3 }} />
                  Runs out in {Math.round(stockPrediction.daysUntilStockout)} days
                </p>
              ) : isLowStock ? (
                <p style={{ fontSize: 12, color: "var(--warning)", marginTop: 2 }}>Below threshold</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Expiry alert banner */}
        {expiryDays !== null && expiryDays <= 60 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
            borderRadius: 12, border: `1px solid ${expiryColor}`,
            background: expiryDays <= 30 ? "rgba(239,68,68,0.07)" : "rgba(245,158,11,0.07)",
          }}>
            <AlertTriangle size={20} style={{ color: expiryColor!, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: expiryColor!, margin: 0 }}>
                {expiryDays <= 0 ? "This product has expired!" : expiryDays <= 30 ? `Expires in ${expiryDays} day${expiryDays !== 1 ? "s" : ""}` : `Expires in ${expiryDays} days`}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
                Expiration date: {format(new Date(product.expirationDate!), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        )}

        {/* Meta details */}
        <div className="uni-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { label: "Low Stock Alert", value: `${product.lowStockAlert} units` },
              ...(ppc ? [{ label: "Pieces per Carton", value: `${ppc} pieces` }] : []),
              ...(product.expirationDate ? [{
                label: "Expiration Date",
                value: format(new Date(product.expirationDate), "MMM d, yyyy"),
                highlight: expiryDays !== null && expiryDays <= 60,
                color: expiryColor ?? undefined,
              }] : []),
              { label: "Created By", value: product.createdBy.name ?? product.createdBy.email },
              { label: "Created", value: format(new Date(product.createdAt), "MMM d, yyyy") },
              { label: "Last Updated", value: format(new Date(product.updatedAt), "MMM d, yyyy") },
            ].map(({ label, value, highlight, color }) => (
              <div key={label} style={{ padding: "10px 14px", background: highlight ? `${color}10` : "var(--bg-input)", borderRadius: 10, border: `1px solid ${highlight ? color : "var(--border)"}` }}>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {highlight && <CalendarClock size={13} style={{ color }} />}
                  <p style={{ fontSize: 14, fontWeight: 600, color: highlight ? color : "var(--text)" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Forecast */}
        <ForecastCard productId={id} initialForecast={serialisedForecast} />

        {/* Stock history */}
        <div className="uni-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Stock History</h2>
          </div>
          {transactions.length === 0 ? (
            <p style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>No transactions recorded yet.</p>
          ) : (
            <div>
              {transactions.map((tx, i) => {
                const ts = TX_STYLE[tx.type] ?? { bg: "var(--bg-input)", color: "var(--text-2)" };
                const isPositive = ["STOCK_IN", "RETURN"].includes(tx.type);
                return (
                  <div key={tx.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px",
                    borderBottom: i < transactions.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: ts.bg, color: ts.color,
                    }}>
                      {TX_ICON[tx.type] ?? <RefreshCw size={13} />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{tx.type.replace("_", " ")}</p>
                      {tx.notes && <p style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.notes}</p>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: isPositive ? "var(--accent)" : "var(--danger)" }}>
                        {isPositive ? "+" : "-"}{tx.quantity}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-3)" }}>{tx.user.name ?? tx.user.email}</p>
                      <p style={{ fontSize: 11, color: "var(--text-3)" }}>{format(new Date(tx.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
