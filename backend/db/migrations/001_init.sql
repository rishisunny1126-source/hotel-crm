-- ============================================================
-- HOTEL ENQUIRY & FOLLOW-UP CRM  --  PostgreSQL Schema (v1)
-- Normalized to 3NF. UUID PKs, FKs, indexes, constraints, enums.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ---------- ENUM TYPES ----------
CREATE TYPE user_role AS ENUM
  ('admin','manager','front_desk','housekeeping','accounts','corporate_coordinator');

CREATE TYPE enquiry_source AS ENUM
  ('call','whatsapp','walk_in','email','website','ota','referral','other');

CREATE TYPE enquiry_status AS ENUM
  ('new','contacted','interested','follow_up_pending','confirmed','cancelled','lost');

CREATE TYPE room_status AS ENUM
  ('available','reserved','occupied','cleaning','maintenance');

CREATE TYPE housekeeping_status AS ENUM
  ('dirty','cleaning','ready','occupied');

CREATE TYPE booking_status AS ENUM
  ('reserved','checked_in','checked_out','cancelled','no_show');

CREATE TYPE followup_status AS ENUM ('pending','completed','overdue','cancelled');
CREATE TYPE priority_level AS ENUM ('low','medium','high','urgent');
CREATE TYPE service_type AS ENUM ('food','laundry','extra_towel','extra_bed','cleaning','other');
CREATE TYPE service_status AS ENUM ('requested','assigned','in_progress','completed','cancelled');
CREATE TYPE complaint_status AS ENUM ('open','in_progress','resolved','closed');
CREATE TYPE shift_type AS ENUM ('morning','evening','night');

-- ---------- USERS ----------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'front_desk',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users(role);

-- ---------- GUESTS (master profile / loyalty) ----------
CREATE TABLE guests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(120) NOT NULL,
  mobile           VARCHAR(20) NOT NULL,
  email            VARCHAR(160),
  city             VARCHAR(80),
  id_proof_type    VARCHAR(40),
  id_proof_number  VARCHAR(60),
  total_stays      INTEGER NOT NULL DEFAULT 0,
  lifetime_value   NUMERIC(12,2) NOT NULL DEFAULT 0,
  preferred_room_type VARCHAR(40),
  preferred_services  TEXT,
  loyalty_tier     VARCHAR(20) DEFAULT 'standard',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mobile)
);
CREATE INDEX idx_guests_mobile ON guests(mobile);
CREATE INDEX idx_guests_email  ON guests(email);

-- ---------- ROOMS ----------
CREATE TABLE rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number  VARCHAR(10) NOT NULL UNIQUE,
  room_type    VARCHAR(40) NOT NULL,
  capacity     SMALLINT NOT NULL CHECK (capacity > 0),
  rate         NUMERIC(10,2) NOT NULL CHECK (rate >= 0),
  status       room_status NOT NULL DEFAULT 'available',
  hk_status    housekeeping_status NOT NULL DEFAULT 'ready',
  floor        SMALLINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_type   ON rooms(room_type);

-- ---------- ENQUIRIES (core CRM) ----------
CREATE TABLE enquiries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code           VARCHAR(20) UNIQUE,
  guest_id           UUID REFERENCES guests(id) ON DELETE SET NULL,
  guest_name         VARCHAR(120) NOT NULL,
  mobile             VARCHAR(20) NOT NULL,
  email              VARCHAR(160),
  city               VARCHAR(80),
  source             enquiry_source NOT NULL DEFAULT 'call',
  room_type          VARCHAR(40),
  guests_count       SMALLINT DEFAULT 1 CHECK (guests_count > 0),
  check_in_date      DATE,
  check_out_date     DATE,
  budget             NUMERIC(10,2),
  special_requirements TEXT,
  status             enquiry_status NOT NULL DEFAULT 'new',
  assigned_staff_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_enq_dates CHECK (check_out_date IS NULL OR check_in_date IS NULL OR check_out_date >= check_in_date)
);
CREATE INDEX idx_enq_status   ON enquiries(status);
CREATE INDEX idx_enq_assigned ON enquiries(assigned_staff_id);
CREATE INDEX idx_enq_source   ON enquiries(source);
CREATE INDEX idx_enq_created  ON enquiries(created_at);

-- ---------- FOLLOW-UPS ----------
CREATE TABLE follow_ups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id    UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  notes         TEXT,
  priority      priority_level NOT NULL DEFAULT 'medium',
  status        followup_status NOT NULL DEFAULT 'pending',
  assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at  TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fu_enquiry ON follow_ups(enquiry_id);
CREATE INDEX idx_fu_status  ON follow_ups(status);
CREATE INDEX idx_fu_date    ON follow_ups(scheduled_date);

-- ---------- ENQUIRY HISTORY (audit timeline) ----------
CREATE TABLE enquiry_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id  UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  event_type  VARCHAR(40) NOT NULL,   -- created/updated/status_changed/follow_up_added/booking_confirmed
  from_value  VARCHAR(120),
  to_value    VARCHAR(120),
  note        TEXT,
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hist_enquiry ON enquiry_history(enquiry_id);

-- ---------- BOOKINGS ----------
CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code  VARCHAR(20) UNIQUE,
  enquiry_id    UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  guest_id      UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  room_id       UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in_date  DATE NOT NULL,
  check_out_date DATE NOT NULL,
  amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  status        booking_status NOT NULL DEFAULT 'reserved',
  checked_in_at  TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_book_dates CHECK (check_out_date > check_in_date)
);
CREATE INDEX idx_book_room   ON bookings(room_id);
CREATE INDEX idx_book_guest  ON bookings(guest_id);
CREATE INDEX idx_book_status ON bookings(status);
CREATE INDEX idx_book_dates  ON bookings(check_in_date, check_out_date);

-- ---------- SELF CHECK-IN ----------
CREATE TABLE self_checkins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  guest_name    VARCHAR(120) NOT NULL,
  phone         VARCHAR(20) NOT NULL,
  id_proof_type VARCHAR(40),
  id_proof_number VARCHAR(60),
  check_in_date DATE NOT NULL,
  reviewed      BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- ROOM SERVICE ----------
CREATE TABLE room_service_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  service_type  service_type NOT NULL,
  description   TEXT,
  status        service_status NOT NULL DEFAULT 'requested',
  assigned_to   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rs_status ON room_service_requests(status);

-- ---------- HOUSEKEEPING TASKS ----------
CREATE TABLE housekeeping_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  status      housekeeping_status NOT NULL DEFAULT 'dirty',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes       TEXT,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hk_status ON housekeeping_tasks(status);

-- ---------- FEEDBACK ----------
CREATE TABLE feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id    UUID REFERENCES guests(id) ON DELETE SET NULL,
  booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fb_rating ON feedback(rating);

-- ---------- COMPLAINTS ----------
CREATE TABLE complaints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id    UUID REFERENCES guests(id) ON DELETE SET NULL,
  booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  title       VARCHAR(160) NOT NULL,
  description TEXT,
  priority    priority_level NOT NULL DEFAULT 'medium',
  status      complaint_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comp_status ON complaints(status);

-- ---------- CORPORATE BOOKINGS ----------
CREATE TABLE corporate_bookings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name   VARCHAR(160) NOT NULL,
  contact_person VARCHAR(120),
  contact_phone  VARCHAR(20),
  contact_email  VARCHAR(160),
  rooms_required SMALLINT CHECK (rooms_required > 0),
  start_date     DATE,
  end_date       DATE,
  budget         NUMERIC(12,2),
  status         enquiry_status NOT NULL DEFAULT 'new',
  coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- GROUP BOOKINGS ----------
CREATE TABLE group_bookings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name     VARCHAR(160) NOT NULL,
  guests_count   INTEGER CHECK (guests_count > 0),
  rooms_count    SMALLINT CHECK (rooms_count > 0),
  arrival_date   DATE,
  departure_date DATE,
  contact_person VARCHAR(120),
  contact_phone  VARCHAR(20),
  status         enquiry_status NOT NULL DEFAULT 'new',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- SHIFT HANDOVER ----------
CREATE TABLE shift_handovers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift       shift_type NOT NULL,
  staff_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  note        TEXT NOT NULL,
  priority    priority_level NOT NULL DEFAULT 'medium',
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  handover_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sh_date ON shift_handovers(handover_date);

-- ---------- REFRESH TOKENS (auth sessions) ----------
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rt_user ON refresh_tokens(user_id);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users','guests','rooms','enquiries','follow_ups',
      'bookings','room_service_requests','housekeeping_tasks','complaints',
      'corporate_bookings','group_bookings'])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON %1$s
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t);
  END LOOP;
END $$;
