/**
 * Test script for Staging Edge Function
 * Tests the analyze-construction Edge Function in staging environment
 */

const STAGING_SUPABASE_URL = 'https://iezmuqawughmwsxlqrim.supabase.co';
const STAGING_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllem11cWF3dWdobXdzeGxxcmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODM5MzAsImV4cCI6MjA3NjU1OTkzMH0.SU0JdMUE-7aWAQJ1oq19dKZifw-qdUiLX9_JmOSOGO0';

const EDGE_FUNCTION_URL = `${STAGING_SUPABASE_URL}/functions/v1/analyze-construction`;

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n🧪 Test 1: Health Check (Staging)');
  console.log('=================================');

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'GET',
      headers: {
        apikey: STAGING_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${STAGING_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Health check passed:');
    console.log('  - Service:', data.service);
    console.log('  - Status:', data.status);
    console.log('  - Version:', data.version);
    console.log('  - Environment:', data.environment);
    console.log('  - Available Providers:', data.middleware?.availableProviders);
    console.log('  - Gemini configured:', data.providers?.gemini);
    console.log('  - Provider Health:', JSON.stringify(data.middleware?.providerHealth, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Test 2: Chat Analysis
async function testChatAnalysis() {
  console.log('\n🧪 Test 2: Chat Analysis (Staging)');
  console.log('===================================');

  const request = {
    message: "I need to renovate my kitchen. It's about 12x15 feet. Need new cabinets, countertops, and flooring.",
    analysisType: 'chat',
    location: {
      coordinates: {
        latitude: 51.5074,
        longitude: -0.1278,
      },
      address: 'London, UK',
    },
  };

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: STAGING_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${STAGING_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${error}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      console.log('✅ Chat analysis successful:');
      console.log('  - AI Provider:', result.aiProvider);
      console.log('  - Processing time:', result.processingTimeMs, 'ms');
      console.log('  - Project type:', result.data.projectType);
      console.log('  - Estimated cost:', result.data.estimatedCost?.total);
      console.log('  - Timeline:', result.data.timeline?.totalDays, 'days');
      console.log('  - Confidence:', result.data.confidence);
      return true;
    } else {
      console.error('❌ Analysis failed:', result.error?.message);
      console.error('  - Full error:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Chat analysis failed:', error.message);
    return false;
  }
}

// Run tests
async function runStagingTests() {
  console.log('🚀 Testing Staging Edge Function');
  console.log('================================');
  console.log('Endpoint:', EDGE_FUNCTION_URL);
  console.log('Environment: Staging (iezmuqawughmwsxlqrim)');

  let passed = 0;
  let failed = 0;

  // Run tests
  if (await testHealthCheck()) passed++;
  else failed++;
  if (await testChatAnalysis()) passed++;
  else failed++;

  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All staging tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check Supabase dashboard logs.');
  }
}

// Run the tests
runStagingTests().catch(console.error);