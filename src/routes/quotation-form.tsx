import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useInvoiceStore } from "@/store/invoiceStore";
import { computeTotals } from "@/lib/invoice";

export const Route = createFileRoute("/quotation-form")({
  component: QuotationFormPage,
});

function QuotationFormPage() {
  const store = useInvoiceStore();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const handleGenerate = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    store.saveCurrentInvoice();

    try {
      const totals = computeTotals({
        items: store.items,
        packingCharge: store.packingCharge || 0,
        discountValue: store.discountValue,
        discountIsPercent: store.discountIsPercent,
        gstRate: store.gstRate,
        gstInclusive: store.gstInclusive,
        taxMode: store.taxMode,
        roundOffEnabled: store.roundOffEnabled,
      });

      const payload = {
        // Original legacy keys required by existing Apps Script defaults
        invoiceNo: store.invoiceNo,
        date: store.invoiceDate,
        buyerName: store.buyer.name,
        // Previously used for Place & Contact, now maps to Place | Contact | GSTIN
        buyerGstin: [
          `${store.buyer.city}${store.buyer.state ? ", " + store.buyer.state : ""}`.trim(),
          [store.buyer.phone, store.buyer.mobile, store.buyer.contact].filter(Boolean).join(", "),
          store.buyer.gstin,
        ]
          .filter(Boolean)
          .join(" | "),
        totalAmount: totals.grandTotal.toFixed(2),
        // New expanded metadata requested for sheet mapping
        sNo: store.invoiceNo,
        "invoice id": store.invoiceNo,
        "Invoice ID": store.invoiceNo,
        Date: store.invoiceDate,
        "Buyer Name": store.buyer.name,
        name: store.buyer.name,
        Name: store.buyer.name,
        contact: [store.buyer.phone, store.buyer.mobile, store.buyer.contact]
          .filter(Boolean)
          .join(", "),
        gstin: store.buyer.gstin,
        subtotal: totals.subtotal.toFixed(2),
        taxAdded: (totals.cgst + totals.sgst + totals.igst).toFixed(2),
        // Exact keys mapping directly to Sheet headers
        "S.NO": store.invoiceNo,
        "Place & Contact": [
          `${store.buyer.city}${store.buyer.state ? ", " + store.buyer.state : ""}`,
          [store.buyer.phone, store.buyer.mobile, store.buyer.contact].filter(Boolean).join(", "),
        ]
          .filter(Boolean)
          .join(" - "),
        Place: `${store.buyer.city}${store.buyer.state ? ", " + store.buyer.state : ""}`,
        place: `${store.buyer.city}${store.buyer.state ? ", " + store.buyer.state : ""}`,
        palce: `${store.buyer.city}${store.buyer.state ? ", " + store.buyer.state : ""}`,
        Contact: [store.buyer.phone, store.buyer.mobile, store.buyer.contact]
          .filter(Boolean)
          .join(", "),
        "mobile number": [store.buyer.phone, store.buyer.mobile, store.buyer.contact]
          .filter(Boolean)
          .join(", "),
        "Mobile Number": [store.buyer.phone, store.buyer.mobile, store.buyer.contact]
          .filter(Boolean)
          .join(", "),
        GSTIN: store.buyer.gstin,
        "gstn number": store.buyer.gstin,
        "GSTN Number": store.buyer.gstin,
        "GSTIN Number": store.buyer.gstin,
        Subtotal: totals.subtotal.toFixed(2),
        Tax: (totals.cgst + totals.sgst + totals.igst).toFixed(2),
        Total: totals.grandTotal.toFixed(2),
        amount: totals.grandTotal.toFixed(2),
        Amount: totals.grandTotal.toFixed(2),
      };

      // Fire-and-forget background fetch so we don't delay navigation
      fetch(
        "https://script.google.com/macros/s/AKfycbyJ91nW0uvt1OtNxuKGkcIiiRborcpWL0JcVDdfUlw5Z4RwI_lE9w2urpIfyX70yh93dQ/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(payload),
        },
      ).catch((e) => console.error("Failed to save to Google Sheets", e));
    } catch (e) {
      console.error("Failed to prepare payload", e);
    }

    navigate({ to: "/quotation" }).finally(() => setIsNavigating(false));
  };

  const handleExportAllExcel = () => {
    if (!store.savedInvoices || store.savedInvoices.length === 0) {
      alert("No invoices to export!");
      return;
    }

    const header =
      "Doc Type,Invoice No,Date,Sales Type,Buyer Name,Buyer GSTIN,Buyer Phone,Seller Name,Subtotal,Discount,Tax,Grand Total\n";

    const rows = store.savedInvoices
      .map((inv) => {
        const isTaxDoc = inv.docType === "Tax Invoice";
        const effectiveGst = isTaxDoc ? inv.gstRate : 0;

        const totals = computeTotals({
          items: inv.items,
          packingCharge: inv.packingCharge || 0,
          discountValue: inv.discountValue,
          discountIsPercent: inv.discountIsPercent,
          gstRate: effectiveGst,
          gstInclusive: inv.gstInclusive || false,
          taxMode: inv.taxMode,
          roundOffEnabled: inv.roundOffEnabled,
        });

        const taxAmount = inv.taxMode === "intra" ? totals.cgst + totals.sgst : totals.igst;

        return [
          `"${inv.docType || ""}"`,
          `"${inv.invoiceNo || ""}"`,
          `"${inv.invoiceDate || ""}"`,
          `"${inv.salesType || ""}"`,
          `"${inv.buyer.name || ""}"`,
          `"${inv.buyer.gstin || ""}"`,
          `"${inv.buyer.mobile || ""}"`,
          `"${inv.seller.name || ""}"`,
          totals.subtotal.toFixed(2),
          totals.discount.toFixed(2),
          taxAmount.toFixed(2),
          totals.grandTotal.toFixed(2),
        ].join(",");
      })
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + header + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `All_Invoices_Database.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-desk font-sans text-ink p-4 sm:p-8">
      <div className="mx-auto max-w-[800px] rounded-[10px] bg-paper p-6 sm:p-10 shadow-[0_1px_0_rgba(0,0,0,0.04),0_28px_50px_-24px_rgba(24,34,54,0.45)] ring-1 ring-black/5">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-rule pb-4 gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight">IIT Quotation Generator</h1>

          <div className="flex items-center gap-2">
            <button
              disabled={isNavigating}
              onClick={() => {
                if (isNavigating) return;
                setIsNavigating(true);
                navigate({ to: "/history" }).finally(() => setIsNavigating(false));
              }}
              className="rounded-[8px] bg-transparent px-3 py-2 text-sm font-semibold text-ink ring-1 ring-rule transition-colors hover:bg-ink/5 disabled:opacity-50"
            >
              View History
            </button>
            <button
              disabled={isNavigating}
              onClick={() => {
                if (isNavigating) return;
                setIsNavigating(true);
                navigate({ to: "/form" }).finally(() => setIsNavigating(false));
              }}
              className="rounded-[8px] bg-transparent px-3 py-2 text-sm font-semibold text-ink ring-1 ring-rule transition-colors hover:bg-ink/5 disabled:opacity-50"
            >
              Invoice Form
            </button>
            <div className="flex rounded-[8px] bg-ink/5 p-0.5 text-sm font-medium">
              {["Tax Invoice", "Bill of Supply", "Cash Memo"].map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    store.setField("docType", t as "Tax Invoice" | "Bill of Supply" | "Cash Memo")
                  }
                  className={`rounded-[6px] px-3 py-1.5 transition-colors ${store.docType === t ? "bg-white text-ink shadow-sm" : "text-inksoft hover:text-ink"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              disabled={isNavigating}
              onClick={handleGenerate}
              className="rounded-[8px] bg-indigo-600 px-4 py-2 text-sm font-semibold text-white ring-1 ring-indigo-500/60 transition-opacity hover:bg-indigo-700 disabled:opacity-50"
            >
              Generate Quotation
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => {
              if (isNavigating) return;
              setIsNavigating(true);
              navigate({ to: "/database" }).finally(() => setIsNavigating(false));
            }}
            className="rounded-[6px] border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            View Permanent Database (Google Sheets) &rarr;
          </button>
          <button
            onClick={handleExportAllExcel}
            className="rounded-[6px] border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
          >
            Export All to Sheets / Excel
          </button>
          <button
            onClick={store.clearAllInfo}
            className="rounded-[6px] border border-ink/20 bg-white/40 px-3 py-1.5 text-xs font-semibold text-inksoft transition-colors hover:text-ink hover:bg-white"
          >
            Clear All Info
          </button>
          <button
            onClick={store.resetForm}
            className="rounded-[6px] border border-ink/20 bg-white/40 px-3 py-1.5 text-xs font-semibold text-inksoft transition-colors hover:text-ink hover:bg-white"
          >
            Set Default Data
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Seller Section */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
              Seller Info (From)
            </h2>
            <div>
              <label className="block text-[10px] uppercase text-inksoft mb-1">Company Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                value={store.seller.name}
                onChange={(e) => store.setNestedField("seller", "name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">GSTIN</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.seller.gstin}
                  onChange={(e) => store.setNestedField("seller", "gstin", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">Mobile No(s)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.seller.mobile}
                  onChange={(e) => store.setNestedField("seller", "mobile", e.target.value)}
                  placeholder="Comma separated if multiple"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-inksoft mb-1">Street</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                value={store.seller.street}
                onChange={(e) => store.setNestedField("seller", "street", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.seller.city}
                  onChange={(e) => store.setNestedField("seller", "city", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">State</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.seller.state}
                  onChange={(e) => store.setNestedField("seller", "state", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Buyer Section */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
              Buyer Info (To)
            </h2>
            <div>
              <label className="block text-[10px] uppercase text-inksoft mb-1">Client Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                value={store.buyer.name}
                onChange={(e) => store.setNestedField("buyer", "name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">GSTIN</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.buyer.gstin}
                  onChange={(e) => store.setNestedField("buyer", "gstin", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">Mobile No(s)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.buyer.mobile}
                  onChange={(e) => store.setNestedField("buyer", "mobile", e.target.value)}
                  placeholder="Comma separated if multiple"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-inksoft mb-1">Street</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                value={store.buyer.street}
                onChange={(e) => store.setNestedField("buyer", "street", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.buyer.city}
                  onChange={(e) => store.setNestedField("buyer", "city", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">State</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.buyer.state}
                  onChange={(e) => store.setNestedField("buyer", "state", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:col-span-2 border-t border-rule pt-4 mt-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
              Bank Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.bank.accountName}
                  onChange={(e) => store.setNestedField("bank", "accountName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">Bank Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.bank.bankName}
                  onChange={(e) => store.setNestedField("bank", "bankName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.bank.accountNumber}
                  onChange={(e) => store.setNestedField("bank", "accountNumber", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">IFSC</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.bank.ifsc}
                  onChange={(e) => store.setNestedField("bank", "ifsc", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Additional details like Invoice No, Date, etc */}
          <div className="space-y-4 sm:col-span-2 border-t border-rule pt-4 mt-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
              Invoice Options
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">Invoice No.</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.invoiceNo}
                  onChange={(e) => store.setField("invoiceNo", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.invoiceDate}
                  onChange={(e) => store.setField("invoiceDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.dueDate}
                  onChange={(e) => store.setField("dueDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">
                  Place of Supply
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.placeOfSupply}
                  onChange={(e) => store.setField("placeOfSupply", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.gstRate}
                  onChange={(e) => store.setField("gstRate", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">Discount</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.discountValue}
                  onChange={(e) => store.setField("discountValue", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-inksoft mb-1">
                  Packing & Chg
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm bg-white/40 border border-rule rounded-[6px] focus:outline-none focus:border-accent"
                  value={store.packingCharge || 0}
                  onChange={(e) => store.setField("packingCharge", Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:col-span-2 border-t border-rule pt-4 mt-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
                Line Items
              </h2>
              <button
                onClick={store.addItem}
                className="rounded-[6px] border border-dashed border-ink/25 px-3 py-1.5 font-mono text-[11px] text-inksoft transition-colors hover:border-accent hover:text-accent"
              >
                + Add Line Item
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                <span className="w-6 text-center">#</span>
                <span className="flex-1">Description</span>
                <span className="w-24">HSN Code</span>
                <span className="w-20">Quantity</span>
                <span className="w-24">Rate</span>
                <span className="w-8"></span>
              </div>
              {store.items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex gap-2 items-center bg-white/20 p-2 rounded-[6px] border border-rule"
                >
                  <span className="w-6 text-center text-xs text-inksoft">{index + 1}</span>
                  <textarea
                    rows={1}
                    placeholder="Description"
                    className="flex-1 px-3 py-1.5 text-sm bg-white/40 border border-rule rounded-[4px] resize-y min-h-[36px] overflow-hidden leading-snug"
                    value={item.description}
                    onChange={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                      store.updateItem(item.id, { description: e.target.value });
                    }}
                  />
                  <input
                    type="text"
                    placeholder="HSN/SAC"
                    className="w-24 px-3 py-1.5 text-sm bg-white/40 border border-rule rounded-[4px]"
                    value={item.hsn}
                    onChange={(e) => store.updateItem(item.id, { hsn: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    className="w-20 px-3 py-1.5 text-sm bg-white/40 border border-rule rounded-[4px]"
                    value={item.qty}
                    onChange={(e) => store.updateItem(item.id, { qty: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    placeholder="Rate"
                    className="w-24 px-3 py-1.5 text-sm bg-white/40 border border-rule rounded-[4px]"
                    value={item.rate}
                    onChange={(e) => store.updateItem(item.id, { rate: Number(e.target.value) })}
                  />
                  <button
                    onClick={() => store.removeItem(item.id)}
                    className="p-2 text-inksoft/60 hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
