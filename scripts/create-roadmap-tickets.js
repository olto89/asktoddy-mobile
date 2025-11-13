/**
 * Create New Roadmap Tickets in Linear
 * Aligned with USP Enhancement Roadmap
 */

const TICKETS = [
  // EPIC 1: Comprehensive Pricing Engine
  {
    title: 'ASK-101: Build Pricing Enhancement Pipeline',
    description: `Build additive pricing enhancement pipeline that connects your existing 704+ pricing database to the AI middleware.

## Core Features
- [ ] Create PricingEnhancer class with graceful degradation
- [ ] Connect to existing get-pricing Edge Function
- [ ] Implement material price matching logic
- [ ] Add regional multipliers (London +35%, etc.)
- [ ] Test with existing scrapers data

## Technical Requirements
- Additive enhancement pattern (never breaks base analysis)
- Integration with existing pricing database
- Real-time market data from scrapers
- Regional variation support

## Implementation
\`\`\`typescript
class PricingEnhancer {
  async enhance(analysis: ProjectAnalysis): Promise<ProjectAnalysis> {
    try {
      const pricing = await this.fetchPricing(analysis.location);
      return this.applyMarketPricing(analysis, pricing);
    } catch (error) {
      console.warn('Pricing enhancement failed:', error);
      return analysis; // Never break base analysis
    }
  }
}
\`\`\`

## Success Criteria
- Base analysis always works
- Enhanced analysis shows real supplier prices
- Regional adjustments applied correctly
- <3s response time maintained

**Priority**: Urgent | **Estimate**: 8h`,
    priority: 1,
    estimate: 8,
  },

  {
    title: 'ASK-102: Advanced Material Classification',
    description: `Enhance AI to extract specific materials from user descriptions and match to your pricing database.

## Features
- [ ] Material extraction from natural language
- [ ] Smart categorization (structural/finishing/electrical)
- [ ] Price matching with alternatives
- [ ] Quality grade recommendations (budget/standard/premium)
- [ ] Supplier comparison integration

## Integration Points
- Use your BuyMaterials, PlumbBuild scraper data
- Connect to existing material categories
- Support 300+ materials from database
- Regional supplier preferences

## Implementation
\`\`\`typescript
interface MaterialClassifier {
  extractMaterials(description: string): ExtractedMaterial[];
  matchToPricing(materials: ExtractedMaterial[]): MaterialWithPricing[];
  suggestAlternatives(material: MaterialWithPricing): Alternative[];
}
\`\`\`

**Priority**: High | **Estimate**: 6h`,
    priority: 2,
    estimate: 6,
  },

  {
    title: 'ASK-103: Labour Rate Integration',
    description: `Connect AI analysis to your labour rate database with regional variations.

## Features
- [ ] Trade-specific rate application
- [ ] Regional multipliers by location
- [ ] Experience level adjustments (apprentice/qualified/master)
- [ ] Seasonal demand factors
- [ ] Project complexity adjustments

## Data Source
- Your existing labour rates database
- Regional variations already captured
- Trade association rate cards

## Implementation
\`\`\`typescript
interface LabourRateEngine {
  calculateLabourCost(trades: string[], region: string, complexity: string): LabourCost;
  applyRegionalMultipliers(baseCost: number, region: string): number;
  getTradeRates(trade: string): TradeRate;
}
\`\`\`

**Priority**: High | **Estimate**: 4h`,
    priority: 2,
    estimate: 4,
  },

  {
    title: 'ASK-104: Tool Hire Recommendations',
    description: `Integrate tool hire pricing and recommendations using your existing data.

## Features
- [ ] Tool requirement extraction from project description
- [ ] HSS Hire integration (from scrapers)
- [ ] Daily/weekly rate calculations
- [ ] Alternative tool suggestions
- [ ] Delivery cost integration
- [ ] Bulk hire optimizations

## Data Sources
- HSS Hire scraper data
- Local hire company rates
- Tool requirement mapping by project type

## Success Criteria
- Accurate tool recommendations
- Real pricing from hire companies
- Cost optimization suggestions
- Delivery logistics integration

**Priority**: Medium | **Estimate**: 4h`,
    priority: 3,
    estimate: 4,
  },

  {
    title: 'ASK-105: Waste & Aggregates Pricing',
    description: `Add waste disposal and aggregates pricing from your existing scrapers.

## Features
- [ ] Skip hire by region with permits
- [ ] Concrete delivery pricing
- [ ] Environmental disposal fees
- [ ] Bulk order optimizations
- [ ] Recycling cost savings

## Integration
- Connect to waste disposal scrapers
- Regional permit cost database
- Concrete supplier pricing
- Aggregates delivery zones

**Priority**: Medium | **Estimate**: 3h`,
    priority: 3,
    estimate: 3,
  },

  // EPIC 2: 3-Comment Quote Refinement
  {
    title: 'ASK-201: Comment Processing Engine',
    description: `Build intelligent comment processing that understands user refinement requests.

## Features
- [ ] Natural language processing for quote changes
- [ ] Smart categorization (cost/timeline/materials/scope)
- [ ] Adjustment calculation logic
- [ ] Question generation for clarification
- [ ] Intent recognition (cheaper/premium/faster/slower)

## Example Comments
- "Make it cheaper" → Budget alternatives + extended timeline
- "Premium kitchen" → Upgrade kitchen materials + specialist trades  
- "Perfect!" → Finalize quote

## Implementation
\`\`\`typescript
interface CommentProcessor {
  analyzeComment(comment: string): RefineIntent;
  generateAdjustments(intent: RefineIntent, quote: ProjectAnalysis): QuoteAdjustment[];
  createClarifyingQuestions(adjustments: QuoteAdjustment[]): string[];
}
\`\`\`

**Priority**: High | **Estimate**: 6h`,
    priority: 2,
    estimate: 6,
  },

  {
    title: 'ASK-202: Interactive Quote Adjustment',
    description: `Build UI for showing quote adjustments and asking clarifying questions.

## Features
- [ ] Before/after quote comparison
- [ ] Adjustment explanation with reasoning
- [ ] Interactive question prompts
- [ ] 3-comment progress tracking
- [ ] Visual diff highlighting

## UI Components
- QuoteComparison component
- AdjustmentExplanation
- ProgressIndicator (1/3 comments)
- ClarifyingQuestions

**Priority**: High | **Estimate**: 5h`,
    priority: 2,
    estimate: 5,
  },

  // EPIC 3: Advanced Document Analysis
  {
    title: 'ASK-301: Enhanced Image Analysis',
    description: `Upgrade Gemini provider to handle construction photos, floor plans, and technical drawings.

## Features
- [ ] Document type detection (photo/plan/technical)
- [ ] Measurement extraction from floor plans
- [ ] Material identification from photos
- [ ] Damage assessment capabilities
- [ ] Scale interpretation for technical drawings

## Document Types
1. **Construction Photos**: Material ID, damage assessment
2. **Floor Plans**: Measurements, room identification
3. **Technical Drawings**: Scale interpretation, compliance

**Priority**: High | **Estimate**: 6h`,
    priority: 3,
    estimate: 6,
  },

  // EPIC 4: Performance & Polish
  {
    title: 'ASK-401: Response Time Optimization',
    description: `Optimize middleware performance for <2s responses consistently.

## Features
- [ ] Prompt optimization for speed
- [ ] Caching for pricing data
- [ ] Concurrent processing where possible
- [ ] Response streaming for better UX
- [ ] Performance monitoring

## Target Performance
- Current: 3-5 seconds
- Target: <2 seconds consistently
- Fallback: <15 seconds with graceful degradation

**Priority**: High | **Estimate**: 3h`,
    priority: 2,
    estimate: 3,
  },

  {
    title: 'ASK-402: Input Clearing Bug Fix',
    description: `Fix text input clearing behavior in chat interface.

## Issues
- [ ] Text sometimes persists after sending
- [ ] Loading state management
- [ ] Error state handling
- [ ] Multiple rapid sends

## Implementation
- Reliable input clearing after send
- Proper state management
- Input validation and sanitization

**Priority**: Medium | **Estimate**: 2h`,
    priority: 3,
    estimate: 2,
  },
];

console.log('='.repeat(80));
console.log('🎫 LINEAR TICKETS TO CREATE');
console.log('='.repeat(80));

TICKETS.forEach((ticket, index) => {
  console.log(`\n${index + 1}. ${ticket.title}`);
  console.log(`   Priority: ${ticket.priority} | Estimate: ${ticket.estimate}h`);
  console.log(`   ${ticket.description.split('\n')[0]}`);
});

console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tickets: ${TICKETS.length}`);
console.log(`Total Estimate: ${TICKETS.reduce((sum, t) => sum + t.estimate, 0)} hours`);

const byPriority = TICKETS.reduce((acc, ticket) => {
  acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
  return acc;
}, {});

console.log('By Priority:');
Object.entries(byPriority).forEach(([priority, count]) => {
  const label = priority === '1' ? 'Urgent' : priority === '2' ? 'High' : 'Medium';
  console.log(`  ${label}: ${count} tickets`);
});

console.log('\n🚀 NEXT STEPS:');
console.log('1. Review ticket list above');
console.log('2. Create tickets in Linear');
console.log('3. Start with ASK-101 (Pricing Enhancement Pipeline)');
console.log('4. Build pricing engine foundation');

// Export for Linear API creation
module.exports = { TICKETS };
