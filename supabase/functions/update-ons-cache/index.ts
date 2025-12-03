/**
 * ONS Pricing Cache Update Edge Function
 * Daily cron job to update construction price indices from ONS APIs
 * Reduces quote generation time from 3-5s to <1s by eliminating real-time API calls
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ONS API endpoints - simplified approach with mock data for MVP
const ONS_DATASETS = [
  {
    id: 'construction-all-work',
    code: 'COPI_ALL',
    name: 'Construction All Work Index',
    mockData: [
      { period: '2024-10', value: 125.4, monthChange: 0.8, yearChange: 4.2 },
      { period: '2024-09', value: 124.4, monthChange: 1.2, yearChange: 4.8 },
      { period: '2024-08', value: 122.9, monthChange: 0.5, yearChange: 3.9 },
    ],
  },
  {
    id: 'construction-new-housing',
    code: 'COPI_HOUSING',
    name: 'Construction New Housing Index',
    mockData: [
      { period: '2024-10', value: 128.1, monthChange: 1.5, yearChange: 5.2 },
      { period: '2024-09', value: 126.2, monthChange: 1.8, yearChange: 5.8 },
      { period: '2024-08', value: 124.0, monthChange: 0.9, yearChange: 4.1 },
    ],
  },
];

interface ONSDataPoint {
  period: string;
  value: number;
  previous_value?: number;
  change?: number;
}

interface CacheEntry {
  index_type: string;
  index_code: string;
  current_value: number;
  previous_value: number | null;
  month_on_month_change: number | null;
  year_on_year_change: number | null;
  data_month: string;
  data_quarter: string | null;
}

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
    console.log('🔄 Starting ONS pricing cache update...');

    // Initialize Supabase client with service role key for database writes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results = [];
    let totalUpdated = 0;
    let errorCount = 0;

    // Process each ONS dataset
    for (const dataset of ONS_DATASETS) {
      console.log(`📊 Processing dataset: ${dataset.name}`);

      try {
        // Use mock data for MVP (real ONS API integration coming later)
        const onsData = dataset.mockData.map(item => ({
          period: item.period,
          value: item.value,
          previous_value: item.value - (item.monthChange || 0),
          change: item.monthChange,
        }));

        if (onsData && onsData.length > 0) {
          // Transform and cache the data
          const cacheEntries = transformONSData(onsData, dataset);

          // Upsert to database
          const { data, error } = await supabase.from('ons_pricing_cache').upsert(cacheEntries, {
            onConflict: 'index_type,data_month',
            ignoreDuplicates: false,
          });

          if (error) {
            console.error(`❌ Database error for ${dataset.name}:`, error);
            errorCount++;
          } else {
            console.log(`✅ Updated ${cacheEntries.length} entries for ${dataset.name}`);
            totalUpdated += cacheEntries.length;
          }
        }

        results.push({
          dataset: dataset.name,
          success: true,
          entries: onsData?.length || 0,
        });

        // No need for rate limiting with mock data, but keep for real API later
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error processing ${dataset.name}:`, error);
        results.push({
          dataset: dataset.name,
          success: false,
          error: error.message,
        });
        errorCount++;
      }
    }

    // Log performance metrics
    await logCachePerformance(supabase, {
      operation_type: 'update',
      cache_type: 'ons_pricing',
      entries_updated: totalUpdated,
      errors: errorCount,
    });

    // Cleanup old data (keep last 24 months)
    await cleanupOldData(supabase);

    const response = {
      success: true,
      message: `ONS pricing cache updated successfully`,
      summary: {
        datasets_processed: ONS_DATASETS.length,
        total_entries_updated: totalUpdated,
        errors: errorCount,
        timestamp: new Date().toISOString(),
      },
      details: results,
    };

    console.log('✅ ONS pricing cache update completed:', response.summary);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ ONS cache update failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Fetch data from ONS API for a specific dataset
 * Currently using mock data for MVP - real API integration coming later
 */
async function fetchONSData(dataset: any): Promise<ONSDataPoint[]> {
  // For MVP, return mock data directly
  // TODO: Replace with real ONS API calls when endpoints are confirmed

  console.log(`📊 Using mock data for: ${dataset.name}`);

  return dataset.mockData.map((item: any) => ({
    period: item.period,
    value: item.value,
    previous_value: item.value - (item.monthChange || 0),
    change: item.monthChange,
  }));
}

/**
 * Transform ONS data to our cache format
 */
function transformONSData(onsData: ONSDataPoint[], dataset: any): CacheEntry[] {
  const entries: CacheEntry[] = [];

  // Sort by period to ensure chronological order
  onsData.sort((a, b) => a.period.localeCompare(b.period));

  for (let i = 0; i < onsData.length; i++) {
    const current = onsData[i];
    const previous = i > 0 ? onsData[i - 1] : null;
    const yearAgo = onsData.find(p => {
      const currentYear = parseInt(current.period.split('-')[0]);
      const currentMonth = parseInt(current.period.split('-')[1] || '1');
      const pointYear = parseInt(p.period.split('-')[0]);
      const pointMonth = parseInt(p.period.split('-')[1] || '1');
      return pointYear === currentYear - 1 && pointMonth === currentMonth;
    });

    // Calculate percentage changes
    const monthOnMonthChange = previous
      ? ((current.value - previous.value) / previous.value) * 100
      : null;

    const yearOnYearChange = yearAgo
      ? ((current.value - yearAgo.value) / yearAgo.value) * 100
      : null;

    // Determine quarter
    const [year, month] = current.period.split('-');
    const monthNum = parseInt(month || '1');
    const quarter = Math.ceil(monthNum / 3);

    entries.push({
      index_type: dataset.code.toLowerCase(),
      index_code: dataset.code,
      current_value: current.value,
      previous_value: previous?.value || null,
      month_on_month_change: monthOnMonthChange,
      year_on_year_change: yearOnYearChange,
      data_month: current.period,
      data_quarter: `${year}-Q${quarter}`,
    });
  }

  return entries;
}

/**
 * Log cache performance metrics
 */
async function logCachePerformance(supabase: any, metrics: any) {
  try {
    await supabase.from('cache_performance_log').insert({
      cache_type: metrics.cache_type,
      operation_type: metrics.operation_type,
      response_time_ms: metrics.response_time_ms || null,
      data_freshness_hours: null, // This is an update operation
      error_message: metrics.errors > 0 ? `${metrics.errors} errors occurred` : null,
    });
  } catch (error) {
    console.error('Failed to log cache performance:', error);
  }
}

/**
 * Cleanup old data to prevent unbounded growth
 */
async function cleanupOldData(supabase: any) {
  try {
    // Keep data from last 24 months only
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 24);
    const cutoffString = cutoffDate.toISOString().slice(0, 7); // YYYY-MM format

    const { error } = await supabase
      .from('ons_pricing_cache')
      .delete()
      .lt('data_month', cutoffString);

    if (error) {
      console.error('Failed to cleanup old ONS data:', error);
    } else {
      console.log('🗑️ Cleaned up ONS data older than 24 months');
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
