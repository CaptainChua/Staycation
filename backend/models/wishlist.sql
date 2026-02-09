CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- `user_id` can be NULL for guest entries
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  -- guest_token is used to track wishlist items for guest users
  guest_token VARCHAR(255),
  haven_id UUID NOT NULL REFERENCES havens(uuid_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraints:
-- - For logged-in users: prevent duplicate (user_id, haven_id)
-- - For guest users: prevent duplicate (guest_token, haven_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_haven ON wishlist (user_id, haven_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_guest_haven ON wishlist (guest_token, haven_id) WHERE guest_token IS NOT NULL;
