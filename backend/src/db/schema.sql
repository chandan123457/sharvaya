CREATE TABLE IF NOT EXISTS candidates (
  id                SERIAL PRIMARY KEY,
  full_name         VARCHAR(120) NOT NULL,
  email             VARCHAR(160) NOT NULL,
  phone             VARCHAR(20)  NOT NULL,
  date_of_birth     DATE,
  gender            VARCHAR(20),
  city              VARCHAR(80)  NOT NULL,
  qualification     VARCHAR(120) NOT NULL,
  experience_years  NUMERIC(4,1) NOT NULL DEFAULT 0,
  position_applied  VARCHAR(120) NOT NULL,
  skills            TEXT[]       NOT NULL DEFAULT '{}',
  expected_salary   NUMERIC(12,2),
  status            VARCHAR(20)  NOT NULL DEFAULT 'Applied',
  notes             TEXT,

  -- Soft delete: a "deleted" row is only hidden from the grid, never removed.
  is_deleted        BOOLEAN      NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,

  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT candidates_status_chk
    CHECK (status IN ('Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'))
);

-- An email must be unique among active candidates only, so a hidden
-- record never blocks a fresh registration with the same email.
CREATE UNIQUE INDEX IF NOT EXISTS candidates_email_active_uq
  ON candidates (LOWER(email)) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS candidates_is_deleted_idx ON candidates (is_deleted);
CREATE INDEX IF NOT EXISTS candidates_created_at_idx ON candidates (created_at DESC);
