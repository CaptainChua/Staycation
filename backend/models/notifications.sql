CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL,        -- receiver
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  notification_type VARCHAR(50) NOT NULL,

  is_read BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id)
    REFERENCES employees(id)
    ON DELETE CASCADE
);