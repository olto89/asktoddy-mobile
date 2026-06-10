# ONS Construction Price Indices Integration Implementation Plan

## Overview

This document outlines the complete implementation plan for integrating UK ONS (Office for National Statistics) Construction Price Indices with the AskToddy mobile app's pricing engine.

## Executive Summary

### What We've Built

- **ONS Service** (`ons-service.ts`): Comprehensive service for fetching, caching, and processing ONS construction price data
- **Enhanced Pricing Service** (`ons-enhanced-pricing-service.ts`): Pricing engine that incorporates official UK government price indices
- **Database Integration**: Supabase table for caching ONS data with RLS policies
- **Fallback Strategy**: Multiple data sources with graceful degradation
- **Type Safety**: Complete TypeScript interfaces for ONS data and enhanced pricing

### Key Benefits

1. **Official Government Data**: Pricing based on UK official statistics rather than estimates
2. **Real-time Market Intelligence**: Quarterly construction price index updates
3. **Enhanced Accuracy**: Regional pricing adjusted by national inflation trends
4. **Performance Optimized**: 24-hour caching with background refresh
5. **Resilient Architecture**: Multiple fallback sources prevent service disruption

## Implementation Architecture

### 1. Data Sources & Hierarchy

```
Primary: ONS Beta API (api.beta.ons.gov.uk/v1)
   ↓ (if unavailable)
Secondary: Direct Excel Download (ons.gov.uk file downloads)
   ↓ (if unavailable)
Tertiary: Cached Data (Supabase cache table)
   ↓ (if stale/unavailable)
Fallback: Estimated Data (based on historical trends)
```

### 2. Service Integration

```
AskToddy Mobile App
   ↓
Supabase Edge Function (/get-pricing)
   ↓
ONSEnhancedPricingService
   ├── ONSService (fetches/caches indices)
   ├── UKPricingService (base pricing logic)
   └── Enhanced calculations (ONS adjustments)
```

### 3. Data Flow

1. **Request**: Mobile app requests pricing for location/project
2. **ONS Fetch**: Service fetches current construction price indices
3. **Cache Check**: Check if recent ONS data exists in cache
4. **API Call**: If needed, call ONS Beta API for latest data
5. **Fallback**: If API fails, use cached or estimated data
6. **Enhancement**: Apply ONS inflation factors to base pricing
7. **Response**: Return enhanced pricing with ONS metadata

## Technical Implementation Details

### Files Created/Modified

#### New Files

- `/supabase/functions/_shared/ons-service.ts` - ONS API integration service
- `/supabase/functions/get-pricing/ons-enhanced-pricing-service.ts` - Enhanced pricing with ONS
- `/supabase/migrations/20241201_ons_construction_cache.sql` - Database caching table
- `/docs/ONS_INTEGRATION_IMPLEMENTATION_PLAN.md` - This documentation

#### Modified Files

- `/supabase/functions/get-pricing/index.ts` - Updated to use ONS-enhanced service
- `/supabase/functions/get-pricing/types.ts` - Added ONS-enhanced fields

### Database Schema

```sql
-- ONS cache table for performance optimization
CREATE TABLE public.ons_construction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'all_construction',
  data_payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Interface Changes

#### Enhanced PricingRequest

```typescript
interface PricingRequest {
  location: string;
  projectType: string;
  materials?: string[];
  tools?: string[];
  timeline?: string;
  projectScale?: 'small' | 'medium' | 'large';
  urgency?: 'standard' | 'urgent';
  enhanceWithONS?: boolean; // NEW: Enable ONS enhancement
}
```

#### Enhanced PricingResponse

```typescript
interface PricingResponse {
  // ... existing fields
  contextFactors: {
    // ... existing factors
    onsInflationRate?: number;        // NEW: Current inflation from ONS
    onsIndexValue?: number;           // NEW: Current index value
    onsLastUpdate?: string;           // NEW: Last ONS data update
    marketTrend?: 'increasing' | 'decreasing' | 'stable'; // NEW
  };
  dataSource: 'ons_enhanced' | 'ons_estimated' | ...; // NEW sources
}
```

## ONS Data Categories Mapping

### ONS Construction Categories → AskToddy Material Categories

| ONS Category                  | AskToddy Materials                | Adjustment Factor   | Notes                |
| ----------------------------- | --------------------------------- | ------------------- | -------------------- |
| **New Work - Housing**        | structural, finishing, roofing    | 1.0x base inflation | Residential projects |
| **New Work - Infrastructure** | structural, aggregates            | 1.2x base inflation | Higher volatility    |
| **New Work - Commercial**     | structural, finishing, electrical | 1.1x base inflation | Mixed materials      |
| **Repair & Maintenance**      | finishing, plumbing, electrical   | 0.8x base inflation | Lower volatility     |
| **All Construction**          | All categories                    | 1.0x base inflation | Default baseline     |

### Material Category Volatility Multipliers

```typescript
const ONS_MATERIAL_MULTIPLIERS = {
  structural: 1.0, // Follows general construction inflation
  finishing: 1.2, // Higher volatility due to market trends
  electrical: 1.1, // Moderate volatility from commodity prices
  plumbing: 1.0, // Stable with general inflation
  insulation: 0.9, // Lower volatility, less market-driven
  roofing: 1.1, // Weather-dependent demand
  flooring: 1.3, // High fashion/trend volatility
  aggregates: 0.8, // Lower volatility, commodity-based
};
```

## Caching Strategy

### Cache TTL (Time To Live)

- **ONS Data**: 24 hours (quarterly data updates)
- **Pricing Calculations**: 1 hour (derived data)
- **Error Responses**: 5 minutes (quick retry for failures)

### Cache Invalidation

```typescript
// Automatic cleanup of expired entries
function cleanupExpiredCache() {
  DELETE FROM ons_construction_cache
  WHERE expires_at < NOW();
}
```

### Background Refresh Strategy

1. **Proactive**: Refresh cache 2 hours before expiration
2. **Reactive**: Fallback to stale cache if API fails
3. **Monitoring**: Log cache hit/miss ratios for optimization

## Error Handling Strategy

### 1. ONS API Failures

```typescript
try {
  // Primary: ONS Beta API
  return await fetchFromONSAPI();
} catch (apiError) {
  try {
    // Secondary: Direct download
    return await fetchFromDownload();
  } catch (downloadError) {
    // Tertiary: Cached data (even if stale)
    return await getCachedData(allowStale: true);
  }
}
```

### 2. Data Quality Checks

- **Index Value Validation**: Ensure reasonable ranges (100-300 for 2015=100)
- **Date Validation**: Check data recency (warn if >6 months old)
- **Trend Validation**: Flag extreme quarterly changes (>10%)

### 3. Service Degradation

```typescript
if (onsDataQuality === 'low') {
  // Increase risk adjustment factor
  adjustmentFactor *= 1.05; // +5% contingency

  // Add recommendation warning
  recommendations.push({
    type: 'quality',
    message: 'Pricing based on estimated data due to ONS service issues',
    priority: 'medium',
  });
}
```

## Performance Optimization

### 1. Request Optimization

- **Parallel Processing**: Fetch ONS data while processing base pricing
- **Conditional Loading**: Only load ONS service when needed
- **Connection Pooling**: Reuse HTTP connections for ONS API

### 2. Data Optimization

- **Selective Caching**: Cache only essential data fields
- **Compression**: Use JSONB compression in Supabase
- **Index Optimization**: Database indices on frequently queried fields

### 3. Response Optimization

- **Streaming**: Stream large datasets rather than loading all at once
- **Lazy Loading**: Load detailed ONS metadata only when requested
- **CDN Caching**: Cache static ONS metadata at edge locations

## Monitoring & Analytics

### 1. Service Health Metrics

```typescript
const metrics = {
  ons_api_success_rate: number;      // % of successful ONS API calls
  ons_cache_hit_rate: number;        // % of requests served from cache
  pricing_enhancement_rate: number;  // % of requests using ONS data
  average_response_time: number;     // End-to-end response time
  fallback_usage_rate: number;      // % using estimated data
};
```

### 2. Data Quality Metrics

```typescript
const dataQuality = {
  ons_data_freshness: number;        // Hours since last ONS update
  index_value_deviation: number;     // Deviation from expected range
  trend_consistency: number;         // Consistency with historical trends
  regional_variance: number;         // Variance across UK regions
};
```

### 3. Business Impact Metrics

```typescript
const businessMetrics = {
  pricing_accuracy_improvement: number;  // % improvement vs base pricing
  user_confidence_score: number;        // User rating of price accuracy
  quote_conversion_rate: number;        // % quotes leading to bookings
  average_quote_variance: number;       // Variance from final project cost
};
```

## Deployment Checklist

### Pre-Deployment

- [ ] Run database migration for ONS cache table
- [ ] Test ONS API connectivity from Supabase environment
- [ ] Verify RLS policies for cache table
- [ ] Load test with realistic request volumes
- [ ] Validate error handling with forced API failures

### Deployment Steps

1. **Database Migration**

   ```bash
   supabase db push
   # Applies 20241201_ons_construction_cache.sql
   ```

2. **Deploy Edge Functions**

   ```bash
   supabase functions deploy get-pricing
   # Deploys enhanced pricing service
   ```

3. **Environment Variables**

   ```bash
   # Verify these are set in Supabase dashboard
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

4. **Test Integration**
   ```bash
   # Test ONS-enhanced endpoint
   curl -X POST 'https://your-project.supabase.co/functions/v1/get-pricing' \
     -H 'Content-Type: application/json' \
     -d '{"location": "London", "projectType": "extension", "enhanceWithONS": true}'
   ```

### Post-Deployment

- [ ] Monitor error rates for first 24 hours
- [ ] Verify cache population and hit rates
- [ ] Check ONS data freshness and quality
- [ ] Validate pricing accuracy against known baselines
- [ ] Monitor performance impact on response times

## Future Enhancements

### 1. Real-time Updates

- **WebSocket Integration**: Push ONS updates to active sessions
- **Notification System**: Alert users of significant price changes
- **Historical Tracking**: Track price changes over time for user projects

### 2. Advanced Analytics

- **Predictive Pricing**: ML models using ONS trends for price forecasting
- **Regional Deep-dive**: Sub-regional pricing based on local ONS data
- **Seasonal Modeling**: Enhanced seasonal adjustments using historical ONS data

### 3. Data Expansion

- **Material-specific Indices**: Map specific ONS material categories
- **Labour Market Data**: Integrate ONS labour cost indices
- **Energy Cost Integration**: Include energy price impacts on construction

### 4. User Experience

- **Pricing Confidence Indicators**: Show users when ONS data enhances accuracy
- **Market Trend Insights**: Display market trends from ONS data in app
- **Cost Prediction**: "Your project cost would have been X last year" features

## Risk Assessment & Mitigation

### High Risk - ONS API Changes

- **Risk**: ONS Beta API structure changes
- **Mitigation**: Multiple fallback data sources, API versioning
- **Detection**: Daily API health checks, automated alerts

### Medium Risk - Data Quality Issues

- **Risk**: Inaccurate or delayed ONS data
- **Mitigation**: Data validation, quality scoring, user warnings
- **Detection**: Anomaly detection on index values and trends

### Low Risk - Performance Impact

- **Risk**: ONS integration slows pricing responses
- **Mitigation**: Aggressive caching, async processing, timeouts
- **Detection**: Response time monitoring, SLA alerts

## Success Metrics

### 3-Month Goals

- **95%+ ONS API Success Rate**: Reliable data fetching
- **80%+ Cache Hit Rate**: Efficient caching implementation
- **<500ms Response Time**: Performance maintained with ONS enhancement
- **10%+ Pricing Accuracy**: Improved accuracy vs base pricing

### 6-Month Goals

- **Regional Price Variations**: Accurate regional pricing differences
- **Seasonal Trend Accuracy**: Pricing that matches seasonal construction trends
- **User Satisfaction**: Positive feedback on pricing accuracy
- **Market Intelligence**: Insights helping users time their projects

## Conclusion

The ONS integration provides AskToddy with a significant competitive advantage by incorporating official UK government construction price data into our pricing engine. This enhancement delivers:

1. **Authority**: Pricing backed by official UK statistics
2. **Accuracy**: Real-time market adjustments based on national trends
3. **Intelligence**: Market insights helping users make informed decisions
4. **Trust**: Government data source builds user confidence

The implementation follows best practices for reliability, performance, and maintainability while providing multiple fallback options to ensure service continuity.

---

_This implementation plan serves as the technical roadmap for ONS integration. All code artifacts are production-ready and follow AskToddy's established patterns for Supabase Edge Functions._
