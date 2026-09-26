# StockSense - Backend Service

This directory contains the **Backend API & Double-Entry Ledger Engine** for StockSense.

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
| `POST` | `/auth/signup` | Register new user (`name`, `email`, `password`, `role`) | No |
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
| `PUT` | `/products/{id}` | Update product information | Manager Only |

### 3. Locations (`/locations`)
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/locations` | List warehouse/storage locations (`WAREHOUSE`, `RACK`, `PRODUCTION`) | Any User |
| `POST` | `/locations` | Create new location | Manager Only |
| `GET` | `/locations/{id}` | Get location details | Any User |

### 4. Operations Documents (`/documents`)
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/documents` | List documents (filters: `type`, `status`, `location_id`, `skip`, `limit`) | Any User |
| `POST` | `/documents` | Create document with line items (`type`, `source_location_id`, `destination_location_id`, `items`) | Any User |
| `GET` | `/documents/{id}` | Document details with populated line items and location data | Any User |
| `PATCH`| `/documents/{id}/status` | Transition status (`DRAFT`, `WAITING`, `READY`, `DONE`, `CANCELED`) | Any User / Manager |
| `POST` | `/documents/{id}/validate` | Finalize & execute double-entry ledger transactions | Any User |

### 5. Stock Ledger & Levels (`/ledger`)
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/ledger` | Immutable audit log of all movements (`product_id`, `document_id`, `location_id`) | Any User |
| `GET` | `/ledger/stock-levels`| Current fast-read stock on hand per product and location | Any User |

### 6. Dashboard & Analytics (`/dashboard`)
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/dashboard/kpis` | Real-time KPIs: total products, low stock count, out of stock, pending receipts/deliveries/transfers | Any User |

---

## 🔄 Double-Entry Inventory Movement Rules
- **Receipt (Incoming):** `source = NULL`, `dest = Location`. Increases destination stock; logs positive receipt in ledger.
- **Delivery (Outgoing):** `source = Location`, `dest = NULL`. Checks available quantity (returns `400 Bad Request` if insufficient); decreases stock; logs outgoing delivery in ledger.
- **Transfer (Internal):** `source = Loc A`, `dest = Loc B`. Atomically decreases Loc A and increases Loc B; global stock invariant is preserved.
- **Adjustment (Physical Count Reconciliation):** `dest = Target Loc`. Computes `variance = actual_count - current_count`. Automatically logs balancing surplus or loss ledger entry and synchronizes current stock level.


## 🏃 Getting Started

### 1. Setup Environment
```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Tests
To run the automated test suite:
```bash
pytest -v
```

### 3. Run the Development Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

