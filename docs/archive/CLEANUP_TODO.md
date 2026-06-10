# Codebase Cleanup TODO

## ⚠️ PROTECTED FILES - DO NOT DELETE

### Pricing Engine Files (KEEP ALL)

- ✅ ALL files in `/scripts/` starting with `scrape-`
- ✅ ALL files in `/scripts/` with `pricing` or `price` in name
- ✅ `/scripts/populate-sample-data.ts`
- ✅ `/scripts/test-quote-refinement.ts`
- ✅ ALL migrations in `/supabase/migrations/`
- ✅ `/supabase/functions/get-pricing/` - ENTIRE folder
- ✅ `/supabase/functions/analyze-construction/pricing/` - ENTIRE folder
- ✅ `/supabase/functions/generate-document/` - PDF generation

## 🧹 Files SAFE to Remove (Unused After Middleware Migration)

### Client-Side AI Files (No Longer Needed)

These files were replaced by Edge Function implementation:

#### ❌ Remove from `/src/services/ai/`:

- `AIMiddleware.ts` - Replaced by Edge Function middleware
- `AIService.ts` - Replaced by AIServiceEdge.ts
- `providers/GeminiProvider.ts` - Now in Edge Function
- `providers/MockProvider.ts` - Mock removed entirely

#### ✅ Keep in `/src/services/ai/`:

- `AIServiceEdge.ts` - Current thin client (KEEP)
- `types.ts` - Shared types (KEEP)
- `index.ts` - Needs cleanup but keep
- `ConstructionAIComparison.md` - Documentation (KEEP)

### Edge Function Cleanup

#### ❌ Remove from `/supabase/functions/analyze-construction/providers/`:

- `mock.ts` - Mock provider no longer used
- `resilient-provider.ts` - Unused wrapper
- `gemini.ts` - Complex version (IF we're sticking with gemini-simple)
- `openai.ts` - Not configured/used (unless you plan to add OpenAI)
- `anthropic.ts` - Not configured/used (unless you plan to add Anthropic)

#### ✅ Keep in providers:

- `gemini-simple.ts` - PRIMARY working provider
- `gemini-fallback.ts` - Fallback with alternative models
- `gemini.ts` - MAYBE keep for future enhanced features?

## 🔧 Code Cleanup Tasks

### 1. Clean up `/src/services/ai/index.ts`

```typescript
// REMOVE legacy exports:
export { AIService as AIServiceLocal } from './AIService';
export { AIMiddleware } from './AIMiddleware';
export { GeminiProvider } from './providers/GeminiProvider';
export { MockProvider } from './providers/MockProvider';
```

### 2. Remove Unused Dependencies

Check and remove from `package.json`:

- `@google/generative-ai` - Only needed in Edge Function now
- Any other AI provider SDKs if present

### 3. Clean Up Middleware Configuration

In `/supabase/functions/analyze-construction/middleware.ts`:

- Remove references to providers we're not using
- Simplify provider initialization

### 4. Remove Test Files

- Any test files for removed components
- Mock data files that are no longer referenced

## 📊 Impact Analysis

### Size Reduction Estimate:

- Client bundle: ~200KB+ reduction (AI SDKs removed)
- Cleaner codebase: ~1500 lines removed
- Simpler architecture: Fewer failure points

### Dependencies to Remove:

```json
{
  "@google/generative-ai": "^x.x.x" // Remove if only Edge Function uses it
  // Check for other unused AI SDKs
}
```

## ⚠️ Before Removing Files:

1. **Check imports**: Ensure no file imports the ones we're removing
2. **Test thoroughly**: Run the app after removal
3. **Backup first**: Commit current working state before cleanup
4. **Gradual removal**: Remove one category at a time and test

## 🎯 Cleanup Order:

1. **Phase 1: Client-side cleanup**
   - Remove unused AI providers from mobile app
   - Clean up index.ts exports
   - Remove unused dependencies

2. **Phase 2: Edge Function cleanup**
   - Remove mock provider
   - Remove unused provider implementations
   - Simplify middleware initialization

3. **Phase 3: Final cleanup**
   - Remove any orphaned test files
   - Update documentation
   - Final testing

## 💡 Alternative: Archive Instead of Delete

Consider moving unused files to an `_archive` folder instead of deleting:

```
/src/services/ai/_archive/
  - AIMiddleware.ts
  - AIService.ts
  - providers/
```

This preserves the code for reference while cleaning the active codebase.

## ✅ Files CONFIRMED Safe to Remove (No Impact on Pricing):

1. `/src/services/ai/providers/MockProvider.ts` - Mock provider, not used
2. `/supabase/functions/analyze-construction/providers/mock.ts` - Mock provider, not used
3. `/supabase/functions/analyze-construction/providers/resilient-provider.ts` - Unused wrapper
4. `/src/services/ai/AIMiddleware.ts` - Replaced by Edge Function (verified no imports)
5. `/src/services/ai/AIService.ts` - Replaced by AIServiceEdge (verified no imports)
6. `/src/services/ai/providers/GeminiProvider.ts` - Client-side, now in Edge Function

## 🤔 Files to KEEP for Now:

1. `/supabase/functions/analyze-construction/providers/gemini.ts` - Complex version with context features
2. `/supabase/functions/analyze-construction/providers/openai.ts` - Keep for future provider expansion
3. `/supabase/functions/analyze-construction/providers/anthropic.ts` - Keep for future provider expansion
4. ALL pricing-related files and folders

---

**Recommendation**: Start with Phase 1 client-side cleanup as it has the most impact on app size and complexity.
