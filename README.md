
  # Consultant Dashboard System

  Compliance management dashboard with Supabase-backed persistence.

  ## Running the code

  1. Follow **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** to configure Supabase (env vars, SQL migration, admin user).
  2. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key.
  3. Run `npm install` then `npm run dev`.

## GitHub CI / Supabase deploy

This repository includes a GitHub Actions workflow at `.github/workflows/supabase-deploy.yml`.

Required GitHub repository secrets:
- `SUPABASE_ACCESS_TOKEN` — Supabase CLI access token (must be a valid `sbp_...` token)
- `SUPABASE_PROJECT_REF` — Supabase project reference

The workflow builds the app, publishes the frontend to GitHub Pages, runs `supabase db push`, and deploys the `admin-users` Edge Function on push to `main` or when manually triggered.

To keep the site always available:
1. Enable GitHub Pages for this repository and choose the `gh-pages` branch or default Pages deployment.
2. Add the required GitHub secrets.
3. Run the workflow manually once or push to `main`.
4. Use the deployed Pages URL as the public app URL, and add that URL to Supabase Auth redirect settings.

