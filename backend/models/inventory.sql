CREATE TABLE inventory (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name VARCHAR(100) NOT NULL,

  category VARCHAR(100)
    CHECK (category IN (
      'Guest Amenities',
      'Bathroom Supplies',
      'Cleaning Supplies',
      'Linens & Bedding',
      'Kitchen Supplies',
      'Add ons'
    )),

  current_stock INT NOT NULL,
  minimum_stock INT NOT NULL,
  unit_type VARCHAR(100) NOT NULL,
  price_per_unit DECIMAL(10,2) DEFAULT NULL,

  last_restocked TIMESTAMPTZ DEFAULT NOW(),

  status VARCHAR(20)
    CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock'))
    DEFAULT 'In Stock',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);