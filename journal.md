# Relief-er Development Journal

## November 2, 2025

### Summary
Completed multiple enhancements to the liquid overfill and external fire scenarios, moved working fluid selections to flow calculations sections, implemented unit conversion for manual flow input in the control valve failure case, refined UI styling across all cases, and implemented global vessel properties with edit warnings and collapsible read-only views on case pages.

### Liquid Overfill Case Implementation
- **Outlet flow credit**: Added optional outlet flow credit feature per API-521 §4.4.8.3 (Net Relief Flow = Maximum Inlet Flow - Normal Outlet Flow)
- **Comprehensive tooltip**: Included section reference, explanation, example, and calculation formula for outlet flow credit
- **"Include Case" toggle**: Moved to right side of page for consistency with other cases
- **About scenario**: Added collapsible description explaining liquid overfill per API 521
- **Working fluid selection**: Moved from Vessel Properties to Flow Calculations card for case independence
- **Results summary restructured**: Now displayed in 4-column grid within Flow Calculations section showing:
  - Gross Inlet Flow
  - Outlet Credit
  - Net Relieving Flow  
  - ASME VIII Design Flow (net / 0.9)
- **Heading changes**: "Flow Summary" → "Flow Calculations", "Case-Specific Settings" → "Pressure Limits & Allowances"
- **ASME VIII design flow**: Clarified tooltip explaining 110% accumulation allowance requirement for liquid relief

### External Fire Case Enhancements
- **Added molecular weight field**: Displayed alongside heat of vaporization in Flow Calculations (auto-filled from working fluid)
- **Dynamic label rendering**: Fire Protection label changes based on code selection ("Fire protection / mitigation factor" for NFPA 30, "Adequate drainage & firefighting?" for API 521)
- **Enhanced API 521 tooltip**: Added Section 4.4.13.2.4.2 reference and detailed adequate drainage criteria with reference to API 2510
- **Simplified dropdown options**: Changed verbose API 521 options to concise "Yes" / "No" selections
- **Equal-width field layout**: Fire protection dropdown now occupies 1/4 width matching other fields in 4-column grid
- **Independent working fluid**: Moved from Vessel Properties to Flow Calculations for independence from other cases

### Control Valve Failure Case Enhancements
- **Unit conversion for manual flow input**: Added dropdown selector for lb/hr, SCFH, kg/hr, kg/s
- **Conversion logic**: Values converted to lb/hr internally for calculations using molecular weight
- **Raw value preservation**: User's input value persists when switching units (not auto-converted on display)
- **Input validation**: Prevented negative numbers, '+' character, and scientific notation (e/E) in mass flow rate field
- **Adjusted field width**: Mass flow rate input set to w-40 (160px) for better UX

### UI/UX Consistency Improvements
- **Simplified checkbox styling**: Removed gray background boxes from outlet flow credit and bypass valve checkboxes, using clean inline style with checkbox + label + tooltip
- **Consistent checkbox alignment**: Checkboxes now align properly with other form fields using standard label positioning
- **Control valve failure layout**: Consider Bypass Valve and Apply Outlet Flow Credit checkboxes now side-by-side on same row (2-column grid)
- **Liquid overfill layout**: Working fluid, max inlet flow, and outlet credit checkbox all on same row (4-column grid with empty 4th column)
- **Heading changes**: Changed "Case-Specific Pressure Settings" to "Pressure Limits & Allowances" for all three cases with consistent font sizing

### Global Vessel Properties Implementation
- **Created `EditWarningModal` component**: Modal with "Don't show again" checkbox stored in localStorage (key: `reliever-hide-vessel-edit-warning`)
- **Created `CollapsibleVesselProperties` component**: Read-only collapsible display with "Edit" button that navigates to cases summary page with optional modal warning
- **Cases summary page**: Added editable `VesselProperties` section at top of page (above case list)
- **Case pages updated**: Replaced inline editable `VesselProperties` with collapsible read-only version on all three case pages
- **API 521-specific fields moved**: Moved `headProtectedBySkirt` and `fireSourceElevation` from `VesselProperties` component to external fire case's "API 521 Environmental Factor (Optional)" section
- **Vessel properties now global**: All vessel data stored in `VesselContext` and persists across all cases
- **Edit warning behavior**: Modal warns users that "Editing vessel properties affects all cases" with Cancel/Proceed buttons

### Technical Notes
- **Data persistence pattern**: Working fluids stored in case-specific flowData using useLocalStorage hook ensures independence between cases
- **Calculation consistency**: Outlet flow credit follows same pattern as control valve failure case for consistency
- **Tooltip enhancement**: API 521 tooltip now provides complete guidance including section reference, formulas, and criteria for determining adequate drainage
- **Dynamic rendering**: Label changes use conditional rendering based on applicableFireCode state variable
- **Unit conversion implementation**: 
  - `convertToLbPerHr()`: Converts from selected unit to lb/hr for calculations
  - `manualFlowRateRaw`: Stores displayed value
  - `manualFlowRate`: Stores converted lb/hr value
  - Conversion factors: SCFH uses 379 ft³/lbmol, kg conversions use 0.453592 lb/kg, 3600 s/hr
- **Modal localStorage key**: `reliever-hide-vessel-edit-warning` prevents modal from showing if user checked "Don't show again"
- **Collapsible component**: Uses React Router's `useRouter()` to navigate to cases page for editing

### Files Modified
- `frontend/src/app/cases/liquid-overfill/page.tsx` - Complete restructuring with outlet flow credit, working fluid, about section
- `frontend/src/app/cases/external-fire/page.tsx` - Independent working fluid, molecular weight field, dynamic labels, enhanced tooltips, API 521 fields moved to environmental factor section
- `frontend/src/app/cases/control-valve-failure/page.tsx` - Simplified checkbox styling, layout improvements, unit conversion, input validation, removed unused updateVesselData
- `frontend/src/app/cases/control-valve-failure/calculations.ts` - Added ManualFlowUnit type, convertToLbPerHr and convertFromLbPerHr functions
- `frontend/src/app/hooks/useReportGenerator.ts` - Updated to handle outlet flow credit fields in liquid overfill reports
- `frontend/src/app/components/CasePressureSettings.tsx` - Updated heading to "Pressure Limits & Allowances"
- `frontend/src/app/components/VesselProperties.tsx` - Removed API 521-specific fields (moved to external fire case)
- `frontend/src/app/components/EditWarningModal.tsx` - New component for edit warning with localStorage persistence
- `frontend/src/app/components/CollapsibleVesselProperties.tsx` - New component for read-only vessel display with edit navigation
- `frontend/src/app/cases/page.tsx` - Added editable VesselProperties section at top, imported updateVesselData
- `frontend/lib/database.ts` - No direct changes but getFluidNames/getFluidProperties now imported at module level in case pages

### API Compliance References
- **API-521 Section 4.4.7**: Overfilling / Liquid Expansion scenarios
- **API-521 Section 4.4.8.3**: Outlet Flow Credit - "The required relieving rate is the difference between maximum inlet flow and normal outlet flow"
- **API-521 Section 4.4.13.2.2**: 25 ft height limit for fire-exposed wetted area, support skirt exclusion
- **API-521 Section 4.4.13.2.4.2**: Adequate drainage and firefighting criteria
- **API 2510**: Referenced for adequate drainage and firefighting facility standards
- **ASME Section VIII**: 0.9 factor for liquid relief sizing (110% accumulation allowance)

---

## November 2, 2025 (Afternoon Session)

### Summary
Enhanced global vessel properties implementation with in-place editing, improved modal UX, fixed toggle functionality, and refined UI consistency across all pages.

### Global Vessel Properties Enhancements
- **In-place editing**: Modified `CollapsibleVesselProperties` to allow editing directly on case pages instead of redirecting to main page
- **Modal improvements**: Changed edit warning modal backdrop from 50% opacity to 20% opacity (`bg-black/20`) for better visibility of underlying page
- **Main page collapsible**: Made vessel properties collapsible on main page with `defaultExpanded={true}`, using separate localStorage keys for main page vs case pages
- **Collapse state persistence**: Implemented independent collapse states using `reliever-vessel-properties-main-collapsed` and `reliever-vessel-properties-case-collapsed` localStorage keys
- **Initialization fix**: Fixed flash issue by initializing state directly from localStorage in `useState` initializer instead of `useEffect`
- **Edit button behavior**: Case pages show "Edit" button that triggers warning modal, then enables in-place editing; main page has no edit button (always editable)
- **Component reuse**: `CollapsibleVesselProperties` now always uses `VesselProperties` component (disabled when not editing), eliminating duplicate read-only display code
- **UI consistency**: Vessel properties heading now matches other card headings (`text-xl font-bold`)

### UI Refinements
- **Breadcrumb font size**: Increased from `text-sm` to `text-base` on all case pages and dataset pages
- **"About this scenario" font size**: Increased from `text-sm` to `text-base` in `ScenarioAbout` component
- **Chevron arrow placement**: Moved chevron arrow icon to appear immediately after "Vessel Properties" text instead of next to Edit button
- **Removed "(Global)" label**: Simplified heading to just "Vessel Properties" on all pages
- **Component ordering**: Moved Vessel Properties card above Gas Selection card on control valve failure page

### Bug Fixes
- **Liquid overfill toggle**: Fixed toggle not working by removing auto-enable `useEffect` that was interfering with manual toggling
- **Main page fields**: Fixed vessel properties fields being disabled on main page by changing `disabled={!isEditing}` to `disabled={showEditButton ? !isEditing : false}`
- **Build cache issues**: Resolved Next.js build cache errors by clearing `.next` directory

### Technical Notes
- **Separate localStorage keys**: Main page and case pages use different keys to maintain independent collapse states
- **Direct state initialization**: Using function initializer in `useState` to read localStorage synchronously during initialization, preventing flash
- **Component props**: Added `defaultExpanded` and `showEditButton` props to `CollapsibleVesselProperties` for flexible configuration
- **In-place editing**: When editing is enabled, `VesselProperties` component is embedded with `hideHeading={true}` and `disabled={false}`

### Files Modified
- `frontend/src/app/components/CollapsibleVesselProperties.tsx` - Added in-place editing, separate collapse states, localStorage initialization fix
- `frontend/src/app/components/EditWarningModal.tsx` - Reduced backdrop opacity to 20%
- `frontend/src/app/components/VesselProperties.tsx` - Added `hideHeading` prop
- `frontend/src/app/cases/page.tsx` - Added collapsible vessel properties with `defaultExpanded={true}` and `showEditButton={false}`
- `frontend/src/app/cases/liquid-overfill/page.tsx` - Removed auto-enable effect that interfered with toggle
- `frontend/src/app/cases/control-valve-failure/page.tsx` - Reordered components (Vessel Properties above Gas Selection)
- `frontend/src/app/components/ScenarioAbout.tsx` - Increased font size from `text-sm` to `text-base`
- All case pages (`external-fire`, `control-valve-failure`, `liquid-overfill`) - Updated breadcrumb font size to `text-base`
- All dataset pages (`gas-properties`, `fluids`, `vessel-head-areas`) - Updated breadcrumb font size to `text-base`

---

## November 2, 2025 (Evening Session)

### Summary
Implemented vessel properties validation, report generation safeguards, fixed data consistency issues, and enhanced user experience with warning modals and field organization.

### Vessel Properties Enhancements
- **Vessel Name field**: Replaced "Vessel Construction Code" (fixed "ASME VIII" display) with optional user-inputtable "Vessel Name" field, positioned as second field after Vessel Tag
- **Vessel properties validation**: Added comprehensive validation requiring all vessel properties fields (except optional vessel name) to be completed before generating report
- **Validation feedback**: Added warning message below Generate Report button when vessel properties are incomplete, styled with amber background matching other warning sections
- **Incomplete data handling**: Fixed max allowed venting pressure and max allowable backpressure to display "—" (em dash) instead of "0.0" when vessel MAWP is 0 or blank, indicating incomplete data

### Report Generation Safeguards
- **ASME compliance warning**: Created `ASMEWarningModal` component that warns users when ASME set pressure exceeds vessel MAWP before generating report
- **Modal integration**: Modal appears when user clicks "Generate Report" if set pressure > MAWP, with Cancel/Proceed buttons
- **Validation flow**: Report generation now checks vessel properties completeness first, then ASME compliance, before proceeding

### Case-Specific Fixes
- **Liquid overfill pressure settings**: Fixed to auto-calculate at 110% MAWP (matching control valve failure case) per ASME Section VIII requirements for liquid relief
- **External fire fluid selection**: Fixed heat of vaporization not clearing when fluid selection is changed back to "Select fluid..." - now clears correctly like molecular weight
- **API 521 Environmental Factor layout**: Reorganized fields so "Bottom Head Protected by Skirt" and "Fire Source Elevation" appear on same row as "Storage Type" and "Fire-rated Insulation?" in 4-column grid

### Technical Notes
- **Vessel properties validation**: Uses `useMemo` to compute validation state based on vessel data, ensuring checks are ready before user clicks
- **Missing fields detection**: `getMissingFields()` function provides detailed list of incomplete fields for user feedback
- **ASME warning modal**: Matches style of `EditWarningModal` component for consistency, with warning icon and amber color scheme
- **Pressure settings auto-calculation**: Liquid overfill case now uses `isAutoCalculated={true}` and `mawpPercent={110}` to fix percentage at 110% per ASME requirements

### Files Modified
- `frontend/src/app/components/VesselProperties.tsx` - Replaced construction code field with optional vessel name field
- `frontend/src/app/components/CasePressureSettings.tsx` - Added validation to show "—" when MAWP is invalid instead of "0.0"
- `frontend/src/app/components/ASMEWarningModal.tsx` - New component for ASME compliance warning
- `frontend/src/app/context/VesselContext.tsx` - Added `vesselName` field to VesselData interface and default values
- `frontend/src/app/cases/page.tsx` - Added vessel properties validation, ASME warning modal integration, warning message display
- `frontend/src/app/cases/liquid-overfill/page.tsx` - Fixed to auto-calculate at 110% MAWP, fixed heat of vaporization clearing
- `frontend/src/app/cases/external-fire/page.tsx` - Fixed heat of vaporization clearing, reorganized API 521 Environmental Factor fields

---

## November 5, 2025

### Summary
Implemented comprehensive case page refactoring, created reusable components and hooks, added Blocked Outlet case per API-521 Section 4.4.2, fixed working fluid independence issues, and established templates for future case development.

### Case Page Refactoring
- **Created reusable components**: `DesignBasisFlowBanner`, `CaseBreadcrumb`, `IncludeCaseToggle`, `CasePageHeader` (composite)
- **Created custom hook**: `useCaseCalculation` to standardize auto-update effect pattern across all cases
- **Refactored existing cases**: Applied new pattern to Liquid Overfill, External Fire, and Control Valve Failure pages
- **Code reduction**: Eliminated 190+ lines of duplicate code across case pages
- **Improved consistency**: Standardized UI/UX patterns for header, toggle, banner, and calculation updates

### Blocked Outlet Case Implementation
- **API-521 Section 4.4.2**: Implemented Closed Outlet scenario calculations
- **Source types supported**: Centrifugal pump, positive displacement pump, pressure source, and other
- **Calculations**: Gross source flow, optional outlet flow credit, net relieving flow, ASME VIII design flow
- **Dynamic guidance panel**: Provides pump-specific notes and relief requirement guidance based on source type and pressure
- **Navigation integration**: Added to Header dropdown, Sidebar menu, and Cases page listing
- **Report generation**: Integrated with PDF report system

### Working Fluid Independence Fix
- **Issue identified**: Homepage displaying incorrect fluid names due to reading from global `vesselData.workingFluid` instead of case-specific storage
- **Fix implemented**: Updated `getFluidName()` in `cases/page.tsx` to read each case's working fluid from its own localStorage
- **Report updates**: Added working fluid to each case's input data section in PDF reports
- **Vessel properties cleanup**: Removed working fluid from vessel properties section in PDF (not a vessel property, case-specific)
- **Architecture decision**: Each case stores independent working fluid in case-specific `flowData` for maximum flexibility

### Documentation & Templates
- **Updated QUICK_REFERENCE.md**: Added comprehensive checklist including report generation, working fluid handling, and navigation integration
- **Updated REFACTORING_RESULTS.md**: Added report generation examples, working fluid independence section, and updated FlowData interface template
- **Template improvements**: Copy-paste starter includes all necessary imports, proper structure, and comments for case-specific customization
- **Future case development**: Reduced estimated development time from 2-3 hours to 30-45 minutes per case

### Technical Notes
- **useCaseCalculation hook**: Handles marking cases as calculated/incomplete, saving results to localStorage for PDF generation, and updating case results for design basis flow comparison
- **Report extraction pattern**: Each case requires extraction function in `useReportGenerator.ts` to format input/output data from localStorage
- **Storage keys**: All cases use `STORAGE_KEYS` constant from `case-types.ts` for consistency
- **Type safety**: `CaseId` type updated across `CaseContext`, `useCaseCalculation`, and report generator to include new cases

### Files Modified
- `frontend/src/app/components/DesignBasisFlowBanner.tsx` - New reusable banner component
- `frontend/src/app/components/CaseBreadcrumb.tsx` - New breadcrumb component
- `frontend/src/app/components/IncludeCaseToggle.tsx` - New toggle switch component
- `frontend/src/app/components/CasePageHeader.tsx` - New composite header component
- `frontend/src/app/hooks/useCaseCalculation.ts` - New custom hook for case calculations
- `frontend/src/app/cases/liquid-overfill/page.tsx` - Refactored with new components
- `frontend/src/app/cases/external-fire/page.tsx` - Refactored with new components
- `frontend/src/app/cases/control-valve-failure/page.tsx` - Refactored with new components
- `frontend/src/app/cases/blocked-outlet/page.tsx` - New case implementation
- `frontend/src/app/cases/page.tsx` - Updated `getFluidName()` and added Blocked Outlet to listing
- `frontend/src/app/components/Header.tsx` - Added Blocked Outlet to navigation
- `frontend/src/app/components/Sidebar.tsx` - Added Blocked Outlet to sidebar
- `frontend/src/app/components/ReportPDF.tsx` - Removed working fluid from vessel properties
- `frontend/src/app/hooks/useReportGenerator.ts` - Added `extractBlockedOutletData()`, added working fluid to case input data
- `frontend/src/app/types/case-types.ts` - Added BLOCKED_OUTLET storage keys
- `frontend/src/app/context/CaseContext.tsx` - Added 'blocked-outlet' to CaseId type and defaults
- `other/summaries/QUICK_REFERENCE.md` - Updated checklist and added report generation steps
- `other/summaries/REFACTORING_RESULTS.md` - Added report generation section and working fluid independence notes

### API Compliance References
- **API-521 Section 4.4.2**: Blocked Outlet / Closed Outlet scenario requirements
- **API-521 Section 4.4.2.2**: Centrifugal pump vs positive displacement pump relief requirements
- **ASME Section VIII**: 0.9 factor for liquid relief sizing (110% accumulation allowance)

---

## November 6, 2025

### Summary
Implemented Cooling/Reflux Failure case per API-521 Section 4.4.3, established standards reference document workflow for all cases, and clarified VLE calculation requirements.

### Cooling/Reflux Failure Case Implementation
- **API-521 Section 4.4.3**: Implemented Cooling or Reflux Failure scenario with four failure modes
- **Failure modes supported**: Total condensing, partial condensing, air cooler fan failure, pump-around circuit failure
- **Calculations**: Mode-specific relief rate calculations based on API-521 guidance
- **VLE requirement clarification**: Updated field labels and tooltips to explicitly state that vapor rates must be determined at relieving conditions (not operating conditions)
- **Field label updates**: Changed "Incoming Vapor Rate" to "Incoming Vapor Rate at Relief", "Operating Temperature" to "Relief Temperature", "Outgoing Vapor Rate" to "Outgoing Vapor Rate at Relief", "Latent Heat" to "Latent Heat at Relief"
- **Enhanced tooltips**: Added guidance that VLE calculations typically require process simulation software (HYSYS, PRO/II, UniSim) or rigorous heat/material balance
- **About section warning**: Added prominent note (amber text) that all vapor rates must be at relieving conditions per API-521 Section 4.4.3.2.1
- **Navigation integration**: Added to Header dropdown, Sidebar menu, and Cases page listing
- **Report generation**: Integrated with PDF report system

### Standards Reference Documentation Workflow
- **Created reference documents**: Added API-521 and/or NFPA-30 reference markdown files in each case folder
- **External Fire**: Added both API-521-Reference.md and NFPA-30-Reference.md (Section 22.7 Emergency Relief Venting)
- **All other cases**: Created API-521-Reference.md with relevant sections copy-pasted from standards
- **Documentation standards**: Established pattern of copy-pasting exact code sections without commentary for audit trail
- **Workflow update**: Added Section 5 to ADD_NEW_CASE.md guide requiring standards reference documents for all new cases

### Technical Notes
- **VLE calculation requirement**: Per API-521 Section 4.4.3.2.2, vapor rates must be "recalculated at a temperature that corresponds to the new vapor composition at relieving conditions." This requires vapor-liquid equilibrium calculations that account for composition changes at elevated pressure.
- **Process simulation dependency**: Rigorous determination of vapor rates at relief conditions typically requires process simulation software (HYSYS, PRO/II, UniSim) with appropriate thermodynamic property packages (Peng-Robinson, SRK, etc.)
- **Calculator role**: This calculator performs the final flow rate determination and applies ASME VIII design factors once the user has determined vapor rates at relieving conditions from external simulations
- **Industry practice**: Standard industry practice is to use process simulation for distillation/condensing systems where composition and properties change significantly with pressure
- **Simplified approach**: For simple systems or screening calculations, engineers may use approximate methods, but rigorous VLE is recommended for final sizing

### Files Modified
- `frontend/src/app/cases/cooling-reflux-failure/page.tsx` - New case implementation with VLE clarifications
- `frontend/src/app/cases/cooling-reflux-failure/API-521-Reference.md` - Standards reference
- `frontend/src/app/cases/external-fire/NFPA-30-Reference.md` - NFPA 30 reference
- `frontend/src/app/cases/external-fire/API-521-Reference.md` - API-521 reference
- `frontend/src/app/cases/control-valve-failure/API-521-Reference.md` - Standards reference
- `frontend/src/app/cases/liquid-overfill/API-521-Reference.md` - Standards reference
- `frontend/src/app/cases/blocked-outlet/API-521-Reference.md` - Standards reference
- `frontend/src/app/types/case-types.ts` - Added COOLING_REFLUX_FAILURE storage keys
- `frontend/src/app/context/CaseContext.tsx` - Added 'cooling-reflux-failure' to CaseId type
- `frontend/src/app/hooks/useCaseCalculation.ts` - Added case ID to type
- `frontend/src/app/components/Header.tsx` - Added navigation link
- `frontend/src/app/components/Sidebar.tsx` - Added navigation link
- `frontend/src/app/cases/page.tsx` - Added case listing and fluid name function
- `frontend/src/app/hooks/useReportGenerator.ts` - Added extraction function
- `other/summaries/ADD_NEW_CASE.md` - Added Section 5 for standards reference documentation

### API Compliance References
- **API-521 Section 4.4.3**: Cooling or Reflux Failure - four calculation methods (4.4.3.2.2 through 4.4.3.2.7)
- **NFPA 30 Section 22.7**: Emergency Relief Venting for Fire Exposure for Aboveground Storage Tanks
- **API-521 Section 4.4.2**: Closed Outlets (Blocked Outlet case)
- **API-521 Section 4.4.7**: Overfilling (Liquid Overfill case)
- **API-521 Section 4.4.8**: Failure of Automatic Controls (Control Valve Failure case)

---

## November [Date], 2025

### Summary
Implemented Hydraulic Expansion (Thermal Expansion) case per API-521 Section 4.4.12 and fixed hydration error in CollapsibleVesselProperties component.

### Hydraulic Expansion Case Implementation
- **API-521 Section 4.4.12**: Implemented Hydraulic Expansion scenario with API-521 Equation (2) for USC units
- **Calculation method**: Uses equation `q = (αᵥ × φ) / (d × c × 500)` where:
  - q = volumetric flow rate (gpm)
  - αᵥ = cubic expansion coefficient (1/°F)
  - φ = heat input rate (Btu/h)
  - d = relative density (dimensionless)
  - c = specific heat capacity (Btu/lb·°F)
- **Scenario types supported**: Cold-fluid shut-in, exchanger blocked-in, solar heating, heat tracing, and other
- **Input fields**: Working fluid, scenario type, heat input rate, cubic expansion coefficient, specific heat capacity, relative density, and optional trapped volume
- **Calculations**: Volumetric flow rate (gpm), mass flow rate (lb/hr), ASME VIII design flow (lb/hr), and optional relief time estimate
- **Typical values provided**: Default values for hydrocarbons (αᵥ = 0.0005, c = 0.5, d = 0.7) with comprehensive tooltips
- **Important warnings**: Prominent warning panel highlighting hydraulic expansion's potential to rapidly generate extremely high pressures
- **Navigation integration**: Added to Header dropdown, Sidebar menu, and Cases page listing (updated count from 4 to 6 cases)
- **Report generation**: Integrated with PDF report system including all input/output data and optional trapped volume/time estimate

### Standards Reference Documentation
- **Created API-521-Reference.md**: Comprehensive reference document with:
  - Table 4-2 excerpt showing hydraulic expansion scenarios
  - Complete Section 4.4.12 text including causes, relieving rate calculation, and piping considerations
  - Table 2 with typical cubic expansion coefficients for light/medium/heavy hydrocarbons and water
  - Equation (1) for SI units and Equation (2) for USC units
  - Key takeaways and administrative controls guidance

### Bug Fix: Hydration Error
- **Issue**: React hydration error in `CollapsibleVesselProperties` component due to server/client state mismatch
- **Root cause**: Component was checking `localStorage` during initial state, causing different values on server vs client
- **Solution**: Initialized state with `defaultExpanded` prop to match server render, then updated from `localStorage` in `useEffect` after hydration
- **Result**: Eliminated hydration mismatch warning while maintaining localStorage persistence for collapse state

### Technical Notes
- **Calculation implementation**: Converts volumetric flow to mass flow using fluid density (8.34 lb/gal × relative density × 60 min/hr)
- **ASME VIII design flow**: Mass flow ÷ 0.9 per ASME Section VIII for liquid relief sizing (110% accumulation allowance)
- **Optional trapped volume**: Users can specify trapped liquid volume to get relief time estimate (reference only, doesn't affect required flow rate)
- **Typical values guidance**: Tooltips provide typical ranges for cubic expansion coefficients (0.0003 to 0.0010 for hydrocarbons), specific heat (0.4 to 0.6), and relative density (0.5 to 0.9)
- **Administrative controls**: About section mentions that relief devices may not be required in certain installations (e.g., cooling circuits with locked-open valves) if proper procedures are in place
- **PRD set pressure guidance**: Emphasized that thermal-relief pressure setting should never exceed maximum pressure permitted by weakest component in system

### Files Modified
- `frontend/src/app/cases/hydraulic-expansion/page.tsx` - New case implementation with API-521 Equation (2)
- `frontend/src/app/cases/hydraulic-expansion/API-521-Reference.md` - Standards reference document
- `frontend/src/app/types/case-types.ts` - Added HYDRAULIC_EXPANSION storage keys
- `frontend/src/app/context/CaseContext.tsx` - Added 'hydraulic-expansion' to CaseId type and defaults
- `frontend/src/app/hooks/useCaseCalculation.ts` - Added case ID to type
- `frontend/src/app/components/Header.tsx` - Added navigation link
- `frontend/src/app/components/Sidebar.tsx` - Added navigation link
- `frontend/src/app/cases/page.tsx` - Added case listing, fluid name function, updated count from 4 to 6
- `frontend/src/app/hooks/useReportGenerator.ts` - Added `extractHydraulicExpansionData()` function
- `frontend/src/app/components/CollapsibleVesselProperties.tsx` - Fixed hydration error by initializing state with prop, updating from localStorage in useEffect

### API Compliance References
- **API-521 Section 4.4.12**: Hydraulic Expansion - causes, relieving rate calculation (Equation 2), and piping considerations
- **API-521 Section 4.4.12.1**: Common causes (cold-fluid shut-in, blocked-in exchanger, solar heating)
- **API-521 Section 4.4.12.3**: Relieving rate calculation using Equation (2) for USC units
- **API-521 Table 2**: Typical values of cubic expansion coefficient for hydrocarbon liquids and water
- **API-521 Section 4.4.12.4**: Piping considerations and alternatives to PRDs (administrative controls, vapor pockets, etc.)
- **ASME Section VIII**: 0.9 factor for liquid relief sizing (110% accumulation allowance)

---

