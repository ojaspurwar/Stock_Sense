# StockSense UI Spec v2 (for Antigravity)

This replaces v1. It follows the official StockSense problem statement: Inventory Management System for **Inventory Managers** and **Warehouse Staff**. The layout comes from a dashboard reference and the colours, type and motion come from a sky-blue video reference, all redrawn for StockSense.

**Rule:** match the PNGs for the look, and copy exact values from the HTML/CSS files. If a PNG and the code disagree, the code wins.

## Reference files (`Frontend/assets/reference/`)

| File | Screen |
|---|---|
| `01-dashboard.png` | Dashboard (landing page after login) |
| `02-login.png` | Log in |
| `03-reset-password-otp.png` | OTP password reset (step 2 of 3) |
| `04-signup.png` | Sign up |
| `05-products.png` | Products list |
| `06-new-product.png` | Create / edit product drawer |
| `07-ui-kit-operations.png` | Colours, type, controls, and the patterns for Receipts, Delivery orders, Internal transfers, Adjustments, Move history, Warehouses |
| `08-motion-reference.png` | What animates |
| `styles.css` | Shared tokens + components. **Use this as the base stylesheet.** |
| `dashboard.html`, `auth.html`, `products.html`, `ui-kit.html` | Working code for each screen (open in a browser; `auth.html#login`, `#signup`, `#otp`; `products.html#new`) |

---

## 1. Requirements checklist (problem statement → where it is)

| Requirement | Where | Notes |
|---|---|---|
| Sign up / log in | `auth.html` `#signup`, `#login` | Role picker on sign up: Inventory manager / Warehouse staff |
| OTP password reset | `auth.html#otp` | 3 steps: Email → 6-digit code → New password. Resend timer. |
| Redirect to dashboard | After login | Land on `dashboard.html` |
| KPI: Total products in stock | Dashboard KPI 1 | Count of products with qty > 0 ("248 of 263 products") |
| KPI: Low / out of stock | Dashboard KPI 2 + Low stock card | Low = on hand below reorder minimum. Out = 0. |
| KPI: Pending receipts | Dashboard KPI 3 | Receipts not Done or Canceled |
| KPI: Pending deliveries | Dashboard KPI 4 | Deliveries not Done or Canceled |
| KPI: Internal transfers scheduled | Dashboard KPI 5 | Transfers not Done or Canceled |
| Filter by document type | Dashboard top bar "Type" | Receipts / Delivery / Internal / Adjustments |
| Filter by status | Dashboard top bar "Status" | Draft, Waiting, Ready, Done, Canceled |
| Filter by warehouse / location | Top bar "Warehouse" | Also filters KPIs |
| Filter by product category | Top bar "Category" | Also filters KPIs |
| Products: create / update | `products.html#new` drawer | Same drawer for edit, title "Edit product" |
| Product fields | Drawer | Name, SKU/code, Category, Unit of measure, Initial stock (optional, with location) |
| Stock availability per location | Products "By warehouse" column | Also product detail |
| Product categories | Category column + filter | Manage categories from the Category dropdown ("+ New category") |
| Reordering rules | Drawer "Reordering rule" + "Reorder min / max" column | Drives low stock alerts |
| Receipts (create → supplier & products → qty → validate → stock up) | `07` Receipt modal | Toast after validate |
| Delivery orders (pick → pack → validate → stock down) | `07` Delivery card | 3-step stepper, tick lines when picked |
| Internal transfers | `07` Transfer card | From → To. Total unchanged, location changes |
| Stock adjustments (product/location → counted qty → auto update + log) | `07` Adjustment card | Shows system qty, counted qty, difference, reason |
| Move history / stock ledger | `07` Move history table | Read-only. No edit or delete |
| Settings → Warehouse | `07` Warehouses | Warehouses with short code, address, locations |
| Profile menu in left sidebar (My profile, Logout) | Sidebar bottom | On every app screen |
| Low stock alerts | Dashboard Low stock card + KPI 2 + Products status | |
| Multi-warehouse | Warehouse filter, "Stock by warehouse", "By warehouse" column | |
| SKU search & smart filters | Search field on every app screen, `/` shortcut | Searches SKU, name |

---

## 2. Colour tokens

Only white, light grey and sky blue, plus navy-black ink. Coral and amber are status colours only. **No green anywhere.**

All tokens are in `styles.css` `:root`. Key values: sky-700 `#1269AF` (primary), sky-500 `#3C8CC7`, sky-300 `#7DB6E3`, sky-100 `#CAE4F5`, sky-50 `#EAF4FB`, white, grey-50 `#F4F6F9`, grey-100 `#E8ECF2`, grey-200 `#D5DBE4`, muted `#8A94A6`, ink-2 `#3A4458`, ink `#000C23`, coral `#E4573D`, amber `#E9A23B`.

Operation colour code (use everywhere: dots, chart, history):
Receipt = sky-500, Delivery = ink, Internal transfer = sky-300, Adjustment = coral.

## 3. Type

Google Fonts: Inter Tight (300–600), DM Mono (300–500), Instrument Serif (italic).

- Hero number: Inter Tight 300, 104px, unit after it in Instrument Serif italic, muted ("412 *kg*").
- KPI numbers: DM Mono 300, 40px.
- Panel titles: Inter Tight 400, 24px. Page titles: 30px.
- Body and table cells: Inter Tight 14px.
- References (WH/IN/00042), SKUs, quantities, primary buttons: DM Mono. Primary buttons are UPPERCASE.
- Instrument Serif italic is used only for units next to the hero number and the middle word of the auth headlines ("INVENTORY *without* GUESSWORK").

## 4. App shell (every screen after login)

- 14px page padding, 10px gaps. Everything floats on the sky gradient.
- **Left sidebar, 220px:** white logo tile on top, then a glass panel with: Dashboard, Products, *Operations* (Receipts, Delivery orders, Internal transfers, Adjustments, Move history), *Settings* (Warehouses). Pending counts on the right in mono. Active item = white background, ink text. **Profile at the bottom:** avatar, name, role, then My profile and Log out.
- **Top bar, 44px, on the sky:** white search field (340px) + glass filter chips + one white action button on the right.
- Panels: white (main) or grey-50 (secondary), radius 6px, no shadows. Only modals and drawers get a shadow.

## 5. Dashboard (`01-dashboard.png`)

Rows: top bar 44px, KPI strip 116px, chart (fills), bottom row 316px.

1. **Top bar:** Search SKU or product, then filter chips Type, Status, Warehouse, Category, and a "New ▾" menu (Receipt, Delivery, Transfer, Adjustment, Product).
2. **KPI strip:** one white panel, 5 columns split by hairlines. Each KPI is a link to its filtered list.
3. **Stock chart:** stock level of one product over time. Product picker next to the number, pills for SKU, category and warehouse. Range: Week / Month / Quarter / Year. Step line (stock changes in steps, not smooth), pale hatch under it, received (sky) and delivered (grey) bars along the bottom, **coral dotted line = reorder minimum from that product's reordering rule**, ink "today" marker with diamond, ink pill with current value. Default product: the one with the most moves this month.
4. **Bottom row:**
   - **Operations:** latest 4 documents matching the filters. Columns: Reference (colour dot + type), Partner/route, Status, Scheduled. "View all" opens the full list.
   - **Stock by warehouse:** number of products held in each warehouse, hatched bars sized by share. "Manage" opens Settings → Warehouses.
   - **Low stock:** sky window with a glass card that cycles through low and out-of-stock items (see motion). Header shows "7 LOW 2 OUT".

## 6. Auth (`02`, `03`, `04`)

Same split as the video: white logo tile + glass bar on top, white form panel on the left, sky on the right with an ASCII-style crate stack (drawn in canvas, see `auth.html`) and a glass card.
- Log in: Email, Password (Show), Keep me logged in, Forgot password?, LOG IN, link to sign up.
- Sign up: Full name, Work email, Role (Inventory manager / Warehouse staff), Password, CREATE ACCOUNT.
- Reset: step dots (Email → Code → New password), 6 OTP boxes in DM Mono, "Resend code in 0:42", VERIFY CODE. Step 1 is an email field; step 3 is new password + confirm.
- Glass card on login/sign up cycles through the 4 operations.

## 7. Products (`05`, `06`)

- Tabs: All / In stock / Low stock / Out of stock with counts.
- Table: Product (name + SKU), Category, Unit, On hand, By warehouse (small pills), Reorder min / max, Status (In stock / Low stock / Out of stock). 12 per page.
- Row click opens the same drawer as "New product", in edit mode, plus a read-only "Stock by location" list and a link to that product's move history.
- Drawer (460px, right side, dark scrim): Name, SKU/code, Category, Unit of measure, **Initial stock (optional)** with location, **Reordering rule (optional)** min and max. Buttons: Cancel, SAVE PRODUCT.

## 8. Operations (`07-ui-kit-operations.png`)

All four operation lists (Receipts, Delivery orders, Internal transfers, Adjustments) use one list layout: title, status filter chips, primary "New ..." button, table with Reference (mono), Partner or route, Products, Scheduled, Status. Reference prefixes: `WH/IN/`, `WH/OUT/`, `WH/INT/`, `WH/ADJ/`.

- **Receipt detail:** supplier, destination, product lines with + quantities in sky. Grey "effect" box says exactly what will happen. VALIDATE RECEIPT → toast.
- **Delivery detail:** 3-step stepper (Pick → Pack → Validate). Pick = tick each line. Then MARK AS PACKED, then VALIDATE DELIVERY. Quantities shown with − in ink.
- **Internal transfer:** From → To (warehouse / location), product, quantity. Note that total stock doesn't change.
- **Adjustment:** Product, Location, In the system (read-only grey), Counted, big coral difference, Reason (Damaged, Lost, Found, Count correction). APPLY ADJUSTMENT.
- **Move history:** Date, Reference, Product, From → To, Quantity (+ sky, − ink, adjustments coral, transfers neutral), Done by, reason under the route when there is one. Filter by product, type, warehouse and date. Read-only.
- **Warehouses:** list of warehouses with short code, address and location chips. "+ Add warehouse", "+ Location".

Status badges: Draft (grey), Waiting (amber), Ready (sky), Done (ink), Canceled (coral).
Never add up quantities with different units. Show "50 kg and 250 pcs", not "300".

## 9. Motion (`08-motion-reference.png`)

- Glass card carousels (Low stock on dashboard, operations card on login): auto-advance every 4s, 300ms fade + 6px rise, pause on hover, ← → to step.
- First load only: KPI numbers count up (600ms), chart line draws left to right (800ms).
- Drawer slides in from the right (220ms). Modal fades and rises 8px (200ms). Toast rises from the bottom and hides after 4s.
- Respect `prefers-reduced-motion`.
- No animated backgrounds, no fade-in on every card.

## 10. Responsive

- < 1200px: sidebar collapses to icons only (64px). Dashboard bottom row goes to 2 columns.
- < 768px: sidebar becomes a bottom tab bar (Dashboard, Products, Operations, History, Profile). Top bar = search icon + filter button that opens a sheet. KPIs scroll sideways. Tables become stacked cards (name, SKU, qty, status). Auth: sky side hides, form fills the screen.

## 11. Don't

- Don't use green, drop shadows on panels, gradients inside white panels, or emoji icons.
- Don't show "projected" stock, "last month" lines, or totals that mix units.
- Don't copy the video's retro computer image. Only use the ASCII crate stack and the static dot texture on sky areas.
