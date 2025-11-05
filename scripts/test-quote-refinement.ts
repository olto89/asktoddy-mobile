#!/usr/bin/env npx tsx
/**
 * Test Quote Refinement System
 * Validates the structured quote flow and refinement logic
 */

import { QuoteRefinementService } from '../src/services/pricing/quote-refinement-service';
import { PROJECT_TEMPLATES, identifyProjectType } from '../src/services/pricing/project-templates';

async function testQuoteRefinement() {
  console.log('🧪 Testing Quote Refinement System\n');

  // Test 1: Extension Quote Initialization
  console.log('📋 Test 1: Extension Quote Initialization');
  console.log('=====================================');

  const userMessage = 'I want to build a single storey rear extension';
  const projectSize = 25; // 25m²
  const baselineTotal = 75000; // £75k baseline

  try {
    const { quote, context } = QuoteRefinementService.initializeQuote(
      userMessage,
      projectSize,
      baselineTotal
    );

    console.log(`✅ Project Type: ${quote.projectType}`);
    console.log(`✅ Total Cost: £${quote.totalCost.toLocaleString()}`);
    console.log(`✅ Categories: ${quote.categories.length}`);
    console.log('\n💰 Cost Breakdown:');

    quote.categories.forEach(cat => {
      console.log(
        `  ${cat.name}: £${cat.cost.toLocaleString()} (${cat.percentage}%) - ${cat.confidence} confidence`
      );
    });

    console.log('\n📝 Assumptions:');
    quote.assumptions.forEach(assumption => {
      console.log(`  • ${assumption}`);
    });

    // Test 2: First Refinement (User thinks too expensive)
    console.log('\n\n📋 Test 2: First Refinement - "Too Expensive"');
    console.log('===============================================');

    const userFeedback1 = 'This seems too expensive, especially the structure cost';

    const refinement1 = QuoteRefinementService.processRefinement(userFeedback1, quote, context);

    console.log(`✅ Updated Total: £${refinement1.updatedQuote.totalCost.toLocaleString()}`);
    console.log(`✅ Iteration: ${refinement1.context.currentIteration}`);
    console.log(`✅ Concerns Identified: ${refinement1.context.userConcerns.join(', ')}`);
    console.log(`✅ Adjustments Made: ${refinement1.context.adjustmentsMade.length}`);
    console.log('\n🤖 AI Response:');
    console.log(`"${refinement1.conversationPrompt}"`);

    if (refinement1.context.adjustmentsMade.length > 0) {
      console.log('\n⚙️ Adjustments Applied:');
      refinement1.context.adjustmentsMade.forEach(adj => {
        console.log(`  • ${adj.category}: ${adj.change} (${adj.reasoning})`);
      });
    }

    // Test 3: Second Refinement (User wants higher quality materials)
    console.log('\n\n📋 Test 3: Second Refinement - "Higher Quality"');
    console.log('===============================================');

    const userFeedback2 = 'Actually, I want higher quality materials and finishes';

    const refinement2 = QuoteRefinementService.processRefinement(
      userFeedback2,
      refinement1.updatedQuote,
      refinement1.context
    );

    console.log(`✅ Final Total: £${refinement2.updatedQuote.totalCost.toLocaleString()}`);
    console.log(`✅ Total Adjustments: ${refinement2.context.adjustmentsMade.length}`);
    console.log('\n🤖 AI Response:');
    console.log(`"${refinement2.conversationPrompt}"`);

    // Test 4: Final Validation
    console.log('\n\n📋 Test 4: Final Validation');
    console.log('============================');

    const userFeedback3 = 'That looks much better, thanks!';

    const refinement3 = QuoteRefinementService.processRefinement(
      userFeedback3,
      refinement2.updatedQuote,
      refinement2.context
    );

    console.log(`✅ Process Complete: ${refinement3.isComplete}`);
    console.log(`✅ Final Quote: ${refinement3.context.finalQuote}`);
    console.log('\n🤖 Final Response:');
    console.log(`"${refinement3.conversationPrompt}"`);

    // Summary
    console.log('\n\n📊 REFINEMENT SUMMARY');
    console.log('=====================');
    console.log(`Initial Quote: £${quote.totalCost.toLocaleString()}`);
    console.log(`Final Quote: £${refinement3.updatedQuote.totalCost.toLocaleString()}`);
    console.log(
      `Total Change: £${(refinement3.updatedQuote.totalCost - quote.totalCost).toLocaleString()}`
    );
    console.log(`Iterations: ${refinement3.context.currentIteration}`);
    console.log(`User Concerns: ${refinement3.context.userConcerns.join(', ')}`);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testProjectIdentification() {
  console.log('\n\n🔍 Testing Project Type Identification');
  console.log('======================================');

  const testCases = [
    'I want to build a rear extension',
    'Need a new kitchen fitted',
    'Renovating our bathroom',
    'Converting the loft into a bedroom',
    'Building a side return extension',
    'Kitchen renovation with new appliances',
    'Ensuite bathroom installation',
  ];

  testCases.forEach(input => {
    const template = identifyProjectType(input);
    console.log(`"${input}" → ${template ? template.name : 'Not identified'}`);
  });
}

async function testTemplateStructure() {
  console.log('\n\n🏗️ Testing Template Structure');
  console.log('==============================');

  Object.values(PROJECT_TEMPLATES).forEach(template => {
    const totalPercentage = template.costCategories.reduce(
      (sum, cat) => sum + cat.typicalPercentage,
      0
    );
    const requiredCategories = template.costCategories.filter(cat => cat.isRequired).length;

    console.log(`${template.name}:`);
    console.log(`  Categories: ${template.costCategories.length} (${requiredCategories} required)`);
    console.log(`  Total %: ${totalPercentage}%`);
    console.log(`  Duration: ${template.typicalDuration.min}-${template.typicalDuration.max} days`);
    console.log(`  Complexity Factors: ${template.complexityFactors.length}`);
    console.log('');
  });
}

// Run all tests
async function main() {
  await testProjectIdentification();
  await testTemplateStructure();
  await testQuoteRefinement();

  console.log('\n✅ All tests completed!');
}

main().catch(console.error);
