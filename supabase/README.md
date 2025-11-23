# Supabase Database Schema

This directory contains SQL files to set up the database schema for the Lumenarie student bank system.

## Setup Instructions

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### 2. Get Your API Keys
1. Go to Project Settings → API
2. Copy the following values to your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The `anon` `public` key
   - `SUPABASE_SERVICE_ROLE_KEY`: The `service_role` `secret` key

### 3. Run the SQL Files
Execute the SQL files **IN THIS EXACT ORDER** through the Supabase SQL Editor:

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste each file's contents, then click "Run"
3. **IMPORTANT: Run in this order to avoid dependency errors:**

   ✅ **001_create_profiles.sql** - User profiles and authentication
   ✅ **002_create_accounts.sql** - Student account balances (without class_id yet)
   ✅ **003_create_prizes.sql** - Prize catalog (without class_id yet)
   ✅ **004_create_transactions.sql** - Transaction history
   ✅ **005_create_prize_requests.sql** - Prize redemption workflow (without class_id yet)
   ✅ **006_create_notifications.sql** - In-app notifications (optional)
   ✅ **007_create_classes.sql** - Classes table (no dependencies on 008)
   ✅ **008_create_class_memberships.sql** - Student-class relationships (requires 007)
   ✅ **009_update_for_classes.sql** - Adds class_id to existing tables (requires 007 & 008)

**Why this order matters:**
- Files 001-006 create the basic tables
- File 007 creates `classes` table
- File 008 creates `class_memberships` which references `classes`
- File 009 updates 002, 003, and 005 to add `class_id` columns and class-aware policies

### 4. Enable Email Confirmations (Optional)
By default, Supabase requires email confirmation. To disable for testing:
1. Go to Authentication → Settings
2. Disable "Enable email confirmations"

## Database Schema Overview

### Tables

**`profiles`** - Extends auth.users with role and profile data
- `id` - UUID (references auth.users)
- `email` - User email
- `name` - Display name
- `role` - Either 'student' or 'teacher'
- `avatar` - Emoji or image URL

**`accounts`** - Student account balances
- `id` - UUID
- `user_id` - References profiles
- `balance` - Current balance (integer, >= 0)
- `currency` - Either 'star-credits' or 'earth-points'

**`transactions`** - Complete transaction history
- `id` - UUID
- `account_id` - References accounts
- `user_id` - References profiles
- `type` - deposit | withdrawal | prize-redemption | adjustment
- `amount` - Transaction amount
- `balance_before` - Balance before transaction
- `balance_after` - Balance after transaction
- `reason` - Why the transaction occurred
- `created_by` - Teacher who created it

**`prizes`** - Available prizes
- `id` - UUID
- `name` - Prize name
- `description` - Prize description
- `cost` - Cost in credits
- `category` - astronomy | earth-science | general
- `icon` - Emoji or icon identifier
- `available` - Whether prize is currently available

**`prize_requests`** - Student prize redemption requests
- `id` - UUID
- `student_id` - References profiles
- `prize_id` - References prizes
- `status` - pending | approved | denied | fulfilled
- `reviewed_by` - Teacher who reviewed
- `review_notes` - Teacher's notes

**`notifications`** - In-app notifications
- `id` - UUID
- `user_id` - References profiles
- `title` - Notification title
- `message` - Notification message
- `type` - success | info | warning | error
- `read` - Whether user has read it

### Key Functions

**`create_transaction(account_id, type, amount, reason, notes)`**
- Atomically creates a transaction and updates account balance
- Prevents race conditions with row locking
- Returns transaction ID

**`approve_prize_request(request_id, review_notes)`**
- Approves a prize request
- Creates transaction and deducts balance
- Updates request status
- Sends notification to student

**`deny_prize_request(request_id, review_notes)`**
- Denies a prize request
- Updates request status
- Sends notification to student

### Security (Row Level Security)

All tables have RLS policies:
- **Students** can only view/modify their own data
- **Teachers** can view/modify all student data
- Balance changes require using the `create_transaction` function
- Prize requests go through approval workflow

## Testing the Schema

After running the SQL files, you can test by:
1. Creating a test user through your app's signup flow
2. Checking that a profile and account were automatically created
3. Using the teacher account to create transactions
4. Testing prize requests as a student

## Troubleshooting

**"relation does not exist" errors:**
- Make sure you ran all SQL files in order
- Check that the `public` schema is being used

**RLS policy errors:**
- Verify the user is authenticated
- Check that the user's role is set correctly in the profiles table

**Balance not updating:**
- Use the `create_transaction` function instead of direct updates
- Check that the account isn't locked by another transaction

## TypeScript Types

Generate strongly-typed Supabase clients from your live schema:

1. Create a personal access token in Supabase (Settings > Access Tokens) and export it as `SUPABASE_ACCESS_TOKEN`.
2. Set `SUPABASE_PROJECT_ID` to your project ref (also works with `SUPABASE_PROJECT_REF`; falls back to parsing `NEXT_PUBLIC_SUPABASE_URL`).
3. Run `npm run supabase:types`.
4. The generated types are written to `lib/supabase/database.types.ts` and automatically used by the client/server helpers.

Re-run the command whenever the database schema changes.

