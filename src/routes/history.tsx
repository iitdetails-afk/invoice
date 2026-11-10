import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, Fragment } from "react";
import { useInvoiceStore } from "@/store/invoiceStore";
import { computeTotals, money } from "@/lib/invoice";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const store = useInvoiceStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const rawList = Array.isArray(store.savedInvoices) ? store.savedInvoices : [];
  const filteredHistory = rawList.filter((inv) => {
    if (!inv) return false;
    const s = searchTerm.trim().toLowerCase();
    if (!s) return true;
    const invNo = String(inv.invoiceNo || "").toLowerCase();
    const buyerName = String(inv.buyer?.name || "").toLowerCase();
    const contact = String(
      inv.buyer?.phone || inv.buyer?.mobile || inv.buyer?.contact || "",
    ).toLowerCase();
    return invNo.includes(s) || buyerName.includes(s) || contact.includes(s);
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getInvoiceTotal = (inv: typeof rawList[number]) => {
    try {
      const isTaxDoc = inv.docType === "Tax Invoice";
      const effGst = isTaxDoc ? (inv.gstRate || 0) : 0;
      const totals = computeTotals({
        items: Array.isArray(inv.items) ? inv.items : [],
        packingCharge: inv.packingCharge || 0,
        discountValue: inv.discountValue || 0,
        discountIsPercent: inv.discountIsPercent ?? true,
        gstRate: effGst,
        gstInclusive: inv.gstInclusive || false,
        taxMode: inv.taxMode || "intra",
        roundOffEnabled: inv.roundOffEnabled ?? true,
      });
      return money(totals.grandTotal);
    } catch {
      return "—";
    }
  };

  return (
    <div className="min-h-screen bg-desk font-sans text-ink p-4 sm:p-8">
      <div className="mx-auto max-w-[900px] rounded-[10px] bg-paper p-6 sm:p-10 shadow-[0_1px_0_rgba(0,0,0,0.04),0_28px_50px_-24px_rgba(24,34,54,0.45)] ring-1 ring-black/5">
        <div className="mb-6 flex justify-between items-center border-b border-rule pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Invoice History</h1>
            <p className="text-xs text-inksoft mt-1">
              Saved invoices stored reliably on this device ({rawList.length} total)
            </p>
          </div>
          <button
            disabled={isNavigating}
            onClick={() => {
              if (isNavigating) return;
              setIsNavigating(true);
              navigate({ to: "/form" }).finally(() => setIsNavigating(false));
            }}
            className="rounded-[8px] bg-transparent px-4 py-2 text-sm font-semibold text-ink ring-1 ring-rule transition-opacity hover:bg-ink/5 disabled:opacity-50"
          >
            Back to Form
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search saved invoices by No, Buyer Name, or Contact / Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white/60 border border-rule rounded-[8px] focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="overflow-x-auto rounded-[8px] border border-rule">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 border-b border-rule text-inksoft uppercase tracking-[0.1em] text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Invoice No.</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Buyer Name</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!store.isHydrated && rawList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-inksoft animate-pulse">
                    Loading saved invoices from local storage...
                  </td>
                </tr>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((inv) => (
                  <Fragment key={inv.invoiceNo}>
                    <tr className="border-b border-rule last:border-b-0 hover:bg-ink/5 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <span className="font-mono text-xs">{inv.invoiceNo}</span>
                        {inv.docType && inv.docType !== "Tax Invoice" && (
                          <span className="ml-1.5 inline-block text-[9px] uppercase px-1.5 py-0.5 rounded bg-ink/5 text-inksoft">
                            {inv.docType}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-inksoft">{inv.invoiceDate || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{inv.buyer?.name || "—"}</div>
                        {(inv.buyer?.mobile || inv.buyer?.phone) && (
                          <span className="block text-[11px] text-inksoft">
                            {inv.buyer.mobile || inv.buyer.phone}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-accent">
                        {getInvoiceTotal(inv)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => toggleExpand(inv.invoiceNo)}
                          className="rounded-[6px] bg-ink/5 text-ink px-2.5 py-1.5 text-xs font-semibold hover:bg-ink/10 mr-1.5 transition-colors"
                        >
                          {expandedId === inv.invoiceNo ? "Hide" : "Details"}
                        </button>
                        <button
                          disabled={isNavigating}
                          onClick={() => {
                            if (isNavigating) return;
                            setIsNavigating(true);
                            store.loadInvoice(inv.invoiceNo);
                            navigate({ to: "/invoice" }).finally(() => setIsNavigating(false));
                          }}
                          className="rounded-[6px] bg-accent text-accent-foreground px-2.5 py-1.5 text-xs font-semibold hover:opacity-90 mr-1.5 transition-opacity disabled:opacity-50"
                        >
                          View / Print
                        </button>
                        <button
                          disabled={isNavigating}
                          onClick={() => {
                            if (isNavigating) return;
                            setIsNavigating(true);
                            store.loadInvoice(inv.invoiceNo);
                            navigate({ to: "/form" }).finally(() => setIsNavigating(false));
                          }}
                          className="rounded-[6px] bg-ink/10 text-ink px-2.5 py-1.5 text-xs font-semibold hover:bg-ink/15 mr-1.5 transition-colors disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNo}?`)) {
                              store.deleteInvoice(inv.invoiceNo);
                              if (expandedId === inv.invoiceNo) setExpandedId(null);
                            }
                          }}
                          className="rounded-[6px] bg-destructive/10 text-destructive px-2 py-1.5 text-xs font-semibold hover:bg-destructive/20 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {expandedId === inv.invoiceNo && (
                      <tr className="bg-white/40 border-b border-rule">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-semibold text-accent uppercase tracking-wider text-[10px] mb-1">
                                Seller Details (From)
                              </p>
                              <p className="font-medium">{inv.seller?.name || "N/A"}</p>
                              <p className="text-inksoft">
                                {inv.seller?.gstin ? `GSTIN: ${inv.seller.gstin}` : ""}
                              </p>
                              <p className="text-inksoft">
                                {inv.seller?.mobile ? `Mobile: ${inv.seller.mobile}` : ""}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-accent uppercase tracking-wider text-[10px] mb-1">
                                Buyer Details (To)
                              </p>
                              <p className="font-medium">{inv.buyer?.name || "N/A"}</p>
                              <p className="text-inksoft">
                                {inv.buyer?.gstin ? `GSTIN: ${inv.buyer.gstin}` : ""}
                              </p>
                              <p className="text-inksoft">
                                {inv.buyer?.street
                                  ? `${inv.buyer.street}, ${inv.buyer.city || ""}`
                                  : inv.buyer?.city || ""}
                              </p>
                            </div>
                            <div className="col-span-2 mt-2">
                              <p className="font-semibold text-accent uppercase tracking-wider text-[10px] mb-1">
                                Line Items ({inv.items?.length || 0})
                              </p>
                              <div className="border border-rule rounded-[6px] overflow-hidden">
                                <table className="w-full text-left">
                                  <thead className="bg-ink/5 text-inksoft uppercase tracking-[0.1em] text-[9px] border-b border-rule">
                                    <tr>
                                      <th className="px-2 py-1">Desc</th>
                                      <th className="px-2 py-1">HSN</th>
                                      <th className="px-2 py-1">Qty</th>
                                      <th className="px-2 py-1 text-right">Rate</th>
                                      <th className="px-2 py-1 text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(inv.items || []).map((item, idx) => (
                                      <tr
                                        key={idx}
                                        className="border-b border-rule last:border-b-0"
                                      >
                                        <td className="px-2 py-1">{item.description || "—"}</td>
                                        <td className="px-2 py-1 text-inksoft">{item.hsn || "—"}</td>
                                        <td className="px-2 py-1">{item.qty}</td>
                                        <td className="px-2 py-1 text-right">₹{item.rate}</td>
                                        <td className="px-2 py-1 text-right font-medium">
                                          ₹{((item.qty || 0) * (item.rate || 0)).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-inksoft">
                    {searchTerm
                      ? `No invoices found matching "${searchTerm}"`
                      : "No saved invoices in history."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
