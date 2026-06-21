# **Product Requirements Document (PRD)**
## **Expense Tracking & Budget Management System**

### **1. Product Vision & Philosophy**
A lightning-fast, minimalist personal finance application designed to remove the friction from daily expense tracking. By combining an uncluttered UI, instant data entry via global modals, and straightforward analytics, the platform encourages consistent financial monitoring without overwhelming the user.

---

### **2. Technical Stack & Theming Strategy**

| Layer | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React + Vite | Fast build times, standard component architecture. |
| **Styling & Components** | Tailwind CSS + `shadcn/ui` | Accessible, unstyled primitives configured for a minimalist aesthetic. |
| **Theming Engine** | `tweakcn` | Custom Tailwind CSS variables generated via tweakcn will be injected into Lovable to universally style all shadcn components (defining specific border radii, high-contrast colors, and minimal shadows). |
| **Backend API** | Python (FastAPI) | Asynchronous REST API, utilizing Pydantic for strict request/response validation. |
| **Database & ORM** | SQLite + SQLModel | Lightweight V1 setup using UUIDs to ensure a zero-friction migration to PostgreSQL in the future. |
| **Authentication** | PyJWT + Passlib | Stateless JWT Bearer token authentication. |

---

### **3. UI/UX Architecture & User Flow**

The frontend consists of four primary routes and one global interaction layer, strictly adhering to a minimalist design system.

#### **Global Interaction: The "Quick-Add" Expense Modal**
* **Trigger:** A persistent floating action button (FAB) or a `Cmd + K` (Command Palette) keyboard shortcut available from *any* page.
* **Component:** `shadcn Dialog` overlay.
* **Functionality:** A fast-entry form (Amount, Category dropdown, Date, optional Note). Submitting this auto-refreshes the underlying page state without a hard reload.

#### **Route 1: Landing Page (`/`)**
* **Focus:** High conversion, maximum negative space.
* **Elements:**
    * Bold, centered hero headline.
    * Single clear Call-to-Action ("Get Started").
    * A clean abstract mockup of the tweakcn-themed dashboard.
    * A lightweight 3-column feature grid using `lucide-react` icons.

#### **Route 2: Authentication (`/login`)**
* **Focus:** Frictionless entry.
* **Elements:** A single, centered `shadcn Card` utilizing `shadcn Tabs` to toggle seamlessly between "Sign In" and "Create Account".

#### **Route 3: Command Dashboard (`/dashboard`)**
* **Focus:** The daily financial snapshot.
* **Elements:**
    * **Metrics Row:** Three top-level `shadcn Cards` displaying: *Total Spent This Month*, *Remaining Budget*, and *Top Spending Category*.
    * **Recent Ledger:** A simplified, read-only list of the 5 most recent transactions.
    * **Micro-Chart:** A very simple 7-day trailing bar chart to visualize immediate spending velocity.

#### **Route 4: My Expenses (`/expenses`)**
* **Focus:** Detailed historical ledger.
* **Elements:**
    * A robust `shadcn DataTable` (via TanStack Table).
    * Columns: Date, Description, Category, Amount.
    * Functionality: Clickable column headers for sorting, and a single minimal text input for fast filtering/searching.

#### **Route 5: Analytics (`/analytics`)**
* **Focus:** High-level, easy-to-digest visual reporting.
* **Elements:**
    * Timeframe Toggle (This Month / Last Month / Year).
    * **Category Breakdown:** A simple `Recharts` Doughnut chart mapping the percentage of funds allocated to each category.
    * **Burn Rate Trend:** A basic line chart plotting cumulative monthly spending against a flat "Budget Cap" target line.

---

### **4. Data Entity Schema (SQLModel)**

To ensure the switch from SQLite to PostgreSQL is effortless, the database relies on UUIDv4 primary keys and strict relational mapping.

* **`User`**
    * `id` (UUID, Primary Key)
    * `email` (String, Unique)
    * `hashed_password` (String)
    * `created_at` (DateTime)
* **`Category`**
    * `id` (UUID, Primary Key)
    * `name` (String)
    * `is_default` (Boolean) - *True for system globals, False for user-created.*
    * `user_id` (UUID, Foreign Key -> User, Nullable)
* **`Expense`**
    * `id` (UUID, Primary Key)
    * `user_id` (UUID, Foreign Key -> User)
    * `category_id` (UUID, Foreign Key -> Category)
    * `amount` (Decimal)
    * `description` (String, Nullable)
    * `transaction_date` (Date)
* **`Budget`**
    * `id` (UUID, Primary Key)
    * `user_id` (UUID, Foreign Key -> User)
    * `limit_amount` (Decimal)
    * `month_year` (String, e.g., "2026-06")

---

### **5. Backend API Endpoints (FastAPI)**

*All endpoints under `/api/v1/...` (except auth) require a valid Bearer JWT.*

**Authentication (`/auth`)**
* `POST /signup` - Create a new user account.
* `POST /login` - Exchange credentials for a JWT.

**Expenses (`/expenses`)**
* `GET /` - Fetch transactions (Supports `?limit=`, `?offset=`, `?category=`).
* `POST /` - Log a new transaction (Triggered by the Quick-Add Modal).
* `DELETE /{id}` - Remove a specific entry.

**Analytics & Dashboards (`/analytics`)**
* `GET /summary` - Returns the top-level metrics for the Dashboard cards.
* `GET /charts/distribution` - Returns formatted JSON `{category: amount}` for the Recharts Doughnut component.
* `GET /charts/trend` - Returns a daily timeseries array of cumulative spending for the Line chart.

**Budgets & Categories (`/budgets`, `/categories`)**
* `GET /categories` - Fetches available categories for the dropdown menus.
* `GET /budgets` - Returns the current active monthly limit.
* `POST /budgets` - Sets or updates the monthly limit.
