# Lumenarie Bank System - Setup Guide

## 🚀 Quick Start

This is a gamified classroom economy system for teachers to manage student accounts with astronomy and earth science theming.

### Current Status
- ✅ All UI components built and working with mock data
- ✅ Database schema complete and ready for Supabase
- ✅ Hybrid auth system (supports both mock and real Supabase auth)
- ⏳ Awaiting Supabase setup to enable real auth

---

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Supabase account** (free tier works fine)

---

## 🛠️ Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for provisioning (takes ~2 minutes)
3. Go to **Project Settings → API**
4. Copy your project URL and anon key

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Step 4: Run Database Migrations

Open the Supabase SQL Editor and run these files **in order**:

1. ✅ `supabase/001_create_profiles.sql`
2. ✅ `supabase/002_create_accounts.sql`
3. ✅ `supabase/003_create_prizes.sql`
4. ✅ `supabase/004_create_transactions.sql`
5. ✅ `supabase/005_create_prize_requests.sql`
6. ✅ `supabase/006_create_notifications.sql`
7. ✅ `supabase/007_create_classes.sql`
8. ✅ `supabase/008_create_class_memberships.sql`
9. ✅ `supabase/009_update_for_classes.sql`
10. ✅ `supabase/010_fix_profile_insert_policy.sql`
11. ✅ `supabase/011_fix_classes_rls_recursion.sql`
12. ✅ `supabase/012_fix_accounts_trigger.sql`

See [supabase/README.md](./supabase/README.md) for detailed schema documentation.

### Step 5: Enable Google OAuth (Optional)

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Enable **Google**
3. Add your Google OAuth credentials (or use Supabase's demo credentials for testing)

### Step 6: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 - you should see the login page!

---

## 🎮 How It Works

### Development Mode (Mock Auth)
- If Supabase isn't configured, the app automatically uses mock authentication
- Quick-login buttons appear for testing different user roles
- All data is stored in mock files (no database required)

### Production Mode (Real Auth)
- Once Supabase is configured, real authentication is enabled
- Google OAuth sign-in works
- All data is stored in Supabase
- Mock login buttons are hidden

### Testing the App

#### As a Student:
1. Log in as "Luna Eclipse" (mock) or use Google sign-in
2. View your balance in Star Credits or Earth Points
3. Browse available prizes
4. Submit prize requests
5. Track transaction history

#### As a Teacher:
1. Log in as "Dr. Nova Sterling" (mock) or use Google sign-in
2. View all student accounts
3. Manage balances (add/subtract credits)
4. Approve/deny prize requests
5. Switch between multiple classes
6. Create and manage prize catalogs

---

## 🏫 Multi-Class Support

Teachers can manage multiple classes:
- Each student can be in multiple classes
- Separate balances per class
- Class-specific or shared prize catalogs
- Filter dashboard by class

---

## 🎨 Features

### Student Dashboard
- ⭐ Animated balance display with count-up effect
- 📜 Transaction history with filters
- 🎁 Prize catalog (astronomy, earth science, general)
- 🚀 Prize request form with animations
- 🎉 Confetti celebrations on deposits/approvals
- 🔔 Toast notifications for all actions

### Teacher Dashboard
- 👥 Student overview grid with rankings
- 💰 Direct balance management
- ✅ Prize request queue (approve/deny)
- 📊 Real-time statistics
- 🏫 Class switching and management
- 🎨 Customizable class themes

### Design & Theming
- 🌌 Animated starry background
- 🌈 Aurora and cosmic color palettes
- 🪐 Loading animations (rotating planets)
- ✨ Glass morphism UI
- 📱 Fully responsive design

---

## 🔧 Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **UI Components**: Custom built with Lucide icons
- **Notifications**: react-hot-toast
- **Celebrations**: canvas-confetti

---

## 📁 Project Structure

```
lumenarie-marketplace/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Student dashboard
│   ├── teacher/             # Teacher dashboard
│   ├── login/               # Auth pages
│   └── layout.tsx           # Root layout
├── components/
│   ├── student/             # Student-specific components
│   ├── teacher/             # Teacher-specific components
│   └── shared/              # Shared UI components
├── contexts/
│   └── AuthContext.tsx      # Hybrid auth provider
├── lib/
│   ├── types.ts             # TypeScript interfaces
│   ├── mockData.ts          # Development mock data
│   ├── currency.ts          # Currency formatting
│   ├── supabase/            # Supabase clients
│   └── utils/               # Helper utilities
├── hooks/
│   └── useConfetti.ts       # Confetti animations
├── supabase/                # Database migrations
│   ├── 001-009...sql        # Schema files
│   └── README.md            # Schema documentation
└── public/                  # Static assets
```

---

## 🐛 Troubleshooting

### Mock Login Shows in Production
- Check `.env.local` has valid Supabase credentials
- Verify `NODE_ENV=production` is set
- Clear browser cache

### Database Errors
- Ensure all SQL files ran in correct order (001 → 009)
- Check RLS policies are enabled
- Verify user has correct role in profiles table

### Auth Not Working
- Check Supabase project is active
- Verify API keys in `.env.local`
- Enable Google OAuth provider in Supabase dashboard
- Check browser console for errors

---

## 🎯 Next Steps

1. ✅ Run database migrations
2. ✅ Test with Google OAuth
3. ⏳ Create initial classes and add students
4. ⏳ Customize prize catalog
5. ⏳ Set up class themes and colors
6. ⏳ Deploy to Vercel/Netlify

---

## 📝 License

MIT

---

## 🙏 Credits

Built with ❤️ for classroom engagement
