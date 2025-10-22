#!/usr/bin/env -S deno run --allow-read --allow-env

/**
 * Test Edge Functions without Docker
 * Validates TypeScript compilation and environment loading
 */

// Test shared environment module
try {
  console.log('🧪 Testing shared environment module...');

  // Set test environment variables
  Deno.env.set('GEMINI_API_KEY', 'test-key');
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  Deno.env.set('APP_ENV', 'test');

  // Import and test environment functions
  const { getEnvironment, createResponse, createErrorResponse, debugLog } = await import(
    './functions/_shared/env.ts'
  );

  console.log('✅ Environment module imported successfully');

  // Test environment loading
  const env = getEnvironment();
  console.log('✅ Environment loaded:', {
    hasGeminiKey: !!env.GEMINI_API_KEY,
    hasSupabaseUrl: !!env.SUPABASE_URL,
    appEnv: env.APP_ENV,
    debug: env.DEBUG,
  });

  // Test response functions
  const testResponse = createResponse({ test: 'data' });
  console.log('✅ Response creation working');

  const errorResponse = createErrorResponse('Test error', 400);
  console.log('✅ Error response creation working');

  // Test debug logging
  debugLog('Test debug message', { test: 'data' });
  console.log('✅ Debug logging working');

  console.log('\n🎉 All Edge Function utilities are working correctly!');
  console.log('\n📋 Next steps:');
  console.log('   1. Install Docker Desktop to run functions locally');
  console.log('   2. Run: supabase functions serve');
  console.log('   3. Test endpoints with curl commands');
} catch (error) {
  console.error('❌ Test failed:', error);
  Deno.exit(1);
}
