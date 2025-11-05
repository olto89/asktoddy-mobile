# AI Contextual Memory System - Requirements Document

## Overview

Implement contextual memory to enable progressive, natural conversations where the AI remembers previous interactions and builds upon them to provide better construction advice.

## Current State

### Existing AI System (v1.0.4)

- ✅ **Information Assessment Scoring** (0-8 points system)
- ✅ **Three Response Modes**: Conversation (0-2), Estimation (3-5), Quote (6-8)
- ✅ **Professional Question Templates** for clarifying details
- ✅ **Regional Pricing Integration** with UK location data
- ✅ **Image Analysis** with Gemini vision capabilities

### Current Limitations

- ❌ **No conversation continuity** - each message is treated independently
- ❌ **Repeated questions** - AI asks same questions in subsequent messages
- ❌ **Lost context** - Previous answers not considered in new responses
- ❌ **No project building** - Can't build comprehensive project understanding over time

## Proposed Solution: Contextual Memory System

### Core Features

#### 1. Conversation History Storage

- **Session-based memory** - Remember entire conversation within a chat session
- **Project context accumulation** - Build comprehensive project understanding
- **Question tracking** - Never ask the same question twice
- **Answer persistence** - Remember all user-provided information

#### 2. Progressive Information Building

- **Project profile creation** - Automatically build detailed project specs
- **Context-aware responses** - Reference previous answers in new questions
- **Smart follow-ups** - Ask logical next questions based on gathered info
- **Assumption validation** - Confirm understanding before proceeding

#### 3. Enhanced Response Intelligence

- **Context-informed scoring** - Use conversation history in information assessment
- **Progressive detail gathering** - Systematically collect missing information
- **Relationship detection** - Understand connections between project elements
- **Conflict resolution** - Handle contradictory information gracefully

## Technical Architecture

### 1. Data Structures

#### Conversation Context

```typescript
interface ConversationContext {
  sessionId: string;
  userId?: string;
  createdAt: string;
  lastUpdated: string;
  projectProfile: ProjectProfile;
  questionHistory: QuestionHistory[];
  messageHistory: MessageSummary[];
  currentPhase: 'discovery' | 'estimation' | 'refinement' | 'quoting';
}

interface ProjectProfile {
  projectType: string;
  location: LocationInfo;
  scope: ProjectScope;
  requirements: ProjectRequirements;
  constraints: ProjectConstraints;
  preferences: UserPreferences;
  completeness: number; // 0-100% of info gathered
}

interface ProjectScope {
  rooms: string[];
  size: SizeInfo;
  timeline: TimelineInfo;
  budget: BudgetInfo;
  workType: ('renovation' | 'extension' | 'new_build' | 'repair')[];
}

interface QuestionHistory {
  question: string;
  answer?: string;
  askedAt: string;
  answeredAt?: string;
  category: 'type' | 'size' | 'scope' | 'quality' | 'constraints' | 'budget';
}
```

#### Enhanced Analysis Request

```typescript
interface EnhancedAnalysisRequest extends AnalysisRequest {
  conversationContext?: ConversationContext;
  sessionId: string;
}
```

### 2. Implementation Plan

#### Phase 1: Foundation Setup

1. **Add session management** to mobile app
2. **Create context storage** in Edge Function
3. **Update AI prompts** to use conversation history
4. **Implement context retrieval** in analysis flow

#### Phase 2: Memory Integration

1. **Enhance information assessment** with context awareness
2. **Update question generation** to avoid repeats
3. **Implement progressive detail building**
4. **Add context-aware response modes**

#### Phase 3: Intelligence Enhancement

1. **Add assumption validation**
2. **Implement conflict resolution**
3. **Create project completeness tracking**
4. **Add conversation phase management**

## User Experience Improvements

### Before (Current System)

```
User: "I want to renovate my kitchen"
AI: "I need more details about your kitchen renovation..."

[New conversation]
User: "What about flooring for the kitchen?"
AI: "I need more details about your kitchen renovation..." // Same questions again
```

### After (With Contextual Memory)

```
User: "I want to renovate my kitchen"
AI: "Great! What's the size of your kitchen and your main goals?"

User: "12 square meters, want modern look"
AI: "Perfect! For your 12sqm modern kitchen, what's your budget range?"

[Later in conversation]
User: "What about flooring for the kitchen?"
AI: "For your 12sqm modern kitchen renovation, here are flooring options that would work well with your project..."
```

## Technical Requirements

### Database Schema (Supabase)

```sql
-- Conversation sessions table
CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT UNIQUE NOT NULL,
  project_profile JSONB,
  question_history JSONB[],
  message_history JSONB[],
  current_phase TEXT DEFAULT 'discovery',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_session_id ON conversation_sessions(session_id);
CREATE INDEX idx_conversation_sessions_updated_at ON conversation_sessions(updated_at);
```

### Edge Function Changes

#### New Files to Create

- `supabase/functions/analyze-construction/context/ContextManager.ts` - Manage conversation context
- `supabase/functions/analyze-construction/context/ProjectProfileBuilder.ts` - Build project profiles
- `supabase/functions/analyze-construction/context/QuestionTracker.ts` - Track question history

#### Files to Modify

- `supabase/functions/analyze-construction/index.ts` - Add context handling
- `supabase/functions/analyze-construction/providers/gemini.ts` - Context-aware prompts
- `supabase/functions/analyze-construction/types.ts` - Add context interfaces

### Mobile App Changes

#### Files to Modify

- `src/screens/ChatScreen.tsx` - Add session management
- `src/services/ai/AIServiceEdge.ts` - Send context with requests

## Success Metrics

### Functional Metrics

- ✅ **Zero repeated questions** in same conversation
- ✅ **Progressive information building** - each response builds on previous
- ✅ **Context awareness** - AI references previous answers appropriately
- ✅ **Project completeness tracking** - Can measure how much info gathered

### User Experience Metrics

- ✅ **Natural conversation flow** - Feels like talking to human expert
- ✅ **Efficient information gathering** - Reaches quote faster
- ✅ **Reduced user frustration** - No repetitive questions
- ✅ **Better quote accuracy** - More complete project understanding

## Implementation Timeline

### Week 1: Foundation

- [ ] Create database schema for conversation storage
- [ ] Implement basic session management in mobile app
- [ ] Add context storage to Edge Function
- [ ] Update AI prompts for context awareness

### Week 2: Integration

- [ ] Implement context-aware information assessment
- [ ] Add question tracking and avoidance
- [ ] Create progressive detail building system
- [ ] Test basic contextual memory functionality

### Week 3: Enhancement

- [ ] Add assumption validation
- [ ] Implement conflict resolution
- [ ] Create project completeness tracking
- [ ] Add conversation phase management
- [ ] Comprehensive testing and refinement

## Risk Mitigation

### Technical Risks

- **Database performance** - Use indexes and efficient queries
- **Context size limits** - Implement context summarization for long conversations
- **Session management** - Handle app restarts and session persistence
- **Data consistency** - Use transactions for context updates

### User Experience Risks

- **Over-remembering** - Allow users to correct/update previous information
- **Privacy concerns** - Clear data retention policies
- **Session confusion** - Clear session boundaries and new conversation options

## Future Enhancements

After contextual memory is stable:

1. **Cross-session memory** - Remember user across different conversations
2. **Project templates** - Create reusable project patterns
3. **Learning system** - Improve questions based on successful conversations
4. **Multi-project tracking** - Handle multiple concurrent projects

---

**Document Version:** 1.0  
**Created:** October 24, 2025  
**Author:** Claude Code  
**Status:** Requirements Approved - Ready for Implementation
