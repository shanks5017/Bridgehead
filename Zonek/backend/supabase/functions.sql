-- ============================================================
-- ZONEK — POSTGIS RPC FUNCTIONS
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Get nearby demand posts within a radius
CREATE OR REPLACE FUNCTION get_nearby_demand_posts(
  p_lat      DOUBLE PRECISION,
  p_lng      DOUBLE PRECISION,
  p_radius_m INTEGER  -- radius in metres
)
RETURNS TABLE (
  id                    UUID,
  title                 TEXT,
  category              TEXT,
  description           TEXT,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  zip                   TEXT,
  latitude              DOUBLE PRECISION,
  longitude             DOUBLE PRECISION,
  images                TEXT[],
  upvotes               INTEGER,
  phone                 TEXT,
  email                 TEXT,
  collaboration_open    BOOLEAN,
  status                TEXT,
  created_by            UUID,
  hashtags              TEXT[],
  urgency_score         INTEGER,
  distance_radius_miles NUMERIC,
  demographics          TEXT[],
  created_at            TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ,
  distance_m            DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.category,
    d.description,
    d.address,
    d.city,
    d.state,
    d.zip,
    ST_Y(d.location::geometry)                          AS latitude,
    ST_X(d.location::geometry)                          AS longitude,
    d.images,
    d.upvotes,
    d.phone,
    d.email,
    d.collaboration_open,
    d.status,
    d.created_by,
    d.hashtags,
    d.urgency_score,
    d.distance_radius_miles,
    d.demographics,
    d.created_at,
    d.updated_at,
    ST_Distance(d.location, ST_MakePoint(p_lng, p_lat)::geography) AS distance_m
  FROM demand_posts d
  WHERE d.location IS NOT NULL
    AND ST_DWithin(d.location, ST_MakePoint(p_lng, p_lat)::geography, p_radius_m)
    AND d.status = 'active'
  ORDER BY distance_m ASC;
END;
$$ LANGUAGE plpgsql;

-- Get nearby rental posts within a radius
CREATE OR REPLACE FUNCTION get_nearby_rental_posts(
  p_lat      DOUBLE PRECISION,
  p_lng      DOUBLE PRECISION,
  p_radius_m INTEGER
)
RETURNS TABLE (
  id                    UUID,
  title                 TEXT,
  category              TEXT,
  description           TEXT,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  zip                   TEXT,
  latitude              DOUBLE PRECISION,
  longitude             DOUBLE PRECISION,
  images                TEXT[],
  price                 NUMERIC,
  price_per_sqft_yearly NUMERIC,
  square_feet           NUMERIC,
  lease_type            TEXT,
  amenities             TEXT[],
  zoning_code           TEXT,
  phone                 TEXT,
  email                 TEXT,
  collaboration_open    BOOLEAN,
  status                TEXT,
  created_by            UUID,
  hashtags              TEXT[],
  upvotes               INTEGER,
  created_at            TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ,
  distance_m            DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.category,
    r.description,
    r.address,
    r.city,
    r.state,
    r.zip,
    ST_Y(r.location::geometry)                          AS latitude,
    ST_X(r.location::geometry)                          AS longitude,
    r.images,
    r.price,
    r.price_per_sqft_yearly,
    r.square_feet,
    r.lease_type,
    r.amenities,
    r.zoning_code,
    r.phone,
    r.email,
    r.collaboration_open,
    r.status,
    r.created_by,
    r.hashtags,
    r.upvotes,
    r.created_at,
    r.updated_at,
    ST_Distance(r.location, ST_MakePoint(p_lng, p_lat)::geography) AS distance_m
  FROM rental_posts r
  WHERE r.location IS NOT NULL
    AND ST_DWithin(r.location, ST_MakePoint(p_lng, p_lat)::geography, p_radius_m)
    AND r.status = 'available'
  ORDER BY distance_m ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ATOMIC UPVOTE COUNTERS (prevents race conditions)
-- ============================================================

CREATE OR REPLACE FUNCTION increment_demand_upvotes(post_id UUID)
RETURNS VOID AS $$
  UPDATE demand_posts SET upvotes = upvotes + 1 WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_demand_upvotes(post_id UUID)
RETURNS VOID AS $$
  UPDATE demand_posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION increment_rental_upvotes(post_id UUID)
RETURNS VOID AS $$
  UPDATE rental_posts SET upvotes = upvotes + 1 WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_rental_upvotes(post_id UUID)
RETURNS VOID AS $$
  UPDATE rental_posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = post_id;
$$ LANGUAGE SQL;

-- Community post atomic counters
CREATE OR REPLACE FUNCTION increment_community_likes(post_id UUID)
RETURNS VOID AS $$
  UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement_community_likes(post_id UUID)
RETURNS VOID AS $$
  UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = post_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION increment_community_replies(post_id UUID)
RETURNS VOID AS $$
  UPDATE community_posts SET replies_count = replies_count + 1 WHERE id = post_id;
$$ LANGUAGE SQL;

-- Mark all messages in a conversation as read by a user (atomic array union)
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
  UPDATE messages
  SET read_by = array(SELECT DISTINCT unnest(array_append(read_by, p_user_id)))
  WHERE conversation_id = p_conversation_id
    AND NOT (p_user_id = ANY(read_by));
$$ LANGUAGE SQL;
