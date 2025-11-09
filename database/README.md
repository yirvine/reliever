# Reference Data

This folder contains reference data schemas and seed data for engineering calculations.

## Current Architecture

**Active implementation:** All reference data is currently served **client-side** via `lib/database.ts` using in-memory TypeScript objects. This provides fast lookups without database queries and simplifies the MVP deployment.

## Files

### `schema.sql`
SQL schema definition for fluid properties and vessel head areas. This file serves as:
- **Documentation** of the data structure and relationships
- **Reference** for data validation and types
- **Migration template** if you decide to move to a server-side database (Supabase, PostgreSQL, etc.)

## Data Sources

- **Fluid Properties**: Heat of vaporization, molecular weights, and liquid densities from industry standard references (NFPA 30, Perry's Chemical Engineers' Handbook)
- **Vessel Head Areas**: Lookup tables for standard ASME vessel head geometries (elliptical, hemispherical, flat)

## Future Considerations

### Option A: Stay Client-Side ✅ (Current)
- Keep data in `lib/database.ts` for fast access
- No backend database needed
- Simple deployment, no database hosting costs
- **Best for:** MVP and single-user scenarios

### Option B: Move to Server-Side Database
If you need:
- User-managed custom fluid libraries
- Shared team datasets
- Dynamic data updates without code changes

You can use `schema.sql` as a migration template for:
- **Supabase** (PostgreSQL with auth/real-time)
- **Vercel Postgres** (simple serverless PostgreSQL)
- **Self-hosted PostgreSQL/SQLite**

## Usage

The data structure in `schema.sql` matches the TypeScript interfaces in `lib/database.ts`:
```typescript
interface FluidProperty {
  id: number
  fluid_name: string
  heat_of_vaporization: number // Btu/lb
  molecular_weight?: number
  liquid_density?: number
}
```

**Note:** If you modify data, update BOTH `schema.sql` (for reference) and `lib/database.ts` (active data).

