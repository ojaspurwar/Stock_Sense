# StockSense Deployment & Architecture Guide

Welcome to the StockSense deployment playbook. This system uses a modern, decoupled architecture. It is critical that each team understands how their piece is hosted and how it connects to the rest of the system.

---

## 🟢 1. Database (Neon Serverless Postgres)
**Status:** ALREADY LIVE
**Responsible Team:** Database Team

The database is hosted on **Neon.tech**. It requires no manual server maintenance.
- **How it works:** The `Database/prisma/schema.prisma` file is our source of truth. 
- **How to update:** If the Database Team adds a new table, they simply run `npx prisma db push` locally, and the live cloud database is instantly updated.
- **Connection:** The Backend team will connect to it using the `DATABASE_URL` environment variable.

---

## ☁️ 2. Backend API (Vercel)
**Status:** PENDING DEPLOYMENT
**Responsible Team:** Backend Team

The Backend serves as the API bridge between the Mobile App and the Database. It will be hosted on **Vercel** using Serverless Functions.

**Deployment Steps for the Backend Team:**
1. Ensure all backend code is pushed to the `main` branch on GitHub.
2. Log into [Vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import the StockSense GitHub repository.
4. ⚙️ **CRITICAL:** In the Vercel project settings, set the **Root Directory** to `Backend`. This ensures Vercel only deploys the API and ignores the mobile app code.
5. In the **Environment Variables** section, add the `DATABASE_URL` (the Neon connection string).
6. Click **Deploy**. Vercel will generate a live production URL (e.g., `https://stocksense-api.vercel.app`).
7. Give this live URL to the Frontend team so they can connect the app.

---

## 📱 3. Frontend Mobile App (Expo EAS)
**Status:** PENDING DEPLOYMENT
**Responsible Team:** Frontend Team

The Mobile App is built with **React Native (Expo)**. It does not connect to the database; it makes HTTP requests to the live Vercel Backend URL.

**Deployment Steps for the Frontend Team:**
When the app is ready for warehouse staff to use, you will use **Expo Application Services (EAS)** to compile it in the cloud.

1. Ensure the Vercel API URL is hardcoded or set in the app's `.env` file so the app knows where to fetch data.
2. Install the EAS CLI globally: `npm install -g eas-cli`
3. Log into Expo: `eas login`
4. **To Build for Android (Easiest for internal tools):**
   Run `eas build --platform android --profile production`
   *Result:* Expo will provide an `.apk` file. You can share this file directly via email, Slack, or Google Drive for warehouse staff to install immediately on their Android devices. No Play Store required!
5. **To Build for iOS:**
   Run `eas build --platform ios --profile production`
   *Result:* Apple requires strict provisioning. You will use this build to distribute the app via **Apple TestFlight** to your staff.
6. **Over-The-Air (OTA) Updates:**
   For minor bug fixes or UI tweaks, you can use `eas update`. This pushes code changes instantly to all users' phones without them needing to re-download the app.
