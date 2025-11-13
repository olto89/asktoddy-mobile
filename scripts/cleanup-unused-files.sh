#!/bin/bash

# Safe Cleanup Script - Removes unused AI files after middleware migration
# PROTECTS all pricing engine files

echo "🧹 Starting safe cleanup of unused AI files..."
echo "⚠️  This script protects all pricing engine files"

# Create archive directory for backup
ARCHIVE_DIR="./src/services/ai/_archive"
echo "📁 Creating archive directory: $ARCHIVE_DIR"
mkdir -p "$ARCHIVE_DIR"
mkdir -p "$ARCHIVE_DIR/providers"

# Archive client-side AI files (keeping copies just in case)
echo "📦 Archiving client-side AI files..."

if [ -f "src/services/ai/AIMiddleware.ts" ]; then
  cp "src/services/ai/AIMiddleware.ts" "$ARCHIVE_DIR/"
  echo "  ✅ Archived AIMiddleware.ts"
fi

if [ -f "src/services/ai/AIService.ts" ]; then
  cp "src/services/ai/AIService.ts" "$ARCHIVE_DIR/"
  echo "  ✅ Archived AIService.ts"
fi

if [ -f "src/services/ai/providers/GeminiProvider.ts" ]; then
  cp "src/services/ai/providers/GeminiProvider.ts" "$ARCHIVE_DIR/providers/"
  echo "  ✅ Archived GeminiProvider.ts"
fi

if [ -f "src/services/ai/providers/MockProvider.ts" ]; then
  cp "src/services/ai/providers/MockProvider.ts" "$ARCHIVE_DIR/providers/"
  echo "  ✅ Archived MockProvider.ts"
fi

# Now remove the unused files
echo ""
echo "🗑️  Removing unused files..."

# Remove client-side files
rm -f "src/services/ai/AIMiddleware.ts"
echo "  ❌ Removed AIMiddleware.ts"

rm -f "src/services/ai/AIService.ts"
echo "  ❌ Removed AIService.ts"

rm -f "src/services/ai/providers/GeminiProvider.ts"
echo "  ❌ Removed client-side GeminiProvider.ts"

rm -f "src/services/ai/providers/MockProvider.ts"
echo "  ❌ Removed MockProvider.ts"

# Remove Edge Function mock providers
rm -f "supabase/functions/analyze-construction/providers/mock.ts"
echo "  ❌ Removed Edge Function mock.ts"

rm -f "supabase/functions/analyze-construction/providers/resilient-provider.ts"
echo "  ❌ Removed resilient-provider.ts"

echo ""
echo "📝 Cleaning up index.ts exports..."

# Create cleaned index.ts
cat > "src/services/ai/index.ts" << 'EOF'
// AI Service Exports
// Using Edge Function AI Service - all processing server-side

export { AIService } from './AIServiceEdge';

export type {
  AIProvider,
  AnalysisRequest,
  ProjectAnalysis,
  QuoteBreakdown,
  MaterialItem,
  ToolRequirement,
  AIProviderConfig,
  AIMiddlewareConfig,
} from './types';

// Default export (Edge Function)
import { AIService } from './AIServiceEdge';
export default AIService;
EOF

echo "  ✅ Updated index.ts with clean exports"

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Archived 4 files to $ARCHIVE_DIR for reference"
echo "  - Removed 6 unused files"
echo "  - Cleaned up index.ts exports"
echo "  - Protected all pricing engine files"
echo ""
echo "💡 Next steps:"
echo "  1. Test the app to ensure everything still works"
echo "  2. Consider removing @google/generative-ai from package.json"
echo "  3. Commit these changes"
echo ""
echo "📦 Archived files are in: $ARCHIVE_DIR"
echo "   (You can safely delete this folder once confident)"