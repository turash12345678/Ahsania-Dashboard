# System Architecture

## 1. Database Schema (SQLite/Turso)

The database is designed to be relational and scalable.

### `users`
*   `id` (Integer, PK)
*   `username` (String, Unique)
*   `password` (String, Hashed)
*   `role` (String: 'admin' | 'user')

### `categories`
*   `id` (Integer, PK)
*   `name` (String)
*   `type` (String: 'product' | 'service')

### `products`
*   `id` (Integer, PK)
*   `name` (String)
*   `category_id` (FK -> categories.id)
*   `buy_price` (Real)
*   `sell_price` (Real)
*   `stock_quantity` (Integer)

### `services`
*   `id` (Integer, PK)
*   `name` (String)
*   `category_id` (FK -> categories.id)
*   `price` (Real)

### `sales`
*   `id` (Integer, PK)
*   `user_id` (FK -> users.id)
*   `total_amount` (Real)
*   `payment_method` (String: 'cash' | 'bkash' | 'nagad')
*   `created_at` (Datetime)

### `sale_items`
*   `id` (Integer, PK)
*   `sale_id` (FK -> sales.id)
*   `item_type` (String: 'product' | 'service')
*   `item_id` (Integer)
*   `quantity` (Integer)
*   `price_at_sale` (Real) - *Records the price at the time of sale, handling custom prices.*

---

## 2. Key Workflows

### POS (Point of Sale) Flow
1.  **Frontend (`app/pos/page.js`):**
    *   Fetches Products and Services.
    *   User adds items to Cart.
    *   User can modify Price and Quantity in Cart.
    *   Calculates Total.
2.  **Checkout:**
    *   Sends JSON payload to `/api/sales`.
    *   Payload: `{ items: [...], total_amount, payment_method, user_id }`
3.  **Backend (`app/api/sales/route.js`):**
    *   Starts a **Transaction**.
    *   Creates `sales` record.
    *   Iterates through items:
        *   Creates `sale_items` record.
        *   If item is a 'product', **decrements** `stock_quantity` in `products` table.
    *   Commits Transaction.
    *   Returns Success/Failure.

### Authentication (Currently Disabled)
*   *Note: Authentication is temporarily bypassed via Middleware for ease of development.*
*   **Standard Flow:**
    *   Login -> `/api/auth/login` -> Verify Password -> Set Cookie.
    *   Middleware checks Cookie for protected routes.

---

## 3. Frontend Architecture
*   **Framework:** Next.js App Router.
*   **Styling:** Global CSS Variables for theming (`app/globals.css`).
*   **State Management:** React `useState` / `useEffect` for local state. No external library (Redux/Zustand) needed yet.
