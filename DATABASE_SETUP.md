# Database Setup Guide

This project uses **Supabase** (managed PostgreSQL + Auth) as its database layer. Supabase was chosen over a standalone MongoDB service because:

- No separate backend server is required — the React app talks to Supabase directly
- Relational data (users, employees, checklist items, archives) maps naturally to PostgreSQL
- Built-in Auth handles password hashing, sessions, and JWT tokens securely
- Row Level Security (RLS) enforces access control at the database level
- Business units (BU1/BU2/BU3) are now scoped per employee record

---

## Step 1 — Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**.
3. Choose an organization, name (e.g. `consultant-dashboard`), database password, and region.
4. Wait for the project to finish provisioning (~2 minutes).

---

## Step 2 — Run the database migration

1. In your Supabase dashboard, open **SQL Editor**.
2. Click **New query**.
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql` and paste it into the editor.
4. Click **Run**.

This creates all tables, RLS policies, triggers, and helper functions.

---

## Step 3 — Configure environment variables

1. In Supabase dashboard, go to **Project Settings → API**.
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. In the project root, create a `.env` file:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. **Never** commit `.env` to git. The `.env.example` file shows the required keys without real values.
5. **Never** put the `service_role` key in the frontend `.env` — it bypasses RLS and must only be used server-side.

---

## Step 4 — Configure Supabase Auth

In **Authentication → Providers → Email**:

| Setting | Recommended value |
|---------|-------------------|
| Enable Email provider | ON |
| Confirm email | OFF (for development) |
| Secure email change | ON (production) |

For production, enable email confirmation and configure SMTP under **Project Settings → Auth**.

Under **Authentication → URL Configuration**, set:

| Setting | Value |
|---------|--------|
| Site URL | `http://localhost:5173` (dev) or your production URL |
| Redirect URLs | Same URL(s) — required for admin **Forgot Password** reset emails |

Also run `supabase/migrations/004_admin_self_password_reset.sql` in the SQL Editor (unlocks locked admin accounts when they use Forgot Password).

**Forgot password (all users):** On the login screen, use **Forgot Password** with your email or phone. Supabase emails a reset link; locked accounts are unlocked via `prepare_user_password_reset` (migration `006`). Open the link → **Set New Password** → sign in. This does **not** use `password_reset_requests` (no RLS errors for logged-out users).

Run migrations through `006_user_password_reset_via_auth.sql` in the SQL Editor.

---

## Step 5 — Create the first admin user

### Option A — Supabase Dashboard (quickest)

1. Go to **Authentication → Users → Add user**.
2. Enter email: `contact@majfintech.com`, password: your chosen admin password.
3. Check **Auto Confirm User**.
4. After creation, open **SQL Editor** and run:

```sql
update public.profiles
set role = 'admin', name = 'System Administrator', email = 'contact@majfintech.com'
where login_email = 'contact@majfintech.com';
```

### Option B — Register then promote

1. Start the app (`npm run dev`), register a new account via the UI.
2. In SQL Editor, promote that user:

```sql
update public.profiles set role = 'admin' where login_email = 'your@email.com';
```

---

## Step 6 — Deploy the admin Edge Function (required for admin user management)

Admin actions **create user** and **delete user** require the **service role key**, which must never be exposed in the browser. These run via a Supabase Edge Function.

**Password reset** works without the Edge Function: the app emails the user a Supabase reset link and unlocks their account. Deploy the function only if you need admins to **set an exact password** from User Management (otherwise the UI falls back to email).

### Prerequisites

Install the Supabase CLI: [https://supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)

### Deploy

```bash
# Link to your project (one-time)
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy admin-users
```

The function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically when deployed to Supabase.

### Local testing (optional)

```bash
supabase functions serve admin-users --env-file supabase/.env.local
```

Create `supabase/.env.local` (gitignored):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Step 7 — Start the app

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and sign in with your admin account.

---

## Architecture overview

```
Browser (React/Vite)
    │
    ├── Supabase Auth        → sessions, password hashing, JWT
    ├── Supabase PostgreSQL  → all application data (RLS-protected)
    └── Edge Function        → admin-only operations (service role)
```

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends `auth.users`) |
| `employees` | Employee records, scoped by `business_unit` |
| `compliance_items` | Checklist rows per employee |
| `monthly_archives` | Archive metadata per BU/month |
| `archive_snapshots` | JSON snapshot of records at archive time |
| `activity_logs` | Admin audit trail |
| `password_reset_requests` | User-initiated reset workflow |
| `login_notifications` | Admin login alerts |
| `chat_messages` | User-to-user messaging |

### What was removed

- All `localStorage` persistence for application data
- Hardcoded sample employees (Sarah, David, Emma, James)
- Auto-seeding of fake compliance data on first load
- Plaintext password storage and “remember me” storing passwords

### Business unit scoping

Selecting BU1, BU2, or BU3 on the landing page now loads employees tagged with that `business_unit`. Each BU maintains its own employee list, checklists, and archives.

---

## Secrets checklist

| Secret | Where to store | Used by |
|--------|----------------|---------|
| `VITE_SUPABASE_URL` | `.env` (frontend) | React app |
| `VITE_SUPABASE_ANON_KEY` | `.env` (frontend) | React app |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function secrets only | `admin-users` function |
| Database password | Supabase dashboard only | Direct DB connections |
| `.env` | Add to `.gitignore` | Never commit |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Database Not Configured” screen | Create `.env` with both `VITE_*` vars and restart dev server |
| Login works but no data loads | Check RLS policies ran; verify user `status = 'active'` in `profiles` |
| Admin can’t create/delete users | Deploy `admin-users` Edge Function (Step 6) |
| “Failed to reset password” / Edge Function | Password reset now **emails a reset link** automatically if the function isn’t deployed. Run migration `005_admin_password_reset_helpers.sql`. For **setting a specific password** in the admin UI, deploy the Edge Function. |
| Phone login fails | Ensure `phone_number` is set on the profile row |
| `403` on data queries | User may be inactive or locked; check `profiles` table |

---

## Production recommendations

1. Enable email confirmation in Supabase Auth.
2. Configure custom SMTP for login notification emails.
3. Set up Supabase database backups (enabled by default on paid plans).
4. Rotate the service role key if ever exposed.
5. Add Supabase Realtime subscriptions for live chat updates (optional enhancement).

## Step 8 — GitHub Actions deployment

This project includes a GitHub workflow at `.github/workflows/supabase-deploy.yml`.

1. In GitHub repository settings, add the following secrets:
   - `SUPABASE_ACCESS_TOKEN` — a Supabase CLI access token
   - `SUPABASE_PROJECT_REF` — your Supabase project ref
2. The workflow builds the app, then runs `supabase db push` and `supabase functions deploy admin-users`.
3. The workflow triggers on push to `main` and can also be run manually.

> Do not store `SUPABASE_SERVICE_ROLE_KEY` in the frontend repository. It belongs only in Supabase Edge Function environment variables or in the Supabase project settings.
