-- ============================================================
-- Migration 003: Payments + GST, and Seasonal Rate Plans
-- ============================================================
CREATE TYPE payment_method AS ENUM ('cash','card','upi','bank_transfer','online');
CREATE TYPE payment_status AS ENUM ('pending','paid','refunded','partial');

-- ---------- PAYMENTS (with GST) ----------
CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no    VARCHAR(24) UNIQUE,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  guest_id      UUID REFERENCES guests(id) ON DELETE SET NULL,
  base_amount   NUMERIC(12,2) NOT NULL CHECK (base_amount >= 0),
  gst_rate      NUMERIC(5,2)  NOT NULL DEFAULT 12.00,   -- % GST (hotel slabs: 12/18)
  gst_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  method        payment_method NOT NULL DEFAULT 'cash',
  status        payment_status NOT NULL DEFAULT 'paid',
  paid_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pay_booking ON payments(booking_id);
CREATE INDEX idx_pay_paid_at ON payments(paid_at);
CREATE INDEX idx_pay_status  ON payments(status);

-- ---------- RATE PLANS (seasonal / dynamic pricing) ----------
CREATE TABLE rate_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(80) NOT NULL,            -- e.g. "Diwali Peak", "Monsoon Offer"
  room_type   VARCHAR(40) NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  rate        NUMERIC(10,2) NOT NULL CHECK (rate >= 0),
  priority    SMALLINT NOT NULL DEFAULT 1,     -- higher wins on overlap
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_rate_dates CHECK (end_date >= start_date)
);
CREATE INDEX idx_rate_type_dates ON rate_plans(room_type, start_date, end_date);

-- updated_at triggers for new tables
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rate_plans_updated BEFORE UPDATE ON rate_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
