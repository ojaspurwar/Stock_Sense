# Database Schema Plan (Draft)

This document outlines the proposed PostgreSQL database schema for the StockSense Inventory Management System. We are focusing strictly on the database architecture before writing any code.

## Core Architectural Concept: Double-Entry Ledger
To ensure absolute accuracy, the system will use a double-entry ledger design for inventory. 
Instead of just updating a "quantity" number up or down, every movement is recorded as a transaction.
- **Receipt (In):** Source = NULL -> Destination = Warehouse
- **Delivery (Out):** Source = Warehouse -> Destination = NULL
- **Transfer:** Source = Warehouse A -> Destination = Warehouse B
- **Adjustment:** Treated as a receipt (if found extra) or delivery (if lost/damaged).

---

## Proposed Tables

### 1. `Users`
Manages authentication and roles.
- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `password_hash` (String)
- `role` (Enum: 'MANAGER', 'STAFF')
- `created_at` (Timestamp)

### 2. `Products`
The catalog of items.
- `id` (UUID, Primary Key)
- `name` (String)
- `sku` (String, Unique)
- `category` (String)
- `unit_of_measure` (String - e.g., kg, pcs, liters)
- `created_at` (Timestamp)

### 3. `Locations`
Represents physical places where stock can exist (Warehouses, Racks, Production Floors).
- `id` (UUID, Primary Key)
- `name` (String)
- `type` (Enum: 'WAREHOUSE', 'RACK', 'PRODUCTION')
- `created_at` (Timestamp)

### 4. `Documents` (Operations)
Represents the high-level action (Receipt, Delivery, Transfer, Adjustment).
- `id` (UUID, Primary Key)
- `type` (Enum: 'RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT')
- `status` (Enum: 'DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED')
- `created_by` (UUID, Foreign Key to Users)
- `source_location_id` (UUID, nullable, Foreign Key to Locations)
- `destination_location_id` (UUID, nullable, Foreign Key to Locations)
- `created_at` (Timestamp)

### 5. `Stock_Ledger` (The Source of Truth)
The immutable log of every item movement. Ties back to a Document.
- `id` (UUID, Primary Key)
- `document_id` (UUID, Foreign Key to Documents)
- `product_id` (UUID, Foreign Key to Products)
- `quantity` (Integer/Decimal - the amount moved)
- `timestamp` (Timestamp)

### 6. `Stock_Levels` (Materialized View / Cache)
A fast-read table to get current stock without summing the entire ledger every time.
- `product_id` (UUID)
- `location_id` (UUID)
- `current_quantity` (Integer/Decimal)
*(Composite Primary Key: product_id, location_id)*

---
**Status:** Awaiting review and adjustments. Do not implement in SQL/ORM yet.
