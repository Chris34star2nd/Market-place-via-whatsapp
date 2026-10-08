-- Add tier_rank column to listings so higher-tier sellers rank first.
-- gold = 4, silver = 3, verified = 2, unverified = 1
ALTER TABLE listings ADD COLUMN IF NOT EXISTS tier_rank int NOT NULL DEFAULT 1;

-- Backfill existing listings from their seller's verification tier
UPDATE listings l
SET tier_rank = CASE
  WHEN s.verification_tier = 'gold' THEN 4
  WHEN s.verification_tier = 'silver' THEN 3
  WHEN s.verification_tier = 'verified' THEN 2
  ELSE 1
END
FROM sellers s
WHERE l.seller_id = s.id;

-- Create index for efficient tier-based sorting
CREATE INDEX IF NOT EXISTS idx_listings_tier_rank ON listings(tier_rank DESC);

-- Function to recalculate tier_rank when a seller's tier changes
CREATE OR REPLACE FUNCTION update_listing_tier_rank()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE listings
  SET tier_rank = CASE
    WHEN NEW.verification_tier = 'gold' THEN 4
    WHEN NEW.verification_tier = 'silver' THEN 3
    WHEN NEW.verification_tier = 'verified' THEN 2
    ELSE 1
  END
  WHERE seller_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger: when a seller's tier changes, update all their listings' tier_rank
DROP TRIGGER IF EXISTS seller_tier_changed ON sellers;
CREATE TRIGGER seller_tier_changed
AFTER UPDATE OF verification_tier ON sellers
FOR EACH ROW
EXECUTE FUNCTION update_listing_tier_rank();

-- Function to set tier_rank when a new listing is created
CREATE OR REPLACE FUNCTION set_listing_tier_rank()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  seller_tier text;
BEGIN
  SELECT verification_tier INTO seller_tier FROM sellers WHERE id = NEW.seller_id;
  NEW.tier_rank := CASE
    WHEN seller_tier = 'gold' THEN 4
    WHEN seller_tier = 'silver' THEN 3
    WHEN seller_tier = 'verified' THEN 2
    ELSE 1
  END;
  RETURN NEW;
END;
$$;

-- Trigger: set tier_rank on new listing insert
DROP TRIGGER IF EXISTS listing_set_tier_rank ON listings;
CREATE TRIGGER listing_set_tier_rank
BEFORE INSERT ON listings
FOR EACH ROW
EXECUTE FUNCTION set_listing_tier_rank();
