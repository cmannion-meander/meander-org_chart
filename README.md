# Meander Org Chart Rebuild Kit

This repository intentionally keeps only the reusable inputs needed to regenerate the project end to end.

## Included Files

- `README.md`: this guide
- `PRD.md`: product requirements
- `Prompts.md`: ordered prompts to rebuild the app
- `samples/employees_sample.csv`: sample import data
- `.env.example`: reference env template
- `.gitignore`: baseline ignore rules
- `LICENSE`

## Goal

Give a new user everything needed to recreate the full app from scratch by running the prompt sequence, instead of shipping generated implementation code.

## Rebuild Process

1. Open this repo in Codex (or your preferred coding agent).
2. Run prompts in `Prompts.md` strictly in order.
3. After scaffold starts, install dependencies:
   - `npm install`
4. Create `.env.local` from `.env.example`.
5. Complete validations at each stage (`lint`, `typecheck`, `build`).
6. Use `samples/employees_sample.csv` for import testing/demo flow.

## Environment Variables

Canonical names:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SECRET_DEFAULT_KEY`
- `SUPABASE_DB_PASSWORD`

Optional:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Never set `NEXT_PUBLIC_SUPABASE_SECRET_DEFAULT_KEY`.
