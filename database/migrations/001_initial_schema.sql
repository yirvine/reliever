-- Initial Database Schema for ReliefGuard
-- Firebase Auth + Supabase Data Storage
-- 
-- This migration creates the core tables for user data, vessels, and cases.
-- Authentication is handled by Firebase, and Supabase stores all application data.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table: Maps Firebase users to our database
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on firebase_uid for fast lookups
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Vessels table: Stores vessel information
CREATE TABLE vessels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Vessel identification
  vessel_tag TEXT NOT NULL,
  vessel_name TEXT,
  
  -- Vessel properties
  vessel_orientation TEXT, -- 'vertical', 'horizontal', 'sphere'
  vessel_diameter NUMERIC, -- inches
  straight_side_height NUMERIC, -- inches (0 for spheres)
  head_type TEXT, -- '2:1 Elliptical', 'Hemispherical', 'Flat', etc.
  
  -- Pressure specifications
  vessel_design_mawp NUMERIC, -- psig
  asme_set_pressure NUMERIC, -- psig
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure vessel_tag is unique per user
  -- Note: Different users CAN have vessels with the same tag - only enforced per user
  UNIQUE(user_id, vessel_tag)
);

-- Create index on user_id for fast user-specific queries
CREATE INDEX idx_vessels_user_id ON vessels(user_id);

-- Cases table: Stores calculation cases linked to vessels
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Case identification
  case_type TEXT NOT NULL, -- 'external-fire', 'control-valve-failure', etc.
  case_name TEXT, -- Custom name (optional)
  
  -- Case data (stored as JSONB for flexibility)
  flow_data JSONB, -- Input parameters and calculated flow results
  pressure_data JSONB, -- Pressure settings (MAWP %, backpressure, etc.)
  
  -- Calculated results (denormalized for quick access)
  calculated_relieving_flow NUMERIC, -- lb/hr
  asme_viii_design_flow NUMERIC, -- lb/hr
  is_calculated BOOLEAN DEFAULT FALSE,
  
  -- Selection state
  is_selected BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure case_type is unique per vessel
  UNIQUE(vessel_id, case_type)
);

-- Create indexes for fast queries
CREATE INDEX idx_cases_vessel_id ON cases(vessel_id);
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_case_type ON cases(case_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vessels_updated_at
  BEFORE UPDATE ON vessels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Users: Can only read their own user record
-- (Note: Since we're using service role key from our API, RLS won't apply to our backend operations)
-- These policies are here for future direct client-side access if needed
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (firebase_uid = current_setting('app.firebase_uid', true));

-- Vessels: Users can only access their own vessels
CREATE POLICY vessels_select_own ON vessels
  FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = current_setting('app.firebase_uid', true)));

CREATE POLICY vessels_insert_own ON vessels
  FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE firebase_uid = current_setting('app.firebase_uid', true)));

CREATE POLICY vessels_update_own ON vessels
  FOR UPDATE
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = current_setting('app.firebase_uid', true)));

CREATE POLICY vessels_delete_own ON vessels
  FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = current_setting('app.firebase_uid', true)));

-- Cases: Users can only access cases for their own vessels
CREATE POLICY cases_select_own ON cases
  FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = current_setting('app.firebase_uid', true)));

CREATE POLICY cases_insert_own ON cases
  FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE firebase_uid = current_setting('app.firebase_uid', true)));

CREATE POLICY cases_update_own ON cases
  FOR UPDATE
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = current_setting('app.firebase_uid', true)));

CREATE POLICY cases_delete_own ON cases
  FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE firebase_uid = current_setting('app.firebase_uid', true)));

-- Comments
COMMENT ON TABLE users IS 'User accounts synced from Firebase Auth';
COMMENT ON TABLE vessels IS 'Vessel properties and specifications';
COMMENT ON TABLE cases IS 'Relief calculation cases linked to vessels';
COMMENT ON COLUMN cases.flow_data IS 'JSONB: Input parameters and calculated flow results';
COMMENT ON COLUMN cases.pressure_data IS 'JSONB: Pressure settings (MAWP %, backpressure, etc.)';

