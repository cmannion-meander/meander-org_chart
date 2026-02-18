## PRD: "People Directory Basic" (internal ChartHop-Basic clone)

### 1) Purpose

Build a lightweight internal web app that covers the "ChartHop Basic" core: **employee directory + org chart + simple filtering + a spreadsheet-like data view**, with minimal integrations and a managed backend via Supabase.

Success is "HR/People Ops can answer 'who is where, reporting to whom, and what’s their basic profile data' in <2 minutes, without opening HRIS exports."

---

### 2) Target users

* **People Ops / HRBP**: maintains org structure, job/level fields, manager relationships
* **Finance / FP&A**: views headcount roster and exports
* **Managers**: org visibility and basic team directory
* **Employees**: self-serve directory, profile info, reporting line

---

### 3) Scope (MVP vs later)

#### MVP (ship this first)

1. **Auth + roles**

   * Sign-in
   * Roles: `admin`, `hr_editor`, `viewer`
2. **Employee profiles (directory)**

   * Employee list, search, basic profile page
   * Fields: name, title, department, manager, location, email, start date, status (active/terminated), photo (optional)
3. **Org chart**

   * Tree view from CEO (or chosen root)
   * Node: name, title, dept, location
   * Click node → profile
4. **Filters**

   * Filter by department, location, manager, status
5. **Data sheet**

   * Table view of employees (sort, filter, column select)
   * CSV export
6. **Admin import**

   * CSV upload to create/update employees
   * Basic validation + error report

#### "Basic+" (phase 2)

* **Change history / audit log** (who edited what)
* **Attribute editor UI** (edit fields in-app; no CSV needed)
* **Custom fields** (simple key/value or JSON schema-lite)
* **Org chart filters** (show only dept, hide contractors, etc.)
* **Teams/Groups** (saved filters)

#### Nice-to-have / future (explicitly de-scoped for "keep it simple")

* Slack integration (profile sync / presence)
* Carta integration (equity)
* Payroll integration (HRIS connectors)
* "Map" visualization beyond a trivial location grouping
* SCIM provisioning and advanced identity workflows
* Engagement features (surveys, kudos, etc.)

---

### 4) Product requirements

#### 4.1 Authentication & authorization

**MVP requirement:** Azure AD sign-in (Microsoft Entra ID) via Supabase Auth OAuth/OIDC.

* Users must authenticate with corporate accounts.
* Authorization is role-based:

  * `admin`: manage roles, configure imports, manage fields
  * `hr_editor`: import roster, edit employee data
  * `viewer`: read-only access

**Acceptance criteria**

* Unauthenticated users are redirected to login.
* Role gates enforced on all write endpoints and admin UI.
* Azure AD tenant restrictions are enforced in auth configuration.

---

#### 4.2 Employee directory & profile

Directory view:

* Search: name, email, title
* Filters: department, location, status
* List items show: photo (optional), name, title, department, manager

Profile view:

* Shows core fields + reporting line (manager chain)
* "Org snippet": direct reports list

**Acceptance criteria**

* Search returns results in <500ms for up to 5k employees.
* Profile URL is stable (based on employee_id).

---

#### 4.3 Org chart

* Render hierarchical tree from `manager_id` links.
* Support zoom/pan and expand/collapse (simple).
* Default root:

  * If there is exactly one employee with no manager → root
  * Else admin sets a root employee

**Edge cases**

* Cycles (bad data): detect and surface a validation error.
* Multiple roots: require root selection.
* Missing managers: orphan nodes listed separately.

**Acceptance criteria**

* For org size up to 2k, initial render is usable (lazy-load children preferred).
* Clicking a node opens the profile.

---

#### 4.4 Data sheet

* Table with configurable columns (at least: name, title, dept, manager, location, status, start_date)
* Sort by any column
* Filter consistent with directory
* CSV export of current filter set

**Acceptance criteria**

* Export respects current filters and visible columns.
* Large exports (5k rows) complete without timeouts.

---

#### 4.5 Import (CSV)

* Upload CSV with required columns:

  * `employee_id`, `name`, `email`, `title`, `department`, `location`, `manager_employee_id`, `status`, `start_date`
* "Upsert" behavior:

  * Existing `employee_id` updates
  * New `employee_id` creates
* Validation:

  * required fields present
  * manager references exist (or flagged as missing)
  * cycle detection after import
* Import produces a report:

  * rows created/updated
  * rows rejected with reasons

**Acceptance criteria**

* Import is idempotent (re-uploading same file yields no changes).
* Validation errors are downloadable as CSV.

---

### 5) Non-functional requirements

* **Deployment:** single Next.js web app deployment plus one Supabase project
* **Data:** Supabase PostgreSQL (managed); local dev via Supabase CLI/local stack or shared dev project
* **Performance:** p95 page loads under 2s on corp network for 2k employees
* **Security:** least privilege, server-side auth checks, CSRF protection where relevant
* **Authorization model:** database-level protections via Postgres RLS where practical
* **Auditability (phase 2):** append-only change log for employee edits/imports

---

### 6) Recommended architecture (simple, managed, fast to iterate)

#### Option A (recommended): Next.js + Supabase

* **UI/API:** Next.js (App Router + route handlers/server actions)
* **Auth:** Supabase Auth with Azure AD provider
* **DB:** Supabase Postgres (tables + indexes + RLS)
* **Storage:** Supabase Storage for optional profile photos (phase 2; URL-only in MVP)
* **Org chart UI:** React tree library (or custom) with lazy loading
* **Hosting:** Vercel or Azure App Service for Next.js (single web app)

Why this fits: one app codebase, managed auth + database, and simpler operations for a small internal team.

#### Option B: Power Apps + Dataverse

* Better for no-code ownership by HR, but lower UI flexibility for advanced org-chart and custom interaction requirements.

Given current direction and need for tailored UX, **Next.js + Supabase is the pragmatic default**.

---

### 7) Data model (MVP)

**Employee**

* `id` (uuid, internal)
* `employee_id` (string, unique; from source system)
* `name` (string)
* `email` (string, unique)
* `title` (string)
* `department` (string)
* `location` (string)
* `status` (enum: active, leave, terminated, contractor)
* `start_date` (date, nullable)
* `manager_employee_id` (string, nullable)  // references employee.employee_id
* `photo_url` (string, nullable)
* `updated_at`, `created_at`

**UserRole**

* `user_email` (string, unique)
* `role` (enum: admin, hr_editor, viewer)

**ImportJob**

* `id`, `uploaded_by`, `uploaded_at`
* `status` (pending/running/succeeded/failed)
* `report_json` (summary + errors)

---

### 8) Key user flows

1. **Viewer** logs in → directory → filters to dept → clicks profile → opens org chart rooted at that manager
2. **HR editor** uploads latest roster CSV → resolves validation errors → org chart updates
3. **Finance** opens data sheet → selects columns → filters active employees → exports CSV

---

### 9) UX notes (minimum viable)

* Left nav: Directory | Org Chart | Data Sheet | Admin (role-gated)
* Directory: search bar + filter chips
* Org chart: root selector (admin-only) + filter dropdown
* Data sheet: column picker + export button

---

### 10) Instrumentation (MVP)

* Basic usage events:

  * logins
  * org chart views
  * exports
  * imports + import failures
* Error tracking (e.g., Sentry) strongly recommended

---

### 11) Delivery plan (phased)

**Phase 1 (MVP)**

* Auth + roles
* Employee CRUD via import only
* Directory + profile
* Org chart
* Data sheet + export

**Phase 2**

* In-app editing
* Audit log / diff views
* Saved views (filters + columns)

**Phase 3**

* Integrations (Slack/Carta/Payroll) only if there’s a real internal system-of-record need

---

### 12) Open questions (decide quickly; defaults included)

1. **System of record**: Is CSV export from HRIS the only input for now? (Default: yes)
2. **Photo source**: do we want to support uploads, or just a URL? (Default: URL only)
3. **Termination visibility**: show terminated employees by default or hidden? (Default: hidden unless filtered)
4. **Org root**: always top exec or allow rooting on any manager? (Default: allow any root in UI)
5. **Web hosting target**: Vercel or Azure App Service for the Next.js app? (Default: Vercel)

---

### 13) Explicit "ChartHop Basic" mapping (what we’re recreating)

From the screenshot’s promise ("org chart + employee data + engagement"), the internal-tool equivalent is:

* Rich profiles ✅ (MVP)
* Org chart w/ filters ✅ (MVP)
* SSO ✅ (MVP via Azure AD through Supabase Auth)
* "Primary payroll integrations" ❌ (de-scoped; CSV import stands in)
* Dashboard ❌ (replace with Directory + Data Sheet; add later if needed)
* "Map" ❌ (defer; optionally add a trivial "Location summary" later)
* Slack/Carta ❌ (defer)
