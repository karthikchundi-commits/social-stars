# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Social Stars" is a Next.js web app designed to help autistic children (ages 3-6) develop social and emotional skills through three types of interactive activities: emotion recognition games, social scenario choices, and interactive stories. Parents have a separate dashboard to monitor progress.

## App Directory

All source code lives in `nextjs_space/`. Run all commands from that directory.

## Commands

```bash
cd nextjs_space

# Development
yarn dev          # Start dev server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint

# Database
yarn prisma migrate dev   # Run migrations
yarn prisma generate      # Regenerate Prisma client
yarn prisma db seed       # Seed activities and test user (john@doe.com / johndoe123)
yarn prisma studio        # Open Prisma Studio GUI
```

## Architecture

### User Flow
1. **Landing** (`/`) - Public marketing page; redirects authenticated users to `/select-child`
2. **Auth** (`/auth/login`, `/auth/signup`) - Credential-based auth via NextAuth with JWT sessions
3. **Select Child** (`/select-child`) - Parent picks which child profile to use
4. **Child Dashboard** (`/dashboard/[childId]`) - Activity grid showing completed/incomplete activities with stars and badges
5. **Activities** - Three route groups, each passing `childId` as a query param:
   - `/activity/emotion/[activityId]` - Pick the correct emotion image
   - `/activity/scenario/[activityId]` - Multiple-choice social scenario
   - `/activity/story/[activityId]` - Page-by-page interactive story with embedded questions
6. **Parent Dashboard** (`/parent-dashboard`) - Recharts bar/pie charts showing per-child progress across all children

### API Routes (`app/api/`)
- `GET /api/activities` - Fetch all activities (no auth required)
- `GET/POST /api/progress?childId=` - Fetch completed activities, achievements & streak; POST marks an activity complete and awards milestone achievements. Awards at 1, 5, 10, 20 total completions; and type-specific badges for breathing (1st, 3rd) and communication (1st)
- `GET/POST /api/mood?childId=` - Fetch/save daily mood check-ins per child
- `GET/POST /api/children` - Manage child profiles for the authenticated user
- `POST /api/signup` - Create new parent account
- `[...nextauth]` - NextAuth handler using credentials provider + PrismaAdapter

### Activity Types
| Type | Route | Content Schema |
|------|-------|----------------|
| `emotion` | `/activity/emotion/[id]` | `{ emotion: string }` — child picks correct face from 6 options |
| `scenario` | `/activity/scenario/[id]` | `{ choices: [{ text, isCorrect, feedback }] }` |
| `story` | `/activity/story/[id]` | `{ pages: [{ text, image, question?, options?, correctAnswer? }] }` |
| `breathing` | `/activity/breathing/[id]` | `{ instruction, cycles, phases: [{ label, duration, color, expand }] }` |
| `communication` | `/activity/communication/[id]` | `{ instruction, targetTaps, items: [{ label, emoji, audio }] }` |

### Data Model (PostgreSQL via Prisma)
- `User` (parent) has many `ChildProfile`s
- `ChildProfile` has many `CompletedActivity` (unique per child+activity), `Achievement`, and `MoodCheckIn`
- `Activity` stores `type`, `category`, and `content` as a JSON string (schema differs per type — see table above)
- `MoodCheckIn` records daily mood (happy/sad/angry/anxious/calm/excited/tired/silly) with timestamp
- Activities are seeded via `scripts/seed.ts`; the migration for `MoodCheckIn` is in `prisma/migrations/20260305000000_add_mood_checkin/`

### Key Patterns
- **Activity content is JSON stored as `String`** in the `content` field — parse client-side with `JSON.parse(activity.content)`
- **`childId` is passed via URL query param** throughout activity pages (not stored in session)
- **Audio feedback** uses the Web Speech API (`speechSynthesis`) — no external audio files. Breathing pages cancel previous speech before speaking
- **Confetti** on correct answers uses `canvas-confetti`
- **Image assets** are hosted at `cdn.abacus.ai` — image constants in `lib/constants.ts`
- **UI components** are shadcn/ui (Radix UI + Tailwind) in `components/ui/`; child-facing cards use `.child-card` and `.child-button` CSS classes in `globals.css`
- **Auth**: NextAuth with JWT strategy; user ID is attached to `session.user.id` via a custom JWT callback in `lib/auth.ts`
- **Prisma client** singleton is in `lib/db.ts`
- **Breathing animation**: CSS `transform: scale()` with `transition` duration matching phase duration — the circle smoothly expands/contracts driven by phase state changes
- **Mood check-in**: shown on first load each day; if mood is `anxious` or `angry`, the dashboard suggests a breathing activity
- **Streak calculation**: computed server-side in `calculateStreak()` in `progress/route.ts` — counts consecutive calendar days with at least one completed activity; resets if no activity in the last 2 days
- **Dashboard organises activities by type** in this order: breathing → emotion → scenario → story → communication

### Environment Variables
Required in `nextjs_space/.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - App URL (e.g., `http://localhost:3000`)
