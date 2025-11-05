-- Migration: Add conversation context system for AI contextual memory
-- Created: October 24, 2025
-- Purpose: Enable progressive conversation memory for better AI interactions

-- Conversation sessions table for storing AI conversation context
CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  project_profile JSONB DEFAULT '{}',
  question_history JSONB[] DEFAULT ARRAY[]::JSONB[],
  message_history JSONB[] DEFAULT ARRAY[]::JSONB[],
  current_phase TEXT DEFAULT 'discovery' CHECK (current_phase IN ('discovery', 'estimation', 'refinement', 'quoting')),
  completeness_score INTEGER DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_session_id ON conversation_sessions(session_id);
CREATE INDEX idx_conversation_sessions_updated_at ON conversation_sessions(updated_at);
CREATE INDEX idx_conversation_sessions_current_phase ON conversation_sessions(current_phase);

-- RLS (Row Level Security) policies
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own conversation sessions
CREATE POLICY "Users can access own conversation sessions" ON conversation_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role (Edge Functions) can access all sessions for AI processing
CREATE POLICY "Service role can access all sessions" ON conversation_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before any UPDATE
CREATE TRIGGER conversation_sessions_updated_at_trigger
  BEFORE UPDATE ON conversation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_conversation_sessions_updated_at();

-- Function to calculate project completeness score based on project_profile
CREATE OR REPLACE FUNCTION calculate_project_completeness(profile JSONB)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  max_score INTEGER := 8; -- Total possible points from information assessment
BEGIN
  -- Project type clarity (0-2 points)
  IF profile ? 'projectType' AND profile->>'projectType' != '' THEN
    IF profile ? 'specificType' THEN
      score := score + 2;
    ELSE
      score := score + 1;
    END IF;
  END IF;
  
  -- Size and scope (0-2 points)
  IF profile ? 'size' AND profile->>'size' != '' THEN
    IF profile ? 'dimensions' OR profile ? 'measurements' THEN
      score := score + 2;
    ELSE
      score := score + 1;
    END IF;
  END IF;
  
  -- Quality requirements (0-2 points)
  IF profile ? 'quality' AND profile->>'quality' != '' THEN
    IF profile ? 'finishLevel' OR profile ? 'brands' THEN
      score := score + 2;
    ELSE
      score := score + 1;
    END IF;
  END IF;
  
  -- Project constraints (0-2 points)
  IF profile ? 'budget' OR profile ? 'timeline' OR profile ? 'constraints' THEN
    IF (profile ? 'budget' AND profile ? 'timeline') OR profile ? 'constraints' THEN
      score := score + 2;
    ELSE
      score := score + 1;
    END IF;
  END IF;
  
  -- Convert to percentage
  RETURN ROUND((score::FLOAT / max_score::FLOAT) * 100);
END;
$$ LANGUAGE plpgsql;

-- Function to upsert conversation session (create or update)
CREATE OR REPLACE FUNCTION upsert_conversation_session(
  p_session_id TEXT,
  p_user_id UUID,
  p_project_profile JSONB DEFAULT NULL,
  p_question_history JSONB[] DEFAULT NULL,
  p_message_history JSONB[] DEFAULT NULL,
  p_current_phase TEXT DEFAULT NULL
)
RETURNS conversation_sessions AS $$
DECLARE
  result conversation_sessions;
  new_completeness INTEGER;
BEGIN
  -- Calculate completeness if project_profile is provided
  IF p_project_profile IS NOT NULL THEN
    new_completeness := calculate_project_completeness(p_project_profile);
  END IF;
  
  -- Upsert the session
  INSERT INTO conversation_sessions (
    session_id, 
    user_id, 
    project_profile, 
    question_history, 
    message_history, 
    current_phase,
    completeness_score
  )
  VALUES (
    p_session_id, 
    p_user_id, 
    COALESCE(p_project_profile, '{}'), 
    COALESCE(p_question_history, ARRAY[]::JSONB[]), 
    COALESCE(p_message_history, ARRAY[]::JSONB[]), 
    COALESCE(p_current_phase, 'discovery'),
    COALESCE(new_completeness, 0)
  )
  ON CONFLICT (session_id) DO UPDATE SET
    project_profile = CASE 
      WHEN p_project_profile IS NOT NULL THEN p_project_profile 
      ELSE conversation_sessions.project_profile 
    END,
    question_history = CASE 
      WHEN p_question_history IS NOT NULL THEN p_question_history 
      ELSE conversation_sessions.question_history 
    END,
    message_history = CASE 
      WHEN p_message_history IS NOT NULL THEN p_message_history 
      ELSE conversation_sessions.message_history 
    END,
    current_phase = CASE 
      WHEN p_current_phase IS NOT NULL THEN p_current_phase 
      ELSE conversation_sessions.current_phase 
    END,
    completeness_score = CASE 
      WHEN new_completeness IS NOT NULL THEN new_completeness 
      ELSE conversation_sessions.completeness_score 
    END,
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON conversation_sessions TO authenticated;
GRANT ALL ON conversation_sessions TO service_role;
GRANT EXECUTE ON FUNCTION upsert_conversation_session TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_conversation_session TO service_role;
GRANT EXECUTE ON FUNCTION calculate_project_completeness TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_project_completeness TO service_role;

-- Add helpful comments
COMMENT ON TABLE conversation_sessions IS 'Stores AI conversation context for progressive memory and better user experience';
COMMENT ON COLUMN conversation_sessions.session_id IS 'Unique identifier for conversation session, generated by mobile app';
COMMENT ON COLUMN conversation_sessions.project_profile IS 'Accumulated project information in JSON format';
COMMENT ON COLUMN conversation_sessions.question_history IS 'Array of questions asked and answers received';
COMMENT ON COLUMN conversation_sessions.message_history IS 'Summarized conversation history for context';
COMMENT ON COLUMN conversation_sessions.current_phase IS 'Current stage of conversation: discovery, estimation, refinement, or quoting';
COMMENT ON COLUMN conversation_sessions.completeness_score IS 'Percentage (0-100) of project information gathered';