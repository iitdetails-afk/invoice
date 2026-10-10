import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useInvoiceStore } from "@/store/invoiceStore";
import { AreaField, Field, ImageSlot, NumField } from "@/components/invoice/Editable";
import {
  computeTotals,
  formatDate,
  money,
  type Bank,
  type DocType,
  type LineItem,
  type Party,
  type SalesType,
  type TaxMode,
} from "@/lib/invoice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quotation")({
  head: () => ({
    meta: [{ title: "IIT Quotation Generator" }],
  }),
  component: QuotationPage,
});

function QuotationPage() {
  const store = useInvoiceStore();
  const {
    salesType,
    invoiceNo,
    invoiceDate,
    placeOfSupply,
    seller,
    buyer,
    shipTo,
    logo,
    terms,
    items,
    discountValue,
    discountIsPercent,
    gstRate,
    gstInclusive,
    taxMode,
    roundOffEnabled,
    packingCharge,
    signature,
  } = store;

  const setSalesType = (v: SalesType) => store.setField("salesType", v);
  const setInvoiceNo = (v: string) => store.setField("invoiceNo", v);
  const setInvoiceDate = (v: string) => store.setField("invoiceDate", v);
  const setLogo = (v: string) => store.setField("logo", v);
  const setTerms = (v: string) => store.setField("terms", v);
  const setPackingCharge = (v: number) => store.setField("packingCharge", v);
  const setSignature = (v: string) => store.setField("signature", v);

  const [errors, setErrors] = useState<string[]>([]);

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

  const updateItem = store.updateItem;
  const addItem = store.addItem;
  const removeItem = store.removeItem;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-desk font-sans text-ink">
      <header className="no-print sticky top-0 z-20 border-b border-black/5 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">IIT Quotation Generator</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/form"
              className="rounded-[8px] bg-transparent px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
            >
              Back to Form
            </Link>
            <button
              onClick={handlePrint}
              className="rounded-[8px] bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground shadow hover:opacity-90 transition-opacity"
            >
              Print Quotation
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 print:p-0 print:m-0">
        <article className="sheet mx-auto max-w-[760px] rounded-[10px] bg-white p-8 shadow-[0_1px_0_rgba(0,0,0,0.04),0_28px_50px_-24px_rgba(24,34,54,0.45)] ring-1 ring-black/5 print:ring-0 print:border-none print:shadow-none sm:p-10">
          <div className="flex items-start justify-between">
            <div className="w-1/3">
              <ImageSlot
                value={logo}
                onChange={setLogo}
                label="Upload logo"
                className="w-32 h-auto shrink-0"
              />
            </div>
            <div className="w-1/3 text-center flex flex-col items-center justify-center">
              <Field
                value={seller.name}
                onChange={setSellerField("name")}
                placeholder="Your company name"
                className="text-2xl font-bold tracking-tight text-center italic text-[#c00000] font-times"
              />
              <div className="mt-1 flex flex-col font-sans text-[9px] text-inksoft items-center text-center">
                <Field
                  value={seller.street}
                  onChange={setSellerField("street")}
                  placeholder="101-C, Amma Unavagam Backside, Opp. Namakkal Bus stand"
                />
                <div className="flex flex-wrap justify-center items-center gap-1 mt-1 font-bold w-full">
                  <span className="mr-0.5">📞</span>
                  <Field
                    value={seller.mobile}
                    onChange={setSellerField("mobile")}
                    placeholder="+91-9751919712"
                    className="w-auto text-center min-w-[85px]"
                  />
                  <span>, E-mail:</span>
                  <Field
                    value={seller.email}
                    onChange={setSellerField("email")}
                    placeholder="iitdetails@gmail.com"
                    className="w-[110px] text-center"
                  />
                  <span>, GSTIN:</span>
                  <Field
                    value={seller.gstin}
                    onChange={setSellerField("gstin")}
                    placeholder="33AOHTPT9724RZXY"
                    className="w-[120px] text-center"
                  />
                </div>
              </div>
            </div>
            <div className="w-1/3 flex justify-end">
              <div className="w-16">{/* Empty space to balance the header */}</div>
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between font-sans">
            <div className="w-2/5 border-[1.5px] border-black p-2 text-[11px] font-bold h-full flex flex-col justify-start">
              <span className="mb-2">To,</span>
              <div className="ml-4 font-bold">
                <Field
                  value={buyer.name}
                  onChange={setBuyerField("name")}
                  placeholder="Client Name"
                  className="mb-0.5 uppercase"
                />
                <Field
                  value={buyer.contact}
                  onChange={setBuyerField("contact")}
                  placeholder="S/O Contact"
                  className="mb-0.5"
                />
                <Field
                  value={buyer.street}
                  onChange={setBuyerField("street")}
                  placeholder="Street"
                  className="mb-0.5"
                />
                <div className="flex gap-1 mb-2">
                  <Field value={buyer.city} onChange={setBuyerField("city")} placeholder="City" />
                  <span> - </span>
                  <Field value={buyer.pin} onChange={setBuyerField("pin")} placeholder="PIN" />
                </div>
              </div>

              <table className="w-full mt-2 text-[10px] border-[1.5px] border-black border-collapse">
                <tbody>
                  <tr>
                    <td className="border-[1.5px] border-black px-1 py-1 w-24">Contact name:</td>
                    <td className="border-[1.5px] border-black px-1 py-1 font-normal">
                      <Field
                        value={buyer.contact}
                        onChange={setBuyerField("contact")}
                        placeholder="Name"
                        className="uppercase"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border-[1.5px] border-black px-1 py-1">Contact no:</td>
                    <td className="border-[1.5px] border-black px-1 py-1 font-normal">
                      <Field
                        value={buyer.mobile}
                        onChange={setBuyerField("mobile")}
                        placeholder="Mobile"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-1/2 flex flex-col items-center justify-end">
              <h2 className="text-xl font-bold tracking-wider mb-2">Quotation</h2>
              <div
                className="w-3/5 border-[1.5px] border-black px-2 py-0.5 text-center font-bold text-[11px] mb-2 cursor-pointer transition-colors hover:bg-black/5"
                onClick={() => setSalesType(salesType === "Cash" ? "Credit" : "Cash")}
              >
                {salesType === "Credit" ? "CREDIT" : "CASH"}/
                {salesType === "Credit" ? "CASH" : "CREDIT"}
              </div>

              <table className="w-full border-collapse border-[1.5px] border-black text-[10px] font-sans">
                <tbody>
                  <tr>
                    <td className="border-[1.5px] border-black px-2 py-1 font-bold text-center w-28 uppercase">
                      DATE
                    </td>
                    <td className="border-[1.5px] border-black px-2 py-1 flex items-center justify-center font-bold">
                      <Field
                        type="date"
                        value={invoiceDate}
                        onChange={setInvoiceDate}
                        className="no-print font-bold text-center"
                      />
                      <span className="hidden print:block font-bold whitespace-nowrap">
                        {formatDate(invoiceDate).toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border-[1.5px] border-black px-2 py-1 font-bold text-center">
                      QuotationNo
                    </td>
                    <td className="border-[1.5px] border-black px-2 py-1 text-center font-bold uppercase">
                      <Field
                        value={invoiceNo}
                        onChange={setInvoiceNo}
                        placeholder="581-2026"
                        className="text-center italic"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border-[1.5px] border-black px-2 py-1 font-bold text-center uppercase">
                      REF #/PO
                    </td>
                    <td className="border-[1.5px] border-black px-2 py-1 text-center">
                      <Field
                        value={shipTo}
                        onChange={store.setField.bind(null, "shipTo")}
                        placeholder=""
                        className="text-center"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border-[1.5px] border-black px-2 py-1 font-bold text-center">
                      SalesType
                    </td>
                    <td className="border-[1.5px] border-black px-2 py-1 text-center">
                      <Field
                        value={placeOfSupply}
                        onChange={store.setField.bind(null, "placeOfSupply")}
                        placeholder="Interstate Sale"
                        className="text-center"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
            <table className="w-full border-collapse border-[2px] border-black text-[10px] sm:text-[11px] font-sans">
              <thead>
                <tr className="font-bold text-center uppercase border-b-[2px] border-black">
                  <th className="border-r-[1.5px] border-black px-1 py-1 w-8">S.No.</th>
                  <th className="border-r-[1.5px] border-black px-2 py-1 text-center">
                    DESCRIPTION
                  </th>
                  <th className="border-r-[1.5px] border-black px-1 py-1 w-20">Unit Price</th>
                  <th className="border-r-[1.5px] border-black px-1 py-1 w-12">GST</th>
                  <th className="border-r-[1.5px] border-black px-1 py-1 w-12">Qty.</th>
                  <th className="border-black px-1 py-1 w-24">AMOUNT</th>
                  <th className="no-print border-l-[1.5px] border-black w-6"></th>
                </tr>
              </thead>
              <tbody className="align-top">
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b-[1px] border-black">
                    <td className="border-r-[1.5px] border-black px-1 py-2 text-center text-[10px]">
                      {i + 1}
                    </td>
                    <td className="border-r-[1.5px] border-black px-2 py-2">
                      <AreaField
                        value={item.description}
                        onChange={(v) => updateItem(item.id, { description: v })}
                        placeholder="Description"
                        className="font-bold leading-tight"
                      />
                    </td>
                    <td className="border-r-[1.5px] border-black px-1 py-2 text-center">
                      <NumField
                        value={item.rate}
                        onChange={(v) => updateItem(item.id, { rate: v })}
                        step={0.01}
                        className="w-full text-center"
                      />
                    </td>
                    <td className="border-r-[1.5px] border-black px-1 py-2 text-center">
                      {gstRate}%
                    </td>
                    <td className="border-r-[1.5px] border-black px-1 py-2 text-center">
                      <NumField
                        value={item.qty}
                        onChange={(v) => updateItem(item.id, { qty: v })}
                        step={1}
                        className="w-full text-center"
                      />
                    </td>
                    <td className="px-1 py-2 text-center font-bold relative">
                      <div className="absolute top-2 left-1">₹</div>
                      {money((item.qty || 0) * (item.rate || 0)).replace("₹", "")}
                    </td>
                    <td className="no-print border-l-[1.5px] border-black px-1 py-2 text-center align-middle">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:bg-destructive/10 rounded px-1"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Optional Empty Rows to fill space if needed */}
                {[...Array(Math.max(0, 3 - items.length))].map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b-[1px] border-black h-16">
                    <td className="border-r-[1.5px] border-black"></td>
                    <td className="border-r-[1.5px] border-black"></td>
                    <td className="border-r-[1.5px] border-black"></td>
                    <td className="border-r-[1.5px] border-black"></td>
                    <td className="border-r-[1.5px] border-black"></td>
                    <td className=""></td>
                    <td className="no-print border-l-[1.5px] border-black"></td>
                  </tr>
                ))}

                <tr className="border-t-[2px] border-black h-8">
                  <td
                    colSpan={2}
                    className="border-r-[1.5px] border-black px-4 py-1 text-right text-[10px]"
                  >
                    Packing&amp; Forwarding
                  </td>
                  <td
                    colSpan={3}
                    className="border-r-[1.5px] border-black px-2 py-1 text-center text-[10px]"
                  >
                    Separate
                  </td>
                  <td className="px-1 py-1 text-center font-bold">
                    <NumField
                      value={packingCharge}
                      onChange={setPackingCharge}
                      step={0}
                      className="w-full text-center no-print"
                    />
                    <span className="hidden print:block">{money(packingCharge)}</span>
                  </td>
                  <td className="no-print border-l-[1.5px] border-black"></td>
                </tr>

                <tr className="border-t-[2px] border-black font-bold h-10">
                  <td
                    colSpan={2}
                    className="px-4 py-1 text-center border-r-[1.5px] border-black flex flex-col justify-center h-full"
                  >
                    <span>Total amount</span>
                    <span className="text-[9px] font-normal leading-none">(Inclusive of GST)</span>
                  </td>
                  <td
                    colSpan={4}
                    className="px-2 py-1 text-center border-r-[0px] border-black text-[11px]"
                  >
                    <div className="flex justify-center items-center gap-1 font-bold">
                      <span>₹</span>
                      <span>{money(totals.grandTotal).replace("₹", "")}</span>
                    </div>
                  </td>
                  <td className="no-print border-l-[1.5px] border-black"></td>
                </tr>
              </tbody>
            </table>
            <button
              onClick={addItem}
              className="no-print mt-2 text-xs border border-dashed border-ink/40 p-1 w-full text-center hover:bg-ink/5"
            >
              + Add Item
            </button>

            <div className="no-print mt-2 flex justify-end items-center gap-2 text-xs font-mono">
              <span>GST Rate:</span>
              <input
                type="number"
                value={gstRate}
                onChange={(e) => store.setField("gstRate", Number(e.target.value))}
                className="border p-1 w-16"
              />{" "}
              %
            </div>
          </div>

          <div className="mt-8 text-[11px] flex justify-between">
            <div className="w-2/3">
              <p className="font-bold mb-1">Terms and Conditions:</p>
              <AreaField
                value={terms}
                onChange={setTerms}
                rows={4}
                className="w-full text-[10px] leading-tight font-sans"
                placeholder="Terms and conditions..."
              />
            </div>
            <div className="w-1/3 flex flex-col justify-end items-end pb-2 pr-4 relative">
              <ImageSlot
                value={signature}
                onChange={setSignature}
                label="Upload signature"
                className="h-14 w-28 shrink-0 object-contain mb-1"
              />
              <div className="text-[11px] italic font-bold">For {seller.name}</div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
