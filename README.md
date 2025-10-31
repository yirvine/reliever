# ReliefGuard

> **Modern web application for sizing pressure relief valves and rupture discs**

A clean, fast, web-based replacement for legacy VBA-driven Excel workbooks used in pressure relief valve (PRV) sizing calculations. Built for engineering professionals following NFPA 30, API 521, and ASME VIII guidelines.

![MVP Status](https://img.shields.io/badge/Status-MVP-green)
![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4)

## **Current Functionality (MVP)**

### ✅ **Landing Page & Navigation**
- Professional hero section with soft fade-in animations
- Clean "How It Works" section with 3-step process
- Dynamic case selection with toggle switches
- Real-time design basis flow calculation and display
- Responsive design optimized for engineering workflows
- Smooth scroll navigation between sections

### ✅ **Case 1: External Fire**
- **Vessel Properties Input**
  - Vessel tag, dimensions (diameter, height)
  - Head type selection (Elliptical, Hemispherical, Flat)
  - Working fluid selection from database
  - MAWP and set pressure configuration
  - Consistent 4-column layout for efficient data entry
- **Fire Code Selection**
  - NFPA 30 (2018) with piecewise heat input formulas
  - API 521 (2000) with drainage/firefighting conditions
  - Detailed tooltips explaining formula selection
- **Real-time Calculations**
  - Fire exposed area calculation (auto-updates)
  - Heat input (Q) based on selected code
  - Relieving flow, ASME VIII design flow, equivalent air flow
  - Automatic MAVP calculation (121% of MAWP)
- **Smart Validation & UX**
  - Handles edge cases (e.g., NFPA 30 minimum area requirements)
  - Clear feedback with hover tooltips explaining limitations
  - Selectable/copyable formula tooltips
  - Case toggle with smooth animations
  - Consistent styling for editable/uneditable fields

### ✅ **Case 2: Control Valve Failure (Gas Service)**
- **Multi-Gas Support**
  - Gas selection: Nitrogen, Air, Oxygen, CO2, Methane, or Custom Gas
  - Automatic molecular weight and specific gravity from NIST/Perry's Handbook
  - Custom gas properties for unlisted gases
- **Dual Calculation Methods**
  - Manual flow input (direct lb/hr entry)
  - Pressure-based calculation using ISA gas flow formulas
  - Real-time switching between calculation methods
- **API 521 Advanced Features**
  - Bypass valve consideration (Section 4.4.8.3) with effective Cv calculation
  - Outlet flow credit (Section 4.4.8.4) for net relief requirement
  - Detailed scenario explanations with code references
- **Advanced Input Parameters**
  - Control valve Cv and optional bypass valve Cv
  - Maximum upstream supply and vessel relieving pressures
  - Temperature, compressibility factor (Z), pressure drop ratio (x_t)
- **API 520 Compliance**
  - ISA-S75.01 gas flow formulas for choked/non-choked flow
  - Automatic flow regime detection and validation
  - Comprehensive error handling and warnings
- **Professional UX**
  - Real-time calculations with optimized performance
  - Detailed tooltips with formula explanations and API references
  - Collapsible About section with scenario guidance
  - Case toggle integration with design basis flow

### ✅ **Case 3: Liquid Overfill**
- **Simple Manual Input**
  - Direct flow rate entry in lb/hr
  - Clear instructions for credible flow determination
  - Pump capacity, pressure differential, or other credible means
- **Streamlined Calculation**
  - Relief flow = user input (no complex conversions)
  - ASME VIII design flow = relief flow ÷ 0.9
  - 110% MAWP allowance (same as nitrogen case)
- **Consistent Integration**
  - Same vessel properties and pressure settings
  - Real-time design basis flow updates
  - Case toggle with visual feedback

### ✅ **Engineering Database**
- **Fluid Properties**: 20+ liquids with heat of vaporization, molecular weight, density (NFPA 30)
- **Gas Properties**: Common gases (N₂, O₂, Air, CO₂, CH₄) with molecular weights and specific gravities (NIST/Perry's)
- **Vessel Head Areas**: Comprehensive lookup tables for standard vessel sizes
- **Heat Input Formulas**: NFPA 30 piecewise functions and API 521 formulas
- **Standard Diameters**: Industry-standard vessel diameter options

### ✅ **Advanced UX Features**
- **Data Persistence**: Automatic localStorage sync with custom hooks for all case data
- **Context Management**: Shared vessel properties and case results across all cases
- **Interactive Tooltips**: Sticky tooltips with detailed formula explanations and selectable text
- **Case Toggle System**: Include/exclude cases from both main page and case pages
- **Real-time Updates**: Calculations update automatically as inputs change with optimized performance
- **Smart Navigation**: Dropdown menus for quick access to cases and datasets
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Page transitions and fade-in effects throughout
- **Collapsible Sections**: Scenario descriptions with clean show/hide functionality

### ✅ **Technical Architecture**
- **Frontend**: Next.js 15+ with App Router, TypeScript, TailwindCSS v4
- **State Management**: 
  - React Context API for vessel data and case results
  - Custom `useLocalStorage` hook for automatic data persistence
  - Centralized type definitions and storage key constants
  - Functional setState patterns to prevent stale closures
  - Memoized calculations for optimized performance
- **Database & Calculations**:
  - In-memory JavaScript objects with comprehensive gas and fluid properties
  - Pure TypeScript functions with strict type safety
  - Industry-validated formulas (NIST, Perry's, API, NFPA, ASME standards)
  - Real-time calculation updates with comprehensive error handling
- **UI/UX**:
  - League Spartan and Inter fonts for professional typography
  - Reusable component library (inputs, dropdowns, tooltips, collapsible sections)
  - Smooth page transitions with PageTransition component
  - Responsive design with adaptive grid layouts
  - Sticky tooltips with hover persistence

## **Future Roadmap**

### **Phase 1: Additional Cases** *(Next 2-3 months)*
- **Case 4**: Blocked Outlet scenarios
- **Case 5**: Gas Blowby calculations
- **Case 6**: Tube Rupture analysis
- Multi-case comparison and selection interface

### **Phase 2: Professional Reporting** *(3-4 months)*
- PDF report generation with company branding
- Calculation summary with input/output tables
- Code compliance documentation
- Export functionality (Excel, CSV formats)
- Print-optimized layouts

### **Phase 3: Data Management** *(4-6 months)*
- SQLite/PostgreSQL integration for production
- User project management and saving
- Calculation history and audit trails
- Custom fluid database management
- Import/export of vessel configurations

### **Phase 4: Enterprise Features** *(6+ months)*
- User authentication and role management
- Multi-company/project organization
- API for integration with other engineering tools
- Advanced validation and approval workflows
- Compliance reporting and documentation

### **Phase 5: Commercialization** *(Future)*
- SaaS deployment with subscription tiers
- Enterprise licensing for engineering firms
- Integration with FluidFlow, HTRI, and other process software
- Mobile app for field calculations
- Advanced analytics and reporting dashboards

## **Development Setup**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yirvine/reliever.git
cd reliever

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Project Structure
```
reliever/
├── frontend/                     # Next.js application
│   ├── src/app/                 # App Router pages and components
│   │   ├── cases/               # Individual calculation case pages
│   │   │   ├── external-fire/        # Case 1: External Fire
│   │   │   ├── control-valve-failure/ # Case 2: Control Valve Failure
│   │   │   └── liquid-overfill/      # Case 3: Liquid Overfill
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # React Context for state management
│   │   ├── hooks/               # Custom React hooks (useLocalStorage, etc.)
│   │   ├── types/               # Shared TypeScript type definitions
│   │   ├── data/                # Data reference pages
│   │   └── datasets/            # Dataset listing pages
│   └── lib/                     # Utilities and database functions
├── database/                    # Database schema and data files
├── journal.md                   # Development log
└── README.md                   # This file
```

## **Engineering Standards**

### Supported Codes & Standards
- **NFPA 30** (2018): Flammable and Combustible Liquids Code
- **API 521** (2000): Pressure-relieving and Depressuring Systems
- **API 520**: Sizing, Selection, and Installation of Pressure-Relieving Devices
- **ISA-S75.01**: Control Valve Sizing Equations (for gas flow calculations)
- **ASME VIII**: Boiler and Pressure Vessel Code

### Calculation Accuracy
- Formulas validated against legacy Excel workbook results
- Unit tests planned for all calculation functions
- Peer review by licensed professional engineers

### Formula References
- **NFPA 30 Heat Input**: Piecewise functions for different area ranges
- **API 521 Heat Input**: Environmental factor considerations with drainage conditions
- **API 520 Gas Flow**: ISA-S75.01 gas flow formulas for choked/non-choked conditions with multiple gas support
- **Fire Exposed Area**: Code-specific wetted surface calculations
- **Relief Flow**: Heat input divided by fluid heat of vaporization
- **ASME VIII Design**: Relief flow divided by 0.9 safety factor

## **Design Philosophy**

### User Experience
- **Engineer-First**: Designed by engineers, for engineers
- **Transparency**: All calculations visible with hover explanations
- **Speed**: Faster than Excel with real-time updates
- **Reliability**: Consistent results with clear validation
- **Elegance**: Clean, professional interface with smooth animations

### Technical Approach
- **MVP-First**: Focus on core functionality before feature creep
- **Modular**: Easy to add new cases and calculation methods
- **Maintainable**: Clean code with TypeScript safety
- **Scalable**: Architecture ready for enterprise deployment

## **Current Status**

### Completed ✅
- [x] Landing page with case selection and smooth animations
- [x] Case 1: External Fire with NFPA 30 and API 521 compliance
- [x] Case 2: Control Valve Failure with multi-gas support and API 521 advanced features
- [x] Case 3: Liquid Overfill with simple manual input
- [x] Database integration for fluid and gas properties
- [x] Real-time calculation updates across all cases with optimized performance
- [x] Automatic data persistence with custom localStorage hook
- [x] PDF report generation with complete case data
- [x] Responsive design and UX polish
- [x] Engineering validation and accuracy testing
- [x] Case toggle system with visual feedback
- [x] Professional navigation with dropdown menus
- [x] Design basis flow calculation and display
- [x] Code quality refactoring with shared utilities and types

### In Progress
- [ ] Case 4: Blocked Outlet scenarios
- [ ] Enhanced error handling and validation
- [ ] Additional gas service scenarios

### Planned
- [ ] Production database integration
- [ ] User authentication system
- [ ] Multi-project management
- [ ] Enterprise deployment

## **Contributing**

This project is currently in private development. Future contributions will be welcome once the MVP is complete and the codebase is ready for external collaboration.

## **License**

Proprietary - All rights reserved. This software is intended for commercial use and licensing to engineering firms.

---

**Built with care for the engineering community**

*Replacing clunky Excel workbooks, one calculation at a time.*