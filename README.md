# 📦 StockSense

<p align="center">
  <strong>Next-Generation Modular Inventory Management System & Real-Time Stock Ledger</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vite%208%20%7C%20React%2018-blue?style=for-the-badge&logo=vite&logoColor=white" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Neon-00e699?style=for-the-badge&logo=postgresql&logoColor=white" alt="Database" />
  <img src="https://img.shields.io/badge/ORM-Prisma%205.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS%20v3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</p>

---

## 🌟 Overview

**StockSense** is an enterprise-grade inventory management system designed for **Inventory Managers** and **Warehouse Staff**. Built upon the core principles of **double-entry inventory accounting**, every movement of goods—vendor receipts, internal transfers between warehouse racks, customer deliveries, and discrepancy adjustments—generates an immutable ledger entry.

The system features a bespoke **sky-blue visual aesthetic**, real-time **KPI count-up animations**, interactive **SVG step-line chart animations**, an ASCII **3D Stock Cube auth experience**, and strict input validation guards.

---

## ✨ Key Features

### 1. 📊 Live KPI Dashboard & Motion System
* **Animated KPI Counters (600ms):** Smooth `useCountUp` animation using `requestAnimationFrame` with cubic ease-out curves (`1 - (1-t)³`) for all KPI cards:
  * Total Products in Stock (with total catalog capacity)
  * Low Stock / Out of Stock alerts (with animated coral pulse indicator)
  * Pending Receipts awaiting dock inspection
  * Pending Delivery Orders queued for dispatch
  * Scheduled Internal Warehouse Transfers
* **Animated SVG Step Chart (800ms):** Displays historical stock levels with daily incoming/outgoing volume bars, coral dotted reorder minimum threshold, and an automatic stroke-drawing animation on initial load and product switch.
* **Low Stock Glass Carousel:** Auto-cycling frosted glass cards (4s interval, pause on hover) highlighting products below safe reorder thresholds.
* **Multi-Level Filtering:** Instant filtering by Document Type, Status (`DRAFT`, `WAITING`, `READY`, `DONE`, `CANCELED`), Warehouse / Rack Location, and Product Category.

### 2. 🧊 Interactive 3D Stock Cube Auth
* **Canvas ASCII Crate Simulation:** Real-time 3D rendered isometric crate stack that animates according to operation types (incoming goods for receipts, outgoing shipments for deliveries, rack hops for transfers, and discrepancy checks for adjustments).
* **OTP Password Reset:** 3-step recovery workflow (Email → 6-Digit Code → New Password) with countdown resend timer.

### 3. 📦 Operations Management
* **Receipts (Incoming Goods):** Vendor arrival workflow. Validating adds stock to the designated warehouse and writes to the ledger.
* **Delivery Orders (Outgoing Goods):** 3-stage stepper workflow (**Pick ➔ Pack ➔ Validate**) with per-line checkoff and negative-stock prevention guards.
* **Internal Transfers:** Safe relocation between warehouses and locations without changing overall stock totals.
* **Stock Adjustments:** Physical inventory recount discrepancy tool with automatic delta calculation and audit logging.

### 4. 📜 Double-Entry Stock Ledger
* Read-only immutable audit trail recording every inventory movement with timestamp, user signature, source location, destination location, and product quantities.

---

## 🎨 Design System & Palette

StockSense adheres strictly to its Sky-Blue design specification:
* **Palette:** Pure white, light grey (`#F4F6F9`), sky blues (`#1269AF` primary, `#3C8CC7`, `#7DB6E3`, `#EAF4FB`), and navy-black ink (`#000C23`).
* **Status Colors:** Coral (`#E4573D`) for alerts/cancellations, Amber (`#E9A23B`) for waiting. **No green anywhere.**
* **Typography:** `Inter Tight` for body/headings, `DM Mono` for SKUs, quantities, and reference IDs, and `Instrument Serif` (italic) for units and auth accents.
* **Micro-Interactions:** Smooth 200ms dropdown transitions, single-cycle modal & drawer dismissals without lingering overlay backdrops, and button active states.

---

## 🏛 Architecture

StockSense is organized as an npm workspaces monorepo:

```text
Stock_Sense/
├── Backend/                 # Next.js 16 Serverless API
│   ├── src/app/api/         # REST API Routes (/products, /kpis, /locations, /documents)
│   └── package.json
├── Database/                # Prisma Data Layer & Database Migrations
│   ├── prisma/
│   │   └── schema.prisma    # PostgreSQL Schema Source of Truth
│   ├── src/                 # Double-Entry Ledger Engine & Seeders
│   └── package.json
├── Frontend/                # Vite 8 + React 18 Single-Page Application
│   ├── src/
│   │   ├── components/      # UI Components (GlassCard, Stepper, Modal, Drawer, AppShell)
│   │   ├── context/         # Auth & Location Providers
│   │   ├── hooks/           # useCountUp Animation Hook
│   │   ├── lib/             # 3D ASCII Stock Cube Canvas Engine
│   │   ├── screens/         # Dashboard, Products, Operations, Auth, Ledger
│   │   ├── services/        # API Client, Offline Fallback & Mock Storage Sync
│   │   └── theme/           # Motion Tokens, Easing Curves & Dynamic Stylesheet
│   └── package.json
├── UI UX IDEA/              # Visual reference, design specs, and layout blueprints
├── HOW_TO_RUN.md            # Local Execution & Guardrails Guide
└── package.json             # Root Workspace Configuration
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Ensure `Backend/.env.local` and `Database/.env` contain your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Start the Application

```bash
# Terminal 1: Start Next.js Backend (Port 3001)
npm run dev:backend

# Terminal 2: Start Vite Frontend (Port 3000)
npm run dev:frontend
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Inventory Manager** | `sarah.connor@stocksense.io` | *(Any)* | Full administrative permissions, document approvals, catalog creation |
| **Warehouse Staff** | `john.doe@stocksense.io` | *(Any)* | Picking, staging, internal transfers, inventory counts |

* **Quick Demo Mode:** Click either 1-click demo button directly on the login screen.
* **OTP Reset Demo Code:** `849201`

---

## 🔌 API Reference

The backend exposes REST endpoints proxied under `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve catalog products (supports `?category=` and `?searchSku=`) |
| `POST` | `/api/products` | Create a new product in the catalog |
| `GET` | `/api/kpis` | Fetch live dashboard analytics and inventory counts |
| `GET` | `/api/locations` | Retrieve all warehouse, production floor, and rack locations |
| `GET` | `/api/documents` | Query documents (supports `?type=`, `?status=`, and `?locationId=`) |
| `POST` | `/api/documents` | Create a new draft document (Receipt, Delivery, Transfer, Adjustment) |
| `POST` | `/api/documents/[id]/validate` | Validate document and execute atomic double-entry ledger transactions |
| `GET` | `/api/seed` | Seed the database with demo catalog and location records |

---

## 🛡️ Critical Guardrails

> [!IMPORTANT]
> * **Tailwind v3:** Do **not** upgrade `Frontend` to Tailwind v4 (relies on v3 PostCSS plugin syntax).
> * **React Deduplication:** Do **not** remove the `dedupe: ['react', 'react-dom']` and local aliases in `Frontend/vite.config.ts`.
> * **Port Allocation:** Frontend runs on **3000**; Backend runs on **3001** with reverse proxy.

---

## 📄 License

This project is licensed under the MIT License.
