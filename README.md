
  # Consultant Dashboard System

  Compliance management dashboard with Supabase-backed persistence.

  ## Running the code

  1. Follow **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** to configure Supabase (env vars, SQL migration, admin user).
  2. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key.
  3. Run `npm install` then `npm run dev`.

## GitHub CI / Supabase deploy

This repository includes a GitHub Actions workflow at `.github/workflows/supabase-deploy.yml`.

Required GitHub repository secrets:
- `SUPABASE_ACCESS_TOKEN` — Supabase CLI access token
- `SUPABASE_PROJECT_REF` — Supabase project reference

The workflow builds the app, runs `supabase db push`, and deploys the `admin-users` Edge Function on push to `main` or when manually triggered.

