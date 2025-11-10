# ReliefGuard - Project Context

## What This Is
ReliefGuard is a web-based pressure relief sizing tool for chemical and process engineers. It helps calculate relief device requirements for pressure vessels under various overpressure scenarios according to API-521 and ASME Section VIII standards.

## Tech Stack
- **Frontend**: Next.js 15 (React 19, TypeScript)
- **Styling**: Tailwind CSS
- **PDF Generation**: @react-pdf/renderer
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Database**: Supabase (PostgreSQL) - stores users, vessels, and cases
- **Reference Data**: Client-side (in-memory TypeScript objects in `src/lib/database.ts`)
- **Data Persistence**: Currently localStorage (migrating to Supabase)

## Architecture Overview

### Global State (Contexts)
- **VesselContext**: Manages vessel properties (MAWP, design pressure, dimensions, etc.) - shared across all cases
- **CaseContext**: Manages which cases are selected and tracks their calculated results for comparison

### Case Structure
Each overpressure scenario is a separate "case" (e.g., External Fire, Liquid Overfill, Control Valve Failure, Blocked Outlet). Cases are independent and calculate their own relief requirements based on:
1. **Vessel properties** (from VesselContext)
2. **Case-specific inputs** (stored in localStorage per case)
3. **API-521/ASME VIII calculations**

### Key Components
- **Reusable case components**: `CasePageHeader`, `DesignBasisFlowBanner`, `IncludeCaseToggle`, `CaseBreadcrumb`
- **Shared vessel UI**: `CollapsibleVesselProperties`, `VesselProperties`
- **Custom hooks**: `useCaseCalculation` (standardizes auto-update logic), `useLocalStorage`, `useReportGenerator`

## How Cases Work
1. User enters vessel properties (design pressure, dimensions, material, etc.)
2. User navigates to a case page and enters case-specific data (e.g., heat input for fire, pump capacity for blocked outlet)
3. Case calculations run automatically and update in real-time
4. Results are saved to localStorage (both inputs and outputs for report generation)
5. User selects which cases to include via toggle switches
6. Selected cases appear on the main cases page, showing the design basis flow (highest required flow rate)
7. User generates a PDF report containing all selected cases

## Important Notes

### Working Fluid Independence
- **Working fluid is case-specific**, not global. External Fire might use "Toluene", while Liquid Overfill uses "Ethanol"
- Stored in each case's localStorage item (e.g., `liquid-overfill-flow-data.workingFluid`)
- Must be included in PDF report under each case's input section, NOT in vessel properties

### Design Basis Flow
- The **design basis flow** is the highest ASME VIII Design Flow across all selected cases
- Displayed prominently on case pages as a yellow banner when that case is the design basis
- Used to determine the minimum relief device capacity required

### Data Persistence
- **Current**: All data persists in **localStorage** (no backend database yet)
- **Future**: Migrating to Supabase database with proper user ownership
- Each case has two storage keys: one for flow data, one for pressure data (see `STORAGE_KEYS` in `case-types.ts`)
- The `useCaseCalculation` hook automatically merges inputs and outputs and saves to localStorage
- Database schema is ready (`database/migrations/001_initial_schema.sql`)

### Adding New Cases
- See `/docs/summaries/ADD_NEW_CASE.md` for step-by-step instructions
- Follow the established pattern: use reusable components, `useCaseCalculation` hook, and localStorage
- Update `CaseContext.tsx`, `Header.tsx`, `Sidebar.tsx`, `cases/page.tsx`, and `useReportGenerator.ts`

### PDF Report Generation
- Handled by `useReportGenerator.ts` hook
- Reads from localStorage for each selected case
- Extracts both input data and calculated results
- Renders via `ReportPDF.tsx` component

## Project Structure
```
reliever/
├── src/app/
│   ├── cases/              # Case pages (external-fire, liquid-overfill, etc.)
│   ├── components/         # Reusable UI components
│   ├── context/            # React contexts (VesselContext, CaseContext)
│   ├── hooks/              # Custom hooks (useCaseCalculation, useReportGenerator, etc.)
│   ├── types/              # TypeScript types and constants
│   └── datasets/           # Reference data pages (fluids, gas properties)
├── public/                 # Static assets
├── lib/
│   ├── firebase/           # Firebase client and admin SDK config
│   └── supabase/           # Supabase database client (non-auth)
├── database/
│   ├── migrations/         # SQL migration scripts
│   └── schema.sql          # Reference schema (legacy)
└── docs/                   # API standards, setup guides, and summaries

## Authentication & Database

### Architecture
ReliefGuard uses a **Firebase + Supabase** architecture:
- **Firebase Auth**: Handles all user authentication (sign-in, session management)
- **Supabase**: Stores all application data (users, vessels, cases) in PostgreSQL

### Why This Setup?
- **Firebase Auth**: Industry-leading auth with built-in Google OAuth, email/password, and session management
- **Supabase**: Powerful PostgreSQL database with automatic REST API, real-time subscriptions, and Row Level Security
- **Separation of Concerns**: Auth and data storage are independent, making the system more flexible

### Auth Flow
1. User signs in via Firebase (email/password or Google OAuth)
2. Frontend obtains Firebase ID token
3. Token sent to `/api/auth/verify-token` Next.js API route
4. Backend verifies token with Firebase Admin SDK
5. Backend upserts user record in Supabase `users` table (linked by `firebase_uid`)
6. User's Supabase ID is returned and cached in `AuthContext`
7. All subsequent data operations use Supabase ID for foreign keys

### Database Schema
See `database/migrations/001_initial_schema.sql` for the full schema.

**Tables:**
- `users` - Maps Firebase users to Supabase (via `firebase_uid`)
- `vessels` - Stores vessel properties, linked to users
- `cases` - Stores calculation cases, linked to vessels and users

### Setup Guides
- **Firebase Setup**: See `docs/FIREBASE_SETUP.md`
- **Database Migration**: See `database/migrations/README.md`
```

## Standards Reference
- **API-521**: Pressure-relieving and Depressuring Systems (see `/docs/API.MD` for key sections)
- **ASME Section VIII**: Rules for pressure vessel design and overpressure protection
- Each case implements specific sections of these standards (documented in case page comments)



