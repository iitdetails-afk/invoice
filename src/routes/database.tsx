import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/database")({
  component: DatabasePage,
});

interface InvoiceRecord {
  sNo?: string | number;
  invoiceNo?: string | number;
  date?: string;
  name?: string;
  buyerName?: string;
  place?: string;
  contact?: string;
  gstin?: string;
  buyerGstin?: string;
  subtotal?: string | number;
  taxAdded?: string | number;
  totalAmount?: string | number;
  "S.NO"?: string;
  Date?: string;
  "Buyer Name"?: string;
  "Place & Contact"?: string;
  Place?: string;
  Contact?: string;
  GSTIN?: string;
  Subtotal?: string | number;
  Tax?: string | number;
  Total?: string | number;
  [key: string]: unknown;
}

function DatabasePage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Fetch permanent data from Google Sheets API
    const fetchInvoices = async () => {
      setLoadingDb(true);
      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbyJ91nW0uvt1OtNxuKGkcIiiRborcpWL0JcVDdfUlw5Z4RwI_lE9w2urpIfyX70yh93dQ/exec",
        );
        const data = await response.json();
        // reverse to show newest first!
        if (Array.isArray(data)) {
          setInvoices(data.reverse());
        }
      } catch (err) {
        console.error("Could not fetch database records:", err);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchInvoices();
  }, []);

  const handleDelete = async (invoiceNo: string | number) => {
    if (!window.confirm(`Are you sure you want to delete invoice #${invoiceNo}?`)) return;

    setDeleting(String(invoiceNo));
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyJ91nW0uvt1OtNxuKGkcIiiRborcpWL0JcVDdfUlw5Z4RwI_lE9w2urpIfyX70yh93dQ/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({ action: "delete", invoiceNo: invoiceNo }),
        },
      );
      const data = await response.json();
      if (data.result === "success") {
        setInvoices((prev) =>
          prev.filter((inv) => String(inv.sNo || inv.invoiceNo) !== String(invoiceNo)),
        );
      } else {
        alert("Failed to delete record.");
      }
    } catch (err) {
      console.error("Could not delete record:", err);
      alert("Error while communicating with server.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-desk font-sans text-ink p-4 sm:p-8">
      <div className="mx-auto max-w-[1200px] rounded-[10px] bg-paper p-6 sm:p-10 shadow-[0_1px_0_rgba(0,0,0,0.04),0_28px_50px_-24px_rgba(24,34,54,0.45)] ring-1 ring-black/5">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-rule pb-4 gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Permanent Database Store (Google Sheets)
          </h1>
          <Link
            to="/form"
            className="rounded-[8px] bg-transparent px-3 py-2 text-sm font-semibold text-ink ring-1 ring-rule transition-colors hover:bg-ink/5"
          >
            &larr; Back to Form
          </Link>
        </div>

        {loadingDb ? (
          <div className="flex items-center justify-center p-10">
            <p className="text-sm text-inksoft animate-pulse">Connecting to Database...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex justify-center p-10 bg-ink/5 rounded-[8px]">
            <p className="text-sm text-inksoft">No permanent records found in Google Sheets.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-sm w-full">
            <table className="w-full text-left whitespace-nowrap border-collapse">
              <thead>
                <tr className="bg-ink/5 text-inksoft text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 rounded-tl-md font-semibold">Invoice ID</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Place</th>
                  <th className="px-4 py-3 font-semibold">Mobile Number</th>
                  <th className="px-4 py-3 font-semibold">GSTN Number</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-tr-md">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-medium">
                {invoices.map((inv, idx) => {
                  const id = String(
                    inv.sNo ||
                      inv.invoiceNo ||
                      inv["S.NO"] ||
                      inv["invoice id"] ||
                      inv["Invoice ID"] ||
                      "",
                  );
                  const isDeleting = deleting === id;

                  let placeStr = String(inv.place || inv["Place"] || inv["palce"] || "");
                  let contactStr = String(
                    inv.contact ||
                      inv["Contact"] ||
                      inv["mobile number"] ||
                      inv["Mobile Number"] ||
                      "",
                  );
                  let gstinStr = String(
                    inv.gstin ||
                      inv["GSTIN"] ||
                      inv["gstn number"] ||
                      inv["GSTN Number"] ||
                      inv["GSTIN Number"] ||
                      "",
                  );
                  const nameStr = String(
                    inv.name || inv.buyerName || inv["Buyer Name"] || inv["Name"] || "",
                  );
                  const amountStr = String(
                    inv.totalAmount || inv["Total"] || inv["amount"] || inv["Amount"] || "0.00",
                  );

                  // Fallback for legacy "Place & Contact" format
                  if (!placeStr && !contactStr && inv["Place & Contact"]) {
                    const raw = String(inv["Place & Contact"]);
                    if (raw.includes(" - ")) {
                      placeStr = raw.split(" - ")[0] || "";
                      contactStr = raw.split(" - ").slice(1).join(" - ");
                    } else {
                      contactStr = raw;
                    }
                  } else if (placeStr && placeStr.includes(" - ") && !contactStr) {
                    // If placeStr inadvertently captured the combined legacy format
                    const parts = placeStr.split(" - ");
                    placeStr = parts[0] || "";
                    contactStr = parts.slice(1).join(" - ");
                  }

                  let rawGstin = inv.buyerGstin ? String(inv.buyerGstin).trim() : "";

                  if (!placeStr && !contactStr && !gstinStr && rawGstin) {
                    if (rawGstin.includes(" | ")) {
                      const parts = rawGstin.split(" | ");
                      // Because we packed it conditionally, we must heuristically assign them back,
                      // or if we mapped 3 strict elements, we just read them.
                      // Usually: Place | Mobile | GSTIN. Let's just try to extract GSTIN and Mobile.
                      for (const part of parts) {
                        const p = part.trim();
                        if (p.length === 15 && /^[A-Z0-9]+$/i.test(p)) {
                          gstinStr = p;
                        } else if (p.match(/\b\d{10}\b/)) {
                          contactStr = p;
                        } else {
                          placeStr = placeStr ? placeStr + ", " + p : p;
                        }
                      }
                      rawGstin = "";
                    } else {
                      const mobileMatch = rawGstin.match(/\b\d{10}\b/);
                      // GSTINs are exactly 15 chars, alphanumeric.
                      const isGstinFormat = rawGstin.length === 15 && /^[A-Z0-9]+$/i.test(rawGstin);

                      if (mobileMatch && !isGstinFormat) {
                        contactStr = mobileMatch[0];
                        placeStr = rawGstin
                          .replace(mobileMatch[0], "")
                          .replace(/^[-\s]+|[-\s]+$/g, "");
                        rawGstin = ""; // consumed
                      } else if (rawGstin.includes(" - ")) {
                        const parts = rawGstin.split(" - ");
                        placeStr = parts[0]?.trim() || "";
                        contactStr = parts.slice(1).join(" - ").trim();
                        rawGstin = ""; // consumed
                      }
                    }
                  }

                  if (!gstinStr && rawGstin) {
                    gstinStr = rawGstin;
                  }

                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${isDeleting ? "bg-red-50/50 opacity-50" : "hover:bg-ink/5"}`}
                    >
                      <td className="px-4 py-3 text-accent">{id || "—"}</td>
                      <td className="px-4 py-3">{inv.date || inv["Date"] || "—"}</td>
                      <td className="px-4 py-3">{nameStr || "—"}</td>
                      <td className="px-4 py-3 leading-snug">
                        {placeStr ? (
                          <div className="text-ink max-w-[200px] truncate">{placeStr}</div>
                        ) : (
                          <span className="text-inksoft">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 leading-snug">
                        {contactStr ? (
                          <div className="text-xs text-inksoft font-normal truncate max-w-[250px]">
                            {contactStr}
                          </div>
                        ) : (
                          <span className="text-inksoft">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-inksoft font-mono">
                        {gstinStr || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">₹{amountStr}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(id)}
                          disabled={isDeleting || deleting !== null}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-[6px] text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
