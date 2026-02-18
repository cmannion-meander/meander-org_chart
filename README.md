# Meander Org Chart

This repo is designed to be rebuilt from scratch live using AI coding prompts.

If you reset the codebase, keep these files:
- `README.md`
- `PRD.md`
- `samples/employees_sample.csv`

## Rebuild Goal

Recreate the internal HR tool defined in `PRD.md` with:
- Next.js App Router
- Supabase (Postgres + Auth)
- Views: directory, org chart, employee profile
- CSV import workflow with validation and idempotent upsert
- Auth + role gates (`admin`, `hr_editor`, `viewer`)
- In-app role management page for admins

## Required Environment Variables

Use these names exactly:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SECRET_DEFAULT_KEY`
- `SUPABASE_DB_PASSWORD`

Never expose secret keys in `NEXT_PUBLIC_*` variables.

## Operator Setup (before prompts)

Run locally:

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
SUPABASE_SECRET_DEFAULT_KEY=...
SUPABASE_DB_PASSWORD=...
```

## Prompt Script (copy/paste in order)

### Prompt 1: Foundation

```text
You are my full-stack developer. Start from this repo with only PRD.md, README.md, and samples/employees_sample.csv present.

Build Stage 1 foundation only:
1) Scaffold a Next.js 16 App Router TypeScript app in this repo.
2) Add dependencies: @supabase/supabase-js, @supabase/ssr, zod, csv-parse.
3) Add scripts: dev, build, start, lint, typecheck, db:start, db:stop, db:status, db:reset.
4) Initialize Supabase project folder and migration workflow.
5) Add base app layout and a home page with a simple “Supabase connection OK” check.
6) Add .gitignore protections for .env files and private key material.

Constraints:
- Keep code server-safe and typed.
- Use App Router only.
- Do not implement auth/import/directory yet.

Validation:
- Run npm run lint, npm run typecheck, npm run build.
- Summarize changed files.
- Update README Development Record with Stage 1.
```

### Prompt 2: Schema + Env + Supabase Clients

```text
Implement Stage 2:

1) Add Supabase migration with these tables:
- employees
- user_roles
- import_jobs
Use practical constraints/indexes and timestamps.

2) Add typed Supabase helpers:
- browser client
- server client
- admin/service client
- middleware helper

3) Add environment module with strict checks:
- Required public vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
- Required server var: SUPABASE_SECRET_DEFAULT_KEY
- Backward compatible optional names: NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Throw a clear error if NEXT_PUBLIC_SUPABASE_SECRET_DEFAULT_KEY is set.
- Ensure public env access uses static process.env.NEXT_PUBLIC_* access (not dynamic key lookup).

4) Add/update .env.example with safe placeholders only.

Validation:
- Run npm run lint, npm run typecheck, npm run build.
- Update README Development Record with Stage 2.
```

### Prompt 3: Directory, Org Chart, Employee Profile

```text
Implement Stage 3 browse features from PRD:

Routes:
- /directory
- /org-chart
- /employees/[employeeId]

Requirements:
- Directory supports search (name/email/title) and filters (department/location/status).
- Org chart renders hierarchy from manager_employee_id and lets user choose a root.
- Employee profile shows core fields, direct manager, and direct reports.
- Add top nav component used across app.

Use current DB schema and Supabase queries.

Validation:
- Run npm run lint, npm run typecheck, npm run build.
- Update README Development Record with Stage 3.
```

### Prompt 4: CSV Import Pipeline

```text
Implement Stage 4 CSV import:

Add:
- UI page: /import
- API route: POST /api/imports/csv
- Import service module for parsing + validation + upsert

Validation rules:
- Required CSV columns: employee_id,name,email,title,department,location,manager_employee_id,status,start_date
- Required field checks
- Invalid date handling
- Duplicate employee_id in file handling
- Missing manager detection
- Manager cycle detection

Behavior:
- Idempotent upsert by employee_id
- Track create/update/reject counts
- Persist import job summary to import_jobs
- Return rejected rows with reasons and provide downloadable error CSV in UI

Validation:
- Run npm run lint, npm run typecheck, npm run build.
- Update README Development Record with Stage 4.
```

### Prompt 5: Auth + Role Gates

```text
Implement Stage 5 authentication and authorization:

Add routes/pages:
- /login
- /auth/callback
- /auth/logout
- /unauthorized

Auth requirements:
- Support Microsoft OAuth provider via Supabase (provider key: azure)
- Support email magic-link fallback
- Redirect unauthenticated users from protected pages

Role model:
- Roles from public.user_roles by user_email
- Default to viewer if no row exists
- Role enum: admin, hr_editor, viewer

Enforcement:
- /import page and /api/imports/csv require admin or hr_editor
- Server-side role checks only (not client-only)

Validation:
- Run npm run lint, npm run typecheck, npm run build.
- Update README Development Record with Stage 5.
```

### Prompt 6: In-App Admin Role Management

```text
Implement Stage 6 admin role management:

Add:
- Admin page: /admin/roles
- Admin API: /api/admin/roles with GET, PUT, DELETE

Rules:
- Admin-only access
- Manage user_roles rows (email + role)
- Prevent removing/demoting your own admin role unsafely
- Prevent deleting/demoting the last remaining admin

UI:
- Table of current role rows
- Add/update role form
- Delete action
- Show current signed-in user email and role counts

Also update app nav so admin users see an Admin link.

Validation:
- Run npm run lint, npm run typecheck, npm run build.
- Update README Development Record with Stage 6.
```

### Prompt 7: Final Hardening Pass

```text
Run a final hardening and consistency pass:

1) Ensure .gitignore excludes .env, .env.local, .env.* (except .env.example), and key/cert files.
2) Ensure README includes:
- local run instructions
- env variable names
- auth/role setup
- sample CSV import instructions
- known next stages (Data Sheet, tests, RLS hardening)
3) Fix any naming mismatches around Supabase keys.
4) Re-run npm run lint, npm run typecheck, npm run build and resolve all issues.
5) Provide a concise file-by-file summary.
```

## SQL Bootstrap For First Admin

After auth works and you can connect to DB, run this once:

```sql
insert into public.user_roles (user_email, role)
values ('cmannion@meanderhq.com', 'admin')
on conflict (user_email)
do update set role = excluded.role, updated_at = timezone('utc', now());
```

If using `psql` with Supabase pooler:

```bash
set -a
source .env.local
set +a

PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  "host=aws-1-us-east-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.<project-ref> sslmode=require"
```

Replace `<project-ref>` with your Supabase project ref.

## Live Demo Flow

Use this sequence on camera:
1. Run Prompt 1 through Prompt 7 in order.
2. Apply migration SQL in Supabase (or use `supabase db reset` for local stack).
3. Start app: `npm run dev`.
4. Sign in at `/login`.
5. Bootstrap admin role with SQL above.
6. Open `/admin/roles` and assign any extra users.
7. Import `samples/employees_sample.csv` at `/import`.
8. Demo `/directory`, `/org-chart`, and `/employees/<employee_id>`.

## Development Record

- Stage 0 (February 18, 2026): Planned MVP scope and architecture from `PRD.md`.
- Stage 1 (February 18, 2026): Next.js + Supabase foundation.
- Stage 2 (February 18, 2026): Schema, env safety, Supabase client layers.
- Stage 3 (February 18, 2026): Directory, org chart, employee profile browse views.
- Stage 4 (February 18, 2026): CSV import pipeline with validation, idempotent upsert, and error reporting.
- Stage 5 (February 18, 2026): Auth + role gates (Microsoft OAuth + magic link).
- Stage 6 (February 18, 2026): In-app admin role management.

## Next Stages (not yet implemented)

- Data Sheet view with column picker + CSV export
- Automated tests (unit/integration/e2e)
- RLS hardening and audit logging
- Perf validation at 2k/5k employee scale
