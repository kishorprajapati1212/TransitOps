-- ============================================================
-- TransitOps — Database Schema (idempotent / safe to re-run)
-- Target: PostgreSQL 14+ (Neon)
-- ============================================================

-- Users & Roles (RBAC via role column)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30)  NOT NULL DEFAULT 'driver'
                CHECK (role IN ('fleet_manager','driver','safety_officer','financial_analyst')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicle Registry
CREATE TABLE IF NOT EXISTS vehicles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR(40) NOT NULL UNIQUE,
  name               VARCHAR(120) NOT NULL,
  type               VARCHAR(40)  NOT NULL,
  max_load_capacity  NUMERIC(12,2) NOT NULL CHECK (max_load_capacity >= 0),
  odometer           NUMERIC(12,2) NOT NULL DEFAULT 0,
  acquisition_cost   NUMERIC(14,2) NOT NULL DEFAULT 0,
  status             VARCHAR(20)  NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available','on_trip','in_shop','retired')),
  region             VARCHAR(60),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Driver Management
CREATE TABLE IF NOT EXISTS drivers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(120) NOT NULL,
  license_number      VARCHAR(60) NOT NULL UNIQUE,
  license_category    VARCHAR(20) NOT NULL,
  license_expiry_date DATE NOT NULL,
  contact_number      VARCHAR(30),
  safety_score        NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (safety_score >= 0 AND safety_score <= 100),
  status              VARCHAR(20) NOT NULL DEFAULT 'off_duty'
                      CHECK (status IN ('available','on_trip','off_duty','suspended')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trip Management (lifecycle: draft -> dispatched -> completed/cancelled)
CREATE TABLE IF NOT EXISTS trips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_code        VARCHAR(40) NOT NULL UNIQUE,
  source           VARCHAR(160) NOT NULL,
  destination      VARCHAR(160) NOT NULL,
  vehicle_id       UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id        UUID REFERENCES drivers(id)  ON DELETE RESTRICT,
  cargo_weight     NUMERIC(12,2) NOT NULL CHECK (cargo_weight >= 0),
  planned_distance NUMERIC(12,2) NOT NULL CHECK (planned_distance >= 0),
  status           VARCHAR(20) NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','dispatched','completed','cancelled')),
  final_odometer   NUMERIC(12,2) CHECK (final_odometer >= 0),
  fuel_consumed    NUMERIC(12,2) CHECK (fuel_consumed >= 0),
  revenue          NUMERIC(14,2) NOT NULL DEFAULT 0,
  dispatched_at    TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maintenance Logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  type         VARCHAR(80) NOT NULL,
  description  TEXT,
  cost         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  status       VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fuel Logs
CREATE TABLE IF NOT EXISTS fuel_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  trip_id    UUID REFERENCES trips(id) ON DELETE SET NULL,
  liters     NUMERIC(12,2) NOT NULL CHECK (liters > 0),
  cost       NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
  log_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses (tolls, maintenance, etc.)
CREATE TABLE IF NOT EXISTS expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  trip_id      UUID REFERENCES trips(id) ON DELETE SET NULL,
  category     VARCHAR(40) NOT NULL,
  description  TEXT,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance / scalability
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type   ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_region ON vehicles(region);
CREATE INDEX IF NOT EXISTS idx_drivers_status  ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license ON drivers(license_expiry_date);
CREATE INDEX IF NOT EXISTS idx_trips_status    ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle   ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver    ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_maint_vehicle   ON maintenance_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maint_status    ON maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle    ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON expenses(vehicle_id);
