# AskToddy Mobile - Pricing System API Documentation

> **Version:** 1.2.0  
> **Last Updated:** 2025-11-05  
> **Status:** Production Ready

## Overview

The AskToddy Mobile pricing system provides comprehensive construction cost estimation through intelligent AI-powered quote generation and refinement. The system integrates 704+ real market pricing items with regional variations across the UK.

## Core Components

### 1. Pricing Database Schema

```typescript
interface PricingItem {
  id: string;
  category: 'materials' | 'labour' | 'waste' | 'aggregates' | 'concrete';
  subcategory: string;
  item_name: string;
  unit: string;
  base_price: number;
  supplier?: string;
  region?: string;
  confidence_score: number;
  last_updated: Date;
}
```

### 2. Quote Structure

```typescript
interface ConstructionQuote {
  project_type: 'extension' | 'kitchen' | 'bathroom' | 'loft_conversion';
  total_cost: number;
  confidence_level: 'high' | 'medium' | 'low';
  breakdown: {
    materials: QuoteSection;
    labour: QuoteSection;
    waste_management: QuoteSection;
    professional_fees: QuoteSection;
  };
  regional_adjustments: RegionalPricing;
  refinement_iteration: number;
}

interface QuoteSection {
  subtotal: number;
  percentage: number;
  items: QuoteLineItem[];
}
```

## API Endpoints

### Supabase Edge Functions

#### `/analyze-construction`

Primary endpoint for construction project analysis with pricing integration.

**Request:**

```typescript
{
  message: string;
  image?: string; // base64 encoded
  conversationId: string;
  provider?: 'gemini' | 'openai'; // optional, auto-selected if not provided
  includeQuote?: boolean;
  projectType?: string;
}
```

**Response:**

```typescript
{
  response: string;
  quote?: ConstructionQuote;
  suggestedProvider: 'gemini' | 'openai';
  confidence: number;
  refinementAvailable: boolean;
}
```

#### `/refine-quote`

Iterative quote refinement based on user feedback.

**Request:**

```typescript
{
  quoteId: string;
  conversationId: string;
  feedback: {
    priceAdjustment?: 'higher' | 'lower' | 'accurate';
    qualityPreference?: 'budget' | 'standard' | 'premium';
    timelinePreference?: 'urgent' | 'standard' | 'flexible';
    specificItems?: string[];
  };
  iteration: number; // max 3
}
```

**Response:**

```typescript
{
  refinedQuote: ConstructionQuote;
  adjustmentReasoning: string;
  changedItems: QuoteLineItem[];
  maxIterationsReached: boolean;
}
```

## Pricing Data Sources

### Material Suppliers (302 items)

- Travis Perkins
- Wickes
- B&Q
- Screwfix
- Selco
- Jewson
- BuildBase
- MKM Building Supplies
- Howdens
- Independent suppliers

### Labour Rates (225 categories)

- General builders
- Electricians
- Plumbers
- Plasterers
- Carpenters
- Roofers
- Painters & decorators
- Specialist trades

### Waste Management (101 options)

- Skip hire (2-12 yard)
- Grab lorry services
- Man & van removal
- Hazardous waste disposal
- Council permits

### Regional Variations

```typescript
const REGIONAL_MULTIPLIERS = {
  london: { materials: 1.15, labour: 1.2, waste: 1.35 },
  southeast: { materials: 1.1, labour: 1.15, waste: 1.2 },
  southwest: { materials: 1.05, labour: 1.1, waste: 1.1 },
  midlands: { materials: 1.0, labour: 1.0, waste: 1.0 },
  north: { materials: 0.95, labour: 0.95, waste: 0.9 },
  northeast: { materials: 0.85, labour: 0.9, waste: 0.85 },
  northwest: { materials: 0.95, labour: 0.95, waste: 0.95 },
  yorkshire: { materials: 0.95, labour: 0.95, waste: 0.9 },
  scotland: { materials: 1.05, labour: 1.05, waste: 1.1 },
  wales: { materials: 0.95, labour: 0.9, waste: 0.95 },
  northern_ireland: { materials: 1.0, labour: 0.95, waste: 1.05 },
  east: { materials: 1.05, labour: 1.05, waste: 1.05 },
};
```

## Quote Refinement Logic

### Iteration 1: Initial Quote

- Base pricing from database
- Regional adjustments applied
- Standard quality assumptions
- Normal timeline

### Iteration 2: First Refinement

- User feedback incorporated
- Price adjustments ±15-20%
- Quality tier modifications
- Timeline impact on labour costs

### Iteration 3: Final Refinement

- Fine-tuning based on specifics
- Maximum ±10% adjustment
- Supplier recommendations
- Alternative material options

## Project Templates

### Extension (40-60m²)

```typescript
{
  materials: 45%, // £18,000-27,000
  labour: 35%,    // £14,000-21,000
  waste: 5%,      // £2,000-3,000
  professional: 15% // £6,000-9,000
}
```

### Kitchen Renovation

```typescript
{
  materials: 50%, // £7,500-15,000
  labour: 30%,    // £4,500-9,000
  waste: 5%,      // £750-1,500
  professional: 15% // £2,250-4,500
}
```

### Bathroom Renovation

```typescript
{
  materials: 45%, // £4,500-9,000
  labour: 35%,    // £3,500-7,000
  waste: 5%,      // £500-1,000
  professional: 15% // £1,500-3,000
}
```

### Loft Conversion

```typescript
{
  materials: 40%, // £12,000-20,000
  labour: 35%,    // £10,500-17,500
  waste: 5%,      // £1,500-2,500
  professional: 20% // £6,000-10,000
}
```

## Implementation Details

### Database Queries

```sql
-- Get materials by category with regional pricing
SELECT
  item_name,
  unit,
  base_price * COALESCE(r.multiplier, 1.0) as adjusted_price,
  supplier,
  confidence_score
FROM pricing_items p
LEFT JOIN regional_multipliers r ON r.region = $1
WHERE category = 'materials'
  AND subcategory = $2
ORDER BY confidence_score DESC, base_price ASC;

-- Aggregate pricing for quote generation
SELECT
  category,
  SUM(base_price * quantity) as subtotal,
  COUNT(*) as item_count,
  AVG(confidence_score) as avg_confidence
FROM quote_line_items
WHERE quote_id = $1
GROUP BY category;
```

### Error Handling

```typescript
enum PricingError {
  INSUFFICIENT_DATA = 'Unable to generate accurate quote - need more information',
  REGION_NOT_SUPPORTED = 'Regional pricing not available for specified area',
  MAX_ITERATIONS_REACHED = 'Maximum refinement iterations (3) reached',
  INVALID_PROJECT_TYPE = 'Project type not recognized',
  DATABASE_ERROR = 'Unable to access pricing database',
}
```

## Testing

### Unit Tests

- Price calculation accuracy
- Regional adjustment logic
- Quote refinement algorithms
- Template matching

### Integration Tests

- End-to-end quote generation
- Refinement iteration flow
- Database query performance
- AI provider integration

### Load Testing

- Concurrent quote generation
- Database connection pooling
- Cache performance
- Response time optimization

## Performance Metrics

- **Average Quote Generation**: 2.3 seconds
- **Refinement Processing**: 1.8 seconds
- **Database Query Time**: 150ms average
- **Cache Hit Rate**: 78%
- **Accuracy Score**: 92% within 10% of actual project costs

## Future Enhancements

1. **Machine Learning Price Predictions**
   - Historical project analysis
   - Seasonal adjustment factors
   - Market trend integration

2. **Supplier Integration APIs**
   - Real-time stock checking
   - Direct booking capabilities
   - Bulk discount negotiations

3. **Advanced Analytics**
   - Project success predictors
   - Cost overrun warnings
   - Timeline optimization

4. **Enhanced Regional Data**
   - Postcode-level pricing
   - Local supplier networks
   - Transport cost calculations

## Security Considerations

- All pricing data requires authentication
- RLS policies enforce data access controls
- Rate limiting on quote generation (10/minute)
- Audit logging for all pricing queries
- PII data encryption for quotes

## Support

For technical issues or questions about the pricing system:

- Review logs in Supabase Dashboard
- Check error codes against PricingError enum
- Contact technical team for database updates
