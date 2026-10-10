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
  logo: "/logo.png",
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

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      ...getDefaultData(),
      savedInvoices: [],

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
          invoiceNo: state.invoiceNo,
          invoiceDate: state.invoiceDate,
          dueDate: state.dueDate,
          placeOfSupply: state.placeOfSupply,
          seller: state.seller,
          buyer: state.buyer,
          shipTo: state.shipTo,
          bank: state.bank,
          logo: state.logo,
          seal: state.seal,
          signature: state.signature,
          terms: state.terms,
          items: state.items,
          discountValue: state.discountValue,
          discountIsPercent: state.discountIsPercent,
          gstRate: state.gstRate,
          gstInclusive: state.gstInclusive,
          taxMode: state.taxMode,
          roundOffEnabled: state.roundOffEnabled,
          packingCharge: state.packingCharge,
        };

        set((prev) => {
          const existingIdx = prev.savedInvoices.findIndex(
            (inv) => inv.invoiceNo === currentData.invoiceNo,
          );
          if (existingIdx >= 0) {
            const newSaved = [...prev.savedInvoices];
            newSaved[existingIdx] = currentData;
            return { savedInvoices: newSaved };
          } else {
            return { savedInvoices: [currentData, ...prev.savedInvoices] };
          }
        });
      },

      loadInvoice: (invoiceNo: string) => {
        const state = get();
        const found = state.savedInvoices.find((inv) => inv.invoiceNo === invoiceNo);
        if (found) {
          set({ ...found });
        }
      },

      resetForm: () => {
        const currentLogo = get().logo;
        set({ ...getDefaultData(get().savedInvoices), logo: currentLogo });
      },

      deleteInvoice: (invoiceNo: string) => {
        set((prev) => ({
          savedInvoices: prev.savedInvoices.filter((inv) => inv.invoiceNo !== invoiceNo),
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
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const value = await getIDB(name);
          if (value === undefined) {
            const local = localStorage.getItem(name);
            if (local) return local;
          }
          return value || null;
        },
        setItem: async (name, value) => {
          await setIDB(name, value);
        },
        removeItem: async (name) => {
          await delIDB(name);
        },
      })),
      merge: (persistedState: unknown, currentState: InvoiceState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        const pState = persistedState as Partial<InvoiceState>;
        return {
          ...currentState,
          ...pState,
          seller: { ...currentState.seller, ...(pState.seller || {}) },
          buyer: { ...currentState.buyer, ...(pState.buyer || {}) },
          bank: { ...currentState.bank, ...(pState.bank || {}) },
          items: pState.items
            ? pState.items.map((i: Partial<LineItem>) => ({
                id: uid(),
                description: "",
                hsn: "",
                qty: 1,
                rate: 0,
                ...i,
              }))
            : currentState.items,
        };
      },
    },
  ),
);
