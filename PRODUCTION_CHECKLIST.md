# AskToddy Mobile - Production Go-Live Checklist

## Status: STAGING PHASE

**Last Updated:** 2024-12-05
**Target Production Date:** TBD

---

## Pre-Production Requirements

### ✅ Completed in Staging

- [x] Edge functions deployed to staging
- [x] Cron jobs configured in staging
  - Daily pricing update (3 AM UTC)
  - Weekly cleanup (Sunday 4 AM UTC)
- [x] Database tables created
  - pricing_cache
  - scheduled_task_log
  - conversation_sessions
  - cache_access_log
  - cleanup_log

### 🔄 In Progress

- [ ] Verify cron jobs work after Cloudflare recovery
- [ ] Test full conversation flow with contextual memory
- [ ] Validate pricing calculations
- [ ] Complete TestFlight beta testing

---

## Production Infrastructure Setup

### 1. Supabase Production Project

- [ ] Reactivate production Supabase project
- [ ] Obtain production service role key
- [ ] Update production environment variables
- [ ] Configure production database

### 2. Database Migrations

- [ ] Run all migrations on production
- [ ] Verify RLS policies are in place
- [ ] Set up database backups
- [ ] Configure point-in-time recovery

### 3. Edge Functions Deployment

- [ ] Deploy all edge functions to production
  - [ ] analyze-construction
  - [ ] generate-document
  - [ ] get-pricing
  - [ ] scheduled-tasks
- [ ] Verify functions are accessible
- [ ] Test with production API keys

### 4. Cron Jobs Configuration

- [ ] Enable pg_cron and pg_net extensions
- [ ] Configure daily pricing update job (3 AM UTC)
- [ ] Configure weekly cleanup job (Sunday 4 AM UTC)
- [ ] Test both jobs manually
- [ ] Verify job execution logs

### 5. API Keys & Environment Variables

- [ ] Update production API keys in environment
  - [ ] Gemini API key
  - [ ] OpenAI API key (if using)
  - [ ] Supabase keys
- [ ] Configure CORS settings
- [ ] Set rate limiting rules

---

## Application Configuration

### 6. Mobile App Settings

- [ ] Update app.config.js for production
- [ ] Configure production Supabase URL
- [ ] Set production environment flags
- [ ] Update EAS build configuration

### 7. Security & Monitoring

- [ ] Enable Sentry error tracking
- [ ] Configure performance monitoring
- [ ] Set up alert thresholds
- [ ] Test error reporting pipeline

### 8. Testing Requirements

- [ ] Full regression test on staging
- [ ] Load testing on staging
- [ ] Security audit
- [ ] Accessibility compliance check

---

## Deployment Process

### 9. Pre-Deployment

- [ ] Create production git tag
- [ ] Document rollback procedure
- [ ] Notify team of deployment window
- [ ] Backup staging data if needed

### 10. Production Build

```bash
# Commands for production deployment
npm run build:production
npm run deploy:production
eas build --profile production --platform ios
eas submit --profile production --platform ios
```

### 11. Post-Deployment

- [ ] Verify all services are running
- [ ] Check cron job schedules
- [ ] Monitor error rates
- [ ] Test critical user flows
- [ ] Update status page

---

## Rollback Plan

### If Issues Occur:

1. [ ] Document issue in incident log
2. [ ] Assess severity (P1/P2/P3)
3. [ ] If P1: Execute rollback
4. [ ] Notify stakeholders
5. [ ] Post-mortem within 24 hours

### Rollback Steps:

```bash
# Revert edge functions
npm run deploy:staging  # Use staging versions

# Revert app if needed
# Submit previous build to App Store
```

---

## Sign-off Requirements

### Technical Sign-off

- [ ] Engineering lead approval
- [ ] Security review completed
- [ ] Performance benchmarks met

### Business Sign-off

- [ ] Product owner approval
- [ ] Legal/compliance review
- [ ] Marketing prepared

---

## Monitoring Checklist (Post-Launch)

### First 24 Hours

- [ ] Monitor error rates every hour
- [ ] Check cron job execution (3 AM UTC)
- [ ] Review user feedback
- [ ] Database performance metrics
- [ ] API response times

### First Week

- [ ] Daily error report review
- [ ] Weekly cleanup job verification (Sunday)
- [ ] User adoption metrics
- [ ] Cost analysis (API usage)
- [ ] Performance optimization opportunities

---

## Notes & Blockers

### Current Blockers:

1. Production Supabase project suspended - needs reactivation
2. Cloudflare outage affecting edge function testing (2024-12-05)

### Decisions Needed:

1. Production launch date
2. Beta testing duration
3. Rollout strategy (phased vs full)

---

## Appendix: Production Cron Job SQL

```sql
-- To be executed in production once project is active

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Daily Pricing Update (3 AM UTC)
SELECT cron.schedule(
  'daily-pricing-update',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[PROD-PROJECT-REF].supabase.co/functions/v1/scheduled-tasks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [PROD-SERVICE-ROLE-KEY]'
    ),
    body := jsonb_build_object('task', 'daily-pricing')
  );
  $$
);

-- Weekly Cleanup (Sunday 4 AM UTC)
SELECT cron.schedule(
  'weekly-cleanup',
  '0 4 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://[PROD-PROJECT-REF].supabase.co/functions/v1/scheduled-tasks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [PROD-SERVICE-ROLE-KEY]'
    ),
    body := jsonb_build_object('task', 'weekly-cleanup')
  );
  $$
);
```

---

_This document is actively maintained. Update after each staging milestone._
