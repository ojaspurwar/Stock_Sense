# StockSense - Backend Web Service

This directory contains the **Backend REST API & Double-Entry Ledger Engine** powering the StockSense inventory management website and web portal.

## 🛠️ Tech Stack
- **Framework:** FastAPI (Python 3.11)
- **Database & ORM:** PostgreSQL + SQLAlchemy 2.0 (Async) + `asyncpg`
- **Migrations:** Alembic
- **Validation:** Pydantic v2
- **Auth:** JWT (`python-jose`) + OTP reset + Password Hashing (`passlib[bcrypt]`)

## 📁 Architecture Overview
```text
Backend/
├── app/
│   ├── api/v1/          # Route handlers (auth, products, locations, documents, ledger, dashboard)
│   ├── core/            # Config, security, database session
│   ├── models/          # SQLAlchemy ORM models (aligned with Database/Schema-Plan.md)
│   ├── schemas/         # Pydantic request/response schemas
│   └── services/        # Business logic (Ledger Engine, Document Service, Auth)
├── alembic/             # Database migrations
├── requirements.txt     # Python dependencies
├── main.py              # Application entrypoint
└── README.md
```

## 🔒 Team Boundary Rule
As established in `Agent-Instructions.md`, the Backend team and its AI agent strictly work inside `Backend/`. Database design references `../Database/Schema-Plan.md`.

## 🚀 Key Responsibilities
1. **Double-Entry Ledger Engine:** Atomic append-only ledger entries for receipts, deliveries, internal transfers, and stock adjustments.
2. **Document Lifecycle:** State machine (`DRAFT` -> `WAITING` -> `READY` -> `DONE` / `CANCELED`).
3. **Role-Based Access Control:** `MANAGER` vs `STAFF` permissions.
4. **Dashboard & KPIs:** Aggregated metrics for low stock alerts, pending orders, and multi-location balances.

## 📡 API Endpoints (Frontend Contract)

Base URL: `http://localhost:8000/api/v1`

### 1. Authentication (`/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` or `/auth/signup` | Register new user (`name`, `email`, `password`, `role`) | No |
| `POST` | `/auth/login` | OAuth2 form login (`username`, `password`) -> JWT token | No |
| `POST` | `/auth/login/json` | JSON body login (`email`, `password`) -> JWT token | No |
| `POST` | `/auth/forgot-password` | Generate 6-digit OTP for password reset (`email`) | No |
| `POST` | `/auth/reset-password` | Reset password using OTP (`email`, `otp_code`, `new_password`) | No |
| `GET` | `/auth/me` | Current user profile | Bearer Token |

### 2. Products Catalog (`/products`)
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/products` | List products with live stock (`search`, `category`, `skip`, `limit`) | Any User |
| `POST` | `/products` | Create product (supports `initial_stock` & `initial_location_id`) | Manager Only |
| `GET` | `/products/{id}` | Product details and total stock across all locations | Any User |
| `GET` | `/products/{id}/availability` | Exact per-location breakdown (Warehouse 1, Rack A, Production Floor) | Any User |
| `PUT` | `/products/{id}` | Update product information | Manager Only |

### 3. Locations (`/locations`)
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/locations` | List locations (Physical: `WAREHOUSE`, `RACK`, `PRODUCTION`; Virtual: `VENDOR`, `CUSTOMER`, `INVENTORY_LOSS`) | Any User |
| `POST` | `/locations` | Create new location | Manager Only |
| `GET` | `/locations/{id}` | Get location details | Any User |

### 4. Operations & Document State Machine (`/operations` or `/documents`)
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/operations` | List documents (filters: `type`, `status`, `location_id`, `skip`, `limit`) | Any User |
| `POST` | `/operations` | Create draft document (`type`: `RECEIPT`, `DELIVERY`, `TRANSFER`, `ADJUSTMENT`) | Any User |
| `GET` | `/operations/{id}` | Document details with populated line items and location data | Any User |
| `PATCH`| `/operations/{id}/status` | Transition status (`DRAFT` → `WAITING` → `READY`) | Any User / Manager |
| `POST` | `/operations/{id}/validate` | Validate order: moves to `DONE` and writes immutable Stock Ledger rows | Any User |

### 5. Stock Ledger & Levels (`/ledger`)
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/ledger` | Immutable audit log of all movements (`product_id`, `document_id`, `location_id`) | Any User |
| `GET` | `/ledger/stock-levels`| Current fast-read stock on hand per product and location | Any User |
| `GET` | `/ledger/verify` | Scans SHA-256 chain integrity across all transactions and flags database tampering | Any User |
| `GET` | `/ledger/valuation` | Live FIFO inventory asset valuation across all products and batches | Any User |
| `GET` | `/ledger/lots` | Detailed list of incoming product batches with purchase costs, remaining quantities, and lot values | Any User |

### 6. Dashboard & Analytics (`/dashboard`)
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/dashboard/kpis` | Real-time KPIs: total products, total stock units, total inventory value (₹), real-time COGS (₹), low stock/out of stock counts, and pending order counts | Any User |
| `GET` | `/dashboard/moves` | Live Move History feed showing the latest ledger movements with operator stamps | Any User |

---

## 🧠 The Four Engine Brains (Services)

1. **The Tamper-Proof Ledger (`app/services/ledger_service.py`):**
   - Implements append-only double-entry stock transactions.
   - Computes SHA-256 block fingerprints chaining each row to the previous entry.
   - One-click cryptographic scan (`GET /api/v1/ledger/verify`) verifying ledger integrity and detecting database mutations or shrinkage.

2. **The Shelf-Lock & Reservation System (`app/services/stock_service.py`):**
   - Splits stock into **Physical Stock**, **Reserved Stock**, and **Available Stock** ($\text{Available} = \text{Physical} - \text{Reserved}$).
   - Employs pessimistic row-level locking (`SELECT ... FOR UPDATE`) to guarantee that two workers cannot claim the same pallet concurrently.

3. **The Smart Batch Tracker (`app/services/fifo_service.py`):**
   - Enforces FIFO (First-In, First-Out) lot consumption for deliveries.
   - Calculates real-time **Cost of Goods Sold (COGS)** and asset valuations denominated in **Indian Rupees (₹ / INR)**.

4. **The Paperwork Rulebook (`app/services/operation_service.py`):**
   - Enforces strict 5-stage document lifecycles: `DRAFT` $\to$ `WAITING` $\to$ `READY` $\to$ `DONE` / `CANCELED`.
   - Protects physical inventory: no stock is moved until the document is officially marked `DONE`.

---

## 🔄 Double-Entry Inventory Movement Rules
- **Receipt (Incoming):** `source = NULL`, `dest = Location`. Increases destination stock; logs positive receipt in ledger.
- **Delivery (Outgoing):** `source = Location`, `dest = NULL`. Checks available quantity (returns `400 Bad Request` if insufficient); decreases stock; logs outgoing delivery in ledger.
- **Transfer (Internal):** `source = Loc A`, `dest = Loc B`. Atomically decreases Loc A and increases Loc B; global stock invariant is preserved.
- **Adjustment (Physical Count Reconciliation):** `dest = Target Loc`. Computes `variance = actual_count - current_count`. Automatically logs balancing surplus or loss ledger entry and synchronizes current stock level.

---

## 🛡️ Enterprise Supply Chain Superpowers

1. **The "Laggy Wi-Fi" Glitch (Idempotency Shield):**
   - Floor workers on tablets/phones frequently experience network freezes under metal roofs and concrete walls.
   - Operations support the `Idempotency-Key` header. Double-tapping or network retries will return the original completed response without creating duplicate slips or double-deducting inventory.
2. **The Phantom Stock Collision (Row-Level Locking):**
   - Pessimistic locking (`SELECT ... FOR UPDATE`) prevents two workers from claiming the same pallet simultaneously. Prevents negative stock and concurrency race conditions.
3. **Cryptographically Tamper-Proof Audit Chain (`SHA-256`):**
   - Every row in `Stock_Ledger` is chained to the preceding entry using SHA-256 (`prev_hash` + `entry_hash`), creating an unalterable audit chain.
   - An auditor can call `GET /api/v1/ledger/verify` to instantly prove mathematically that no records were deleted, modified, or forged in the database.
4. **Real Cost Tracking (FIFO Valuation in Indian Rupees ₹):**
   - `GET /api/v1/ledger/valuation` provides real-time inventory asset valuation and Cost of Goods Sold (COGS) tracking using FIFO (First-In, First-Out) in Indian Rupees (INR / ₹).

---

## 🏃 Getting Started (Copy-Paste Quickstart)

### 1. Setup Environment
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Database Migrations
```bash
alembic upgrade head
```

### 3. Seed Realistic Indian Warehouse Demo Data
Populate real Indian industrial products (Steel Coils, Pallet Racks, Ball Bearings), vendor/customer locations (Tata Steel, BHEL, L&T Infra), completed historical transactions, and ready-to-use accounts:
```bash
python -m app.core.seed
```

**Demo Login Credentials:**
- **Manager:** `manager@stocksense.in` | Password: `Manager@123` (Name: Rajesh Sharma)
- **Warehouse Staff:** `staff@stocksense.in` | Password: `Staff@123` (Name: Amit Kumar)

### 4. Run Automated Test Suite
```bash
pytest -v
```

### 5. Launch the Development Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

