# AskToddy Mobile - Pricing System Deployment Checklist

> **Version:** 1.2.0  
> **Deployment Date:** TBD  
> **Risk Level:** Medium - New feature with database changes

## Pre-Deployment Checklist

### 🔍 Code Review

- [ ] All pricing calculation functions reviewed
- [ ] TypeScript types match database schema
- [ ] Error handling for missing pricing data
- [ ] Regional adjustment logic verified
- [ ] Quote refinement iteration limits enforced (max 3)

### 🗄️ Database Preparation

- [ ] Run migration: `20251105_pricing_tables.sql`
- [ ] Verify 704+ pricing items loaded
- [ ] Check RLS policies on pricing tables
- [ ] Test database connection pooling
- [ ] Backup existing conversation_sessions table

### 🧪 Testing Requirements

- [ ] Unit tests passing (pricing calculations)
- [ ] Integration tests passing (quote generation)
- [ ] Regional variations tested for all 12 UK regions
- [ ] Quote refinement flow tested (3 iterations)
- [ ] Load testing completed (10 concurrent quotes)
- [ ] Edge cases handled (missing data, invalid regions)

### 📱 Mobile App Checks

- [ ] Build version updated to 1.2.0
- [ ] Environment variables configured for staging
- [ ] AI provider selection logic tested
- [ ] Quote display UI responsive on all screen sizes
- [ ] Refinement modal functions correctly

## Deployment Steps

### Stage 1: Staging Deployment

#### 1. Database Setup

```bash
# Connect to staging database
supabase db push --db-url $STAGING_DATABASE_URL

# Verify migrations
supabase db diff

# Load pricing data
npm run db:seed:pricing:staging
```

#### 2. Edge Functions

```bash
# Deploy updated edge functions
supabase functions deploy analyze-construction --project-ref $STAGING_PROJECT_REF
supabase functions deploy refine-quote --project-ref $STAGING_PROJECT_REF

# Test functions
npm run test:edge:staging
```

#### 3. Mobile Build

```bash
# Create staging build
eas build --profile staging --platform ios

# Submit to TestFlight
eas submit --profile staging --platform ios
```

#### 4. Staging Tests

- [ ] Generate quotes for all 4 project types
- [ ] Test refinement with various feedback combinations
- [ ] Verify regional pricing adjustments
- [ ] Check performance metrics (< 3s quote generation)
- [ ] Test error scenarios (network failure, invalid data)

### Stage 2: Production Deployment

#### 1. Production Database

```bash
# CRITICAL: Backup production database first
supabase db dump --project-ref $PROD_PROJECT_REF > backup_$(date +%Y%m%d).sql

# Apply migrations
supabase db push --db-url $PRODUCTION_DATABASE_URL

# Verify data integrity
npm run db:verify:pricing:production
```

#### 2. Production Edge Functions

```bash
# Deploy with production config
supabase functions deploy analyze-construction --project-ref $PROD_PROJECT_REF
supabase functions deploy refine-quote --project-ref $PROD_PROJECT_REF
```

#### 3. Production Build

```bash
# Create production build
eas build --profile production --platform ios

# Submit to App Store
eas submit --profile production --platform ios
```

## Monitoring Checklist

### 🚨 First 24 Hours

- [ ] Monitor error rates in Sentry
- [ ] Check Supabase function logs
- [ ] Review quote generation metrics
- [ ] Monitor database query performance
- [ ] Track user feedback on quotes
- [ ] Verify regional pricing accuracy

### 📊 Key Metrics to Track

- Quote generation time (target: < 3s)
- Refinement usage rate (expected: 30-40%)
- Error rate (target: < 1%)
- Database query time (target: < 200ms)
- Cache hit rate (target: > 75%)
- User satisfaction with quotes

## Rollback Plan

### If Critical Issues Occur:

1. **Immediate Actions**

   ```bash
   # Revert edge functions
   supabase functions deploy analyze-construction --version previous

   # Restore database if needed
   psql $DATABASE_URL < backup_YYYYMMDD.sql
   ```

2. **App Rollback**
   - Promote previous TestFlight build to production
   - Or submit expedited review for previous version

3. **Communication**
   - Notify users of temporary pricing unavailability
   - Update status page
   - Log incident in post-mortem document

## Post-Deployment Verification

### ✅ Success Criteria

- [ ] All 4 project templates generating accurate quotes
- [ ] Regional variations applying correctly
- [ ] Quote refinement completing within 3 iterations
- [ ] No increase in error rates
- [ ] Performance metrics within targets
- [ ] Positive user feedback on quote accuracy

### 📝 Documentation Updates

- [ ] Update README with version 1.2.0 features
- [ ] Update API documentation
- [ ] Add pricing system to user guide
- [ ] Update troubleshooting guide
- [ ] Record deployment notes

## Team Sign-offs

- [ ] Development Team Lead
- [ ] QA Lead
- [ ] Product Owner
- [ ] DevOps Engineer
- [ ] Customer Support briefed

## Notes

### Known Limitations

- Initial release covers 12 UK regions (postcodes coming in v1.3)
- Specialist trades may have limited pricing data
- Some materials require manual supplier verification

### Support Preparation

- Customer support team briefed on pricing features
- FAQ updated with common pricing questions
- Escalation path defined for pricing disputes

### Future Improvements (v1.3)

- Postcode-level pricing granularity
- Direct supplier API integrations
- Historical price trend analysis
- Seasonal adjustment factors

---

**Deployment Window:** Recommended Tuesday-Thursday, 10:00-14:00 GMT
**Rollback Decision Time:** Within 2 hours of deployment
**Success Metric Review:** 24 hours post-deployment
