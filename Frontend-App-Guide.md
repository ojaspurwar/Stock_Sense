# StockSense Mobile App Guide

Welcome to the **Frontend** team! Your mission is to build the StockSense Inventory Management System into a native Mobile App (iOS and Android).

Although your folder is named `Frontend`, you are building a full mobile application. Since the Database and Backend are using Node.js/TypeScript and deploying to Vercel, we highly recommend using **React Native with Expo** for the app. This allows you to use TypeScript everywhere and deploy to app stores easily.

Here is your roadmap to building the app:

## Step 1: Initialize the Mobile App
Open your terminal, navigate into the `Frontend` folder, and initialize an Expo project:
```bash
cd Frontend
npx create-expo-app@latest .
```
This will generate the core mobile app files (like `app.json` and `App.tsx` or an `app/` router directory). 

## Step 2: Develop the UI
Based on the project requirements, you need to build the following screens:
1. **Authentication:** Login/Signup screen with OTP-based password reset.
2. **Dashboard:** The landing page showing KPIs (Total Products, Low Stock, Pending Receipts/Deliveries).
3. **Products:** A screen to view the catalog and search by SKU.
4. **Operations:** Screens to handle Receipts (Incoming), Deliveries (Outgoing), Transfers, and Adjustments.

*Tip: You can use a UI library like `NativeWind` (Tailwind for React Native) or `React Native Paper` to build the interfaces quickly.*

## Step 3: Connect to the Backend (API)
Your app will **never** connect to the database directly. Instead, you will make HTTP requests to the Vercel Backend. 
For example, when a user validates a delivery, you might call the backend like this:

```typescript
const response = await fetch('https://your-vercel-backend-url.com/api/documents/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ documentId: '12345' })
});
```
*(The backend will then securely run the Prisma database transactions we already built).*

## Step 4: Test on Your Phone
To see the app running live on your physical phone while you code:
1. Run `npx expo start` in the `Frontend` folder.
2. Download the **Expo Go** app on your iPhone or Android.
3. Scan the QR code in your terminal. The app will open on your phone and update instantly as you save code!

## Step 5: Build the Final App (.apk / .ipa)
When the app is finished and ready for production, you will use Expo Application Services (EAS) to compile the code into installable app files.
```bash
npm install -g eas-cli
eas login
eas build --profile production
```
This will generate the actual Android (`.apk` or `.aab`) and iOS (`.ipa`) files that can be installed by warehouse staff or distributed on the App Store!

Good luck, and remember to keep all of your code strictly inside the `Frontend` folder!
