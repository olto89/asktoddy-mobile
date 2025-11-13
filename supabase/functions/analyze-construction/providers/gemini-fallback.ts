/**
 * Gemini Fallback Provider - Uses alternative models for reliability
 */

import { GeminiProvider } from './gemini.ts';
import { ContextManager } from '../context/ContextManager.ts';

export class GeminiFallbackProvider extends GeminiProvider {
  name = 'gemini-fallback';

  // Use a different model or configuration for fallback
  private fallbackModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];

  constructor(apiKey: string, contextManager?: ContextManager) {
    super(apiKey, contextManager);
    this.name = 'gemini-fallback';
    // Start with the fastest lightweight model
    this['model'] = this.fallbackModels[0];
  }

  async isAvailable(): Promise<boolean> {
    // Try each fallback model
    for (const model of this.fallbackModels) {
      try {
        this['model'] = model;
        const available = await super.isAvailable();
        if (available) {
          console.log(`✅ Gemini fallback using model: ${model}`);
          return true;
        }
      } catch (error) {
        console.log(`❌ Gemini fallback model ${model} failed:`, error.message);
        continue;
      }
    }

    console.log('❌ All Gemini fallback models failed');
    return false;
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
    error?: string;
  }> {
    // Quick health check with the current model
    const health = await super.healthCheck();

    // If degraded/down, try switching models
    if (health.status === 'down' || health.status === 'degraded') {
      console.log('🔄 Gemini fallback trying alternative models...');

      for (const model of this.fallbackModels) {
        if (model === this['model']) continue; // Skip current model

        try {
          this['model'] = model;
          const newHealth = await super.healthCheck();
          if (newHealth.status === 'healthy') {
            console.log(`✅ Gemini fallback switched to: ${model}`);
            return newHealth;
          }
        } catch (error) {
          continue;
        }
      }
    }

    return health;
  }
}
