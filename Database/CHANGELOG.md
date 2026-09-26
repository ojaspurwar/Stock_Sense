# Database Folder Log & Changelog

## [Current Status: Operational & Synced]
The Database folder has been fully initialized, connected to Neon Serverless Postgres, and populated with core business logic.

### Actions Completed:
1. **Schema Design & Planning**
   - Designed a robust Double-Entry Ledger system for inventory.
   - Finalized `Schema-Plan.md` identifying all required tables: `Users`, `Products`, `Contacts`, `Locations`, `Documents`, `Document_Lines`, `Stock_Ledger`, and `Stock_Levels`.
   - Utilized `Decimal` types for precise inventory quantities.

2. **Environment & ORM Setup**
   - Initialized `package.json` and `tsconfig.json` for a Node.js/TypeScript environment.
   - Installed `prisma` (v5) and `@prisma/client`.
   - Set up `.env` with secure connection strings (direct and pooled) for Neon.
   - Added a strict `.gitignore` to prevent leaking the `.env` file or pushing `node_modules` to version control.

3. **Database Deployment**
   - Executed `npx prisma db push` successfully.
   - All tables, constraints, and enums were instantly synced to the live remote Neon database.
   - Generated the Prisma Client for full TypeScript autocomplete.

4. **Core Service Implementation (`src/` folder)**
   - **`db.ts`**: Implemented a Prisma singleton to prevent connection exhaustion in serverless environments.
   - **`inventoryService.ts`**: Built the `validateDocument` function. This uses a massive ACID-compliant transaction to securely process receipts, deliveries, and transfers, automatically generating immutable `StockLedger` entries and updating the `StockLevel` cache.
   - **`productService.ts`**: Added functions for creating products and fetching catalog availability.
   - **`documentService.ts`**: Added functions for creating Draft documents and filtering them.
   - **`kpiService.ts`**: Added queries for the Dashboard (Total Products, Low Stock, Pending Deliveries/Receipts).
   - **`index.ts`**: Created a barrel export file so the backend team can easily import all database functions and types seamlessly.

5. **Additional Utilities**
   - Installed AWS S3 packages (`@aws-sdk/client-s3`) to support future file uploads (like receipt images).
   - Created `README.md` to guide teammates on running `npx prisma db push` if they ever need to pull or sync the database structure locally.

---
*The Database architecture is currently stable and locked for the backend team to consume.*
