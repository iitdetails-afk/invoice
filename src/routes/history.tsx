import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, Fragment } from "react";
import { useInvoiceStore } from "@/store/invoiceStore";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const store = useInvoiceStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const filteredHistory = store.savedInvoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.buyer.phone || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-desk font-sans text-ink p-4 sm:p-8">
      <div className="mx-auto max-w-[800px] rounded-[10px] bg-paper p-6 sm:p-10 shadow-[0_1px_0_rgba(0,0,0,0.04),0_28px_50px_-24px_rgba(24,34,54,0.45)] ring-1 ring-black/5">
        <div className="mb-6 flex justify-between items-center border-b border-rule pb-4">
          <h1 className="text-2xl font-extrabold tracking-tight">Invoice History</h1>
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
            placeholder="Search saved invoices by No, Buyer Name, or Contact..."
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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((inv) => (
                  <Fragment key={inv.invoiceNo}>
                    <tr className="border-b border-rule last:border-b-0 hover:bg-ink/5 transition-colors">
                      <td className="px-4 py-3 font-medium">{inv.invoiceNo}</td>
                      <td className="px-4 py-3 text-inksoft">{inv.invoiceDate}</td>
                      <td className="px-4 py-3">
                        {inv.buyer.name}
                        {inv.buyer.phone ? (
                          <span className="block text-[10px] text-inksoft">{inv.buyer.phone}</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleExpand(inv.invoiceNo)}
                          className="rounded-[6px] bg-ink/5 text-ink px-3 py-1.5 text-xs font-bold hover:bg-ink/10 mr-2 transition-colors"
                        >
                          {expandedId === inv.invoiceNo ? "Collapse" : "Expand"}
                        </button>
                        <button
                          disabled={isNavigating}
                          onClick={() => {
                            if (isNavigating) return;
                            setIsNavigating(true);
                            store.loadInvoice(inv.invoiceNo);
                            navigate({ to: "/form" }).finally(() => setIsNavigating(false));
                          }}
                          className="rounded-[6px] bg-accent/10 text-accent px-3 py-1.5 text-xs font-bold hover:bg-accent/20 mr-2 transition-colors disabled:opacity-50"
                        >
                          Load Form
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${inv.invoiceNo}?`)) {
                              store.deleteInvoice(inv.invoiceNo);
                            }
                          }}
                          className="rounded-[6px] bg-destructive/10 text-destructive px-3 py-1.5 text-xs font-bold hover:bg-destructive/20 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {expandedId === inv.invoiceNo && (
                      <tr className="bg-white/40 border-b border-rule">
                        <td colSpan={4} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-semibold text-accent uppercase tracking-wider text-[10px] mb-1">
                                Seller Details (From)
                              </p>
                              <p>{inv.seller.name || "N/A"}</p>
                              <p className="text-inksoft">
                                {inv.seller.gstin ? `GSTIN: ${inv.seller.gstin}` : ""}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-accent uppercase tracking-wider text-[10px] mb-1">
                                Buyer Details (To)
                              </p>
                              <p>{inv.buyer.name || "N/A"}</p>
                              <p className="text-inksoft">
                                {inv.buyer.gstin ? `GSTIN: ${inv.buyer.gstin}` : ""}
                              </p>
                            </div>
                            <div className="col-span-2 mt-2">
                              <p className="font-semibold text-accent uppercase tracking-wider text-[10px] mb-1">
                                Line Items List
                              </p>
                              <div className="border border-rule rounded-[6px] overflow-hidden">
                                <table className="w-full text-left">
                                  <thead className="bg-ink/5 text-inksoft uppercase tracking-[0.1em] text-[9px] border-b border-rule">
                                    <tr>
                                      <th className="px-2 py-1">Desc</th>
                                      <th className="px-2 py-1">HSN</th>
                                      <th className="px-2 py-1">Qty</th>
                                      <th className="px-2 py-1">Rate</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inv.items.map((item, idx) => (
                                      <tr
                                        key={idx}
                                        className="border-b border-rule last:border-b-0"
                                      >
                                        <td className="px-2 py-1">{item.description}</td>
                                        <td className="px-2 py-1 text-inksoft">{item.hsn}</td>
                                        <td className="px-2 py-1">{item.qty}</td>
                                        <td className="px-2 py-1">₹{item.rate}</td>
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
                  <td colSpan={4} className="px-4 py-8 text-center text-inksoft">
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
