-- Migration: Add quotes table for Supabase-backed draft sync
-- Created: March 16, 2026
-- Purpose: Enable cloud persistence and cross-device sync for quote drafts

-- Quotes table — mirrors the client SiteNote shape
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,  -- client-generated (e.g. draft_123_abc)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Site note fields
  address TEXT NOT NULL DEFAULT '',
  job_type TEXT NOT NULL DEFAULT '',
  construction_method TEXT,
  construction_method_multiplier NUMERIC,
  property_type TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  tasks TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT NOT NULL DEFAULT '',
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  voice_notes TEXT NOT NULL DEFAULT '',
  voice_recordings JSONB DEFAULT '[]',

  -- Generated quote fields
  generated_tasks JSONB,
  total_cost JSONB,        -- { min, max }
  final_cost NUMERIC,
  ai_analysis JSONB,
  site_notes JSONB,        -- original site notes snapshot

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'completed')),
  pending_generation BOOLEAN DEFAULT false,

  -- Timestamps (lastModified/timestamp are ms-epoch to match frontend)
  timestamp BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  last_modified BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_user_last_modified ON quotes(user_id, last_modified DESC);
CREATE INDEX idx_quotes_status ON quotes(status);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can access their own quotes
CREATE POLICY "Users can access own quotes" ON quotes
  FOR ALL USING (auth.uid() = user_id);

-- Service role (Edge Functions) can access all quotes
CREATE POLICY "Service role can access all quotes" ON quotes
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-update updated_at trigger (same pattern as conversation_sessions)
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at_trigger
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_quotes_updated_at();

-- Permissions
GRANT ALL ON quotes TO authenticated;
GRANT ALL ON quotes TO service_role;

-- Comments
COMMENT ON TABLE quotes IS 'Stores construction quote drafts and generated quotes, synced from mobile app';
COMMENT ON COLUMN quotes.id IS 'Client-generated ID (e.g. draft_1710590400000_abc123)';
COMMENT ON COLUMN quotes.last_modified IS 'Millisecond unix timestamp, used for conflict resolution (last-write-wins)';
COMMENT ON COLUMN quotes.deleted_at IS 'Soft-delete timestamp; non-null means logically deleted';
