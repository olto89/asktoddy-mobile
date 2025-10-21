/**
 * Test script for Edge Function AI Service migration
 * Verifies that the analyze-construction Edge Function is working correctly
 */

const SUPABASE_URL = 'https://tggvoqhewfmczyjoxrqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZ3ZvcWhld2ZtY3p5am94cnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzgxNjQsImV4cCI6MjA3MDY1NDE2NH0.OP6RCxBCioj-4_6o8OUHO5NxP1ZssBBqtfw8kMw_Kcc';

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/analyze-construction`;

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n🧪 Test 1: Health Check');
  console.log('======================');
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Health check passed:');
    console.log('  - Service:', data.service);
    console.log('  - Status:', data.status);
    console.log('  - Version:', data.version);
    console.log('  - Available Providers:', data.middleware?.availableProviders);
    console.log('  - Gemini configured:', data.providers?.gemini);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Test 2: Chat Analysis
async function testChatAnalysis() {
  console.log('\n🧪 Test 2: Chat Analysis');
  console.log('========================');
  
  const request = {
    message: "I need to renovate my bathroom. It's about 8x10 feet. Need new tiles, vanity, and shower installation.",
    analysisType: 'chat',
    location: {
      coordinates: {
        latitude: 51.5074,
        longitude: -0.1278
      },
      address: 'London, UK'
    }
  };

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(request)
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
      return false;
    }
  } catch (error) {
    console.error('❌ Chat analysis failed:', error.message);
    return false;
  }
}

// Test 3: Mock Image Analysis (base64 placeholder)
async function testImageAnalysis() {
  console.log('\n🧪 Test 3: Image Analysis');
  console.log('=========================');
  
  // Use a small 1x1 pixel transparent PNG as placeholder
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const request = {
    imageUri: placeholderImage,
    analysisType: 'construction_estimate',
    location: {
      coordinates: {
        latitude: 51.5074,
        longitude: -0.1278
      },
      address: 'London, UK'
    }
  };

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ Image analysis successful:');
      console.log('  - AI Provider:', result.aiProvider);
      console.log('  - Processing time:', result.processingTimeMs, 'ms');
      console.log('  - Analysis type:', result.data.analysisType);
      return true;
    } else {
      console.error('❌ Analysis failed:', result.error?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Image analysis failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Testing Edge Function AI Service Migration (ASK-35)');
  console.log('======================================================');
  console.log('Endpoint:', EDGE_FUNCTION_URL);
  console.log('Environment: Staging (tggvoqhewfmczyjoxrqu)');
  
  let passed = 0;
  let failed = 0;
  
  // Run tests
  if (await testHealthCheck()) passed++; else failed++;
  if (await testChatAnalysis()) passed++; else failed++;
  if (await testImageAnalysis()) passed++; else failed++;
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Edge Function migration successful!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the Edge Function logs.');
  }
}

// Run the tests
runTests().catch(console.error);