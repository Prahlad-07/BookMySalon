CREATE TABLE IF NOT EXISTS signup_verification_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_token VARCHAR(180) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  requested_role VARCHAR(32) NOT NULL,
  email_otp_hash VARCHAR(255) NOT NULL,
  phone_otp_hash VARCHAR(255) NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_signup_session_token (session_token),
  INDEX idx_signup_session_email (email),
  INDEX idx_signup_session_phone (phone)
);
