# Standalone stand-alone WooCommerce & WordPress Admin Panel Agent

This repository contains a secure, visually pristine, production-ready **stand-alone full-stack WooCommerce Admin Portal**. Built using a high-fidelity SaaS aesthetic (similar to Shopify Admin and Stripe dashboards), it allows direct WooCommerce product, user, and coupon inventory management without logging into the standard `wp-admin` dashboard.

---

## 🏗️ Technical Architecture

### 1. Technology Stacks
* **Frontend UI**: React (v19) + Vite (v6) with high-density components (bento-grid metric layouts, custom dark/light theme triggers, responsive drawer menus).
* **Styles**: Utility-first CSS using Tailwind CSS (v4) withInter and Space Grotesk typographies.
* **Backend Core**: Standalone Express Server (`/server.ts`) operating behind a reverse proxy layer.
* **Persistent Cache**: Relational disk storage simulation (`/src/server/db.json`) for administrators, activity tracking trails, system error logs, and offline scratchnotes.
* **REST Handshake Layer**: Centralized Axios intercepts with automatic JWT token attachment and network request auto-retry layers.

### 2. Standard Database Schema (Simulated relational SQL structure)
- **Admins (`db.admins`)**:
  - `id`: Unique UUID
  - `username` / `email`: Unique strings
  - `role`: `'Super Admin' | 'Staff Admin' | 'Product Manager'`
  - `passwordHash`: Bcrypt secure keys
- **Products (`db.products`)**:
  - `name`, `sku` (Unique index), `price` (USD), `sale_price` (nullable)
  - `stock` limits, `status` (`'publish' | 'draft' | 'pending'`), `visibility`
  - `categories` array (tag selectors), `seo_title` & `seo_desc` indexes
  - `variations`: SKU variations (Size, Color, Price, Stock matrix)
- **Customers (`db.users`)**:
  - `username`, `email`, `mobile`, `wallet_balance`, `registration_date`
  - `order_history` logs array, `login_logs` tracking IP ranges
- **Coupons (`db.coupons`)**:
  - `code` (Uppercase index), `discount_type` (`'percent' | 'fixed'`)
  - `amount`, `expiry_date`, `usage_limit`, `usage_count`, `min_amount`

---

## 🚦 Features Overview

### 🔐 1. Cryptographic Authentication & Role Boundaries
- **Encrypted Login**: Access credentials verified using secure bcrypt password hashing and validated using session JWT endpoints.
- **Role-Based Controls**:
  - **Super Admin**: Infinite configurations. Holding full capabilities for CRUD operations, IP whitelists, rate limit adjusters, and customer deletions.
  - **Staff Admin**: Accesses all sections, edit products/coupons, but is prohibited from editing core site credentials or modifying IP security ranges.
  - **Product Manager**: Strictly limited to viewing logs/stats and editing product items. Prohibited from editing users, coupons, or settings.

### 📊 2. High-Fidelity Analytics UI
- Responsive, fluid metric cards featuring revenue statistics (USD), customer levels, active product inventories, and coupon campaigns.
- **Weekly Revenue Curves** area graphics powered by **Recharts**.
- **Product Category Density** analytics visualizations.
- **Low Stock Alerters** fetching items with index bounds $\le$ 15 units.
- **Disk Scratchpad**: Integrated textarea notebook with instant **debounce auto-save** syncing written drafts directly to the backend database.

### 📦 3. WooCommerce CRUD Management
- Comprehensive list tables detailing name, category tags, price details, and published states.
- **Bulk Action Engines**: Instantly bulk delete, modify product states, or override stock counts.
- **Yoast-compatible SEO Metadata**: Custom inputs for SEO Titles and Meta Descriptions.
- **Variations Matrix**: Manage individual attributes (such as color, size) with custom SKU tracking, stock lines, and separate pricing.
- **Drag & Drop Gallery Loader**: Fully functional drag/upload mock. Compresses files losslessly, tracking progress bars before launching random Unsplash asset pairs.

### 👥 4. Customers Directory & Wallet Audits
- Complete customer register with detail searching (name, email, phone lines).
- **Ban / Unban overrides**: Block customer checkouts instantaneously.
- **CSV Data Exporter**: Native browser client function compiling a pristine, downloadable `.csv` data table.
- **Access Logs timeline**: Auditing customer session IP coordinates and devices.

### 🎟️ 5. Promo Campaign Generator
- Launch fixed or percentage-off promo coupon regulations.
- **Usage limit rules**: Track total utilized percentage over limits with responsive indicator bars.
- **Promo Code Generator**: Instant ticket builder creating unique uppercase strings (e.g., `WINTER20-F3DA`).

### ⚙️ 6. Settings, Diagnostics & Handshake Tools
- Custom settings fields for API timeouts, CORS headers, site URLs, and key secrets.
- **Connection Diagnostics Checker**: Manual or auto-refresh handshakes testing URL reachability, WooCommerce credential validation, SSL states, and millisecond latencies.
- **Security panel**: IP Address comma arrays, max login attempts, Rate Limit switches, and Two Factor authentication simulations.

---

## 🛣️ Centralized Directory Configuration

```bash
├── server.ts                 # Express full-stack bootloader & Vite middleware
├── package.json              # Bundling commands and system scripts
├── src/
│   ├── types.ts              # TypeScript interface schemas for WooCommerce
│   ├── App.tsx               # Auth & settings providers, dashboard layout routing
│   ├── main.tsx              # React bootstrap mounting
│   ├── index.css             # Tailwind layout specifications
│   ├── components/
│   │   ├── Sidebar.tsx       # Brand headers, system status dots, and menus
│   │   └── Navbar.tsx        # Alerts stream dropdown, theme switches
│   ├── pages/
│   │   ├── Login.tsx         # Auth credentials page with prefilled preset accounts
│   │   ├── Dashboard.tsx     # Metrics, Recharts curves, and auto-save scratchnotes
│   │   ├── Products.tsx      # Comprehensive CRUD, bulk controls, and gallery uploads
│   │   ├── Users.tsx         # Customer tables, order history models, and CSV downloaders
│   │   ├── Coupons.tsx       # Coupon ticket lists and auto-code builders
│   │   └── Settings.tsx      # WordPress site properties, diagnostic checkers, and security locks
│   └── services/
│       └── api.ts            # Centralized Axios interceptors & JWT attachment layers
```

---

## 💻 Installation & Local Launch Commands

1. **Integrate Local Dependencies**:
   ```bash
   npm install
   ```
2. **Launch Standalone Dev Server (Express + Vite)**:
   ```bash
   npm run dev
   ```
   Go to `http://localhost:3000` to review the dashboard.

3. **Verify Code Quality**:
   ```bash
   npm run lint
   ```
4. **Compile for Production Build**:
   ```bash
   npm run build
   ```
5. **Launch stand-alone production environment**:
   ```bash
   npm run start
   ```

---

## 🛡️ Prefilled Playground Accounts

To test the role-based security permissions out of the box, we have preloaded the following secure presets on the login screen. You can click any preset to automatically fill the form fields:

1. **Super Admin**:
   * Username / Email: `admin`
   * Password: `password123`
   * Permissions: Complete CRUD and system settings modifications.
2. **Staff Admin**:
   * Username / Email: `staff`
   * Password: `password123`
   * Permissions: Can manage products and coupons, but restricted from modifying critical API credentials or whitelists.
3. **Product Manager**:
   * Username / Email: `manager`
   * Password: `password123`
   * Permissions: Read-only views, and can ONLY edit product specs.
