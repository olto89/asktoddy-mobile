/**
 * Consolidated Scheduled Tasks Edge Function
 * Handles all MVP cron jobs in one simple function
 *
 * Tasks:
 * - daily-pricing: Updates all pricing caches (3 AM)
 * - weekly-cleanup: Database maintenance (Sunday 4 AM)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Task handlers
import { runDailyPricingCache } from './tasks/daily-pricing.ts';
import { runWeeklyCleanup } from './tasks/weekly-cleanup.ts';

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { task } = await req.json();

    if (!task) {
      return new Response(JSON.stringify({ error: 'Task parameter required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`⚡ Executing scheduled task: ${task}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let result;
    const startTime = Date.now();

    // Route to appropriate task handler
    switch (task) {
      case 'daily-pricing':
        result = await runDailyPricingCache(supabase);
        break;

      case 'weekly-cleanup':
        result = await runWeeklyCleanup(supabase);
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown task: ${task}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const runtime = Date.now() - startTime;

    // Log task execution
    await logTaskExecution(supabase, task, result.success, runtime, result);

    // Return result
    return new Response(
      JSON.stringify({
        task,
        success: result.success,
        runtime_ms: runtime,
        details: result,
      }),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Scheduled task error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Log task execution to database for monitoring
 */
async function logTaskExecution(
  supabase: any,
  taskType: string,
  success: boolean,
  runtime: number,
  details: any
) {
  try {
    await supabase.from('scheduled_task_log').insert({
      task_type: taskType.replace('-', '_'), // Convert to DB format
      success,
      runtime_ms: runtime,
      records_processed: details.records_processed || 0,
      records_updated: details.records_updated || 0,
      error_message: details.error || null,
      details: details,
    });
  } catch (error) {
    console.error('Failed to log task execution:', error);
  }
}
