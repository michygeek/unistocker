"use client";

import { useState } from "react";
import { Plus, X, Trash2, Loader2, ShoppingCart, Camera } from "lucide-react";
import { recordSale } from "@/lib/actions/sales";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/inventory/barcode-scanner";

interface Product { id: string; name: string; sku: string; barcode: string | null; sellingPrice: number; quantity: number; }
interface CartItem extends Product { cartQty: number; }

export function NewSaleButton({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const router = useRouter();

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, cartQty: i.cartQty + 1 } : i);
      return [...prev, { ...product, cartQty: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { setCart((p) => p.filter((i) => i.id !== id)); return; }
    setCart((p) => p.map((i) => i.id === id ? { ...i, cartQty: qty } : i));
  };

  const handleScan = (code: string) => {
    setScannerOpen(false);
    const match = products.find((p) => p.barcode === code || p.sku === code);
    if (!match) {
      setScanError(`No product found for: ${code}`);
      setTimeout(() => setScanError(""), 3000);
      return;
    }
    if (match.quantity === 0) {
      setScanError(`"${match.name}" is out of stock`);
      setTimeout(() => setScanError(""), 3000);
      return;
    }
    setScanError("");
    addToCart(match);
  };

  const subtotal = cart.reduce((s, i) => s + i.sellingPrice * i.cartQty, 0);
  const taxAmt = subtotal * (tax / 100);
  const total = subtotal - discount + taxAmt;

  const handleSubmit = async () => {
    if (!cart.length) { setError("Cart is empty"); return; }
    setLoading(true); setError("");
    const result = await recordSale({
      items: cart.map((i) => ({ productId: i.id, quantity: i.cartQty, unitPrice: i.sellingPrice })),
      discount, tax, notes,
    });
    setLoading(false);
    if ("error" in result) {
      setError(typeof result.error === "string" ? result.error : "Failed to record sale");
    } else {
      setCart([]); setDiscount(0); setTax(0); setNotes(""); setOpen(false); router.refresh();
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="uni-btn uni-btn-primary">
        <Plus size={16} /> New Sale
      </button>

      {scannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />}

      {open && (
        <div className="uni-overlay" style={{ alignItems: "flex-start", paddingTop: 32 }}>
          <div className="uni-overlay-backdrop" onClick={() => setOpen(false)} />
          <div className="uni-modal" style={{ maxWidth: 780, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            {/* Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingCart size={16} style={{ color: "var(--accent)" }} /> New Sale
              </h2>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                <X size={20} />
              </button>
            </div>

            {/* Split body */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* ── Left: Products ── */}
              <div style={{ width: "50%", borderRight: "1px solid var(--border)", overflowY: "auto" }}>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-2)" }}>
                      Products
                    </p>
                    <button
                      type="button" onClick={() => setScannerOpen(true)}
                      style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}
                    >
                      <Camera size={13} /> Scan
                    </button>
                  </div>
                  {scanError && (
                    <p style={{ fontSize: 12, color: "var(--danger)", padding: "6px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 8, marginBottom: 10 }}>
                      {scanError}
                    </p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        disabled={p.quantity === 0}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 12px", borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          cursor: p.quantity === 0 ? "not-allowed" : "pointer",
                          opacity: p.quantity === 0 ? 0.45 : 1,
                          textAlign: "left", transition: "all 0.15s",
                          width: "100%",
                        }}
                        onMouseEnter={(e) => { if (p.quantity > 0) { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-sub)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-glow)"; } }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                          <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{p.sku} · {p.quantity} in stock</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginLeft: 8, flexShrink: 0 }}>
                          ₦{p.sellingPrice.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right: Cart ── */}
              <div style={{ width: "50%", display: "flex", flexDirection: "column" }}>
                {/* Cart items */}
                <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-2)", marginBottom: 12 }}>
                    Cart ({cart.length} items)
                  </p>
                  {cart.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", marginTop: 32 }}>Add items from the left</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {cart.map((item) => (
                        <div key={item.id} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "10px 12px", borderRadius: 10,
                          background: "var(--bg-input)", border: "1px solid var(--border)",
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>₦{item.sellingPrice.toFixed(2)} each</p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button
                              onClick={() => updateQty(item.id, item.cartQty - 1)}
                              style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-2)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >-</button>
                            <input
                              type="number" value={item.cartQty}
                              onChange={(e) => updateQty(item.id, Number(e.target.value))}
                              style={{ width: 44, textAlign: "center", fontSize: 12, border: "1px solid var(--border)", borderRadius: 6, padding: "2px 4px", background: "var(--bg-card)", color: "var(--text)" }}
                              min={1} max={item.quantity}
                            />
                            <button
                              onClick={() => updateQty(item.id, item.cartQty + 1)}
                              style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-2)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >+</button>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", width: 64, textAlign: "right" }}>
                            ₦{(item.sellingPrice * item.cartQty).toFixed(2)}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 0)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", display: "flex" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals + checkout */}
                <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Discount (₦)</label>
                      <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min={0} className="uni-input" style={{ padding: "6px 10px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Tax (%)</label>
                      <input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} min={0} max={100} className="uni-input" style={{ padding: "6px 10px" }} />
                    </div>
                  </div>

                  <textarea
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)" rows={1}
                    className="uni-input" style={{ resize: "none" }}
                  />

                  {/* Order summary */}
                  <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}>
                      <span>Subtotal</span><span>₦{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--danger)" }}>
                        <span>Discount</span><span>-₦{discount.toFixed(2)}</span>
                      </div>
                    )}
                    {taxAmt > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)" }}>
                        <span>Tax</span><span>+₦{taxAmt.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14, color: "var(--text)", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 2 }}>
                      <span>Total</span><span style={{ color: "var(--accent)" }}>₦{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {error && <p style={{ fontSize: 12, color: "var(--danger)" }}>{error}</p>}

                  <button
                    onClick={handleSubmit}
                    disabled={loading || cart.length === 0}
                    className="uni-btn uni-btn-primary"
                    style={{ width: "100%", padding: "10px 16px", fontSize: 14 }}
                  >
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Processing…</>
                      : `Complete Sale · ₦${total.toFixed(2)}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
