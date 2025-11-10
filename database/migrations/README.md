# Database Migrations

This directory contains SQL migration scripts for setting up the Supabase database.

## Current Schema

### Authentication
- **Firebase Auth** handles all user authentication (Google OAuth + email/password)
- Supabase stores only application data, not auth

### Tables

1. **users** - Maps Firebase users to database records
   - `firebase_uid` (unique) - Links to Firebase Auth user
   - `email`, `name` - User profile info
   
2. **vessels** - Vessel properties and specifications
   - Linked to `users` via `user_id`
   - Stores vessel geometry, MAWP, set pressure, etc.
   
3. **cases** - Relief calculation cases
   - Linked to `vessels` and `users`
   - Stores case type, input data (JSONB), and calculated results

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `001_initial_schema.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push
```

### Option 3: Direct SQL Execution

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" -f 001_initial_schema.sql
```

## Environment Variables

After setting up the database, ensure these are in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Row Level Security (RLS)

The migration includes RLS policies, but since we're using the **service role key** from our Next.js API routes, these policies are bypassed. The policies are in place for future client-side direct access if needed.

Our API route (`/api/auth/verify-token`) handles authorization by verifying Firebase tokens before any database operations.

