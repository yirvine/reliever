# ReliefGuard - Project Context

## What This Is
ReliefGuard is a web-based pressure relief sizing tool for chemical and process engineers. It helps calculate relief device requirements for pressure vessels under various overpressure scenarios according to API-521 and ASME Section VIII standards.

## Tech Stack
- **Frontend**: Next.js 15 (React 19, TypeScript)
- **Styling**: Tailwind CSS
- **PDF Generation**: @react-pdf/renderer
- **Authentication**: Supabase Auth (email + Google OAuth)
- **Reference Data**: Client-side (in-memory TypeScript objects in `src/lib/database.ts`)
- **User Data**: localStorage (transitioning to Supabase for saved vessels)

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
- All data persists in **localStorage** (no backend database for user data)
- Each case has two storage keys: one for flow data, one for pressure data (see `STORAGE_KEYS` in `case-types.ts`)
- The `useCaseCalculation` hook automatically merges inputs and outputs and saves to localStorage

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
├── lib/                    # Supabase clients and reference data
├── database/               # Reference schemas (seed data for future DB if needed)
└── docs/                   # API standards and development summaries

## Authentication

### Supabase Auth Setup
The app uses Supabase for user authentication with:
- **Email/password** sign up and sign in
- **Google OAuth** for single-click sign in
- **Session management** via HTTP-only cookies
- **AuthContext** for client-side user state

### Auth Flow
1. Guest users can access all pages and cases (for now)
2. Login button in header opens auth modal
3. After login, user avatar appears with email and logout option
4. Sessions persist across page reloads
5. Future: Login gates for saving vessels and generating reports
```

## Standards Reference
- **API-521**: Pressure-relieving and Depressuring Systems (see `/docs/API.MD` for key sections)
- **ASME Section VIII**: Rules for pressure vessel design and overpressure protection
- Each case implements specific sections of these standards (documented in case page comments)



