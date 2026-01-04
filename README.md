# Ahsania S&S Management System

A comprehensive management system for tracking inventory, services, sales, and analytics. Built with Next.js, SQLite (Turso), and designed for scalability.

## 🚀 Features

*   **Dashboard:** Real-time overview of sales, stock, and performance metrics.
*   **Inventory Management:**
    *   **Products:** Track stock, buy/sell prices, and categories.
    *   **Services:** Manage service offerings and pricing.
    *   **Categories:** Organize items dynamically.
*   **Point of Sale (POS):**
    *   Fast and efficient checkout interface.
    *   Support for Barcode Scanners (future) and Manual Search.
    *   Custom pricing and quantity adjustments.
    *   Mobile-first design for on-the-go usage.
*   **User Management:** Role-based access (Admin/User).
*   **Analytics:** Daily sales reports and trend analysis.

## 🛠 Tech Stack

*   **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
*   **Database:** [Turso](https://turso.tech/) (LibSQL/SQLite)
*   **Styling:** CSS Modules / Global CSS (with CSS Variables)
*   **Deployment:** Vercel

## 📂 Project Structure

*   `app/` - Main application routes and API endpoints.
    *   `api/` - Backend logic (Next.js Route Handlers).
    *   `inventory/`, `pos/`, `dashboard/` - Frontend pages.
*   `components/` - Reusable UI components.
    *   `ui/` - Atomic components (Buttons, Inputs).
    *   `pos/` - POS-specific components.
*   `lib/` - Utility functions (Database connection).
*   `scripts/` - Database initialization and maintenance scripts.

## ⚡ Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd solitary-meteorite
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file with your Turso credentials:
    ```env
    TURSO_DATABASE_URL=libsql://...
    TURSO_AUTH_TOKEN=...
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 📖 Documentation

*   [Deployment Guide](./DEPLOY.md) - How to deploy to Vercel.
*   [UI Integration Guide](./UI_INTEGRATION_GUIDE.md) - Workflow for generating UI components from Figma.
*   [Architecture](./ARCHITECTURE.md) - Deep dive into the system design and database schema.
