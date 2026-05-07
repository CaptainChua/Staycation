-- Fix empty haven_name values by generating a name from tower + floor
UPDATE havens
SET haven_name = 'Haven ' || INITCAP(tower) || ' - Floor ' || floor
WHERE TRIM(haven_name) = '';

-- Add a check constraint to prevent empty haven_name in future
ALTER TABLE havens
ADD CONSTRAINT check_haven_name_not_empty CHECK (TRIM(haven_name) <> '');
