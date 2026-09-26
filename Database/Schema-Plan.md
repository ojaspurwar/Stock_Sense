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

### 2. `Contacts`
Stores information about Suppliers and Customers.
- `id` (UUID, Primary Key)
- `name` (String)
- `type` (Enum: 'SUPPLIER', 'CUSTOMER', 'INTERNAL')
- `email` (String, nullable)
- `phone` (String, nullable)
- `created_at` (Timestamp)

### 3. `Products`
The catalog of items.
- `id` (UUID, Primary Key)
- `name` (String)
- `sku` (String, Unique)
- `category` (String)
- `unit_of_measure` (String - e.g., kg, pcs, liters)
- `created_at` (Timestamp)

### 4. `Locations`
Represents physical places where stock can exist (Warehouses, Racks, Production Floors).
- `id` (UUID, Primary Key)
- `name` (String)
- `type` (Enum: 'WAREHOUSE', 'RACK', 'PRODUCTION')
- `created_at` (Timestamp)

### 5. `Documents` (Operations)
Represents the high-level action (Receipt, Delivery, Transfer, Adjustment).
- `id` (UUID, Primary Key)
- `type` (Enum: 'RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT')
- `status` (Enum: 'DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED')
- `contact_id` (UUID, nullable, Foreign Key to Contacts)
- `created_by` (UUID, Foreign Key to Users)
- `source_location_id` (UUID, nullable, Foreign Key to Locations)
- `destination_location_id` (UUID, nullable, Foreign Key to Locations)
- `created_at` (Timestamp)

### 6. `Document_Lines`
The specific items and requested quantities expected in a Document before it is finalized.
- `id` (UUID, Primary Key)
- `document_id` (UUID, Foreign Key to Documents)
- `product_id` (UUID, Foreign Key to Products)
- `requested_quantity` (Decimal)
- `processed_quantity` (Decimal - amount actually processed)

### 7. `Stock_Ledger` (The Source of Truth)
The immutable log of every item movement. Generated when a Document is validated.
- `id` (UUID, Primary Key)
- `document_id` (UUID, Foreign Key to Documents)
- `product_id` (UUID, Foreign Key to Products)
- `quantity` (Decimal - the amount moved)
- `timestamp` (Timestamp)

### 8. `Stock_Levels` (Materialized View / Cache)
A fast-read table to get current stock without summing the entire ledger every time.
- `product_id` (UUID)
- `location_id` (UUID)
- `current_quantity` (Decimal)
*(Composite Primary Key: product_id, location_id)*

---
**Status:** Schema plan finalized. Ready for implementation.
