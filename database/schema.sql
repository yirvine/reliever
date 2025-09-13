-- Reliever Database Schema
-- Reference tables for fluid properties and vessel geometry

-- Fluid Properties Table
CREATE TABLE fluid_properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fluid_name TEXT NOT NULL UNIQUE,
    heat_of_vaporization REAL NOT NULL, -- Btu/lb
    molecular_weight REAL, -- M
    liquid_density REAL, -- Lx (lb/ft³)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vessel Head Area Table
CREATE TABLE vessel_head_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diameter_inches REAL NOT NULL,
    head_type TEXT NOT NULL CHECK (head_type IN ('Elliptical', 'Hemispherical', 'Flat')),
    area_sq_feet REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(diameter_inches, head_type)
);

-- Index for fast lookups
CREATE INDEX idx_fluid_name ON fluid_properties(fluid_name);
CREATE INDEX idx_vessel_diameter_type ON vessel_head_areas(diameter_inches, head_type);

-- Insert fluid properties data
INSERT INTO fluid_properties (fluid_name, heat_of_vaporization, molecular_weight, liquid_density) VALUES
('Acetaldehyde', 252, 44.05, 1673),
('Acetic acid', 174, 60.05, 1348),
('Acetone', 224, 58.08, 1707),
('Air', 0, 28.97, 0),
('Benzene', 169, 78.11, 1494),
('Cyclohexane', 154, 84.16, 1413),
('Dimethylamine', 250, 45.08, 1679),
('Ethanol', 368, 46.07, 2498),
('Ethyl acetate', 157, 88.11, 1474),
('Gasoline', 145, 96, 1421),
('Heptane', 137, 100.2, 1371),
('Hexane', 144, 86.17, 1357),
('Methanol', 474, 32.04, 2663),
('Methylene Chloride', 122, 84.93, 1124),
('Nitrogen', 86, 28, 455),
('Octane', 132, 114.22, 1411),
('Pentane', 153, 72.15, 1300),
('Toluene', 156, 92.13, 1497),
('Vinyl acetate', 165, 86.09, 1532),
('Water', 970, 18.01, 4111);

-- Insert vessel head area data (sample from your table)
INSERT INTO vessel_head_areas (diameter_inches, head_type, area_sq_feet) VALUES
-- 2:1 Elliptical heads
(30, 'Elliptical', 0.1524),
(36, 'Elliptical', 0.233),
(42, 'Elliptical', 0.33),
(48, 'Elliptical', 0.56),
(54, 'Elliptical', 0.87),
(60, 'Elliptical', 1.22),
(66, 'Elliptical', 1.46),
(72, 'Elliptical', 1.91),
(78, 'Elliptical', 2.42),
(84, 'Elliptical', 2.99),
(90, 'Elliptical', 3.61),
(96, 'Elliptical', 4.30),
(102, 'Elliptical', 6.72),
(108, 'Elliptical', 17.21),
(114, 'Elliptical', 21.79),
(120, 'Elliptical', 26.88),
(126, 'Elliptical', 32.53),
(132, 'Elliptical', 38.75),
(138, 'Elliptical', 45.43),
(144, 'Elliptical', 52.70),
(150, 'Elliptical', 60.49),
(156, 'Elliptical', 70.25),
(162, 'Elliptical', 77.69),
(168, 'Elliptical', 87.15),

-- ASME F&D (Hemispherical) heads
(30, 'Hemispherical', 0.13),
(36, 'Hemispherical', 0.20),
(42, 'Hemispherical', 0.28),
(48, 'Hemispherical', 0.48),
(54, 'Hemispherical', 0.75),
(60, 'Hemispherical', 1.05),
(66, 'Hemispherical', 1.32),
(72, 'Hemispherical', 1.65),
(78, 'Hemispherical', 2.09),
(84, 'Hemispherical', 2.59),
(90, 'Hemispherical', 3.13),
(96, 'Hemispherical', 3.72),
(102, 'Hemispherical', 5.82),
(108, 'Hemispherical', 14.89),
(114, 'Hemispherical', 18.84),
(120, 'Hemispherical', 23.04),
(126, 'Hemispherical', 28.15),
(132, 'Hemispherical', 33.50),
(138, 'Hemispherical', 39.32),
(144, 'Hemispherical', 45.60),
(150, 'Hemispherical', 52.35),
(156, 'Hemispherical', 59.56),
(162, 'Hemispherical', 67.23),
(168, 'Hemispherical', 75.38),

-- Flat heads
(30, 'Flat', 0.22),
(36, 'Flat', 0.34),
(42, 'Flat', 0.48),
(48, 'Flat', 0.815),
(54, 'Flat', 1.26),
(60, 'Flat', 1.77),
(66, 'Flat', 2.14),
(72, 'Flat', 2.79),
(78, 'Flat', 3.53),
(84, 'Flat', 4.36),
(90, 'Flat', 5.28),
(96, 'Flat', 6.28),
(102, 'Flat', 9.82),
(108, 'Flat', 25.13),
(114, 'Flat', 31.81),
(120, 'Flat', 39.27),
(126, 'Flat', 47.52),
(132, 'Flat', 56.55),
(138, 'Flat', 66.37),
(144, 'Flat', 76.97),
(150, 'Flat', 88.36),
(156, 'Flat', 100.53),
(162, 'Flat', 113.49),
(168, 'Flat', 127.24);
