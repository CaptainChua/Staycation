-- Relax the capacity constraint to allow up to 50 guests
ALTER TABLE havens 
DROP CONSTRAINT IF EXISTS check_capacity;

ALTER TABLE havens 
ADD CONSTRAINT check_capacity CHECK (capacity > 0 AND capacity <= 50);
