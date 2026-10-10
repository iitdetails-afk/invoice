# Easy Invoice Pro

Here is a comprehensive prompt you can feed into an AI coding assistant, website builder, or development team to build your invoicing application:

---

**System Role & Objective:**

You are an expert full-stack developer and UI/UX designer. Your task is to build a responsive, modern web application for generating, previewing, and downloading professional Tax Invoices and Bills. The app should have dynamic, editable fields, automated financial calculations, and print/PDF export readiness.

### 1. Key Modules & Layout

- **Header & Metadata:**
- Document Title: Toggle between "Tax Invoice", "Bill of Supply", or "Cash Memo".
- Invoice Number (Auto-increment or custom input).
- Invoice Date and Due Date pickers.
- Sales Type selector: **Cash** or **Credit**.

- **Business Profiles (Two-Column Layout):**
- **Seller / "From" Details (Editable):**
- Company Name & Logo upload.
- Full Address (Street, City, State, PIN).
- GSTIN / Tax ID.
- Contact Person, Phone Number, and Email.

- **Buyer / "Bill To" Details (Editable):**
- Client / Customer Name or Company Name.
- Billing & Shipping Addresses.
- Client GSTIN (Optional/Conditional).
- Contact Person, Phone Number, and Email.

- **Line Items Table (Dynamic Add/Remove Rows):**
- Columns:

1. **S.No** (Auto-indexed).
2. **Item Description / Service**.
3. **HSN / SAC Code**.
4. **Quantity** (Numeric).
5. **Unit Price (Rate)** (Numeric).
6. **Taxable Amount / Total** (Formula: `Quantity * Unit Price`).

- "Add New Item" button and per-row delete button.

- **Calculations & Summary Block:**
- Subtotal calculation across all line items.
- Discount input (Percentage or flat amount).
- Tax breakdown:
- CGST + SGST (for intra-state sales) or IGST (for inter-state sales) with selectable percentage slabs (e.g., 0%, 5%, 12%, 18%, 28%).

- Round-off toggle/adjustment.
- **Grand Total** (Rendered clearly in bold numbers and dynamically converted to "Amount in Words").

- **Payment & Banking Details:**
- Bank Account Name.
- Account Number & IFSC / Routing Code.
- Bank Name & Branch.
- UPI ID and dynamically generated UPI QR Code based on Grand Total.

- **Footer, Legal & Authentication:**
- Terms & Conditions text area.
- Digital placeholder for **Company Seal / Stamp** (image upload).
- Authorized Signatory area (image upload or manual signature canvas) with date.

### 2. Functional & Technical Requirements

- **Tech Stack:** React / Next.js with Tailwind CSS (or pure HTML/CSS/JavaScript with clean styling).
- **PDF / Print Export:** Include a "Download PDF" and "Print Invoice" button that outputs a clean, print-friendly A4 sheet (`@media print` optimized, hiding UI controls and buttons).
- **Local Persistence:** Save the seller profile and bank details in `localStorage` so the user does not have to re-enter company details on every visit.
- **Input Validation:** Ensure required fields (Invoice #, Date, at least one line item) are completed before printing or exporting.

Provide the complete file structure, clean component code, and calculation logic.

---

Would you prefer this built as a single-page standalone HTML/JS application, or as a React/Vite project?

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f3021f53-33ad-4176-a7cb-530748170bcc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
