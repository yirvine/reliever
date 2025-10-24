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
