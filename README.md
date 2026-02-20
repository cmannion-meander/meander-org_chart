# Meander Org Chart

Internal HR web app for directory visibility, org hierarchy browsing, controlled CSV imports, and role-based administration.

## Project Goal

Enable HR, managers, and finance to answer:
- Who is on the team?
- Where do they sit in the org?
- Who reports to whom?

The MVP is intentionally focused: authenticate users, browse people data, import roster updates safely, and enforce role-based access.

## Tech Stack

- App: Next.js 16 (App Router, TypeScript)
- Data/Auth: Supabase (Postgres + Auth)
- Validation: Zod
- CSV parsing: `csv-parse`

## Architecture

- Server-first Next.js app using App Router pages and Route Handlers
- Supabase clients split by runtime/context:
  - Browser client for client-side auth actions
  - Server client for authenticated server rendering
  - Admin/service client for privileged server operations
- Role model in `public.user_roles` (`admin`, `hr_editor`, `viewer`)
- CSV imports validated in a dedicated service module before upsert

## Repository Structure

- `app/`: routes, pages, API handlers
- `components/`: shared UI components
- `lib/`: env, auth, Supabase, import services
- `supabase/`: local Supabase config and SQL migrations
- `samples/employees_sample.csv`: sample import data
- `PRD.md`: product requirements
- `Prompts.md`: ordered rebuild prompts

## Environment Variables

Canonical names:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SECRET_DEFAULT_KEY`
- `SUPABASE_DB_PASSWORD`

Optional backward-compatible names:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Additional optional convenience:
- `DATABASE_URL` (for direct SQL migration workflows)

Notes:
- Never expose secrets in `NEXT_PUBLIC_*` variables.
- `NEXT_PUBLIC_SUPABASE_SECRET_DEFAULT_KEY` is explicitly rejected.
- If canonical and legacy key names are both set, values must match.

## Rebuild Instructions

1. Keep `README.md`, `PRD.md`, and `samples/employees_sample.csv`.
2. Follow prompts in `Prompts.md` in order.
3. Configure `.env.local` from `.env.example`.
4. Apply DB migrations (`supabase/` SQL files).
5. Run and validate:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`

## Azure Deployment

This repo is prepared for Azure App Service / Container Apps deployment.

- `next.config.ts` uses `output: "standalone"` for lean production runtime packaging.
- `Dockerfile` provides a multi-stage production image (`node:20-alpine`) suitable for Azure container deploys.
- `.dockerignore` minimizes Docker build context and excludes local secrets/artifacts.
- `.azureignore` excludes local-only/generated files for `azd` packaging workflows.
- `.deployment` enables build-on-deploy for App Service source deployments.

Typical paths:

1. Azure App Service (source deploy)
   - Push this repo, use Node 20+ runtime
   - Ensure app settings/env vars are configured in Azure
   - Startup command: `npm run start` (or leave default for Node app detection)
2. Azure App Service / Container Apps (container deploy)
   - Build from included `Dockerfile`
   - Expose port `3000` (already configured)
   - Configure required environment variables in Azure

## Current Scope Delivered

- Directory browse (`/directory`)
- Org chart browse (`/org-chart`)
- Employee profile (`/employees/[employeeId]`)
- CSV import pipeline (`/import`, `/api/imports/csv`)
- Auth (password sign-in/sign-up with admin approval workflow, Microsoft OAuth supported, no magic-link dependency)
- Admin role management (`/admin/roles`, `/api/admin/roles`)

## Recent Hardening Updates

- Fixed session persistence across navbar navigation by tightening server-side auth/session handling.
- Removed logout side effects on `GET` requests; logout is performed via `POST` to avoid link-prefetch signout behavior.
- Standardized production-safe callback/logout origin handling for Azure forwarded host/protocol headers.
- Kept password login as the primary sign-in path to avoid magic-link rate-limit dependence.
- Refined the interface styling to a cleaner SaaS-style UI baseline for directory, org chart, import, login, and admin views.

## Admin Bootstrap SQL

Use `supabase/sql/bootstrap_admin.sql` in Supabase SQL editor to promote an email to `admin`:

1. Edit the target email in the script.
2. Run the SQL.
3. The role row is upserted safely in `public.user_roles`.
