-- ============================================================
-- Migration 004: time-precise bookings (12h / 1d / 2d stays)
-- Booked rooms stay unavailable until their checkout TIME passes.
-- ============================================================

-- Move check-in/out from DATE to TIMESTAMPTZ (keeps column names)
ALTER TABLE bookings ALTER COLUMN check_in_date  TYPE timestamptz USING check_in_date::timestamptz;
ALTER TABLE bookings ALTER COLUMN check_out_date TYPE timestamptz USING check_out_date::timestamptz;

-- Rebuild the double-booking guard using a TIME range (was date range)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_double_booking;
ALTER TABLE bookings
  ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(check_in_date, check_out_date, '[)') WITH &&
  )
  WHERE (status IN ('reserved','checked_in'));
