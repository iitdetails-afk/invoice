export type DocType = "Tax Invoice" | "Bill of Supply" | "Cash Memo";
export type SalesType = "Cash" | "Credit";
export type TaxMode = "intra" | "inter";

export interface LineItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
}

export interface Party {
  name: string;
  street: string;
  city: string;
  state: string;
  pin: string;
  gstin: string;
  contact: string;
  phone: string;
  mobile: string;
  email: string;
}

export interface Bank {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
  upi: string;
}

export interface SellerProfile {
  seller: Party;
  bank: Bank;
  logo: string;
  seal: string;
  signature: string;
  terms: string;
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export const emptyParty = (): Party => ({
  name: "",
  street: "",
  city: "",
  state: "",
  pin: "",
  gstin: "",
  contact: "",
  phone: "",
  mobile: "",
  email: "",
});

export const defaultSeller: Party = {
  name: "Indian Info Tech",
  street: "101-C, Amma Unavagam Backside, Opp. Namakkal Bus stand",
  city: "Namakkal",
  state: "Tamil Nadu",
  pin: "",
  gstin: "33AOHPT9724R2ZY",
  contact: "",
  phone: "",
  mobile: "+91-9003446612, +91-9751919712",
  email: "iitdetails@gmail.com",
};

export const defaultBuyer: Party = emptyParty();

export const defaultBank: Bank = {
  accountName: "INDIAN INFO TECH",
  accountNumber: "10280450828",
  ifsc: "IDFB0080792",
  bankName: "IDFC Bank",
  branch: "",
  upi: "9003446612",
};

export const defaultTerms =
  "1. Goods once sold are not returnable. 2. Interest @18% p.a. on overdue invoices.";

export const defaultItems = (): LineItem[] => [
  {
    id: uid(),
    description: "Air Blower with Adapter & controller 12v,5Amps",
    hsn: "7321",
    qty: 10,
    rate: 1600,
  },
  {
    id: uid(),
    description: "Air Blower with Adapter & controller 24v.2.5Amps",
    hsn: "7321",
    qty: 10,
    rate: 1750,
  },
];

export const GST_SLABS = [0, 5, 12, 18, 28];

export const money = (n: number) =>
  "₹" +
  (Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  const t = TENS[Math.floor(n / 10)] ?? "";
  const o = ONES[n % 10] ?? "";
  return o ? `${t}-${o}` : t;
}

function indianWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  if (crore) parts.push(`${indianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

export function amountInWords(amount: number): string {
  const safe = Math.max(0, Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100);
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);
  let out = `Rupees ${indianWords(rupees)}`;
  if (paise) out += ` and ${twoDigits(paise)} Paise`;
  return `${out} Only`;
}

export interface Totals {
  subtotal: number;
  packingCharge: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  grandTotal: number;
}

export function computeTotals(opts: {
  items: LineItem[];
  packingCharge: number;
  discountValue: number;
  discountIsPercent: boolean;
  gstRate: number;
  gstInclusive: boolean;
  taxMode: TaxMode;
  roundOffEnabled: boolean;
}): Totals {
  const subtotal = opts.items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
  const rawDiscount = opts.discountIsPercent
    ? (subtotal * (opts.discountValue || 0)) / 100
    : opts.discountValue || 0;
  const discount = Math.min(Math.max(rawDiscount, 0), subtotal);
  const discountedSubtotal = subtotal - discount;

  let taxable = discountedSubtotal;
  let tax = (taxable * (opts.gstRate || 0)) / 100;

  if (opts.gstInclusive && opts.gstRate > 0) {
    taxable = (discountedSubtotal * 100) / (100 + opts.gstRate);
    tax = discountedSubtotal - taxable;
  }

  const intra = opts.taxMode === "intra";
  const cgst = intra ? tax / 2 : 0;
  const sgst = intra ? tax / 2 : 0;
  const igst = intra ? 0 : tax;

  const packingCharge = opts.packingCharge || 0;
  // If GST was inclusive, the grand total is just the pre-GST Subtotal (discountedSubtotal) + Packing.
  // We use `taxable + tax` which inherently equals `discountedSubtotal` either way!
  const beforeRound = taxable + tax + packingCharge;
  const rounded = Math.round(beforeRound);
  const roundOff = opts.roundOffEnabled ? rounded - beforeRound : 0;

  return {
    subtotal,
    packingCharge,
    discount,
    taxable,
    cgst,
    sgst,
    igst,
    roundOff,
    grandTotal: beforeRound + roundOff,
  };
}

export function upiLink(bank: Bank, seller: Party, amount: number) {
  const pa = bank.upi.trim();
  if (!pa) return "";
  const pn = encodeURIComponent(seller.name || bank.accountName || "Merchant");
  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${pn}&am=${amount.toFixed(2)}&cu=INR`;
}

export const PROFILE_KEY = "meridian-gst-seller-profile-v2";
