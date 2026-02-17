-- Migration for AI features: analytics tables, pricing history, coupons
ALTER TABLE IF EXISTS bookings
  ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS booking_date DATE,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'CONFIRMED';

ALTER TABLE IF NOT EXISTS service_offering
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS booking_stats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  salon_id BIGINT,
  service_offering_id BIGINT,
  period_start DATETIME,
  period_end DATETIME,
  booking_count INT,
  INDEX(salon_id),
  INDEX(service_offering_id)
);

CREATE TABLE IF NOT EXISTS service_price_adjustment_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  service_offering_id BIGINT,
  salon_id BIGINT,
  applied_price DECIMAL(10,2),
  reason VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) UNIQUE,
  discount_pct INT,
  valid_from DATETIME,
  valid_until DATETIME,
  usage_limit INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
