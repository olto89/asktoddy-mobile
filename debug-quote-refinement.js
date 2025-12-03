/**
 * Debug Script for Quote Refinement Detection System
 * More detailed testing with debug output
 */

const SUPABASE_URL = 'https://iezmuqawughmwsxlqrim.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imllem11cWF3dWdobXdzeGxxcmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODM5MzAsImV4cCI6MjA3NjU1OTkzMH0.SU0JdMUE-7aWAQJ1oq19dKZifw-qdUiLX9_JmOSOGO0';

async function debugQuoteRefinement() {
  console.log('🔍 Debug Quote Refinement Detection System...\n');

  const baseUrl = `${SUPABASE_URL}/functions/v1/analyze-construction`;
  const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`📱 Session ID: ${sessionId}\n`);

  // Helper function to log detailed analysis
  function logAnalysisDetails(title, result) {
    console.log(`=== ${title} ===`);
    console.log(`🎯 Project Type: ${result.data.projectType}`);
    console.log(`📊 Confidence: ${result.data.confidence}%`);
    console.log(`🔍 Response Type: ${result.data.responseType || 'N/A'}`);
    console.log(
      `💰 Cost Range: £${result.data.costBreakdown?.totalCost?.min || 'N/A'} - £${result.data.costBreakdown?.totalCost?.max || 'N/A'}`
    );

    // Enhanced debug info
    if (result.data.improvementSuggestions) {
      console.log(`💡 Suggestions: ${result.data.improvementSuggestions.length} items`);
      result.data.improvementSuggestions.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion}`);
      });
    }

    if (result.data.costBreakdown?.materials?.items) {
      console.log(`🧱 Materials: ${result.data.costBreakdown.materials.items.length} items`);
    }

    if (result.data.timeline) {
      console.log(`⏱️ Timeline: ${result.data.timeline.professional || 'N/A'} professional`);
    }

    console.log(`📝 Description: ${(result.data.description || '').substring(0, 100)}...`);
    console.log('');
  }

  try {
    // Test 1: Very basic request
    console.log('=== Test 1: Basic Request (Low Info) ===');
    const basicRequest = {
      message: 'bathroom renovation',
      sessionId,
      analysisType: 'chat',
    };

    const response1 = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(basicRequest),
    });

    const result1 = await response1.json();
    logAnalysisDetails('Basic Request', result1);

    // Wait a moment between requests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Add specific dimensions and materials
    console.log('=== Test 2: Add Dimensions & Materials ===');
    const detailedRequest = {
      message:
        'Actually, the bathroom is 2.5m x 1.8m and I want porcelain tiles and chrome fixtures',
      sessionId,
      analysisType: 'chat',
    };

    const response2 = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(detailedRequest),
    });

    const result2 = await response2.json();
    logAnalysisDetails('Added Dimensions & Materials', result2);

    // Wait a moment between requests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Add quality level and budget
    console.log('=== Test 3: Add Quality & Budget ===');
    const qualityRequest = {
      message:
        'I want premium quality finishes and my budget is £8000. This needs to be completed in 2 weeks.',
      sessionId,
      analysisType: 'chat',
    };

    const response3 = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(qualityRequest),
    });

    const result3 = await response3.json();
    logAnalysisDetails('Added Quality & Budget', result3);

    // Summary with progression analysis
    console.log('=== CONFIDENCE PROGRESSION ANALYSIS ===');
    const confidences = [result1.data.confidence, result2.data.confidence, result3.data.confidence];
    console.log(`Step 1 (basic): ${confidences[0]}%`);
    console.log(
      `Step 2 (+dimensions+materials): ${confidences[1]}% (${confidences[1] > confidences[0] ? '+' : ''}${confidences[1] - confidences[0]})`
    );
    console.log(
      `Step 3 (+quality+budget): ${confidences[2]}% (${confidences[2] > confidences[1] ? '+' : ''}${confidences[2] - confidences[1]})`
    );

    const totalIncrease = confidences[2] - confidences[0];
    console.log(`\nTotal confidence increase: ${totalIncrease > 0 ? '+' : ''}${totalIncrease}%`);

    // Check for expected behavior
    const step2Increase = confidences[1] > confidences[0];
    const step3Increase = confidences[2] > confidences[1];
    const overallIncrease = confidences[2] > confidences[0];

    console.log(`\n📈 Step 2 improvement: ${step2Increase ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📈 Step 3 improvement: ${step3Increase ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📈 Overall improvement: ${overallIncrease ? '✅ PASS' : '❌ FAIL'}`);

    if (overallIncrease && totalIncrease >= 10) {
      console.log('\n🎉 Quote Refinement System is working well!');
    } else if (overallIncrease) {
      console.log('\n⚠️ Quote Refinement System is working but needs improvement');
    } else {
      console.log('\n❌ Quote Refinement System needs investigation');
    }
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Run the debug test
debugQuoteRefinement().catch(console.error);
