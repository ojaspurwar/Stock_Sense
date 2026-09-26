# StockSense - Mobile Application (iOS & Android)

StockSense Mobile is a real-time, modular Inventory Management System (IMS) built with **React Native** and **Expo SDK 52**. It enforces double-entry ledger inventory movements and empowers warehouse operatives and inventory managers with full mobile stock controls.

---

## 📱 Features & Completed Mobile Screens

### 1. Authentication & Security (`src/screens/auth/`)
- **Login Screen (`LoginScreen.tsx`):**
  - Sign in with email and password
  - 1-tap demo persona quick-login (`Manager` vs `Warehouse Staff`)
  - Seamless navigation to Signup and Forgot Password
- **Signup Screen (`SignupScreen.tsx`):**
  - Registration with Full Name, Email, Password, and Role selection (`MANAGER` vs `STAFF`)
- **Password Reset Screen (`ForgotPasswordScreen.tsx`):**
  - 2-step OTP flow: request 6-digit recovery code -> verify code and set new password

### 2. Operational Dashboard (`src/screens/dashboard/DashboardScreen.tsx`)
- **Multi-Warehouse / Location Switcher (`LocationHeader.tsx`):**
  - Real-time dropdown to filter stock and operations by location (Main Warehouse, Production Floor, Rack A-101, Rack B-202, Cold Storage Vault) or view consolidated "All Locations".
- **Real-Time KPIs:**
  - Total Products registered in catalog
  - Low Stock Alerts (items below reorder threshold)
  - Out of Stock counts
  - Pending Inbound Receipts
  - Pending Outbound Deliveries
  - Scheduled Internal Transfers
- **Quick Operations Launchpad:** 1-tap shortcuts to Receipts, Deliveries, Transfers, and Adjustments.
- **Urgent Stock Attention Preview:** Displays critical items below min reorder levels.

### 3. Catalog & Product Management (`src/screens/products/ProductsScreen.tsx`)
- Search by SKU or product name
- Category filter pills (Raw Materials, Fasteners, Fluids & Chemicals, Mechanical, Packaging, etc.)
- Stock status chips (`All`, `Low Stock`, `Out of Stock`)
- Live stock quantities with units of measure (kg, pcs, liters, boxes)
- Expandable location breakdown showing exact on-hand balances per storage rack/warehouse
- **Add Product Modal (Manager Role):** Create new catalog items with Name, SKU, Category, UoM, Min Reorder Level, and initial opening stock.

### 4. Operations Hub (`src/screens/operations/`)
- **Inbound Receipts (`ReceiptsScreen.tsx`):**
  - Track incoming vendor shipments
  - Filter by status (`DRAFT`, `WAITING`, `READY`, `DONE`, `CANCELED`)
  - Log new receipts with vendor details, line items, and quantities
  - **Atomic Validation:** Validates arrival, increments warehouse stock, and logs credit in the Double-Entry Ledger.
- **Outgoing Deliveries (`DeliveriesScreen.tsx`):**
  - Manage customer dispatch orders
  - Real-time source location stock verification (prevents dispatching insufficient inventory)
  - Log new delivery orders
  - **Atomic Validation:** Deducts stock from source location and logs debit in the Double-Entry Ledger.
- **Internal Transfers (`TransfersScreen.tsx`):**
  - Move stock between locations (e.g., Main Store to Production Rack, Rack A to Rack B)
  - Automatically verifies source stock
  - **Global Invariant Preserved:** Simultaneously decrements source and increments destination while keeping global inventory constant.
- **Physical Count Adjustments (`AdjustmentsScreen.tsx`):**
  - Physical audit & discrepancy reconciliation
  - Displays recorded system stock vs counted physical stock
  - Computes real-time discrepancy variance (`+` surplus or `-` loss)
  - Automatically records balancing ledger entry and synchronizes inventory.

### 5. Immutable Double-Entry Ledger (`src/screens/ledger/LedgerScreen.tsx`)
- Complete audit trail of every movement in the system
- Filter by transaction type (`RECEIPT`, `DELIVERY`, `TRANSFER`, `ADJUSTMENT`)
- Filter by specific SKU / Product
- Displays timestamp, operative name, source location, destination location, and quantity change.

---

## 🛠️ Technology Stack
- **Framework:** Expo 52 + React Native 0.76 (TypeScript)
- **Navigation:** React Navigation v6 (Native Stack + Bottom Tabs)
- **Local Persistence:** `@react-native-async-storage/async-storage`
- **Icons:** `@expo/vector-icons` (Ionicons)
- **Design System:** Native clean mobile design, responsive Safe Area layout

---

## 🚀 Running the App

### 1. Start Expo Dev Server
```bash
npm start
# or
npx expo start
```

### 2. View on Device / Emulator
- **Physical Phone:** Install **Expo Go** (iOS / Android) and scan the QR code displayed in the terminal.
- **Android Emulator:** Press `a` in the terminal.
- **iOS Simulator:** Press `i` in the terminal.
- **Web Preview:** Press `w` in the terminal.

### 3. TypeScript Typecheck
```bash
npx tsc --noEmit
```
