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
    const match = products.find(
      (p) => p.barcode === code || p.sku === code
    );
    if (!match) {
      setScanError(`No product found for code: ${code}`);
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
  const discountAmt = discount;
  const taxAmt = subtotal * (tax / 100);
  const total = subtotal - discountAmt + taxAmt;

  const handleSubmit = async () => {
    if (!cart.length) { setError("Cart is empty"); return; }
    setLoading(true);
    setError("");

    const result = await recordSale({
      items: cart.map((i) => ({ productId: i.id, quantity: i.cartQty, unitPrice: i.sellingPrice })),
      discount: discountAmt,
      tax,
      notes,
    });

    setLoading(false);
    if ("error" in result) {
      setError(typeof result.error === "string" ? result.error : "Failed to record sale");
    } else {
      setCart([]);
      setDiscount(0);
      setTax(0);
      setNotes("");
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
      >
        <Plus size={18} /> New Sale
      </button>

      {scannerOpen && (
        <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden z-10 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart size={18} /> New Sale
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Products */}
              <div className="w-1/2 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Products</p>
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition font-medium"
                    >
                      <Camera size={13} /> Scan barcode
                    </button>
                  </div>
                  {scanError && (
                    <p className="text-xs text-red-500 mb-2 bg-red-50 dark:bg-red-900/20 px-2 py-1.5 rounded-lg">{scanError}</p>
                  )}
                  <div className="space-y-1.5">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        disabled={p.quantity === 0}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition disabled:opacity-40 disabled:cursor-not-allowed text-left border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sku} · {p.quantity} in stock</p>
                        </div>
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 ml-2">
                          ₦{p.sellingPrice.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart */}
              <div className="w-1/2 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Cart</p>
                  {cart.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center mt-8">Add items from the left</p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">₦{item.sellingPrice.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQty(item.id, item.cartQty - 1)}
                              className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >-</button>
                            <input
                              type="number"
                              value={item.cartQty}
                              onChange={(e) => updateQty(item.id, Number(e.target.value))}
                              className="w-12 text-center text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-0.5 bg-white dark:bg-gray-900"
                              min={1}
                              max={item.quantity}
                            />
                            <button
                              onClick={() => updateQty(item.id, item.cartQty + 1)}
                              className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >+</button>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white w-16 text-right">
                            ₦{(item.sellingPrice * item.cartQty).toFixed(2)}
                          </span>
                          <button onClick={() => updateQty(item.id, 0)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Discount (₦)</label>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        min={0}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Tax (%)</label>
                      <input
                        type="number"
                        value={tax}
                        onChange={(e) => setTax(Number(e.target.value))}
                        min={0}
                        max={100}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    rows={1}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 resize-none"
                  />

                  <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Subtotal</span><span>₦{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Discount</span><span>-₦{discountAmt.toFixed(2)}</span>
                      </div>
                    )}
                    {taxAmt > 0 && (
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Tax</span><span>+₦{taxAmt.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-indigo-200 dark:border-indigo-800 pt-1 mt-1">
                      <span>Total</span><span>₦{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-xs">{error}</p>}

                  <button
                    onClick={handleSubmit}
                    disabled={loading || cart.length === 0}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium text-sm transition flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : `Complete Sale · ₦${total.toFixed(2)}`}
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
