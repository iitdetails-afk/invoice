import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as getIDB, set as setIDB, del as delIDB } from "idb-keyval";
import {
  defaultBuyer,
  defaultSeller,
  defaultBank,
  defaultItems,
  defaultTerms,
} from "@/lib/invoice";
import type { Party, Bank, LineItem, DocType, SalesType, TaxMode } from "@/lib/invoice";

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const generateInvoiceNumber = (savedInvoices: InvoiceData[] = []) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const endYear = (startYear + 1).toString().slice(-2);

  let maxSeq = 0;
  const fySuffix = `${startYear}-${endYear}`;
  for (const inv of savedInvoices) {
    if (inv.invoiceNo && inv.invoiceNo.endsWith(fySuffix)) {
      const parts = inv.invoiceNo.split("-");
      if (parts.length === 3 && parts[0]) {
        const seq = parseInt(parts[0], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, "0");
  return `${nextSeq}-${fySuffix}`;
};
const uid = () =>
  Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9);

export interface InvoiceData {
  docType: DocType;
  salesType: SalesType;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  placeOfSupply: string;
  seller: Party;
  buyer: Party;
  shipTo: string;
  bank: Bank;
  logo: string;
  seal: string;
  signature: string;
  terms: string;
  items: LineItem[];
  discountValue: number;
  discountIsPercent: boolean;
  gstRate: number;
  gstInclusive: boolean;
  taxMode: TaxMode;
  roundOffEnabled: boolean;
  packingCharge: number;
}

export interface InvoiceState extends InvoiceData {
  savedInvoices: InvoiceData[];
  isHydrated: boolean;
  setField: <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => void;
  setNestedField: <P extends "seller" | "buyer" | "bank", K extends keyof InvoiceData[P]>(
    parent: P,
    field: K,
    value: InvoiceData[P][K],
  ) => void;
  updateItem: (id: string, patch: Partial<LineItem>) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  saveCurrentInvoice: () => void;
  loadInvoice: (invoiceNo: string) => void;
  deleteInvoice: (invoiceNo: string) => void;
  resetForm: () => void;
  clearAllInfo: () => void;
  resetPartyToDefault: () => void;
}

const getDefaultData = (savedInvoices: InvoiceData[] = []): InvoiceData => ({
  docType: "Tax Invoice",
  salesType: "Credit",
  invoiceNo: generateInvoiceNumber(savedInvoices),
  invoiceDate: "",
  dueDate: "",
  placeOfSupply: "",
  seller: defaultSeller,
  buyer: defaultBuyer,
  shipTo: "",
  bank: defaultBank,
  logo: "/logo-bg-removed.png",
  seal: "",
  signature: "",
  terms: defaultTerms,
  items: defaultItems(),
  discountValue: 5,
  discountIsPercent: true,
  gstRate: 18,
  gstInclusive: false,
  taxMode: "intra",
  roundOffEnabled: true,
  packingCharge: 0,
});

const getSafeStorage = () => ({
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;

    try {
      // 1. Try IndexedDB
      const idbVal = await getIDB(name);
      if (idbVal !== undefined && idbVal !== null) {
        return typeof idbVal === "string" ? idbVal : JSON.stringify(idbVal);
      }

      // 2. Fallback to localStorage and migrate to IDB
      try {
        const local = localStorage.getItem(name);
        if (local) {
          setIDB(name, local).catch(() => {});
          return local;
        }

        // 3. Fallback to older storage keys (v1)
        const v1 = localStorage.getItem("invoice-storage");
        if (v1) {
          setIDB(name, v1).catch(() => {});
          return v1;
        }
      } catch (e) {
        console.warn("localStorage read error", e);
      }
    } catch (err) {
      console.warn("IndexedDB read error, trying fallback", err);
      try {
        return localStorage.getItem(name) || localStorage.getItem("invoice-storage") || null;
      } catch {
        return null;
      }
    }
    return null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;

    let idbOk = false;
    try {
      await setIDB(name, value);
      idbOk = true;
    } catch (err) {
      console.warn("setIDB error", err);
    }

    // Backup to localStorage
    try {
      localStorage.setItem(name, value);
    } catch (e: unknown) {
      const err = e as { name?: string; code?: number };
      // Handle QuotaExceededError without crashing the application
      if (err?.name === "QuotaExceededError" || err?.code === 22) {
        try {
          const parsed = JSON.parse(value);
          if (parsed?.state?.savedInvoices && Array.isArray(parsed.state.savedInvoices)) {
            // Strip heavy base64 strings from historical items for the localStorage backup
            parsed.state.savedInvoices = parsed.state.savedInvoices.map((inv: InvoiceData) => ({
              ...inv,
              logo: "",
              seal: "",
              signature: "",
            }));
            localStorage.setItem(name, JSON.stringify(parsed));
          }
        } catch {
          if (!idbOk) {
            console.error("Storage quota exceeded and IndexedDB unavailable", e);
          }
        }
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      await delIDB(name);
    } catch {}
    try {
      localStorage.removeItem(name);
      localStorage.removeItem("invoice-storage");
    } catch {}
  },
});

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      ...getDefaultData(),
      savedInvoices: [],
      isHydrated: false,

      setField: (field, value) => set({ [field]: value }),
      setNestedField: (parent, field, value) =>
        set((state: InvoiceState) => ({ [parent]: { ...state[parent], [field]: value } })),
      updateItem: (id, patch) =>
        set((state) => ({ items: state.items.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      addItem: () =>
        set((state) => ({
          items: [...state.items, { id: uid(), description: "", hsn: "", qty: 1, rate: 0 }],
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.length > 1 ? state.items.filter((r) => r.id !== id) : state.items,
        })),

      saveCurrentInvoice: () => {
        const state = get();
        const currentData: InvoiceData = {
          docType: state.docType,
          salesType: state.salesType,
          invoiceNo: state.invoiceNo || generateInvoiceNumber(state.savedInvoices),
          invoiceDate: state.invoiceDate || today(),
          dueDate: state.dueDate,
          placeOfSupply: state.placeOfSupply,
          seller: { ...state.seller },
          buyer: { ...state.buyer },
          shipTo: state.shipTo,
          bank: { ...state.bank },
          logo: state.logo,
          seal: state.seal,
          signature: state.signature,
          terms: state.terms,
          items: (state.items || []).map((it) => ({ ...it })),
          discountValue: state.discountValue,
          discountIsPercent: state.discountIsPercent,
          gstRate: state.gstRate,
          gstInclusive: state.gstInclusive,
          taxMode: state.taxMode,
          roundOffEnabled: state.roundOffEnabled,
          packingCharge: state.packingCharge,
        };

        set((prev) => {
          const prevSaved = Array.isArray(prev.savedInvoices) ? prev.savedInvoices : [];
          const existingIdx = prevSaved.findIndex(
            (inv) => inv && inv.invoiceNo === currentData.invoiceNo,
          );
          if (existingIdx >= 0) {
            const newSaved = [...prevSaved];
            newSaved[existingIdx] = currentData;
            return { savedInvoices: newSaved };
          } else {
            return { savedInvoices: [currentData, ...prevSaved] };
          }
        });
      },

      loadInvoice: (invoiceNo: string) => {
        const state = get();
        const prevSaved = Array.isArray(state.savedInvoices) ? state.savedInvoices : [];
        const found = prevSaved.find((inv) => inv && inv.invoiceNo === invoiceNo);
        if (found) {
          set({
            ...found,
            seller: { ...defaultSeller, ...(found.seller || {}) },
            buyer: { ...defaultBuyer, ...(found.buyer || {}) },
            bank: { ...defaultBank, ...(found.bank || {}) },
            logo: found.logo || state.logo || "/logo.png",
            seal: found.seal || state.seal || "",
            signature: found.signature || state.signature || "",
            items: (found.items || []).map((it) => ({
              id: it.id || uid(),
              description: it.description || "",
              hsn: it.hsn || "",
              qty: typeof it.qty === "number" ? it.qty : 1,
              rate: typeof it.rate === "number" ? it.rate : 0,
            })),
          });
        }
      },

      resetForm: () => {
        const state = get();
        const currentLogo = state.logo;
        const currentSeal = state.seal;
        const currentSig = state.signature;
        const currentSeller = state.seller;
        const currentBank = state.bank;
        set({
          ...getDefaultData(state.savedInvoices),
          seller: currentSeller,
          bank: currentBank,
          logo: currentLogo,
          seal: currentSeal,
          signature: currentSig,
        });
      },

      deleteInvoice: (invoiceNo: string) => {
        set((prev) => ({
          savedInvoices: (Array.isArray(prev.savedInvoices) ? prev.savedInvoices : []).filter(
            (inv) => inv && inv.invoiceNo !== invoiceNo,
          ),
        }));
      },

      clearAllInfo: () => {
        set({
          docType: "Tax Invoice",
          invoiceNo: "",
          invoiceDate: "",
          dueDate: "",
          placeOfSupply: "",
          seller: {
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
          },
          buyer: {
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
          },
          bank: { accountName: "", bankName: "", accountNumber: "", branch: "", ifsc: "", upi: "" },
          shipTo: "",
          logo: get().logo,
          seal: "",
          signature: "",
          items: [{ id: uid(), description: "", hsn: "", qty: 1, rate: 0 }],
          discountValue: 0,
          gstRate: 0,
          packingCharge: 0,
        });
      },

      resetPartyToDefault: () => {
        set({
          seller: defaultSeller,
          buyer: defaultBuyer,
          bank: defaultBank,
        });
      },
    }),
    {
      name: "invoice-storage-v2",
      storage: createJSONStorage(getSafeStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("Hydration failed", error);
        }
        useInvoiceStore.setState({ isHydrated: true });
      },
      merge: (persistedState: unknown, currentState: InvoiceState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return { ...currentState, isHydrated: true };
        }
        const pState = persistedState as Partial<InvoiceState>;
        const rawSaved = Array.isArray(pState.savedInvoices) ? pState.savedInvoices : [];
        const validSaved = rawSaved.filter((inv): inv is InvoiceData => Boolean(inv && inv.invoiceNo));

        return {
          ...currentState,
          ...pState,
          isHydrated: true,
          savedInvoices: validSaved,
          seller: { ...currentState.seller, ...(pState.seller || {}) },
          buyer: { ...currentState.buyer, ...(pState.buyer || {}) },
          bank: {
            ...currentState.bank,
            ...(pState.bank || {}),
            upi:
              !pState.bank?.upi || pState.bank?.upi === "9003446612"
                ? "indianinfotech@idfcbank"
                : pState.bank.upi,
          },
          items:
            Array.isArray(pState.items) && pState.items.length > 0
              ? pState.items.map((i: Partial<LineItem>) => ({
                  id: i.id || uid(),
                  description: i.description || "",
                  hsn: i.hsn || "",
                  qty: typeof i.qty === "number" ? i.qty : 1,
                  rate: typeof i.rate === "number" ? i.rate : 0,
                }))
              : currentState.items,
        };
      },
    },
  ),
);
