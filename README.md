# Samrakshak - Construction Safety Platform

A comprehensive safety platform for construction workers, site managers, and contractors. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Worker App
- ✅ Smooth onboarding with email OTP verification
- ✅ Profile setup (name, photo, experience)
- 🚧 Daily safety check-ins
- 🚧 Incident reporting (near-miss/unsafe conditions)
- 🚧 3-lesson safety training with certification
- 🚧 Job marketplace to find work
- 🚧 Fall detection using phone accelerometer
- 🚧 Push notifications for alerts

### Manager Dashboard
- 🚧 Real-time safety monitoring
- 🚧 Check-in compliance tracking
- 🚧 Incident management
- 🚧 Fall detection alerts
- 🚧 Training progress tracking
- 🚧 Job posting and applicant management
- 🚧 Worker directory
- 🚧 Report generation

### Contractor Portal
- 🚧 Job posting
- 🚧 Access to certified worker directory
- 🚧 Applicant review and acceptance

## Project Structure

```
Samrakshak/
├── src/
│   ├── apps/
│   │   ├── worker/       # Worker mobile app
│   │   ├── manager/      # Manager dashboard
│   │   └── contractor/   # Contractor portal
│   ├── shared/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks (auth, etc.)
│   │   ├── lib/          # Utilities (Supabase client, helpers)
│   │   └── types/        # TypeScript type definitions
│   ├── App.tsx           # Main routing
│   ├── main.tsx          # App entry point
│   └── style.css         # Tailwind styles
├── supabase/
│   └── migrations/       # Database schema
├── .env                  # Environment variables
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Get your project URL and anon key from Settings > API

### 2. Set up Database

1. In your Supabase project dashboard, go to SQL Editor
2. Copy the contents of `supabase/migrations/20250124000000_initial_schema.sql`
3. Paste and run it in the SQL Editor

### 3. Configure Storage Buckets

In Supabase dashboard:
1. Go to Storage
2. Create the following buckets (all public):
   - `photos` - for profile photos, check-in photos, incident photos
   - `voice-notes` - for incident voice notes
   - `certificates` - for training certificates

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 5. Install Dependencies

```bash
pnpm install
```

### 6. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Available Routes

- `/` - Portal selection (Worker, Manager, Contractor)
- `/worker` - Worker app
- `/manager` - Manager dashboard
- `/contractor` - Contractor portal

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management:** React Context + Hooks

## Database Schema

The app uses 14 tables:
- `users` - Base user information
- `worker_profiles` - Worker-specific data
- `manager_profiles` - Manager-specific data
- `contractor_profiles` - Contractor-specific data
- `daily_check_ins` - Safety check-in records
- `incidents` - Incident reports
- `safety_alerts` - Fall detection alerts
- `training_lessons` - Safety training content
- `training_progress` - Worker training progress
- `certifications` - Worker certifications
- `jobs` - Job postings
- `job_applications` - Job applications
- `notifications` - User notifications
- `work_shifts` - Worker shift tracking

## Development Status

- ✅ Project setup and configuration
- ✅ Database schema and types
- ✅ Authentication system (email OTP)
- ✅ Shared UI components
- ✅ Worker onboarding flow
- 🚧 Worker features (check-ins, incidents, training, jobs)
- 🚧 Manager dashboard
- 🚧 Contractor portal
- 🚧 Real-time notifications
- 🚧 Fall detection system

## Next Steps

1. Complete Worker App features:
   - Daily safety check-ins
   - Incident reporting with photo/voice
   - Training module with videos and quizzes
   - Job marketplace with applications
   - Fall detection using accelerometer

2. Build Manager Dashboard:
   - Overview with stats cards
   - Check-in monitoring
   - Incident management
   - Alert management
   - Training progress tracking
   - Job and applicant management
   - Worker directory
   - Report generation

3. Build Contractor Portal:
   - Landing page and signup
   - Job posting
   - Applicant management
   - Worker directory access

4. Add real-time features:
   - Push notifications
   - Real-time alert updates
   - Live safety monitoring

## License

MIT
