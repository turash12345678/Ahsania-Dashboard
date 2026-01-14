# UI Integration Guide: POS System (React + Tailwind)

This guide documents the frontend implementation of the Point of Sale (POS) prototype. It is designed to help the Backend Developer understand the component structure, state management, and data contracts required for full integration.

---

## 📂 Project Structure

The project follows a component-based architecture using **React** and **Tailwind CSS**.

```
/
├── App.tsx                     ✅ Main Entry Point (State Container)
├── components/
│   ├── Header.tsx              ✅ Top Search & Filter Bar
│   ├── ProductItem.tsx         ✅ Interactive Product Card
│   ├── BottomBar.tsx           ✅ Total & Checkout Action
│   └── ui/                     ✅ Shadcn UI Components (Button, Input, etc.)
├── lib/
│   └── utils.ts                ✅ Utility for class merging (cn)
```

---

## 📦 Product Data Structure

Each product in the system follows this structure:

```typescript
interface Product {
  id: string;               // Unique identifier (e.g., "1", "2", "3")
  productName: string;      // Product name (e.g., "Pencil")
  productImage: string | null;  // URL to product image (optional)
  buyingPrice: number;      // Cost/Purchase price (e.g., 120) - Used for profit calculation
  sellingPrice: number;     // Default selling price (e.g., 200) - Used in "Fixed Price" mode
}
```

### Field Mapping Summary:
| Field Name      | Example Value | Display Location | Purpose |
|----------------|---------------|------------------|---------|
| `productName`  | "Pencil"      | Product title in list | Product identification |
| `productImage` | URL or null   | Product icon (placeholder currently) | Visual representation |
| `buyingPrice`  | 120           | **Kept in data, not shown in UI** | Your purchase/cost price - for profit calculation |
| `sellingPrice` | 200           | Shown in collapsed view + Fixed price option when selected | The price you sell at |

---

## 🧩 Components Documentation

### **1. ProductItem** (`components/ProductItem.tsx`)
**Purpose:** Represents a single product in the list. It handles selection, quantity adjustment, and price customization.
- **State:** Stateless/Controlled (Fully managed by parent).
- **Features:**
  - **Collapsed State:** Shows Name, Default Price (৳), Icon.
  - **Expanded State:** Shows Quantity Stepper, Fixed vs Custom Price Toggle.
  - **Custom Price:** Input field appears when "Custom" (Empty Box) is selected.
- **Props:**
  - `id`, `name`, `defaultPrice`
  - `isSelected`, `quantity`
  - `priceOption` ('fixed' | 'custom'), `customPrice`
  - Events: `onSelect`, `onQuantityChange`, `onPriceOptionChange`, `onCustomPriceChange`

### **2. App Container** (`/App.tsx`)
**Purpose:** The central logic hub. It manages the "Cart" state and orchestrates all child components.
- **State Management:**
  - `selectedIds`: Tracks expanded/selected items.
  - `quantities`: Maps Product ID to Quantity.
  - `priceOptions`: Maps Product ID to selected price mode.
  - `customPrices`: Maps Product ID to custom input value.
- **Total Calculation:**
  - Sum of `(Price × Quantity)` for selected items.
  - If **Fixed**: Uses `sellingPrice`.
  - If **Custom**: Uses `customPrice` value (replaces sellingPrice).

### **3. BottomBar** (`components/BottomBar.tsx`)
**Purpose:** Displays the calculated total and the primary checkout action.
**Props:** `total`, `currency`.

---

## 🔄 Backend Integration Checklist

To fully operationalize this frontend, the backend team needs to address the following:

### Phase 1: Data Binding
- [ ] **Fetch Products:** Replace `INITIAL_PRODUCTS` in `App.tsx` with API data (`GET /api/inventory/products`).
- [ ] **Map Data:** Ensure backend response matches the `Product` interface.

### Phase 2: Checkout Logic
- [ ] **Handle Checkout:** Create function to aggregate order data.
  - Payload should include: `items` (with `quantity`, `unitPrice`, `totalPrice`, `priceMode`), `grandTotal`.
- [ ] **Submit Order:** `POST /api/sales` with the payload.

---

## 🎯 Quick Reference
1. **Price Modes:**
   - **Fixed Price:** Uses `product.sellingPrice` (from DB).
   - **Custom Price:** User-entered value **replaces** selling price.
2. **Total Calculation:** Only **selected** items contribute to total.
3. **Data Flow:** Backend -> App State -> Components.

---

**Last Updated:** December 18, 2025
**Status:** ✅ UI Prototype Complete (React + Tailwind)