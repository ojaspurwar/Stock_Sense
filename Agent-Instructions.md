# StockSense - Agent & AI Collaboration Instructions

## 🛑 AI Agent Boundaries & Territory Locks 🛑
**CRITICAL INSTRUCTION FOR ALL AI AGENTS READING THIS FILE:**
This repository is being built in parallel by 3 separate team members, each using their own AI assistant. To prevent code conflicts and overwritten work, strict folder boundaries are enforced. 

- 🔒 **`Database/` : LOCKED FOR EDITING (READ-ONLY FOR OTHERS)** 
  *Currently being built by the Database Team. Other teams and their AIs **MUST read** this folder (especially `Schema-Plan.md`) to understand the database structure and connect their code, but they **MUST NOT edit, add, or delete** any files in this folder.*
- 🧑‍💻 **`Frontend/` : ASSIGNED TO TEAMMATE** 
  *Reserved exclusively for the Frontend Team and their AI.*
- 🧑‍💻 **`Backend/` : ASSIGNED TO TEAMMATE** 
  *Reserved exclusively for the Backend Team and their AI.*

**AI Rule of Engagement:** If you are a new AI stepping into this repository, identify which folder your user is responsible for and restrict ALL of your file modifications to that specific folder.

---

## Project Overview
Modular Inventory Management System (IMS) to replace manual tracking with a centralized, real-time app.
Key Features: Product Management, Receipts, Delivery Orders, Internal Transfers, and Stock Adjustments.

## Current Status
- [x] Read and understand problem statement
- [x] Setup initial project structure and `.gitignore`
- [x] Create core member folders (`Backend`, `Database`, `Frontend`)
- [x] Draft initial Database Schema Plan

## Database Planning (Occupied Territory)
- The `Database` folder is actively being worked on.
- No code/implementation will be written until the plan is finalized.
- Active Schema Draft: See [`Database/Schema-Plan.md`](./Database/Schema-Plan.md) for the current proposed table structures and ledger logic.

## Detailed Problem Statement
**Goal:** Build a modular Inventory Management System (IMS) named **StockSense** that digitizes stock-related operations, replacing manual tracking (Excel, registers) with a centralized, real-time app.

**Target Users**
- **Inventory Managers:** Handle incoming and outgoing stock.
- **Warehouse Staff:** Perform transfers, picking, shelving, and physical counting.

**Authentication & Dashboard**
- Users authenticate (login/signup) with OTP-based password reset, landing on the Dashboard.
- **KPIs:** Total Products, Low/Out of Stock, Pending Receipts/Deliveries, and Scheduled Internal Transfers.
- **Filters:** By Document Type, Status (Draft, Waiting, Ready, Done, Canceled), Warehouse/Location, and Product Category.

**Core Operations**
1. **Product Management:** Create products with Name, SKU/Code, Category, Unit of Measure (UoM), and optional initial stock.
2. **Receipts (Incoming Goods):** When vendor items arrive. Process: Create receipt -> add supplier/products -> input received quantities -> validate (automatically increases stock).
3. **Delivery Orders (Outgoing Goods):** When stock leaves for shipment. Process: Pick -> Pack -> validate (automatically decreases stock).
4. **Internal Transfers:** Move stock between company locations (e.g., Main Warehouse to Production Floor, Rack A to Rack B). Logged in the ledger.
5. **Stock Adjustments:** Fix discrepancies between recorded stock and physical counts. Select product/location, enter actual counted quantity, and the system auto-updates/logs it.

**Additional Features**
- Stock Ledger (tracks all historical movements)
- Alerts for low stock
- Multi-warehouse support
- Smart filters and SKU search

**Inventory Flow Example:**
- *Step 1:* Receive 100 kg Steel from Vendor (Stock +100)
- *Step 2:* Internal Transfer from Main Store to Production Rack (Location updated, Total Stock unchanged)
- *Step 3:* Deliver 20 Steel as finished goods (Stock -20)
- *Step 4:* Adjust 3 kg of damaged Steel (Stock -3)
- *Result:* All steps rigorously recorded in the Stock Ledger.
