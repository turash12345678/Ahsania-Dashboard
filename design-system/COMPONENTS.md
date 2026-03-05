# Component Catalog

This document lists the reusable components available in the project.

## 🧩 Core Components

| Component Name | File Path | Description |
|----------------|-----------|-------------|
| **Sidebar** | `components/Sidebar.js` | Main navigation sidebar. |
| **ProductDetailsSidebar** | `components/ProductDetailsSidebar.js` | Sidebar for specific product details. |
| **CategoryManagerModal** | `components/CategoryManagerModal.js` | Modal for managing categories. |

## 📦 UI Primitives (Shadcn/UI based)

*Located in `components/ui/`* (To be populated as we migrate/add more)

- `Button`
- `Input`
- `Dialog` (Modal)
- `Sheet` (Sidebar/Drawer)

## 📍 How to Find Components

When asking the AI to modify a component, refer to it by its functional name. For example:

- "Edit the **Main Sidebar**" -> `components/Sidebar.js`
- "Update the **Product List**" -> `app/inventory/products/page.js`
- "Change the **POS Interface**" -> `components/pos/...`

## 📝 Creating New Components

1.  Create the file in `components/` (or a subdirectory like `components/ui` for primitives).
2.  Add it to this list.
3.  Use **Pencil.dev** to visually style it.
