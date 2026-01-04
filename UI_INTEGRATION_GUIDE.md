# UI Integration Guide: POS System (React + Tailwind)

This guide documents the frontend implementation of the Point of Sale (POS) system. It details the component structure, state management, and data contracts required for full integration with the Next.js backend.

---

## 📂 Project Structure

The project follows a component-based architecture using **Next.js**, **React**, and **Tailwind CSS**.

```
/
├── app/pos/page.js             ✅ Main Entry Point (renders PosContainer)
├── components/pos/
│   ├── PosContainer.tsx        ✅ Central Logic Hub (State, Fetch, Logic)
│   ├── Header.tsx              ✅ Top Search & Filter Bar
│   ├── ProductItem.tsx         ✅ Interactive Product Card
│   └── BottomBar.tsx           ✅ Total & Checkout Action
├── lib/
│   └── utils.ts                ✅ Utility for class merging (cn)
```

---

## 📦 Product Data Structure

Each product fetched from the API (`/api/inventory/products`) is mapped to this structure:

```typescript
interface Product {
  id: string;               // Unique from DB
  productName: string;      // Product name
  productImage: string | null;  // URL (optional)
  buyingPrice: number;      // Cost price (backend only)
  sellingPrice: number;     // Selling price (default)
}
```

---

## 🧩 Components Documentation

### **1. PosContainer** (`components/pos/PosContainer.tsx`)
**Purpose:** The brain of the POS. It manages all state and logic.
- **State:**
  - `products`: Fetched from `/api/inventory/products`.
  - `selectedIds`: Set of selected product IDs.
  - `quantities`: Map of ID -> Quantity.
  - `priceOptions`: Map of ID -> 'fixed' | 'custom'.
  - `customPrices`: Map of ID -> custom price value.
  - `searchTerm`: Search input value.
- **Logic:**
  - **Fetching:** Loads products on mount.
  - **Filtering:** Filters products by `searchTerm`.
  - **Total Calculation:** Dynamically calculates total based on selection and price mode.
  - **Checkout:** Aggregates order data and POSTs to `/api/sales`.

### **2. ProductItem** (`components/pos/ProductItem.tsx`)
**Purpose:** Visual representation of a product.
- **Features:**
  - **Collapsed:** Simple view with Name & Price.
  - **Expanded:** Quantity controls, Price mode toggle (Fixed vs Custom).
- **Props:** Controlled by `PosContainer`.

### **3. Header** (`components/pos/Header.tsx`)
**Purpose:** Search and filtering.
- **Props:** `searchTerm`, `onSearchChange`.

### **4. BottomBar** (`components/pos/BottomBar.tsx`)
**Purpose:** Checkout trigger.
- **Props:** `total`, `onCheckout`.

---

## 🔄 Backend Integration Status

### ✅ Phase 1: Data Binding (Complete)
- **Fetching:** `PosContainer` correctly fetches from `/api/inventory/products`.
- **Mapping:** Data is mapped from DB fields (`name`, `cost_price`, `sell_price`) to Frontend fields (`productName`, `buyingPrice`, `sellingPrice`).
- **Filtering:** Search functionality is implemented locally on the fetched dataset.

### ✅ Phase 2: Checkout Logic (Complete)
- **Ordering:** `handleCheckout` constructs a clean payload:
  ```json
  {
    "items": [
        { "id": "1", "type": "product", "quantity": 2, "price": 200 }
    ],
    "payment_method": "cash",
    "total_amount": 400,
    "user_id": 1
  }
  ```
- **Submission:** POSTs to `/api/sales`.
- **Feedback:** Alerts user on success/failure and resets state.

---

## 🎯 Quick Reference for Developers
1. **Price Modes:**
   - **Fixed:** Uses `sellingPrice` from DB.
   - **Custom:** User manually overrides price for that transaction.
2. **Total Math:** `Sum( (Price_Mode_Value) * Quantity )` for all selected items.
3. **State Reset:** After a successful sale, all selections and quantities are cleared.

---

**Last Updated:** December 18, 2025
**Status:** ✅ Fully Integrated & Functional
