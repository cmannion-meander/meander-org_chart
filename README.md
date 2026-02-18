# Meander Org Chart

Internal HR tool for maintaining an org chart and people directory.

## Project Goal

Enable HR, managers, and finance to quickly answer:
- Who is on the team?
- Where do they sit in the org?
- Who reports to whom?

The MVP is intentionally simple: import employee data from CSV, browse it in multiple views, and control access with role-based permissions.

## MVP Scope

- Authentication (Microsoft via Supabase OAuth, with magic-link fallback)
- Roles: `admin`, `hr_editor`, `viewer`
- Directory view (`/directory`)
- Org chart view (`/org-chart`)
- Employee profile view (`/employees/[employeeId]`)
- CSV import flow (`/import`) with validation + idempotent upsert
- In-app admin role management (`/admin/roles`)

## Tech Stack

- Frontend/API: Next.js (App Router, TypeScript)
- Backend: Supabase (Postgres + Auth)
- Validation/parsing: Zod + `csv-parse`

## Repository Structure

- `PRD.md`: product requirements and acceptance criteria
- `Prompts.md`: ordered prompt sequence to rebuild the full app from scratch
- `samples/employees_sample.csv`: demo import data
- `src/`: app implementation (when present)
- `supabase/`: migrations and local Supabase config (when present)

## Environment Variables

Use these names:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SECRET_DEFAULT_KEY`
- `SUPABASE_DB_PASSWORD`

Do not expose secrets in any `NEXT_PUBLIC_*` variable.

## Rebuild / Demo Workflow

1. Keep `README.md`, `PRD.md`, and `samples/employees_sample.csv`.
2. Use prompts in `Prompts.md` in order.
3. Configure `.env.local`.
4. Apply DB migration.
5. Run the app and validate each stage.

## Current Delivery Status

Implemented so far:
- Foundation + schema
- Browse views (directory, org chart, profile)
- CSV import pipeline
- Auth + role gates
- Admin role management UI/API

Planned next:
- Data Sheet + CSV export
- Automated tests
- RLS hardening + audit logging
- Performance validation at target scale
