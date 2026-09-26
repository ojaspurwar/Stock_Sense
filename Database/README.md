# StockSense Database

This folder contains the Prisma ORM setup and the Database Schema for the StockSense IMS. 
It is designed to connect to a cloud PostgreSQL database (like Vercel Postgres, Neon, or Supabase) out of the box.

## 🚀 One-Command Setup

To get this running on your machine or for a teammate:

1. **Clone the repo** and navigate to this folder:
   ```bash
   cd Database
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Connect to your Database**:
   - Create a file named `.env` in this folder.
   - Copy the contents of `.env.example` into `.env`.
   - Replace the `DATABASE_URL` with your actual cloud PostgreSQL URL.
4. **Push the Schema**:
   ```bash
   npx prisma db push
   ```
   *This command instantly pushes the tables in `prisma/schema.prisma` to your remote database without needing migrations.*

5. **Generate the Client**:
   ```bash
   npx prisma generate
   ```
   *(This gives you perfect TypeScript autocomplete when querying the DB from your backend code!)*

## 📚 Viewing the Database
You can easily view and edit your database using Prisma Studio:
```bash
npx prisma studio
```
This opens a local web UI where you can manage your Products, Documents, and Stock Ledger.
