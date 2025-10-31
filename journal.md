# ReliefGuard Development Notes

*Chronological log of significant changes and implementations*

**Format**: Brief summaries of major changes only. Focus on substantial implementations, not minor tweaks. Include technical context when relevant.

---

## 2024-12-19 - Navigation & Landing Page Updates

### Navigation Updates
- **Changed primary navigation**: Updated all `/calc/` references to `/cases/` - main buttons now go to cases selection page instead of calculator
- **Fixed home navigation**: Both header logo and sidebar home button now correctly navigate to landing page (`/`) instead of `/calc/`
- **Added Cases to navbar**: Added "Cases" link to main navigation, temporarily hid "About" button (logic preserved)

### Landing Page Enhancements
- **Added valve animation**: Integrated animated relief valve SVG to hero section showing cap movement and steam lines
- **Optimized spacing**: Reduced top padding and tightened button spacing for better visual hierarchy

### Case Page Navigation
- **Added back navigation**: Implemented "Back to Cases (progress is saved)" links on all case-specific pages with left arrow icon
- **Removed breadcrumbs**: Cleaned up header breadcrumbs on case pages for consistency

## Technical Notes
- All navigation changes maintain existing functionality while improving user flow
- Valve animation uses SVG with CSS animations for smooth performance
- Progress saving messaging reassures users their work is preserved when navigating

## Future Ideas
- **Auto-save toggle**: Add user preference to enable/disable automatic progress saving, allowing users to choose between auto-save convenience or manual save control

---

## 2024-12-19 - Tooltip Improvements & NFPA 30 Enhancements

### Universal Tooltip Component
- **Created reusable Tooltip component**: Implemented sticky tooltips that remain visible when hovering over them, allowing users to select/copy text
- **Applied universally**: Converted all tooltips across External Fire, Liquid Overfill, Nitrogen Failure cases and CasePressureSettings component to use new component
- **Enhanced UX**: Tooltips now persist when user moves cursor onto them, preventing accidental disappearances while reading

### External Fire Case Enhancements
- **Added NFPA 30 reduction factors**: Implemented protection options dropdown (0.5, 0.4, 0.3) for drainage, water spray, and insulation based on NFPA 30 Section 22.7.3.5
- **Updated guidance**: Clarified NFPA 30 usage for flammable liquids vs API 521 for process equipment, acknowledging NFPA's common application to pressure vessels despite storage tank origins
- **Added warning banner**: Blue information banner appears when NFPA 30 is selected explaining applicability to flammable/combustible liquids
- **Updated formula tooltips**: Enhanced heat input formulas to reference Chapter 22.7 and show which reduction factor is applied

### Nitrogen Failure Case Updates
- **Added outlet pressure tooltip**: "Lowest conceivable operating pressure of the tank"
- **Updated inlet pressure tooltip**: "Maximum conceivable pressure directly upstream of failing control valve"
- **Standardized all tooltips**: Converted remaining tooltips (Temperature, Compressibility Factor, etc.) to new component

### Technical Notes
- Tooltip component uses `mb-0` to eliminate gap between icon and text box, preventing hover state loss
- All tooltips use consistent sticky behavior with pointer-events management
- NFPA 30 changes maintain backward compatibility with existing data

---

## 2025-10-31 - PDF Report Generation & Data Persistence Fixes

### PDF Report Generation (Major Feature)
- **Implemented professional PDF report generation** using `@react-pdf/renderer`
- **Single-page layout**: Dark navy accents (#1e3a8a), light gray backgrounds for sections
- **Design Basis Flow section**: Prominently displays governing case and required flow in lb/hr + SCFH conversion (using standard air density 0.0752 lb/ft³)
- **Case-by-case breakdown**: Shows input parameters and calculation results for all enabled cases
- **Download trigger**: "Generate Report" button on `/cases` page, auto-downloads as `reliefguard_report.pdf`

### Critical Data Architecture Fix
- **Problem discovered**: PDF was showing wrong numbers - calculated values weren't being saved to localStorage, only input parameters
- **Root cause**: `calculatePreview()` computed values displayed on page, but those values were never persisted
- **Solution implemented**: 
  - Modified `calculatePreview()` to return ALL values (flows, wetted area, heat input, environmental factor)
  - useEffect now saves complete data object: `{...flowData (inputs), ...previewValues (calculated results)}`
  - **Key principle**: PDF shows exactly what user sees on page - no recalculation, no stale data
- **Applied to**: External Fire, Nitrogen Control Failure cases

### Data Persistence Enhancements
- **Pressure data now saved**: External Fire and Nitrogen cases now persist pressure settings (max venting pressure, backpressure) to localStorage
- **Consistent pattern across all cases**: Load on mount, save on change via useEffect hooks
- **localStorage keys standardized**: `{case-id}-flow-data`, `{case-id}-pressure-data`

### Route & UX Updates
- **Routes renamed**: `/reference` → `/datasets` (more accurate terminology)
- **Dropdown width fix**: Fire Protection/Mitigation dropdown now `max-w-sm` instead of full width
- **Mobile optimization**: Case page headers stack properly on mobile, reduced spacing
- **Background opacity**: Homepage hero section reduced to 10% for better text readability
- **Vessel properties reordering**: Orientation moved to 2nd field (after vessel tag), straight side height and head type hide for spheres
- **Branding updates**: Removed "MVP" badge, added "Prototype build ©2025 ReliefGuard" footer

### Nitrogen Case Field Alignment
- **Fixed field name mismatch**: PDF generator was looking for non-existent fields (`nitrogenSupplyPressure`, etc.)
- **Corrected to actual fields**: `totalCv`, `inletPressure`, `outletPressure`, `temperatureF`, `compressibilityZ`, `xt`
- **Note for future**: These fields may change when nitrogen case is reviewed/refactored

### Technical Notes
- **Critical lesson learned**: Never recalculate values for persistence - always save what's displayed
- **Return structure consistency**: All code paths in `calculatePreview()` must return same field structure (null vs undefined matters!)
- **Data flow pattern**: UI calculations → previewValues → localStorage → PDF generator (single source of truth)
- **Type safety**: Explicit `typeof` checks before formatting numbers in PDF generator prevents N/A from appearing

### Files Modified
- `frontend/src/app/cases/external-fire/page.tsx` - calculation saving, dropdown width
- `frontend/src/app/cases/nitrogen-failure/page.tsx` - pressure data persistence
- `frontend/src/app/hooks/useReportGenerator.ts` - data extraction, nitrogen fields
- `frontend/src/app/components/ReportPDF.tsx` - PDF document layout and styling
- `frontend/src/app/api/generate-report/route.ts` - PDF generation endpoint
- `frontend/src/app/cases/page.tsx` - report button integration
- `frontend/src/app/components/VesselProperties.tsx` - field reordering, conditional rendering
- Route changes across datasets pages and navigation components

### Architecture Decisions
- **Why @react-pdf/renderer**: Industry standard, server-side rendering, type-safe
- **Why single page PDF**: Keeps reports concise, forces focus on essential data
- **Why localStorage for reports**: Client-side data, no backend needed, instant generation
- **Why explicit input listing**: Prevents old calculated results from contaminating new data (lesson learned the hard way)

---

## 2025-10-31 - Control Valve Failure Generalization & Code Quality Improvements

### Case 2: Nitrogen → Control Valve Failure (Gas Service)
- **Generalized from nitrogen-only to any gas service**: Renamed and refactored Case 2 to support multiple gas types
- **Gas selection database**: Added support for Nitrogen, Air, Oxygen, CO2, Methane, and Custom Gas with proper molecular weights and specific gravities sourced from NIST and Perry's Handbook
- **Custom gas inputs**: Allow users to specify custom MW and SG for unlisted gases - fields become editable when Custom Gas is selected
- **API-521 compliance enhancements**:
  - **Bypass valve consideration** (Section 4.4.8.3): Option to include inadvertent bypass valve opening scenario, calculates effective total Cv
  - **Outlet flow credit** (Section 4.4.8.4): Allows crediting normal outlet flow against inlet flow for net relief requirement
  - Detailed tooltips referencing specific API-521 sections
- **About section added**: Created reusable `ScenarioAbout` component with collapsible scenario descriptions, used across External Fire and Control Valve cases
- **Gas Properties dataset page**: New reference page documenting gas properties used in calculations with source citations

### Navigation & UX Enhancements
- **Cases dropdown in navbar**: Added dropdown menu for direct access to Case 1 - External Fire, Case 2 - Control Valve Failure, Case 3 - Liquid Overfill
- **Datasets dropdown enhancement**: Added Gas Properties to datasets navigation
- **3-column dataset layout**: Datasets page now displays 3 cards per row on large screens instead of 2
- **Tooltip icon fix**: Updated question mark SVG to include dot at bottom for proper symbol rendering
- **Include Case toggle positioning**: Moved to right side of page header for consistency across all cases

### Code Quality Refactoring
- **Created `useLocalStorage` custom hook**: Eliminated 120+ lines of duplicate localStorage boilerplate code across all case pages
- **Centralized type definitions**: Created `types/case-types.ts` with shared `CasePressureData` interface and `STORAGE_KEYS` constants
- **Improved React patterns**: Standardized functional setState pattern (`prev => ({ ...prev, ...})`) to prevent stale closures
- **Bug fixes**:
  - Fixed PDF report generator reading stale/incorrect data - calculated results weren't being saved to localStorage
  - Fixed custom gas SG/MW changes not affecting flow calculations due to stale closure in useCallback
  - Restored explicit localStorage save for calculated outputs (useLocalStorage only handles inputs)

### Data Migration & Persistence
- **LocalStorage migration logic**: Added automatic migration from old `nitrogen-control` keys to new `control-valve-failure` keys in CaseContext
- **Robust key handling**: All localStorage keys now use centralized constants to prevent typos and enable easy refactoring

### Technical Notes
- **Critical lesson on custom hooks**: Document clearly what hooks do and DON'T do - useLocalStorage handles inputs but not derived/calculated values
- **Functional setState pattern**: Always use `setState(prev => ...)` to avoid stale closures, especially in callbacks with dependencies
- **Report generator architecture**: PDF needs both input AND output data explicitly saved; don't rely on automatic sync for calculated values

### Files Modified
- Renamed `frontend/src/app/cases/nitrogen-failure/` → `control-valve-failure/`
- Updated `calculations.ts` with generic gas flow formulas and gas properties database
- Refactored all 3 case pages to use new `useLocalStorage` hook
- Created `frontend/src/app/hooks/useLocalStorage.ts`
- Created `frontend/src/app/types/case-types.ts`
- Created `frontend/src/app/components/ScenarioAbout.tsx`
- Created `frontend/src/app/data/gas-properties/page.tsx`
- Updated navigation in Header, Sidebar, NavDropdown components
- Updated CaseContext with migration logic and new case ID
- Updated useReportGenerator with new field names and gas properties

### Architecture Decisions
- **Why generalize nitrogen case**: Control valve failures apply to many gas services (air, oxygen, inert gases) - same physics, different properties
- **Why separate gas properties page**: Transparency about data sources; users can verify MW/SG values against standards
- **Why useLocalStorage hook**: DRY principle - eliminate duplicate code while maintaining type safety and error handling
- **Why explicit calculated saves**: Report generator operates independently of UI state; needs complete snapshot of inputs+outputs
