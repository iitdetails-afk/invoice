import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useInvoiceStore } from "@/store/invoiceStore";
import { QRCodeCanvas } from "qrcode.react";
import { AreaField, Field, ImageSlot, NumField } from "@/components/invoice/Editable";
import {
  GST_SLABS,
  amountInWords,
  computeTotals,
  formatDate,
  money,
  upiLink,
  IDFC_MERCHANT_UPI_BASE,
  type Bank,
  type Party,
  type SalesType,
  type TaxMode,
} from "@/lib/invoice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quotation")({
  head: () => ({
    meta: [
      { title: "IIT Quotation Generator — Quotation & Estimate Generator" },
      {
        name: "description",
        content:
          "Create GST quotations and estimates with live totals, amount in words, UPI QR and print-ready A4 export.",
      },
      { property: "og:title", content: "IIT Quotation Generator — Quotation & Estimate Generator" },
      {
        property: "og:description",
        content:
          "Editable GST quotation sheet with CGST/SGST or IGST slabs, discounts, round-off, UPI QR and A4 PDF export.",
      },
    ],
  }),
  component: QuotationPage,
});

const QUOTATION_TYPES = ["Quotation", "Proforma Invoice", "Estimate"];

function QuotationPage() {
  const store = useInvoiceStore();
  const {
    salesType,
    invoiceNo,
    invoiceDate,
    dueDate,
    placeOfSupply,
    seller,
    buyer,
    shipTo,
    bank,
    logo,
    seal,
    signature,
    terms,
    items,
    discountValue,
    discountIsPercent,
    gstRate,
    gstInclusive,
    taxMode,
    roundOffEnabled,
    packingCharge,
  } = store;

  const [quotationType, setQuotationType] = useState<string>("Quotation");
  const [errors, setErrors] = useState<string[]>([]);
  const [qrMode, setQrMode] = useState<"image" | "live">("live");

  const setSalesType = (v: SalesType) => store.setField("salesType", v);
  const setInvoiceNo = (v: string) => store.setField("invoiceNo", v);
  const setInvoiceDate = (v: string) => store.setField("invoiceDate", v);
  const setDueDate = (v: string) => store.setField("dueDate", v);
  const setPlaceOfSupply = (v: string) => store.setField("placeOfSupply", v);
  const setShipTo = (v: string) => store.setField("shipTo", v);
  const setLogo = (v: string) => store.setField("logo", v);
  const setSeal = (v: string) => store.setField("seal", v);
  const setSignature = (v: string) => store.setField("signature", v);
  const setTerms = (v: string) => store.setField("terms", v);
  const setPackingCharge = (v: number) => store.setField("packingCharge", v);
  const setDiscountValue = (v: number) => store.setField("discountValue", v);
  const setDiscountIsPercent = (fn: (prev: boolean) => boolean) =>
    store.setField("discountIsPercent", fn(discountIsPercent));
  const setGstRate = (v: number) => store.setField("gstRate", v);
  const setGstInclusive = (fn: (prev: boolean) => boolean) =>
    store.setField("gstInclusive", fn(gstInclusive));
  const setTaxMode = (v: TaxMode) => store.setField("taxMode", v);
  const setRoundOffEnabled = (fn: (prev: boolean) => boolean) =>
    store.setField("roundOffEnabled", fn(roundOffEnabled));

  const totals = useMemo(
    () =>
      computeTotals({
        items,
        packingCharge,
        discountValue,
        discountIsPercent,
        gstRate,
        gstInclusive,
        taxMode,
        roundOffEnabled,
      }),
    [
      items,
      packingCharge,
      discountValue,
      discountIsPercent,
      gstRate,
      gstInclusive,
      taxMode,
      roundOffEnabled,
    ],
  );

  const setSellerField = (k: keyof Party) => (v: string) => store.setNestedField("seller", k, v);
  const setBuyerField = (k: keyof Party) => (v: string) => store.setNestedField("buyer", k, v);
  const setBankField = (k: keyof Bank) => (v: string) => store.setNestedField("bank", k, v);

  const updateItem = store.updateItem;
  const addItem = store.addItem;
  const removeItem = store.removeItem;

  const validate = () => {
    const errs: string[] = [];
    if (!invoiceNo.trim()) errs.push("Quotation number is required.");
    if (!invoiceDate) errs.push("Quotation date is required.");
    if (!seller.name.trim()) errs.push("Seller name is required.");
    if (!buyer.name.trim()) errs.push("Buyer name is required.");
    const valid = items.filter((i) => i.description.trim() && i.qty > 0 && i.rate >= 0);
    if (valid.length === 0) errs.push("Add at least one item with a description and quantity.");
    setErrors(errs);
    return errs.length === 0;
  };

  const handlePrint = () => {
    validate();
    window.print();
  };

  const handleExportExcel = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Quotation No,Date,Sales Type,Buyer Name,Buyer GSTIN,Buyer Mobile,Seller Name,Total Amount\n" +
      `${invoiceNo},${invoiceDate},${salesType},${buyer.name},${buyer.gstin},${buyer.mobile || buyer.phone},${seller.name},${totals.grandTotal}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${invoiceNo.replace(/\//g, "_")}_quotation_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const upi = upiLink(bank, seller, totals.grandTotal);

  return (
    <div className="min-h-screen bg-desk font-sans text-ink">
      <header className="no-print sticky top-0 z-20 border-b border-black/5 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">IIT Quotation Generator</span>
            <span className="ml-1 rounded-[4px] bg-ink/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-inksoft">
              Draft
            </span>
          </div>
          <div className="flex rounded-[8px] bg-ink/5 p-0.5 text-sm font-medium">
            {QUOTATION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setQuotationType(t)}
                className={cn(
                  "rounded-[6px] px-3 py-1.5 transition-colors",
                  quotationType === t ? "bg-white text-ink shadow-sm" : "text-inksoft hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/quotation-form"
              className="rounded-[8px] bg-transparent px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
            >
              Back to Form
            </Link>
            <button
              onClick={() => {
                store.saveCurrentInvoice();
                alert("Successfully saved layout modifications!");
              }}
              className="rounded-[8px] border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/30"
            >
              Save Details
            </button>
            <button
              onClick={handleExportExcel}
              className="rounded-[8px] bg-green-50 text-green-700 border border-green-200 px-3 py-2 text-sm font-medium transition-colors hover:bg-green-100"
            >
              Export to Excel (Sheets)
            </button>
            <button
              onClick={handlePrint}
              className="rounded-[8px] border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/30"
            >
              Print
            </button>
            <button
              onClick={handlePrint}
              className="rounded-[8px] bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground ring-1 ring-accent/60 transition-opacity hover:opacity-90"
            >
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="no-print mx-auto mt-4 max-w-[760px] rounded-[8px] border border-destructive/30 bg-destructive/8 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-destructive">
            Fix before export
          </p>
          <ul className="mt-1 list-inside list-disc text-xs text-inksoft">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <main className="px-4 py-8 print:p-0 print:m-0">
        <article className="sheet mx-auto w-full max-w-[794px] min-h-[1123px] rounded-[10px] bg-paper p-8 shadow-[0_1px_0_rgba(0,0,0,0.04),0_28px_50px_-24px_rgba(24,34,54,0.45)] ring-1 ring-black/5 print:ring-0 print:border-none print:shadow-none print:p-0 print:m-0 sm:p-10">
          {/* Masthead */}
          <div className="flex items-start justify-between gap-6 border-b-2 border-ink pb-5">
            <div className="flex items-center gap-3">
              <div className="size-16 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo-bg-removed.png"
                  alt="Company Logo"
                  className="h-full w-full object-contain mix-blend-multiply"
                />
              </div>
              <div className="min-w-0">
                <Field
                  value={seller.name}
                  onChange={setSellerField("name")}
                  placeholder="Your company name"
                  className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl"
                  invalid={errors.length > 0 && !seller.name.trim()}
                />
                <div className="mt-1 flex flex-wrap font-mono text-[11px] text-inksoft">
                  <Field
                    value={seller.street}
                    onChange={setSellerField("street")}
                    placeholder="Street"
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <p className="text-lg font-bold uppercase tracking-[0.18em] text-accent">{quotationType}</p>
              <div className="mt-1 flex items-center justify-end gap-1 font-mono text-xs text-inksoft">
                <span>No.</span>
                <Field
                  value={invoiceNo}
                  onChange={setInvoiceNo}
                  align="right"
                  placeholder="QUO-0001"
                  className="w-32"
                  invalid={errors.length > 0 && !invoiceNo.trim()}
                />
              </div>
              <div className="flex items-center justify-end gap-1 font-mono text-xs text-inksoft">
                <span>GSTIN</span>
                <Field
                  value={seller.gstin}
                  onChange={setSellerField("gstin")}
                  align="right"
                  placeholder="27ABCDE1234F1Z5"
                  className="w-36"
                />
              </div>
            </div>
          </div>

          {/* Meta strip */}
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs sm:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-inksoft">Quotation Date</p>
              <Field
                type="date"
                value={invoiceDate}
                onChange={setInvoiceDate}
                className="font-bold no-print"
              />
              <p className="hidden font-bold print:block">{formatDate(invoiceDate)}</p>
            </div>
            <div className={cn(!dueDate && "print:hidden")}>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase tracking-wider text-inksoft">Valid Until</span>
                <button
                  type="button"
                  onClick={() =>
                    store.setField(
                      "dueDate",
                      dueDate ? "" : invoiceDate || new Date().toISOString().slice(0, 10),
                    )
                  }
                  className={cn(
                    "no-print rounded px-1.5 py-0.5 text-[9px] font-semibold border transition-colors cursor-pointer",
                    dueDate
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-ink/5 text-inksoft border-rule hover:text-ink",
                  )}
                  title={
                    dueDate
                      ? "Valid Until date is ON for printing. Click to turn OFF."
                      : "Valid Until date is OFF for printing. Click to turn ON."
                  }
                >
                  Print: {dueDate ? "ON" : "OFF"}
                </button>
              </div>
              {dueDate ? (
                <>
                  <Field
                    type="date"
                    value={dueDate}
                    onChange={setDueDate}
                    className="font-bold no-print mt-0.5"
                  />
                  <p className="hidden font-bold print:block">{formatDate(dueDate || "")}</p>
                </>
              ) : (
                <p className="font-mono text-inksoft/40 italic no-print text-[11px] mt-1">
                  Hidden / Off
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-inksoft">Place of Supply</p>
              <Field value={placeOfSupply} onChange={setPlaceOfSupply} className="font-bold" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-inksoft">Payment Type</p>
              <div className="flex gap-2 font-bold">
                {(["Cash", "Credit"] as SalesType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSalesType(t)}
                    className={cn(
                      "transition-colors",
                      salesType === t
                        ? "text-accent"
                        : "text-inksoft/60 hover:text-inksoft print:hidden",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* From / Bill To */}
          <div className="mt-6 print:mt-3 grid grid-cols-1 gap-6 print:gap-4 sm:grid-cols-2">
            <div className="rounded-[8px] border border-rule bg-white/40 p-4 print:p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                From
              </p>
              <Field
                value={seller.name}
                onChange={setSellerField("name")}
                placeholder="Company name"
                className="mt-1 text-sm font-semibold"
              />
              <div className="mt-0.5 text-xs text-inksoft leading-tight">
                <Field
                  value={seller.street}
                  onChange={setSellerField("street")}
                  placeholder="Street"
                />
                <div className="flex">
                  <Field value={seller.city} onChange={setSellerField("city")} placeholder="City" />
                  <span className="mr-1">,</span>
                  <Field
                    value={seller.state}
                    onChange={setSellerField("state")}
                    placeholder="State"
                  />
                  <span className="mr-1"> -</span>
                  <Field value={seller.pin} onChange={setSellerField("pin")} placeholder="PIN" />
                </div>
              </div>
              <div className="mt-2 font-mono text-[10px] text-inksoft leading-snug">
                <div className="flex">
                  <span className="w-16">GSTIN</span>
                  <span className="mr-1">:</span>
                  <Field value={seller.gstin} onChange={setSellerField("gstin")} placeholder="—" />
                </div>
                <div className="flex mt-0.5">
                  <span className="w-16">Contact</span>
                  <span className="mr-1">:</span>
                  <Field
                    value={seller.contact}
                    onChange={setSellerField("contact")}
                    placeholder="Name"
                  />
                </div>
                <div className="flex mt-0.5">
                  <span className="w-16">Mobile</span>
                  <span className="mr-1">:</span>
                  <Field
                    value={seller.mobile}
                    onChange={setSellerField("mobile")}
                    placeholder="Mobile"
                  />
                </div>
                <div className="flex mt-0.5">
                  <span className="w-16">Email</span>
                  <span className="mr-1">:</span>
                  <Field
                    type="email"
                    value={seller.email}
                    onChange={setSellerField("email")}
                    placeholder="Email"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[8px] border border-rule bg-white/40 p-4 print:p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                To,
              </p>
              <Field
                value={buyer.name}
                onChange={setBuyerField("name")}
                placeholder="Client name"
                className="mt-1 text-sm font-semibold"
                invalid={errors.length > 0 && !buyer.name.trim()}
              />
              <div className="mt-0.5 text-xs text-inksoft leading-tight">
                <Field
                  value={buyer.street}
                  onChange={setBuyerField("street")}
                  placeholder="Street"
                />
                <div className="flex">
                  <Field value={buyer.city} onChange={setBuyerField("city")} placeholder="City" />
                  <span className="mr-1">,</span>
                  <Field
                    value={buyer.state}
                    onChange={setBuyerField("state")}
                    placeholder="State"
                  />
                  <span className="mr-1"> -</span>
                  <Field value={buyer.pin} onChange={setBuyerField("pin")} placeholder="PIN" />
                </div>
                <Field
                  value={shipTo}
                  onChange={setShipTo}
                  placeholder="Shipping address (if different)"
                  className="mt-1 block"
                />
              </div>
              <div className="mt-2 font-mono text-[10px] text-inksoft leading-snug">
                <div className="flex">
                  <span className="w-16">GSTIN</span>
                  <span className="mr-1">:</span>
                  <Field value={buyer.gstin} onChange={setBuyerField("gstin")} placeholder="—" />
                </div>
                <div className="flex mt-0.5">
                  <span className="w-16">Contact</span>
                  <span className="mr-1">:</span>
                  <Field
                    value={buyer.contact}
                    onChange={setBuyerField("contact")}
                    placeholder="Name"
                  />
                </div>
                <div className="flex mt-0.5">
                  <span className="w-16">Mobile</span>
                  <span className="mr-1">:</span>
                  <Field
                    value={buyer.mobile || buyer.phone}
                    onChange={setBuyerField("mobile")}
                    placeholder="Mobile"
                  />
                </div>
                <div className="flex mt-0.5">
                  <span className="w-16">Email</span>
                  <span className="mr-1">:</span>
                  <Field
                    type="email"
                    value={buyer.email}
                    onChange={setBuyerField("email")}
                    placeholder="Email"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="mt-6 overflow-hidden rounded-[8px] border border-rule">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-ink text-[10px] uppercase tracking-wider text-white">
                  <th className="px-3 py-2 font-semibold">S.No</th>
                  <th className="px-3 py-2 font-semibold">HSNCode</th>
                  <th className="px-3 py-2 font-semibold">DESCRIPTION</th>
                  <th className="px-3 py-2 text-right font-semibold">Unit Price</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty.</th>
                  <th className="px-3 py-2 text-right font-semibold">AMOUNT</th>
                  <th className="no-print w-8 px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {items.map((item, i) => (
                  <tr key={item.id} className="border-t border-rule">
                    <td className="px-3 py-2.5 text-inksoft">{String(i + 1).padStart(2, "0")}</td>
                    <td className="w-20 px-3 py-2.5">
                      <Field
                        value={item.hsn}
                        onChange={(v) => updateItem(item.id, { hsn: v })}
                        placeholder="—"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <AreaField
                        rows={1}
                        value={item.description}
                        onChange={(v) => updateItem(item.id, { description: v })}
                        placeholder="Item or service"
                        className="font-sans text-[13px] font-medium min-h-[3rem]"
                      />
                    </td>
                    <td className="w-24 px-3 py-2.5 text-right">
                      <NumField
                        value={item.rate}
                        onChange={(v) => updateItem(item.id, { rate: v })}
                        step={0.01}
                      />
                    </td>
                    <td className="w-16 px-3 py-2.5 text-right">
                      <NumField
                        value={item.qty}
                        onChange={(v) => updateItem(item.id, { qty: v })}
                        step={0.01}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold">
                      {money((item.qty || 0) * (item.rate || 0))}
                    </td>
                    <td className="no-print px-2 py-2.5 text-right">
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label="Delete row"
                        className="size-5 rounded-[4px] text-inksoft/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addItem}
            className="no-print mt-2 rounded-[6px] border border-dashed border-ink/25 px-3 py-1.5 font-mono text-[11px] text-inksoft transition-colors hover:border-accent hover:text-accent"
          >
            + Add Line Item
          </button>

          {/* Words, Terms & Totals Summary Layout */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 items-start">
            {/* Left Column: Amount In Words & Terms */}
            <div className="flex flex-col gap-4 font-sans text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                  Amount in Words
                </p>
                <p className="mt-1 text-sm italic text-ink font-semibold leading-relaxed">
                  {amountInWords(totals.grandTotal)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                  Terms &amp; Conditions
                </p>
                <AreaField
                  value={terms}
                  onChange={setTerms}
                  rows={4}
                  className="mt-1 text-xs text-inksoft"
                  placeholder="Terms & conditions"
                />
              </div>
            </div>

            {/* Right Column: Totals Summary */}
            <div className="flex flex-col items-end">
              <div className="w-full sm:max-w-xs font-mono text-xs">
                {/* GST Controls (screen only) */}
                <div className="no-print mb-3 p-2 bg-ink/5 rounded-[6px] border border-rule flex flex-col gap-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-inksoft font-medium">GST Rate</span>
                    <div className="flex gap-1">
                      {GST_SLABS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setGstRate(s)}
                          className={cn(
                            "rounded-[4px] px-2 py-0.5 font-medium border text-[10px] transition-colors",
                            gstRate === s
                              ? "bg-accent text-accent-foreground border-accent"
                              : "bg-white text-inksoft border-rule hover:text-ink cursor-pointer",
                          )}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-rule">
                    <button
                      onClick={() => setTaxMode(taxMode === "intra" ? "inter" : "intra")}
                      className="rounded-[4px] border border-ink/15 bg-white px-2 py-0.5 text-inksoft font-medium hover:text-ink cursor-pointer text-[10px]"
                    >
                      {taxMode === "intra" ? "Intra (CGST/SGST)" : "Inter (IGST)"}
                    </button>
                    <button
                      onClick={() => setGstInclusive((b) => !b)}
                      className={cn(
                        "rounded-[4px] border px-2 py-0.5 font-medium cursor-pointer text-[10px] transition-colors",
                        gstInclusive
                          ? "bg-accent/10 text-accent border-accent/30"
                          : "bg-white text-inksoft border-ink/15 hover:text-ink",
                      )}
                    >
                      {gstInclusive ? "Tax Included" : "Tax Excluded"}
                    </button>
                  </div>
                </div>

                <div className="rounded-[8px] border border-rule overflow-hidden bg-white/40">
                  <table className="w-full text-right border-collapse">
                    <tbody className="divide-y divide-rule">
                      <tr>
                        <td className="px-3 py-2 text-inksoft font-semibold text-left">Subtotal</td>
                        <td className="px-3 py-2 font-semibold">{money(totals.subtotal)}</td>
                      </tr>

                      <tr className={cn(totals.discount === 0 && "print:hidden")}>
                        <td className="px-3 py-2 text-inksoft text-left">
                          <div className="flex items-center gap-1">
                            <span>Discount</span>
                            <NumField
                              value={discountValue}
                              onChange={setDiscountValue}
                              step={0.01}
                              className="w-14 text-right no-print"
                            />
                            <button
                              onClick={() => setDiscountIsPercent((p: boolean) => !p)}
                              className="rounded-[4px] bg-ink/5 px-1 text-[10px] text-ink print:bg-transparent no-print cursor-pointer"
                            >
                              {discountIsPercent ? "%" : "₹"}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-destructive whitespace-nowrap">
                          − {money(totals.discount)}
                        </td>
                      </tr>

                      {taxMode === "intra" ? (
                        <>
                          <tr className={cn(totals.cgst === 0 && "print:hidden")}>
                            <td className="px-3 py-2 text-inksoft text-left">
                              CGST @{gstRate / 2}%{" "}
                              {gstInclusive && <span className="text-[9px]">(Incl.)</span>}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">{money(totals.cgst)}</td>
                          </tr>
                          <tr className={cn(totals.sgst === 0 && "print:hidden")}>
                            <td className="px-3 py-2 text-inksoft text-left">
                              SGST @{gstRate / 2}%{" "}
                              {gstInclusive && <span className="text-[9px]">(Incl.)</span>}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">{money(totals.sgst)}</td>
                          </tr>
                        </>
                      ) : (
                        <tr className={cn(totals.igst === 0 && "print:hidden")}>
                          <td className="px-3 py-2 text-inksoft text-left">
                            IGST @{gstRate}%{" "}
                            {gstInclusive && <span className="text-[9px]">(Incl.)</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{money(totals.igst)}</td>
                        </tr>
                      )}

                      <tr className={cn(totals.packingCharge === 0 && "print:hidden")}>
                        <td className="px-3 py-2 text-inksoft text-left">
                          <div className="flex items-center gap-1">
                            <span>Packing &amp; Frwd.</span>
                            <NumField
                              className="w-14 text-right no-print"
                              value={packingCharge}
                              onChange={setPackingCharge}
                              step={0.01}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{money(totals.packingCharge)}</td>
                      </tr>

                      <tr className={cn(!roundOffEnabled && "print:hidden")}>
                        <td className="px-3 py-2 text-inksoft text-left">
                          <div className="flex items-center gap-1">
                            <span>Round Off</span>
                            <button
                              onClick={() => setRoundOffEnabled((r: boolean) => !r)}
                              className="no-print ml-1 rounded-[4px] bg-ink/5 px-1 text-[10px] cursor-pointer"
                            >
                              {roundOffEnabled ? "on" : "off"}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {totals.roundOff < 0 ? "−" : "+"} {money(Math.abs(totals.roundOff))}
                        </td>
                      </tr>

                      <tr className="bg-ink/5 print:bg-transparent border-t-2 border-ink">
                        <td className="px-3 py-2.5 font-bold text-sm uppercase tracking-wider text-ink text-left">
                          Total Amount
                        </td>
                        <td className="px-3 py-2.5 font-bold text-base text-ink whitespace-nowrap">
                          {money(totals.grandTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Bank / UPI */}
          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-rule pt-6 sm:grid-cols-3">
            <div className="font-mono text-xs sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-inksoft">
                Payment Details
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                <p className="text-inksoft">A/c Name</p>
                <Field
                  value={bank.accountName}
                  onChange={setBankField("accountName")}
                  className="font-bold"
                  placeholder="Account name"
                />
                <p className="text-inksoft">Bank &amp; Branch</p>
                <div className="flex gap-1 font-bold">
                  <Field
                    value={bank.bankName}
                    onChange={setBankField("bankName")}
                    placeholder="Bank"
                  />
                  <Field
                    value={bank.branch}
                    onChange={setBankField("branch")}
                    placeholder="Branch"
                  />
                </div>
                <p className="text-inksoft">Account No.</p>
                <Field
                  value={bank.accountNumber}
                  onChange={setBankField("accountNumber")}
                  className="font-bold"
                  placeholder="Account number"
                />
                <p className="text-inksoft">IFSC Code</p>
                <Field
                  value={bank.ifsc}
                  onChange={setBankField("ifsc")}
                  className="font-bold"
                  placeholder="IFSC"
                />
                <p className="text-inksoft">UPI ID</p>
                <Field
                  value={bank.upi}
                  onChange={setBankField("upi")}
                  className="font-bold text-accent"
                  placeholder="name@bank"
                />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-extrabold text-ink text-[11px] uppercase tracking-wider block mb-1">
                Scan &amp; Pay
              </span>
              <div className="grid size-28 shrink-0 place-items-center rounded-[8px] bg-white p-2 border border-rule shadow-sm">
                {qrMode === "image" ? (
                  <img
                    src="/upi-qr-code.png"
                    alt="Scan to Pay QR Code"
                    className="size-full object-contain"
                  />
                ) : (
                  <QRCodeCanvas
                    value={upi || IDFC_MERCHANT_UPI_BASE}
                    size={96}
                    level="M"
                    marginSize={1}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                )}
              </div>
              <div className="font-mono text-[10px] leading-tight text-inksoft mt-1.5 text-center">
                <p className="font-extrabold text-ink text-xs">
                  {money(totals.grandTotal)}
                </p>
                <div className="no-print mt-1.5">
                  <button
                    type="button"
                    onClick={() => setQrMode((m) => (m === "live" ? "image" : "live"))}
                    className="rounded bg-ink/5 hover:bg-ink/10 px-1.5 py-0.5 text-[8px] font-semibold border border-rule text-ink cursor-pointer"
                  >
                    {qrMode === "live" ? "Static Card QR" : "Live Amount QR"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SignatureArea - Print styling with upload capability */}
          <div className="mt-8 flex justify-end">
            <div className="flex flex-col items-end pt-2">
              <ImageSlot
                value={signature}
                onChange={setSignature}
                label="Upload signature"
                className="h-16 w-32 shrink-0 object-contain"
              />
              <div className="mt-2 flex items-center justify-between border-t border-ink/40 pt-1 font-mono text-[10px] uppercase tracking-wider text-ink/80 min-w-[200px]">
                <span>Authorised Signatory for {seller.name || "—"}</span>
              </div>
            </div>
          </div>

          <p className="mt-8 border-t border-rule pt-3 text-center font-mono text-[10px] text-inksoft no-print">
            This is a system-generated quotation. E-invoice / E-way bill details to
            follow where applicable.
          </p>
        </article>
        <p className="no-print mx-auto mt-4 max-w-[760px] text-center font-mono text-[10px] text-inksoft">
          Every field on the sheet is editable. Seller, bank, seal and signature details are
          remembered on this device.
        </p>
      </main>
    </div>
  );
}
