CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  salon_owner_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uk_conversation_customer_owner UNIQUE (customer_id, salon_owner_id),
  INDEX idx_conversation_customer (customer_id),
  INDEX idx_conversation_owner (salon_owner_id),
  CONSTRAINT fk_conversation_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_conversation_owner FOREIGN KEY (salon_owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  client_message_id VARCHAR(100) NULL,
  content VARCHAR(2000) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'SENT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME NULL,
  read_at DATETIME NULL,
  CONSTRAINT uk_messages_client_message_id UNIQUE (client_message_id),
  INDEX idx_message_conversation_created (conversation_id, created_at),
  INDEX idx_message_receiver_status (receiver_id, status, created_at),
  INDEX idx_message_sender_created (sender_id, created_at),
  CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES users(id)
);

ALTER TABLE notifications
  MODIFY COLUMN type VARCHAR(64) NOT NULL;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS conversation_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS message_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS user_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS booking_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS salon_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS was_read BIT(1) NOT NULL DEFAULT b'0';

CREATE INDEX idx_notification_user_created ON notifications (user_id, created_at);
CREATE INDEX idx_notification_user_read ON notifications (user_id, was_read);
CREATE INDEX idx_notification_conversation ON notifications (conversation_id);
CREATE INDEX idx_notification_booking ON notifications (booking_id);
