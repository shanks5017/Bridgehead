-- ============================================================
-- ZONEK (BRIDGEHEAD) — SUPABASE SCHEMA
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                TEXT NOT NULL DEFAULT '',
  username                 TEXT NOT NULL UNIQUE,
  user_type                TEXT NOT NULL DEFAULT 'community' CHECK (user_type IN ('entrepreneur', 'community')),
  company_name             TEXT NOT NULL DEFAULT '',
  role                     TEXT NOT NULL DEFAULT '',
  bio                      TEXT NOT NULL DEFAULT '',
  profile_picture_url      TEXT NOT NULL DEFAULT '',
  original_picture_url     TEXT NOT NULL DEFAULT '',
  reputation_score         INTEGER NOT NULL DEFAULT 100,
  deals_completed          INTEGER NOT NULL DEFAULT 0,
  is_verified_entrepreneur BOOLEAN NOT NULL DEFAULT FALSE,
  auth_provider            TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'microsoft')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEMAND POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS demand_posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  category              TEXT NOT NULL,
  description           TEXT NOT NULL,
  location              GEOGRAPHY(POINT, 4326),
  address               TEXT NOT NULL DEFAULT '',
  city                  TEXT,
  state                 TEXT,
  zip                   TEXT,
  images                TEXT[] NOT NULL DEFAULT '{}',
  upvotes               INTEGER NOT NULL DEFAULT 0,
  phone                 TEXT,
  email                 TEXT,
  collaboration_open    BOOLEAN NOT NULL DEFAULT TRUE,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired')),
  created_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hashtags              TEXT[] NOT NULL DEFAULT '{}',
  urgency_score         INTEGER,
  distance_radius_miles NUMERIC,
  demographics          TEXT[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RENTAL POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS rental_posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  category              TEXT NOT NULL,
  description           TEXT NOT NULL,
  location              GEOGRAPHY(POINT, 4326),
  address               TEXT NOT NULL DEFAULT '',
  city                  TEXT,
  state                 TEXT,
  zip                   TEXT,
  images                TEXT[] NOT NULL DEFAULT '{}',
  price                 NUMERIC NOT NULL DEFAULT 0,
  price_per_sqft_yearly NUMERIC,
  square_feet           NUMERIC NOT NULL DEFAULT 0,
  lease_type            TEXT,
  amenities             TEXT[] NOT NULL DEFAULT '{}',
  zoning_code           TEXT,
  phone                 TEXT,
  email                 TEXT,
  collaboration_open    BOOLEAN NOT NULL DEFAULT TRUE,
  status                TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'expired')),
  created_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hashtags              TEXT[] NOT NULL DEFAULT '{}',
  upvotes               INTEGER NOT NULL DEFAULT 0,
  
  -- Extra scraped fields
  source_platform       TEXT,
  listing_url           TEXT UNIQUE,
  locality              TEXT,
  rent_per_sqft         NUMERIC,
  floor                 TEXT,
  listing_date          TIMESTAMPTZ,
  is_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  furnishing_status     TEXT,
  facing                TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPVOTES (normalized junction tables)
-- ============================================================
CREATE TABLE IF NOT EXISTS demand_upvotes (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  demand_post_id UUID NOT NULL REFERENCES demand_posts(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, demand_post_id)
);

CREATE TABLE IF NOT EXISTS rental_upvotes (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rental_post_id UUID NOT NULL REFERENCES rental_posts(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, rental_post_id)
);

-- ============================================================
-- DEMAND COMMENTS (was embedded array in MongoDB)
-- ============================================================
CREATE TABLE IF NOT EXISTS demand_comments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_post_id UUID NOT NULL REFERENCES demand_posts(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RENTAL COMMENTS (was embedded array in MongoDB)
-- ============================================================
CREATE TABLE IF NOT EXISTS rental_comments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_post_id UUID NOT NULL REFERENCES rental_posts(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name    TEXT NOT NULL,
  author_username TEXT,
  author_avatar  TEXT,
  author_badge   TEXT CHECK (author_badge IN ('entrepreneur', 'investor', 'expert')),
  content        TEXT NOT NULL CHECK (char_length(content) <= 1000),
  topic          TEXT NOT NULL DEFAULT 'general',
  hashtags       TEXT[] NOT NULL DEFAULT '{}',
  likes_count    INTEGER NOT NULL DEFAULT 0,
  replies_count  INTEGER NOT NULL DEFAULT 0,
  reposts_count  INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS community_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name  TEXT NOT NULL,
  author_avatar TEXT,
  content      TEXT NOT NULL CHECK (char_length(content) <= 500),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY INTERACTIONS (likes / reposts)
-- ============================================================
CREATE TABLE IF NOT EXISTS community_interactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('like', 'repost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, type)
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  post_id         UUID,              -- nullable; could be demand or rental id
  last_message    JSONB,             -- { text, sender_id, timestamp, read }
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  role_context    JSONB,             -- { owner_id, seeker_id }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text            TEXT,
  media           JSONB,             -- [{ type, url }]
  read_by         UUID[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Demand posts
CREATE INDEX IF NOT EXISTS idx_demand_posts_location   ON demand_posts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_demand_posts_created_at ON demand_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demand_posts_status     ON demand_posts (status);
CREATE INDEX IF NOT EXISTS idx_demand_posts_created_by ON demand_posts (created_by);
CREATE INDEX IF NOT EXISTS idx_demand_posts_hashtags   ON demand_posts USING GIN (hashtags);

-- Rental posts
CREATE INDEX IF NOT EXISTS idx_rental_posts_location   ON rental_posts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_rental_posts_created_at ON rental_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rental_posts_status     ON rental_posts (status);
CREATE INDEX IF NOT EXISTS idx_rental_posts_created_by ON rental_posts (created_by);
CREATE INDEX IF NOT EXISTS idx_rental_posts_hashtags   ON rental_posts USING GIN (hashtags);

-- Comments
CREATE INDEX IF NOT EXISTS idx_demand_comments_post  ON demand_comments (demand_post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_rental_comments_post  ON rental_comments (rental_post_id, created_at ASC);

-- Community
CREATE INDEX IF NOT EXISTS idx_community_posts_topic  ON community_posts (topic, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_time   ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags   ON community_posts USING GIN (hashtags);
CREATE INDEX IF NOT EXISTS idx_community_comments     ON community_comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_community_interactions ON community_interactions (post_id, user_id);

-- Conversations & Messages
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_updated      ON conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation      ON messages (conversation_id, created_at ASC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_demand_posts
  BEFORE UPDATE ON demand_posts FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_rental_posts
  BEFORE UPDATE ON rental_posts FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_demand_comments
  BEFORE UPDATE ON demand_comments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_rental_comments
  BEFORE UPDATE ON rental_comments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_community_posts
  BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_community_comments
  BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_messages
  BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, username, user_type, auth_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'community'),
    COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_upvotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_upvotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Demand posts
DROP POLICY IF EXISTS "demand_posts_select_all" ON demand_posts;
CREATE POLICY "demand_posts_select_all"     ON demand_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "demand_posts_insert_auth" ON demand_posts;
CREATE POLICY "demand_posts_insert_auth"    ON demand_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "demand_posts_update_owner" ON demand_posts;
CREATE POLICY "demand_posts_update_owner"   ON demand_posts FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "demand_posts_delete_owner" ON demand_posts;
CREATE POLICY "demand_posts_delete_owner"   ON demand_posts FOR DELETE USING (auth.uid() = created_by);

-- Rental posts
DROP POLICY IF EXISTS "rental_posts_select_all" ON rental_posts;
CREATE POLICY "rental_posts_select_all"     ON rental_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "rental_posts_insert_auth" ON rental_posts;
CREATE POLICY "rental_posts_insert_auth"    ON rental_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "rental_posts_update_owner" ON rental_posts;
CREATE POLICY "rental_posts_update_owner"   ON rental_posts FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "rental_posts_delete_owner" ON rental_posts;
CREATE POLICY "rental_posts_delete_owner"   ON rental_posts FOR DELETE USING (auth.uid() = created_by);

-- Upvotes
DROP POLICY IF EXISTS "demand_upvotes_select" ON demand_upvotes;
CREATE POLICY "demand_upvotes_select"  ON demand_upvotes FOR SELECT USING (true);
DROP POLICY IF EXISTS "demand_upvotes_manage" ON demand_upvotes;
CREATE POLICY "demand_upvotes_manage"  ON demand_upvotes FOR ALL  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rental_upvotes_select" ON rental_upvotes;
CREATE POLICY "rental_upvotes_select"  ON rental_upvotes FOR SELECT USING (true);
DROP POLICY IF EXISTS "rental_upvotes_manage" ON rental_upvotes;
CREATE POLICY "rental_upvotes_manage"  ON rental_upvotes FOR ALL  USING (auth.uid() = user_id);

-- Comments
DROP POLICY IF EXISTS "demand_comments_select" ON demand_comments;
CREATE POLICY "demand_comments_select"  ON demand_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "demand_comments_insert" ON demand_comments;
CREATE POLICY "demand_comments_insert"  ON demand_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "rental_comments_select" ON rental_comments;
CREATE POLICY "rental_comments_select"  ON rental_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "rental_comments_insert" ON rental_comments;
CREATE POLICY "rental_comments_insert"  ON rental_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Community posts
DROP POLICY IF EXISTS "community_posts_select" ON community_posts;
CREATE POLICY "community_posts_select"  ON community_posts FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "community_posts_insert" ON community_posts;
CREATE POLICY "community_posts_insert"  ON community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "community_posts_update" ON community_posts;
CREATE POLICY "community_posts_update"  ON community_posts FOR UPDATE USING (auth.uid() = author_id);

-- Community comments
DROP POLICY IF EXISTS "community_comments_select" ON community_comments;
CREATE POLICY "community_comments_select"  ON community_comments FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "community_comments_insert" ON community_comments;
CREATE POLICY "community_comments_insert"  ON community_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Community interactions
DROP POLICY IF EXISTS "interactions_select" ON community_interactions;
CREATE POLICY "interactions_select"  ON community_interactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "interactions_manage" ON community_interactions;
CREATE POLICY "interactions_manage"  ON community_interactions FOR ALL  USING (auth.uid() = user_id);

-- Conversations
DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select"  ON conversations FOR SELECT
  USING (auth.uid() = ANY(participant_ids));
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert"  ON conversations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update"  ON conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids));

-- Messages
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select"  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id AND auth.uid() = ANY(participant_ids)
  ));
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert"  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id AND auth.uid() = ANY(participant_ids)
    )
  );
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update"  ON messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id AND auth.uid() = ANY(participant_ids)
  ));
