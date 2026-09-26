# StockSense - Agent & AI Collaboration Instructions

## 🚀 Full-Stack AI Development Mode
**Status:** The entire project (Database, Backend, Frontend) is now being developed by Ojas and this AI. All folder boundaries have been removed.

---

## Project Overview
Modular Inventory Management System (IMS) to replace manual tracking with a centralized, real-time app.
Key Features: Product Management, Receipts, Delivery Orders, Internal Transfers, and Stock Adjustments.

## Current Status
- [x] Read and understand problem statement
- [x] Setup initial project structure and `.gitignore`
- [x] Create core member folders (`Backend`, `Database`, `Frontend`)
- [x] Draft Database Schema Plan
- [x] Initialize Prisma and TypeScript in `Database/`
- [x] Sync schema to live Neon database
- [x] Write core Database TypeScript Services (`inventoryService`, `productService`, `documentService`, `kpiService`)
- [x] Create deployment and app guides for the team

## 🚀 Next Steps (For Teammates)

**For the Backend Team:**
- [ ] Initialize your Node.js/Next.js API in the `Backend/` folder.
- [ ] Import the pre-written Prisma services from the `Database/src/` folder to build your API routes.
- [ ] Deploy the API to Vercel (See `Deployment-Guide.md`).

**For the Frontend Team:**
- [ ] Initialize the React Native Expo app inside the `Frontend/` folder.
- [ ] Build the UI screens (Dashboard, Scanner, Product List).
- [ ] Connect the UI to the live Vercel API.
- [ ] Build the `.apk` using EAS (See `Deployment-Guide.md` and `Frontend-App-Guide.md`).

## Database Planning (Occupied Territory)
- The `Database` folder is fully initialized and synced with Neon!
- The core services are written in `Database/src/`.
- Active Schema Docs: See [`Database/Schema-Plan.md`](./Database/Schema-Plan.md) for table structures and ledger logic.


## 100% Complete Feature Specification (From PDF)
**Goal:** Build a modular Inventory Management System (IMS) named **StockSense** that digitizes stock-related operations, replacing manual tracking (Excel, registers) with a centralized, real-time app.

### 1. Target Users
- **Inventory Managers:** Handle incoming and outgoing stock.
- **Warehouse Staff:** Perform transfers, picking, shelving, and physical counting.

### 2. Authentication
- User sign up / log in.
- OTP-based password reset.
- Redirects directly to the Inventory Dashboard upon login.

### 3. Dashboard View & Analytics
The landing page shows a complete snapshot of inventory operations.
- **Dashboard KPIs:**
  - Total Products in Stock
  - Low Stock / Out of Stock Items
  - Pending Receipts
  - Pending Deliveries
  - Internal Transfers Scheduled
- **Dynamic Filters:**
  - By document type: Receipts / Delivery / Internal / Adjustments
  - By status: Draft, Waiting, Ready, Done, Canceled
  - By warehouse or location
  - By product category

### 4. Navigation Structure
1. **Products:** Create/update products, stock availability per location, product categories, and **reordering rules**.
2. **Operations:** Receipts (Incoming), Delivery Orders (Outgoing), Inventory Adjustment.
3. **Move History**
4. **Dashboard**
5. **Setting:** Warehouse configurations.
6. **Profile Menu (Left Sidebar):** My Profile, Logout.

### 5. Core Features & Operations
1. **Product Management:** Create products with Name, SKU/Code, Category, Unit of Measure (UoM), and optional initial stock.
2. **Receipts (Incoming Goods):** Used when items arrive from vendors.
   - *Process:* Create new receipt -> Add supplier & products -> Input quantities received -> Validate (stock increases automatically).
   - *Example:* Receive 50 units of "Steel Rods" -> stock +50.
3. **Delivery Orders (Outgoing Goods):** Used when stock leaves for customer shipment.
   - *Process:* Pick items -> Pack items -> Validate (stock decreases automatically).
   - *Example:* Sales order for 10 chairs -> Delivery order reduces chairs by 10.
4. **Internal Transfers:** Move stock inside the company.
   - *Example:* Main Warehouse -> Production Floor; Rack A -> Rack B.
   - *Note:* Each movement must be strictly logged in the ledger.
5. **Stock Adjustments:** Fix mismatches between recorded stock and physical count.
   - *Steps:* Select product/location -> Enter counted quantity -> System auto-updates and logs the adjustment.

### 6. Additional System Features
- Alerts for low stock.
- Multi-warehouse support.
- SKU search & smart filters.
- **Mockup Reference:** [Excalidraw Link](https://link.excalidraw.com/l/65VNwvy7c4X/3ENvQFu9o8R)

### 7. Simplified Inventory Flow Example
- *Step 1:* Receive Goods from Vendor (Receive 100 kg Steel -> Stock: +100).
- *Step 2:* Move to production rack (Internal Transfer: Main Store -> Production Rack. Stock unchanged in total, but new location updated).
- *Step 3:* Deliver finished goods (Deliver 20 steel -> Stock for frames: -20).
- *Step 4:* Adjust damaged items (3 kg steel damaged -> Stock: -3).
- **Result:** Everything logged immutably in the Stock Ledger.
