# AskToddy Mobile - Architectural Guidelines

## 🚨 CRITICAL: Middleware-First Architecture

**ALL BUSINESS LOGIC MUST BE IN THE EDGE FUNCTION - NOT THE FRONTEND**

---

## Core Architectural Principles

### 1. **Edge Function = Single Source of Truth**

- ✅ **DO**: All AI processing, parsing, and structuring in edge function
- ✅ **DO**: Return fully structured `ProjectAnalysis` objects
- ❌ **DON'T**: Parse AI responses in frontend
- ❌ **DON'T**: Have business logic in React components

### 2. **Frontend = Presentation Layer Only**

- ✅ **DO**: Display structured data received from edge function
- ✅ **DO**: Handle user interactions and navigation
- ✅ **DO**: Simple error handling and loading states
- ❌ **DON'T**: Parse complex data structures
- ❌ **DON'T**: Make direct AI API calls
- ❌ **DON'T**: Implement fallback business logic

### 3. **Data Flow Architecture**

```
User Input → Frontend → Edge Function → AI Provider → Edge Function → Frontend → User
                ↑                        ↑                    ↓
            Simple Request         Parse & Structure    Structured Data
```

---

## Implementation Standards

### Edge Function Requirements

1. **Return Type**: Always return `ProjectAnalysis` interface
2. **Error Handling**: Return structured fallback data on errors (200 status)
3. **Parsing**: Convert raw AI text to structured objects server-side
4. **Business Logic**: All cost calculations, difficulty assessments, etc.

### Frontend Requirements

1. **Type Safety**: Use TypeScript interfaces for all API responses
2. **Simple Logic**: Only UI state management and display logic
3. **Error Boundaries**: Handle network errors, not business logic errors
4. **No Parsing**: Expect ready-to-display structured data

---

## File Structure Guidelines

### Edge Function (`/supabase/functions/analyze-construction/`)

```
index.ts                 // Main function with structured response
types.ts                 // Type definitions matching frontend
parsing/                 // AI response parsing utilities
templates/               // Fallback data generation
providers/               // AI provider integrations
```

### Frontend (`/src/`)

```
services/ai/
  ├── AIServiceEdge.ts    // Simple API client
  └── types.ts            // Shared type definitions
screens/
  └── TaskListScreen.tsx  // Display ProjectAnalysis data
```

---

## Development Workflow

### When Adding New Features:

1. **Define Types**: Update shared type definitions
2. **Edge Function**: Implement business logic server-side
3. **Frontend**: Update to display new structured data
4. **Deploy**: Edge function first, then frontend
5. **Test**: Verify data structure matches expectations

### When Debugging Issues:

1. **Check Edge Function**: Verify returned data structure
2. **Check Types**: Ensure interface alignment
3. **Check Frontend**: Verify data consumption logic
4. **Never**: Add business logic to frontend as "quick fix"

---

## Anti-Patterns to Avoid

### ❌ **Frontend Business Logic**

```typescript
// WRONG - parsing in frontend
const parseAIResponse = (text: string) => {
  const cost = text.match(/£(\d+)/)[1];
  return { cost: parseInt(cost) };
};
```

### ❌ **Multiple Data Sources**

```typescript
// WRONG - frontend choosing between AI and templates
const data = aiResponse?.data || fallbackTemplate;
```

### ❌ **Frontend AI Calls**

```typescript
// WRONG - direct AI integration in frontend
await openai.chat.completions.create({...});
```

---

## Correct Implementation Examples

### ✅ **Edge Function Structure**

```typescript
// Edge function returns complete ProjectAnalysis
return new Response(JSON.stringify({
  projectType: 'bathroom',
  costBreakdown: {
    materials: { items: [...], min: 1000, max: 2000 },
    labor: { min: 800, max: 1200, hourlyRate: 25 },
    total: { min: 1800, max: 3200 }
  },
  timeline: { phases: [...] },
  // ... complete structured data
}));
```

### ✅ **Frontend Consumption**

```typescript
// Frontend simply displays structured data
const response = await aiService.processChat(prompt);
setTasks(convertProjectAnalysisToTasks(response));
```

---

## Testing Standards

### Edge Function Tests

- ✅ Test structured data output format
- ✅ Test error handling returns valid fallback
- ✅ Test all ProjectAnalysis fields populated

### Frontend Tests

- ✅ Test UI renders structured data correctly
- ✅ Test error states display properly
- ✅ Test user interactions work

### Integration Tests

- ✅ Test complete data flow end-to-end
- ✅ Test type safety between frontend/backend

---

## Deployment Order

1. **Edge Function** - Deploy business logic first
2. **Frontend** - Update display logic second
3. **Test** - Verify complete integration
4. **Document** - Update architectural decisions

---

## Monitoring & Debugging

### Edge Function Logs

- Monitor structured data output
- Track parsing success rates
- Monitor AI provider health

### Frontend Logs

- Track data consumption patterns
- Monitor UI error rates
- Track user interaction flows

---

**Remember: The middleware/edge function is the brain, the frontend is just the face. Keep the brain smart and the face simple.**
