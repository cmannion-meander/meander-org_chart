# Meander Org Chart

## Implementation Plan (Pre-Development)

This README captures the implementation plan derived from `PRD.md`.  
No application development has started yet.

## MVP Constraints To Honor

- Deployment: single Azure App Service (no Kubernetes).
- Auth: Azure AD (Microsoft Entra ID) via OAuth/OIDC; corporate accounts only.
- Roles: `admin`, `hr_editor`, `viewer`, with server-side enforcement on write/admin routes.
- Data store: PostgreSQL in Azure; SQLite allowed for local development.
- Scale/performance targets:
  - Directory search p95 under 500ms at up to 5k employees.
  - Page load p95 under 2s on corp network at ~2k employees.
  - Data sheet CSV export supports 5k filtered rows without timeout.
  - Org chart remains usable at up to 2k employees (lazy child loading preferred).
- MVP write path: CSV import (upsert) is primary way to create/update employee records.
- Explicit MVP scope only: directory, profile, org chart, filters, data sheet, export, role-gated admin import.

## Recommended Technical Approach

- Framework: Next.js (App Router) fullstack app.
- Auth: NextAuth with Azure AD provider.
- ORM/data: Prisma + PostgreSQL.
- Hosting: one Node runtime on Azure App Service.
- Observability: application logging + Sentry for errors.

This matches the PRD recommendation for a single deployable unit and fast UI iteration.

## Delivery Plan

### Phase 0: Finalize Decisions (1-2 days)

- Confirm defaults from PRD open questions:
  - System of record = HRIS CSV only (for MVP).
  - Photos = URL only.
  - Terminated employees hidden by default unless filtered.
  - Org chart can be rooted on any manager in UI.
- Define RBAC ownership process (who grants/removes `admin` and `hr_editor`).
- Freeze MVP field dictionary and CSV contract.

### Phase 1: Project Foundation (2-3 days)

- Bootstrap Next.js + TypeScript + App Router structure.
- Configure Prisma schema/migrations for:
  - `Employee`
  - `UserRole`
  - `ImportJob`
- Add local/dev environment setup using SQLite and production profile for PostgreSQL.
- Add shared validation layer (Zod or equivalent) for CSV rows and API DTOs.
- Establish baseline CI (typecheck, lint, tests).

### Phase 2: Authentication and Authorization (2-3 days)

- Integrate NextAuth Azure AD login flow.
- Enforce auth on all application pages and APIs.
- Implement role lookup via `UserRole`.
- Add route/action guards:
  - `viewer`: read-only
  - `hr_editor`: import + data edits where allowed
  - `admin`: role/field/import configuration
- Add authorization tests for protected write paths.

### Phase 3: Import Pipeline (4-5 days)

- Build CSV upload UI (role-gated to `hr_editor`/`admin`).
- Parse and validate required columns:
  - `employee_id`, `name`, `email`, `title`, `department`, `location`, `manager_employee_id`, `status`, `start_date`
- Implement idempotent upsert by `employee_id`.
- Add integrity checks:
  - required fields
  - missing manager references
  - cycle detection in manager graph
- Generate import report (created/updated/rejected counts + row-level errors).
- Provide downloadable error CSV.
- Persist import metadata/results in `ImportJob`.

### Phase 4: Directory and Profile (3-4 days)

- Build directory list with:
  - search across name/email/title
  - filters for department/location/status
- Build profile view with stable route by `employee_id`.
- Show manager chain and direct reports snippet.
- Ensure query/index strategy supports target search latency.

### Phase 5: Org Chart (4-5 days)

- Render hierarchy from `manager_employee_id`.
- Support pan/zoom and expand/collapse.
- Click node routes to profile.
- Implement root behavior:
  - auto-select single no-manager root
  - require configured root when multiple roots exist
- Surface edge cases:
  - cycle errors
  - orphaned nodes (missing managers)
- Add lazy loading strategy for larger org trees.

### Phase 6: Data Sheet and Export (3-4 days)

- Build table with sortable/filterable columns.
- Add column picker for visible columns.
- Ensure filter semantics match directory.
- Export current filtered/visible dataset to CSV.
- Test 5k-row export performance and timeout handling.

### Phase 7: Hardening and Azure Release (3-4 days)

- Add CSRF protections where applicable.
- Validate server-side authorization coverage.
- Add metrics/events:
  - logins
  - org chart views
  - exports
  - imports/failures
- Configure Azure App Service deployment pipeline.
- Run load/perf checks against MVP targets.
- Prepare admin/user handoff documentation.

## Testing and Quality Plan

- Unit tests:
  - CSV validation
  - cycle detection
  - role guard logic
- Integration tests:
  - auth-protected route behavior
  - import upsert idempotency
  - directory/profile query correctness
- End-to-end tests:
  - viewer browse flow
  - HR editor import flow with error handling
  - finance export flow
- Performance checks:
  - search latency on seeded 5k employees
  - org chart usability at 2k
  - export robustness at 5k rows

## Risks and Mitigations

- Dirty source CSV data causes graph inconsistencies.
  - Mitigation: strict validation + actionable error CSV + import dry-run mode.
- Org chart rendering degrades with very large teams.
  - Mitigation: lazy load children and cap initial expansion depth.
- Role drift (incorrect access) creates compliance risk.
  - Mitigation: server-side guards only, deny-by-default checks, access audit in logs.
- Performance regressions as fields/filters grow.
  - Mitigation: index critical columns, benchmark with seeded data in CI/staging.

## Out of Scope for MVP

- Slack/Carta/payroll integrations.
- SCIM provisioning and non-Azure SSO variants.
- Engagement features and advanced dashboards.
- Full in-app attribute editor and audit diff UI (planned for Phase 2+).
