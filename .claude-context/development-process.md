# Development Process & Testing Requirements

## 🚨 CRITICAL: Verify Before Claiming "Fixed"

### Core Principles

1. **NEVER claim something is fixed without verification**
2. **ALWAYS trace the actual data flow, not assumed flow**
3. **TEST locally or verify logic before pushing builds**
4. **UNDERSTAND the root cause before implementing fixes**

---

## Required Process for All Fixes

### 1. Problem Analysis Phase

- [ ] Identify the ACTUAL problem in the code
- [ ] Trace the complete data flow from start to end
- [ ] Verify assumptions by reading the actual implementation
- [ ] Document what is currently happening vs what should happen

### 2. Solution Design Phase

- [ ] Design the fix based on actual code behavior
- [ ] Verify the fix addresses the root cause, not symptoms
- [ ] Check for side effects on other components
- [ ] Confirm data structures match between components

### 3. Implementation Phase

- [ ] Write the fix with clear understanding of impact
- [ ] Verify the code actually does what you intend
- [ ] Check that return types match expected types
- [ ] Ensure error handling is appropriate

### 4. Verification Phase

- [ ] Read the modified code to confirm changes are correct
- [ ] Trace through the logic mentally or with logs
- [ ] Verify data structures are consistent
- [ ] Check edge cases and error scenarios

### 5. Testing Phase

- [ ] Test the happy path
- [ ] Test error conditions
- [ ] Verify no regressions in existing functionality
- [ ] Confirm UI behaves as expected

### 6. Deployment Phase

- [ ] Only claim "fixed" after verification
- [ ] Document what was actually changed
- [ ] Explain how the fix addresses the root cause
- [ ] Provide evidence of testing/verification

---

## Common Pitfalls to Avoid

### ❌ Pattern Matching Without Understanding

**Wrong**: "Frontend parsing is bad" → "Move to backend"
**Right**: Check if backend actually returns structured data first

### ❌ Assuming Code Does What You Intend

**Wrong**: Write code and assume it works
**Right**: Verify the code execution path and return values

### ❌ Surface-Level Fixes

**Wrong**: Change UI code for data problems
**Right**: Fix data flow at the source

### ❌ Claiming Success Without Testing

**Wrong**: "All fixed! Pushing to TestFlight"
**Right**: "I've verified X returns Y, here's the evidence"

---

## Current Issues Requiring Fixes

### Issue 1: AI Response Appears "Mocked"

**Root Cause**: Edge function returns raw text, not structured JSON
**Current State**:

- Edge function calls Gemini and returns: `text || 'No response generated'`
- Frontend parseAIResponseToTasks uses templates when no structured data
  **Required Fix**:
- Edge function must parse Gemini text into ProjectAnalysis JSON structure
- Return consistent structured data regardless of AI provider

### Issue 2: New Site Assessment Doesn't Clear Form

**Root Cause**: Auto-save logic overrides the null existingQuote
**Current State**:

- Navigation passes `existingQuote: null`
- But auto-save fills form with last saved draft
  **Required Fix**:
- Check if explicitly starting new assessment
- Don't auto-load draft when isNewAssessment is true

### Issue 3: App Crashes on Edit Saved Quote

**Root Cause**: EditQuoteScreen expects `tasks` prop but doesn't receive it
**Current State**:

- Navigation passes `savedQuote` without `tasks` array
- EditQuoteScreen destructures undefined `tasks`
  **Required Fix**:
- Pass correct props including tasks array
- Or handle missing props gracefully in EditQuoteScreen

---

## Verification Checklist for Current Fixes

Before claiming these issues are fixed:

1. **For Edge Function Fix**:
   - [ ] Verify Gemini response is parsed into JSON
   - [ ] Check ProjectAnalysis structure is returned
   - [ ] Confirm frontend receives structured data
   - [ ] Test with actual API call, not assumptions

2. **For New Assessment Fix**:
   - [ ] Verify form is actually blank
   - [ ] Check auto-save doesn't override
   - [ ] Test navigation flow
   - [ ] Confirm draft isn't auto-loaded

3. **For Edit Quote Crash Fix**:
   - [ ] Verify all required props are passed
   - [ ] Check EditQuoteScreen handles props correctly
   - [ ] Test with different quote types (draft/generated)
   - [ ] Confirm no undefined destructuring

---

## Remember

**The goal is not to write code quickly, but to solve problems correctly.**

Always ask: "How do I know this actually works?" before claiming it's fixed.
