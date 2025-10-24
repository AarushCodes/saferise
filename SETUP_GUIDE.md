# SafeRise Setup Guide

## What's Been Built

I've created the foundation for your SafeRise construction safety platform! Here's what's ready:

### ✅ Completed Features

1. **Project Structure**
   - Modern React + TypeScript + Vite setup
   - Tailwind CSS for styling
   - Three separate apps (Worker, Manager, Contractor) with routing
   - Reusable component library

2. **Database Schema**
   - Complete Supabase PostgreSQL schema with 14 tables
   - Row Level Security (RLS) policies configured
   - Sample training lessons pre-populated
   - Ready-to-use SQL migration file

3. **Authentication System**
   - Email + OTP verification flow using Supabase Auth
   - User roles (worker, manager, contractor)
   - Protected routes based on user role

4. **Worker App - Onboarding Flow**
   - Email entry page with OTP request
   - OTP verification page
   - Profile setup (name, phone, experience, photo upload)
   - Smooth 3-minute onboarding as specified
   - Worker home screen with navigation

5. **Shared Components**
   - Button, Card, Input, TextArea, Select, Modal components
   - Consistent design system
   - Utility functions for formatting dates, currency, location

### 🚧 What's Next (Needs Implementation)

**Worker App:**
- Daily safety check-ins (4 toggles + photo)
- Incident reporting (photo + voice note)
- Training module (3 lessons with videos + quizzes)
- Job marketplace (browse, apply, track applications)
- Fall detection using accelerometer
- Push notifications

**Manager Dashboard:**
- Overview with stats
- All monitoring tabs (check-ins, incidents, alerts, training, reports)
- Job management
- Worker directory

**Contractor Portal:**
- Landing page and signup
- Job posting and management

## Quick Start

### 1. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Choose a region close to you
4. Set a strong database password (save it!)
5. Wait for project to initialize (~2 minutes)

### 2. Get Your Credentials

1. In your Supabase project, click on **Settings** (gear icon)
2. Click on **API** in the sidebar
3. Copy these two values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key (under Project API keys)

### 3. Set Up Database

1. In Supabase dashboard, click **SQL Editor** in sidebar
2. Click **New query**
3. Open the file `supabase/migrations/20250124000000_initial_schema.sql` in this project
4. Copy ALL the contents and paste into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" - this is good!

The database now has:
- All tables created
- Security policies configured
- 3 sample training lessons inserted

### 4. Create Storage Buckets

1. In Supabase dashboard, click **Storage** in sidebar
2. Click **New bucket**
3. Create these three buckets (make all **Public**):

   **Bucket 1: photos**
   - Name: `photos`
   - Public: ✅ Yes
   - For: Profile photos, check-in photos, incident photos

   **Bucket 2: voice-notes**
   - Name: `voice-notes`
   - Public: ✅ Yes
   - For: Incident voice recordings

   **Bucket 3: certificates**
   - Name: `certificates`
   - Public: ✅ Yes
   - For: Training certificates (PDF)

### 5. Configure Environment Variables

1. Open the file `.env` in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

Save the file!

### 6. Run the App

```bash
cd saferise
pnpm install  # If you haven't already
pnpm dev
```

The app will open at http://localhost:3000

## Testing the Worker Onboarding Flow

1. Go to http://localhost:3000
2. Click on "Worker App"
3. Enter your email address
4. Check your email for the OTP code (6 digits)
5. Enter the OTP code
6. Complete your profile:
   - Upload a photo (optional)
   - Enter your name
   - Enter your phone number
   - Select years of experience
7. Click "Complete Setup"
8. You'll land on the Worker Home screen!

## Project Structure

```
saferise/
├── src/
│   ├── apps/
│   │   ├── worker/              # Worker mobile app
│   │   │   ├── pages/           # All worker screens
│   │   │   │   ├── OnboardingEmail.tsx      ✅ Done
│   │   │   │   ├── OnboardingOTP.tsx        ✅ Done
│   │   │   │   ├── OnboardingProfile.tsx    ✅ Done
│   │   │   │   ├── WorkerHome.tsx           ✅ Done
│   │   │   │   ├── DailyCheckIn.tsx         🚧 TODO
│   │   │   │   ├── IncidentReport.tsx       🚧 TODO
│   │   │   │   ├── Training.tsx             🚧 TODO
│   │   │   │   ├── Jobs.tsx                 🚧 TODO
│   │   │   │   └── Profile.tsx              🚧 TODO
│   │   │   └── WorkerApp.tsx
│   │   ├── manager/             # Manager dashboard
│   │   │   └── ManagerApp.tsx   🚧 TODO
│   │   └── contractor/          # Contractor portal
│   │       └── ContractorApp.tsx 🚧 TODO
│   ├── shared/
│   │   ├── components/          # Reusable UI components ✅
│   │   ├── hooks/               # useAuth hook ✅
│   │   ├── lib/                 # Supabase client + utils ✅
│   │   └── types/               # TypeScript types ✅
│   ├── App.tsx                  # Main routing ✅
│   └── main.tsx                 # Entry point ✅
├── supabase/
│   └── migrations/
│       └── 20250124000000_initial_schema.sql  ✅
├── .env                         # Your credentials
├── README.md                    # Full documentation
└── SETUP_GUIDE.md              # This file
```

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution:** Make sure your `.env` file has the correct credentials and restart the dev server.

### Issue: OTP email not arriving
**Solution:**
- Check spam folder
- In Supabase, go to Authentication > Settings and make sure Email Auth is enabled
- Supabase free tier has email limits - check your quota

### Issue: Photo upload fails
**Solution:**
- Make sure the `photos` bucket exists in Supabase Storage
- Make sure it's set to Public
- Check browser console for specific error

### Issue: Profile creation fails
**Solution:**
- Check browser console for the specific error
- Make sure the database migration ran successfully
- Verify RLS policies are created (check Supabase > Table Editor > users table > Policies)

## Next Development Steps

I recommend building features in this order:

### Phase 1: Worker Core Features
1. **Daily Check-In** (src/apps/worker/pages/DailyCheckIn.tsx)
   - 4 yes/no toggles
   - Photo upload
   - GPS location
   - Submit to database

2. **Incident Reporting** (src/apps/worker/pages/IncidentReport.tsx)
   - Type selection (near-miss / unsafe condition)
   - Photo upload (required)
   - Voice note recording (optional, 30 sec max)
   - Location capture

3. **Training Module** (src/apps/worker/pages/Training.tsx)
   - List 3 lessons
   - Video player for each lesson
   - Quiz with 3 questions
   - Certificate generation on completion

4. **Job Marketplace** (src/apps/worker/pages/Jobs.tsx)
   - Browse jobs list
   - Job detail page
   - Apply functionality
   - My Applications tab

### Phase 2: Manager Dashboard
1. Overview dashboard with stats cards
2. Check-ins monitoring tab
3. Incidents tracking tab
4. Real-time alerts tab
5. Training progress tracking
6. Reports generation
7. Job management
8. Worker directory

### Phase 3: Advanced Features
1. Fall detection using phone accelerometer
2. Push notifications setup
3. Real-time subscriptions
4. Contractor portal

## Helpful Resources

- **Supabase Docs:** https://supabase.com/docs
- **React Router Docs:** https://reactrouter.com
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Vite Docs:** https://vitejs.dev

## Need Help?

If you run into issues:
1. Check the browser console for errors (F12 or Cmd+Option+I)
2. Check the terminal where `pnpm dev` is running
3. Review the Supabase dashboard for database/auth errors
4. Double-check your `.env` file

## What You Have Now

You have a **fully functional foundation** with:
- ✅ Modern tech stack configured
- ✅ Database schema ready
- ✅ Authentication working
- ✅ Worker onboarding complete
- ✅ Component library built
- ✅ Routing setup for all three portals
- ✅ Type safety with TypeScript

The groundwork is done - now you can focus on building out the specific features one by one!
