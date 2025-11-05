# AI Model Resilience Strategy for Production

## Handling Provider Model Deprecations

> **Problem**: Google frequently deprecates Gemini models (gemini-2.0-flash-exp → deprecated)
> **Impact**: Production outages when models are sunset without notice
> **Solution**: Multi-layered resilience strategy

---

## 🛡️ **1. Model Version Management**

### **Configuration-Driven Models**

Instead of hardcoding models, use environment variables:

```typescript
// Bad - Hardcoded
const model = 'gemini-1.5-flash';

// Good - Configurable
const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
```

### **Remote Configuration Service**

Use Supabase to store model configurations:

```sql
CREATE TABLE ai_model_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  deprecation_date TIMESTAMPTZ,
  fallback_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production models
INSERT INTO ai_model_config (provider, model_name, is_primary) VALUES
  ('gemini', 'gemini-1.5-flash', true),
  ('gemini', 'gemini-1.5-pro', false),
  ('openai', 'gpt-4-turbo-preview', false);
```

---

## 🔄 **2. Automatic Fallback Chain**

### **Implementation**

```typescript
class ResilientAIProvider {
  private modelChain = [
    { provider: 'gemini', model: 'gemini-1.5-flash' },
    { provider: 'gemini', model: 'gemini-1.5-pro' },
    { provider: 'gemini', model: 'gemini-pro' },
    { provider: 'openai', model: 'gpt-4-turbo-preview' },
    { provider: 'openai', model: 'gpt-3.5-turbo' },
  ];

  async executeWithFallback(prompt: string): Promise<any> {
    for (const config of this.modelChain) {
      try {
        return await this.callModel(config, prompt);
      } catch (error) {
        console.warn(`Model ${config.model} failed, trying next...`);
        this.reportModelFailure(config, error);
      }
    }
    throw new Error('All models failed');
  }

  private async callModel(config: any, prompt: string) {
    // Test if model is available first
    const isAvailable = await this.testModel(config);
    if (!isAvailable) {
      throw new Error(`Model ${config.model} not available`);
    }

    // Make actual API call
    return await this.makeAPICall(config, prompt);
  }
}
```

---

## 🏥 **3. Health Check System**

### **Proactive Model Testing**

```typescript
// Run every hour in production
class ModelHealthMonitor {
  async checkAllModels() {
    const results = [];

    for (const model of this.configuredModels) {
      const health = await this.testModel(model);
      results.push({
        model: model.name,
        status: health.status,
        latency: health.latency,
        timestamp: new Date(),
      });

      // Alert if primary model is degraded
      if (model.isPrimary && health.status !== 'healthy') {
        await this.sendAlert({
          severity: 'critical',
          message: `Primary model ${model.name} is ${health.status}`,
          action: 'Automatic fallback activated',
        });
      }
    }

    // Store health history
    await this.storeHealthMetrics(results);
  }

  async testModel(model: any) {
    try {
      const start = Date.now();
      const response = await model.generateContent('test');
      const latency = Date.now() - start;

      return {
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
      };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }
}
```

### **Supabase Edge Function Health Check**

```typescript
// supabase/functions/model-health/index.ts
Deno.serve(async req => {
  const models = [
    { provider: 'gemini', model: 'gemini-1.5-flash' },
    { provider: 'gemini', model: 'gemini-1.5-pro' },
    { provider: 'openai', model: 'gpt-4-turbo-preview' },
  ];

  const health = await Promise.all(
    models.map(async m => ({
      ...m,
      available: await testModel(m),
      timestamp: new Date(),
    }))
  );

  // Update database with current status
  await updateModelStatus(health);

  return new Response(JSON.stringify(health));
});
```

---

## 📊 **4. Monitoring & Alerts**

### **Metrics to Track**

```typescript
interface ModelMetrics {
  modelName: string;
  requestCount: number;
  successRate: number;
  averageLatency: number;
  errorRate: number;
  fallbackCount: number;
  lastError?: string;
  lastSuccess: Date;
}
```

### **Alert Triggers**

- Primary model failure rate > 10%
- Fallback usage > 25% of requests
- New model deprecation announced
- Latency degradation > 3x baseline
- Total AI system failure

### **Notification Channels**

```typescript
class AlertManager {
  async sendCriticalAlert(alert: Alert) {
    await Promise.all([
      this.sendEmail(alert),
      this.sendSlack(alert),
      this.sendPagerDuty(alert),
      this.logToSentry(alert),
    ]);
  }
}
```

---

## 🔄 **5. Zero-Downtime Model Migration**

### **Gradual Rollout Strategy**

```typescript
class ModelMigration {
  async migrateToNewModel(oldModel: string, newModel: string) {
    // Phase 1: Test new model with 1% of traffic
    await this.setTrafficSplit(newModel, 0.01);
    await this.monitor(1 * HOUR);

    // Phase 2: Increase to 10%
    if (await this.metricsHealthy()) {
      await this.setTrafficSplit(newModel, 0.1);
      await this.monitor(2 * HOURS);
    }

    // Phase 3: 50/50 split
    if (await this.metricsHealthy()) {
      await this.setTrafficSplit(newModel, 0.5);
      await this.monitor(6 * HOURS);
    }

    // Phase 4: Full migration
    if (await this.metricsHealthy()) {
      await this.setTrafficSplit(newModel, 1.0);
      await this.markOldModelDeprecated(oldModel);
    }
  }
}
```

---

## 📋 **6. Deprecation Response Playbook**

### **When Google Announces Deprecation**

1. **Immediate Actions** (Day 0)
   - Update fallback chain configuration
   - Test replacement model thoroughly
   - Update monitoring to track both models

2. **Migration Phase** (Days 1-7)
   - Deploy new model to staging
   - Run A/B tests in production
   - Monitor performance metrics

3. **Completion** (Day 7+)
   - Full production migration
   - Update documentation
   - Post-mortem if issues occurred

### **When Model Fails Without Warning**

1. **Automatic Response** (< 1 second)
   - Fallback chain activates
   - Alerts sent to team
   - Metrics logged

2. **Manual Response** (< 5 minutes)
   - Check provider status page
   - Verify API keys still valid
   - Update model configuration if needed

3. **Recovery** (< 1 hour)
   - Deploy configuration update
   - Clear any caches
   - Verify system stability

---

## 🚀 **7. Implementation Checklist**

### **Immediate (Before Production)**

- [ ] Move model names to environment variables
- [ ] Implement basic fallback to at least one alternative
- [ ] Add health check endpoint
- [ ] Set up basic alerting (email minimum)

### **Week 1 (Production Hardening)**

- [ ] Create model configuration table
- [ ] Implement full fallback chain
- [ ] Add comprehensive health monitoring
- [ ] Set up Slack/PagerDuty alerts

### **Month 1 (Full Resilience)**

- [ ] Implement traffic splitting
- [ ] Add automated model testing
- [ ] Create migration automation
- [ ] Document runbooks for team

---

## 💡 **Best Practices**

### **For MVP/Launch**

```typescript
// Minimum viable resilience
const AI_MODELS = {
  primary: process.env.AI_MODEL_PRIMARY || 'gemini-1.5-flash',
  fallback: process.env.AI_MODEL_FALLBACK || 'gpt-3.5-turbo',
};

async function callAI(prompt: string) {
  try {
    return await callGemini(AI_MODELS.primary, prompt);
  } catch (error) {
    console.error('Primary model failed, using fallback');
    return await callOpenAI(AI_MODELS.fallback, prompt);
  }
}
```

### **For Scale**

- Use feature flags for instant model switching
- Implement circuit breakers for failing models
- Cache successful responses for resilience
- Consider self-hosted models for critical paths

---

## 📊 **Cost Considerations**

### **Model Pricing Tiers**

```typescript
const MODEL_COSTS = {
  'gemini-1.5-flash': 0.00001, // Cheapest, good for most
  'gemini-1.5-pro': 0.0001, // 10x cost, better quality
  'gpt-3.5-turbo': 0.00002, // Reliable fallback
  'gpt-4-turbo': 0.001, // Premium fallback
};

// Smart routing based on request value
function selectModel(requestValue: number) {
  if (requestValue > 100) return 'gpt-4-turbo'; // High-value quotes
  if (requestValue > 10) return 'gemini-1.5-pro'; // Medium quotes
  return 'gemini-1.5-flash'; // Default
}
```

---

## 🎯 **Recommended Production Setup**

### **For AskToddy MVP**

1. **Primary**: Gemini 1.5 Flash (stable, cheap, fast)
2. **Fallback 1**: Gemini 1.5 Pro (same provider, better model)
3. **Fallback 2**: GPT-3.5 Turbo (different provider, reliable)
4. **Emergency**: Mock provider with cached responses

### **Configuration**

```env
# .env.production
GEMINI_MODEL_PRIMARY=gemini-1.5-flash
GEMINI_MODEL_FALLBACK=gemini-1.5-pro
OPENAI_MODEL_FALLBACK=gpt-3.5-turbo
MODEL_HEALTH_CHECK_INTERVAL=3600000  # 1 hour
MODEL_FALLBACK_ENABLED=true
```

### **Monitoring Dashboard**

```sql
-- Real-time model performance view
CREATE VIEW model_performance AS
SELECT
  model_name,
  COUNT(*) as requests_24h,
  AVG(latency_ms) as avg_latency,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as success_rate,
  MAX(timestamp) as last_used
FROM ai_requests
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY model_name;
```

---

## 🔐 **Security Notes**

- Never expose model names in client responses
- Rotate API keys regularly
- Use separate keys for each environment
- Monitor for unusual usage patterns
- Implement rate limiting per model

---

**Bottom Line**: Never rely on a single model in production. Always have at least one fallback ready, and ideally use remote configuration to switch models without deploying code.
