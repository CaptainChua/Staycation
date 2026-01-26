-- ===============================================
-- REVIEWS TABLE - SIMPLIFIED VERSION
-- ===============================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  haven_id UUID NOT NULL,
  user_id UUID, -- NULL for guest reviews, UUID for logged-in users
  
  -- Guest information
  guest_first_name VARCHAR(100) NOT NULL,
  guest_last_name VARCHAR(100) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  
  -- Review content
  comment TEXT,
  
  -- Category ratings (1-5 scale)
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  checkin_rating INTEGER CHECK (checkin_rating >= 1 AND checkin_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Calculated overall rating (average of all category ratings)
  overall_rating DECIMAL(3,2) CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
  
  -- Review status
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Admin moderation
  admin_notes TEXT,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'pending', 'hidden', 'flagged')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_reviews_booking 
    FOREIGN KEY (booking_id) 
    REFERENCES booking(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_reviews_haven 
    FOREIGN KEY (haven_id) 
    REFERENCES havens(uuid_id) 
    ON DELETE CASCADE,
    
  -- Ensure one review per booking
  CONSTRAINT unique_review_per_booking UNIQUE (booking_id),
  
  -- Ensure at least one rating is provided
  CONSTRAINT check_at_least_one_rating CHECK (
    cleanliness_rating IS NOT NULL OR 
    communication_rating IS NOT NULL OR 
    checkin_rating IS NOT NULL OR 
    accuracy_rating IS NOT NULL OR 
    location_rating IS NOT NULL OR 
    value_rating IS NOT NULL
  )
);

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

-- Index for haven-specific queries
CREATE INDEX IF NOT EXISTS idx_reviews_haven_id ON reviews(haven_id);

-- Index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Index for booking lookups
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Index for public reviews display
CREATE INDEX IF NOT EXISTS idx_reviews_public ON reviews(is_public, status);

-- Index for featured reviews
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(is_featured, is_public, status);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Index for overall rating queries
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating);

-- Composite index for haven reviews with ratings
CREATE INDEX IF NOT EXISTS idx_reviews_haven_public_rating ON reviews(haven_id, is_public, status, overall_rating);

-- ===============================================
-- TRIGGER FOR UPDATED_AT AND OVERALL RATING CALCULATION
-- ===============================================

CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Calculate overall rating as average of all provided ratings
    DECLARE
      rating_count INTEGER := 0;
      rating_sum DECIMAL := 0;
    BEGIN
      IF NEW.cleanliness_rating IS NOT NULL THEN
        rating_count := rating_count + 1;
        rating_sum := rating_sum + NEW.cleanliness_rating;
      END IF;
      
      IF NEW.communication_rating IS NOT NULL THEN
        rating_count := rating_count + 1;
        rating_sum := rating_sum + NEW.communication_rating;
      END IF;
      
      IF NEW.checkin_rating IS NOT NULL THEN
        rating_count := rating_count + 1;
        rating_sum := rating_sum + NEW.checkin_rating;
      END IF;
      
      IF NEW.accuracy_rating IS NOT NULL THEN
        rating_count := rating_count + 1;
        rating_sum := rating_sum + NEW.accuracy_rating;
      END IF;
      
      IF NEW.location_rating IS NOT NULL THEN
        rating_count := rating_count + 1;
        rating_sum := rating_sum + NEW.location_rating;
      END IF;
      
      IF NEW.value_rating IS NOT NULL THEN
        rating_count := rating_count + 1;
        rating_sum := rating_sum + NEW.value_rating;
      END IF;
      
      IF rating_count > 0 THEN
        NEW.overall_rating := ROUND(rating_sum / rating_count, 2);
      END IF;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to reviews table
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Apply trigger for INSERT as well to calculate overall_rating on creation
CREATE TRIGGER calculate_overall_rating_on_insert
    BEFORE INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();
