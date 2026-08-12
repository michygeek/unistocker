"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, X, Trash2, Loader2, ShoppingCart, Camera, ScanLine } from "lucide-react";
import { recordSale } from "@/lib/actions/sales";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/inventory/barcode-scanner";
import { SaleReceipt, type ReceiptData } from "@/components/sales/sale-receipt";
import { addOp } from "@/lib/offline-queue";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  quantity: number;
  piecesPerCarton: number | null;
}

interface CartItem extends Product {
  cartCartons: number;
  cartPieces: number;
}

function totalPieces(item: CartItem): number {
  if (item.piecesPerCarton) return item.cartCartons * item.piecesPerCarton + item.cartPieces;
  return item.cartPieces;
}

function stockLabel(p: Product): string {
  if (!p.piecesPerCarton) return `${p.quantity} in stock`;
  const ctns = Math.floor(p.quantity / p.piecesPerCarton);
  const pcs = p.quantity % p.piecesPerCarton;
  if (ctns === 0) return `${pcs} pcs`;
  if (pcs === 0) return `${ctns} ctn`;
  return `${ctns} ctn + ${pcs} pcs`;
}

interface Props {
  products: Product[];
  userName: string;
  organizationName: string;
}

export function NewSaleButton({ products, userName, organizationName }: Props) {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showFeedback = (text: string, ok: boolean) => {
    setScanFeedback({ text, ok });
    setTimeout(() => setScanFeedback(null), 2500);
  };

  const addToCart = useCallback((product: Product, fromScan = false) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => {
          if (i.id !== product.id) return i;
          if (i.piecesPerCarton) {
            const newCartons = i.cartCartons + 1;
            if (newCartons * i.piecesPerCarton > product.quantity) return i;
            return { ...i, cartCartons: newCartons };
          }
          if (i.cartPieces + 1 > product.quantity) return i;
          return { ...i, cartPieces: i.cartPieces + 1 };
        });
      }
      return [...prev, {
        ...product,
        cartCartons: product.piecesPerCarton ? 1 : 0,
        cartPieces: product.piecesPerCarton ? 0 : 1,
      }];
    });
    if (fromScan) showFeedback(`✓ Added: ${product.name}`, true);
  }, []);

  // Handles both physical scanner (barcode field + Enter) and camera scan
  const lookupAndAdd = useCallback((code: string) => {
    const q = code.trim();
    if (!q) return;
    const match = products.find(
      (p) => p.barcode === q || p.sku === q || p.sku.toLowerCase() === q.toLowerCase()
    );
    if (!match) {
      showFeedback(`No product for: ${q}`, false);
      return;
    }
    if (match.quantity === 0) {
      showFeedback(`"${match.name}" is out of stock`, false);
      return;
    }
    addToCart(match, true);
  }, [products, addToCart]);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupAndAdd(barcodeInput);
      setBarcodeInput("");
      barcodeRef.current?.focus();
    }
  };

  const handleCameraScan = (code: string) => {
    setScannerOpen(false);
    lookupAndAdd(code);
    barcodeRef.current?.focus();
  };

  const updateCartItem = (id: string, field: "cartCartons" | "cartPieces", val: number) => {
    if (val < 0) return;
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, [field]: val } : i));
  };

  const removeFromCart = (id: string) => setCart((p) => p.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.sellingPrice * totalPieces(i), 0);
  const taxAmt = subtotal * (tax / 100);
  const total = subtotal - discount + taxAmt;

  const handleSubmit = async () => {
    if (!cart.length) { setError("Cart is empty"); return; }
    const validItems = cart.filter((i) => totalPieces(i) > 0);
    if (!validItems.length) { setError("All cart items have 0 quantity"); return; }
    setLoading(true); setError("");

    const salePayload = {
      items: validItems.map((i) => ({ productId: i.id, quantity: totalPieces(i), unitPrice: i.sellingPrice })),
      discount, tax, notes,
    };

    // ── Offline path ──────────────────────────────────────────────────────
    if (!navigator.onLine) {
      await addOp({ type: "SALE", payload: salePayload });
      window.dispatchEvent(new CustomEvent("offline-queue-updated"));
      setLoading(false);

      const tempNumber = `PENDING-${Date.now().toString().slice(-6)}`;
      const receiptData: ReceiptData = {
        receiptNumber: tempNumber,
        createdAt: new Date(),
        cashierName: userName,
        organizationName,
        items: validItems.map((i) => ({
          name: i.name,
          quantity: totalPieces(i),
          unitPrice: i.sellingPrice,
          total: i.sellingPrice * totalPieces(i),
        })),
        subtotal,
        discount,
        taxAmount: taxAmt,
        total,
        notes: notes ? `${notes} [PENDING SYNC]` : "[PENDING SYNC — will confirm when online]",
      };
      setReceipt(receiptData);
      setCart([]); setDiscount(0); setTax(0); setNotes(""); setBarcodeInput(""); setProductFilter("");
      return;
    }

    // ── Online path ───────────────────────────────────────────────────────
    const result = await recordSale(salePayload);
    setLoading(false);

    if ("error" in result) {
      setError(typeof result.error === "string" ? result.error : "Failed to record sale");
      return;
    }

    const receiptData: ReceiptData = {
      receiptNumber: result.sale.receiptNumber,
      createdAt: new Date(),
      cashierName: userName,
      organizationName,
      items: validItems.map((i) => ({
        name: i.name,
        quantity: totalPieces(i),
        unitPrice: i.sellingPrice,
        total: i.sellingPrice * totalPieces(i),
      })),
      subtotal,
      discount,
      taxAmount: taxAmt,
      total,
      notes: notes || undefined,
    };

    setReceipt(receiptData);
    setCart([]); setDiscount(0); setTax(0); setNotes(""); setBarcodeInput(""); setProductFilter("");
    router.refresh();
  };

  const filteredProducts = productFilter
    ? products.filter((p) =>
        p.name.toLowerCase().includes(productFilter.toLowerCase()) ||
        p.sku.toLowerCase().includes(productFilter.toLowerCase())
      )
    : products;

  // Show receipt modal if sale just completed
  if (receipt) {
    return (
      <SaleReceipt
        receipt={receipt}
        onClose={() => { setReceipt(null); setOpen(false); }}
        onNewSale={() => { setReceipt(null); setOpen(true); setTimeout(() => barcodeRef.current?.focus(), 100); }}
      />
    );
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setTimeout(() => barcodeRef.current?.focus(), 100); }} className="uni-btn uni-btn-primary">
        <Plus size={16} /> New Sale
      </button>

      {scannerOpen && <BarcodeScanner onScan={handleCameraScan} onClose={() => setScannerOpen(false)} />}

      {open && (
        <div className="uni-overlay uni-overlay-sheet" style={{ alignItems: "flex-start", paddingTop: 32 }}>
          <div className="uni-overlay-backdrop" onClick={() => setOpen(false)} />
          <div className="uni-modal uni-modal-sheet animate-in" style={{ maxWidth: 820, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            {/* Header */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingCart size={16} style={{ color: "var(--accent)" }} /> New Sale
              </h2>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                <X size={20} />
              </button>
            </div>

            {/* Split body */}
            <div className="flex flex-col sm:flex-row" style={{ flex: 1, overflow: "hidden" }}>
              {/* ── Left: Products ── */}
              <div
                className="w-full sm:w-1/2 flex flex-col border-b sm:border-b-0 sm:border-r border-[var(--border)] max-h-[42vh] sm:max-h-none"
              >
                {/* Barcode / search input */}
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <ScanLine size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--accent)", pointerEvents: "none" }} />
                      <input
                        ref={barcodeRef}
                        value={barcodeInput}
                        onChange={(e) => {
                          setBarcodeInput(e.target.value);
                          setProductFilter(e.target.value);
                        }}
                        onKeyDown={handleBarcodeKeyDown}
                        placeholder="Scan barcode or search product…"
                        className="uni-input"
                        style={{ paddingLeft: 32, fontSize: 13 }}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="uni-btn uni-btn-ghost"
                      style={{ flexShrink: 0, paddingLeft: 12, paddingRight: 12, color: "var(--accent)", borderColor: "var(--accent-sub)" }}
                      title="Open camera scanner"
                    >
                      <Camera size={15} />
                    </button>
                  </div>
                  {scanFeedback && (
                    <p style={{
                      fontSize: 12, marginTop: 6, fontWeight: 600, padding: "5px 10px", borderRadius: 7,
                      color: scanFeedback.ok ? "var(--accent)" : "var(--danger)",
                      background: scanFeedback.ok ? "var(--accent-sub)" : "rgba(239,68,68,0.08)",
                    }}>
                      {scanFeedback.text}
                    </p>
                  )}
                </div>

                {/* Product list */}
                <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
                  {filteredProducts.length === 0 && (
                    <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", marginTop: 24 }}>No products found</p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        disabled={p.quantity === 0}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "9px 12px", borderRadius: 10,
                          border: "1px solid var(--border)", background: "transparent",
                          cursor: p.quantity === 0 ? "not-allowed" : "pointer",
                          opacity: p.quantity === 0 ? 0.45 : 1,
                          textAlign: "left", transition: "all 0.15s", width: "100%",
                          minWidth: 0,
                        }}
                        onMouseEnter={(e) => {
                          if (p.quantity > 0) {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-sub)";
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-glow)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                          <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.sku}{p.barcode ? ` · ${p.barcode}` : ""} · {stockLabel(p)}
                          </p>
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
              <div className="w-full sm:w-1/2 flex flex-col" style={{ minHeight: 0, flex: 1 }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-2)", marginBottom: 10 }}>
                    Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})
                  </p>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: "center", marginTop: 40 }}>
                      <ShoppingCart size={32} style={{ color: "var(--text-3)", opacity: 0.3, margin: "0 auto 8px" }} />
                      <p style={{ fontSize: 13, color: "var(--text-3)" }}>Scan or click a product</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {cart.map((item) => (
                        <div key={item.id} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: item.piecesPerCarton ? 8 : 0 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>₦{item.sellingPrice.toFixed(2)} / pc</p>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", width: 72, textAlign: "right" }}>
                              ₦{(item.sellingPrice * totalPieces(item)).toFixed(2)}
                            </span>
                            <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", display: "flex", padding: 2 }}>
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {item.piecesPerCarton ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                              <div>
                                <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 3 }}>Cartons ({item.piecesPerCarton} pcs)</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <QtyBtn onClick={() => updateCartItem(item.id, "cartCartons", item.cartCartons - 1)}>-</QtyBtn>
                                  <input type="number" value={item.cartCartons} min={0}
                                    onChange={(e) => updateCartItem(item.id, "cartCartons", Number(e.target.value))}
                                    style={{ width: 42, textAlign: "center", fontSize: 13, border: "1px solid var(--border)", borderRadius: 6, padding: "2px 4px", background: "var(--bg-card)", color: "var(--text)" }}
                                  />
                                  <QtyBtn onClick={() => updateCartItem(item.id, "cartCartons", item.cartCartons + 1)}>+</QtyBtn>
                                </div>
                              </div>
                              <div>
                                <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 3 }}>Loose Pieces</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <QtyBtn onClick={() => updateCartItem(item.id, "cartPieces", item.cartPieces - 1)}>-</QtyBtn>
                                  <input type="number" value={item.cartPieces} min={0}
                                    onChange={(e) => updateCartItem(item.id, "cartPieces", Number(e.target.value))}
                                    style={{ width: 42, textAlign: "center", fontSize: 13, border: "1px solid var(--border)", borderRadius: 6, padding: "2px 4px", background: "var(--bg-card)", color: "var(--text)" }}
                                  />
                                  <QtyBtn onClick={() => updateCartItem(item.id, "cartPieces", item.cartPieces + 1)}>+</QtyBtn>
                                </div>
                              </div>
                              <p style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--accent)", fontWeight: 600, margin: 0 }}>
                                = {totalPieces(item)} pcs
                              </p>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <label style={{ fontSize: 12, color: "var(--text-3)", marginRight: 4 }}>Qty:</label>
                              <QtyBtn onClick={() => updateCartItem(item.id, "cartPieces", item.cartPieces - 1)}>-</QtyBtn>
                              <input type="number" value={item.cartPieces} min={1} max={item.quantity}
                                onChange={(e) => updateCartItem(item.id, "cartPieces", Number(e.target.value))}
                                style={{ width: 44, textAlign: "center", fontSize: 13, border: "1px solid var(--border)", borderRadius: 6, padding: "2px 4px", background: "var(--bg-card)", color: "var(--text)" }}
                              />
                              <QtyBtn onClick={() => updateCartItem(item.id, "cartPieces", item.cartPieces + 1)}>+</QtyBtn>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals + checkout */}
                <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Discount (₦)</label>
                      <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min={0} className="uni-input" style={{ padding: "6px 10px", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Tax (%)</label>
                      <input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} min={0} max={100} className="uni-input" style={{ padding: "6px 10px", fontSize: 13 }} />
                    </div>
                  </div>

                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={1} className="uni-input" style={{ resize: "none", fontSize: 13 }} />

                  {/* Summary */}
                  <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-2)" }}>
                      <span>Subtotal</span><span>₦{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--danger)" }}>
                        <span>Discount</span><span>-₦{discount.toFixed(2)}</span>
                      </div>
                    )}
                    {taxAmt > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-2)" }}>
                        <span>Tax</span><span>+₦{taxAmt.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15, color: "var(--text)", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 2 }}>
                      <span>Total</span><span style={{ color: "var(--accent)" }}>₦{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {error && <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{error}</p>}

                  <button
                    onClick={handleSubmit}
                    disabled={loading || cart.length === 0}
                    className="uni-btn uni-btn-primary"
                    style={{ width: "100%", padding: "11px 16px", fontSize: 15 }}
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

function QtyBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)",
        background: "var(--bg-card)", color: "var(--text-2)", cursor: "pointer",
        fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
