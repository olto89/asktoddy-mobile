/**
 * Resilient AI Provider with Automatic Fallback
 * Handles model deprecations and outages gracefully
 */

import { AIProvider, AnalysisRequest, ProjectAnalysis } from '../types.ts';
import { GeminiProvider } from './gemini.ts';
import { OpenAIProvider } from './openai.ts';
import { MockProvider } from './mock.ts';

interface ModelConfig {
  provider: string;
  model: string;
  priority: number;
  maxRetries: number;
}

export class ResilientAIProvider implements AIProvider {
  name = 'resilient';
  private providers: Map<string, AIProvider> = new Map();
  private modelChain: ModelConfig[] = [];
  private healthStatus: Map<string, boolean> = new Map();

  constructor(geminiKey?: string, openaiKey?: string, supabaseUrl?: string, supabaseKey?: string) {
    // Initialize providers
    if (geminiKey) {
      this.providers.set('gemini', new GeminiProvider(geminiKey));
    }
    if (openaiKey) {
      this.providers.set('openai', new OpenAIProvider(openaiKey));
    }
    this.providers.set('mock', new MockProvider());

    // Load model configuration (could be from database in production)
    this.loadModelConfiguration();
  }

  private loadModelConfiguration() {
    // In production, load this from Supabase or environment
    const configString = Deno.env.get('AI_MODEL_CHAIN');

    if (configString) {
      try {
        this.modelChain = JSON.parse(configString);
      } catch {
        this.useDefaultConfiguration();
      }
    } else {
      this.useDefaultConfiguration();
    }
  }

  private useDefaultConfiguration() {
    this.modelChain = [
      {
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        priority: 1,
        maxRetries: 2,
      },
      {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        priority: 2,
        maxRetries: 1,
      },
      {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        priority: 3,
        maxRetries: 1,
      },
      {
        provider: 'mock',
        model: 'mock',
        priority: 999,
        maxRetries: 1,
      },
    ];
  }

  async isAvailable(): Promise<boolean> {
    // Check if at least one provider is available
    for (const config of this.modelChain) {
      const provider = this.providers.get(config.provider);
      if (provider && (await provider.isAvailable())) {
        return true;
      }
    }
    return false;
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
    availableModels?: string[];
  }> {
    const startTime = Date.now();
    const availableModels: string[] = [];

    // Check all providers
    for (const config of this.modelChain) {
      const provider = this.providers.get(config.provider);
      if (provider) {
        const health = await provider.healthCheck();
        const modelName = `${config.provider}/${config.model}`;

        if (health.status === 'healthy') {
          availableModels.push(modelName);
          this.healthStatus.set(modelName, true);
        } else {
          this.healthStatus.set(modelName, false);
        }
      }
    }

    const latency = Date.now() - startTime;

    if (availableModels.length === 0) {
      return { status: 'down', latency, availableModels };
    } else if (availableModels.length < this.modelChain.length / 2) {
      return { status: 'degraded', latency, availableModels };
    } else {
      return { status: 'healthy', latency, availableModels };
    }
  }

  async analyzeImage(request: AnalysisRequest): Promise<ProjectAnalysis> {
    const errors: Array<{ model: string; error: string }> = [];

    // Sort by priority
    const sortedChain = [...this.modelChain].sort((a, b) => a.priority - b.priority);

    for (const config of sortedChain) {
      const provider = this.providers.get(config.provider);
      if (!provider) continue;

      const modelName = `${config.provider}/${config.model}`;

      // Skip if we know it's unhealthy
      if (this.healthStatus.get(modelName) === false) {
        console.log(`⚠️ Skipping unhealthy model: ${modelName}`);
        continue;
      }

      // Try the provider with retries
      for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        try {
          console.log(`🔄 Attempting ${modelName} (attempt ${attempt}/${config.maxRetries})`);

          // Update the provider's model if it's configurable
          if (config.provider === 'gemini' && provider instanceof GeminiProvider) {
            (provider as any).model = config.model;
          }

          const result = await provider.analyzeImage(request);

          // Success! Log it and return
          console.log(`✅ Success with ${modelName}`);
          await this.logModelUsage(modelName, true, Date.now());

          // Add which model was used to the response
          return {
            ...result,
            aiProvider: modelName,
            metadata: {
              ...result.metadata,
              fallbackUsed: config.priority > 1,
              modelChainPosition: config.priority,
            },
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ ${modelName} attempt ${attempt} failed:`, errorMessage);

          errors.push({ model: modelName, error: errorMessage });

          // Mark as unhealthy if all retries failed
          if (attempt === config.maxRetries) {
            this.healthStatus.set(modelName, false);
            await this.logModelUsage(modelName, false, Date.now(), errorMessage);
          }

          // Wait before retry
          if (attempt < config.maxRetries) {
            await this.delay(1000 * attempt); // Exponential backoff
          }
        }
      }
    }

    // All models failed
    console.error('🚨 All AI models failed:', errors);

    // Send critical alert in production
    await this.sendCriticalAlert({
      message: 'All AI models failed',
      errors,
      timestamp: new Date().toISOString(),
    });

    throw new Error(
      `All AI models failed. Errors: ${errors.map(e => `${e.model}: ${e.error}`).join('; ')}`
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logModelUsage(model: string, success: boolean, timestamp: number, error?: string) {
    // In production, log to database
    console.log('📊 Model usage:', {
      model,
      success,
      timestamp: new Date(timestamp).toISOString(),
      error,
    });

    // Could write to Supabase here
    // await supabase.from('ai_model_usage').insert({...})
  }

  private async sendCriticalAlert(alert: any) {
    // In production, send to monitoring service
    console.error('🚨 CRITICAL ALERT:', alert);

    // Could send to Sentry, PagerDuty, Slack, etc.
    // await fetch('https://hooks.slack.com/...', {method: 'POST', body: JSON.stringify(alert)})
  }

  /**
   * Get current model configuration for monitoring
   */
  getModelConfiguration() {
    return {
      chain: this.modelChain,
      health: Array.from(this.healthStatus.entries()).map(([model, healthy]) => ({
        model,
        healthy,
        lastChecked: new Date().toISOString(),
      })),
    };
  }

  /**
   * Update model configuration at runtime
   */
  async updateModelConfiguration(newChain: ModelConfig[]) {
    console.log('🔄 Updating model configuration');
    this.modelChain = newChain;

    // Clear health cache to recheck
    this.healthStatus.clear();

    // Run health check on new configuration
    await this.healthCheck();
  }
}
