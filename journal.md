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
