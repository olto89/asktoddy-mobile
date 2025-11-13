/**
 * Create Linear Tickets for Pricing Enhancement Work
 * Run with: LINEAR_API_KEY=your_key node create-pricing-tickets.js
 */

const { createTicket, getTeamId } = require('./create-linear-tickets.js');

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.log('❌ LINEAR_API_KEY environment variable required');
  console.log('💡 Get your API key from: https://linear.app/settings/api');
  console.log('💡 Then run: LINEAR_API_KEY=your_key node create-pricing-tickets.js');
  process.exit(1);
}

// GraphQL mutations for updating tickets to Done status
const UPDATE_ISSUE_MUTATION = `
  mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
    issueUpdate(id: $id, input: $input) {
      success
      issue {
        id
        identifier
        title
        state {
          name
        }
      }
    }
  }
`;

const GET_WORKFLOW_STATES_QUERY = `
  query WorkflowStates($teamId: String!) {
    workflowStates(filter: { team: { id: { eq: $teamId } } }) {
      nodes {
        id
        name
        type
      }
    }
  }
`;

async function makeLinearRequest(query, variables = {}) {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LINEAR_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Linear API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Linear GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

// Pricing Enhancement Tickets
const PRICING_TICKETS = [
  {
    title: '✅ Completed: Stable Material Calculation System',
    description: `# Stable Material Calculation System - COMPLETED

## Summary
Built 100% reliable server-side calculation system replacing AI-based quantity estimation with deterministic calculations.

## Key Achievements
- **100% Consistency**: Identical results between requests
- **Sub-10ms Response Time**: Lightning-fast calculations
- **UK Building Standards**: Proper material quantities using industry standards
- **Dimension Parsing**: Advanced DimensionExtractor handles various text formats
- **MaterialCalculationService**: Server-side calculations for all material types

## Technical Implementation
- New endpoint: \`/analyze-construction-stable\`
- DimensionExtractor class for parsing dimensions from text
- MaterialCalculationService using UK building standards
- Perfect consistency between identical requests
- Comprehensive test coverage

## Results
- Material quantities now realistic (e.g., 4,080 bricks for 4x4m extension)
- Fixed critical bug where all quantities were set to 1
- Materials cost now realistic (£15,000-30,000 for extension vs £160-320 before)

## Documentation
- \`docs/STABLE_PRICING_SYSTEM.md\` - Complete technical documentation
- Test file \`test-stable-endpoint.js\` for validation

🏗️ **Status**: ✅ COMPLETED - System is live and stable`,
    priority: 2, // High
    estimate: 8,
    status: 'completed',
  },
  {
    title: '✅ Completed: Pricing Enhancement Pipeline',
    description: `# Pricing Enhancement Pipeline - COMPLETED

## Summary
Implemented additive enhancement pattern that never breaks base analysis while adding realistic pricing layers.

## Key Achievements
- **Additive Enhancement Pattern**: Safe pricing additions that never break base functionality
- **National Average Tool Hire**: Rebranded from HSS with realistic rates
- **Toddy Tool Hire Integration**: Local pricing with proper multi-day scaling
- **Fixed Unrealistic Pricing**: Mini digger from £414/day to £165/day
- **Corrected Weekly Rates**: From 4.5x to 1.95x daily rate (industry standard)

## Technical Implementation
- Enhanced \`/analyze-construction-stable\` with pricing layers
- PricingEnhancementService for additive pricing
- National Average tool hire rates (realistic market rates)
- Toddy Tool Hire API integration with proper scaling
- Weekly rate calculations follow industry standards (7-day booking = 1.95x daily rate)

## Results
- Tool hire pricing now realistic and competitive
- Multi-day booking rates properly scaled
- Enhanced pricing never breaks base material calculations
- Consistent pricing across all requests

## Documentation
- Pricing enhancement documented in \`docs/STABLE_PRICING_SYSTEM.md\`
- Post-MVP strategy in \`docs/POST_MVP_ACCURACY_STRATEGY.md\`

🏗️ **Status**: ✅ COMPLETED - Enhancement pipeline is live and working`,
    priority: 2, // High
    estimate: 5,
    status: 'completed',
  },
  {
    title: '🚀 Phase 1: Quote Comparison System',
    description: `# Quote Comparison System - Post-MVP Enhancement

## Summary
Implement user quote comparison system to collect real-world pricing data for machine learning training.

## Goals
- Collect real-world quote data from users
- Build dataset for ML pricing model training
- Improve pricing accuracy through real-world validation
- Create incentive system for user participation

## Technical Requirements
- Quote submission interface in mobile app
- Backend storage for quote comparisons
- Data validation and cleaning pipeline
- Privacy-compliant data collection
- Reward system for contributing users

## Implementation Plan
1. **Quote Submission UI**: Simple form for users to input actual quotes received
2. **Data Storage**: Secure backend storage with anonymization
3. **Validation Pipeline**: Detect and filter outliers/spam submissions
4. **Reward System**: Points/credits for users who contribute accurate data
5. **Analytics Dashboard**: Track data quality and collection progress

## Success Metrics
- 100+ quote submissions per month
- Data quality score >80%
- User participation rate >15%
- Pricing accuracy improvement measurable

## Dependencies
- Stable pricing system (✅ Complete)
- User authentication system
- Backend data storage infrastructure

🎯 **Priority**: High - Critical for ML training data collection
📅 **Timeline**: 2-3 weeks post-MVP launch`,
    priority: 2, // High
    estimate: 5,
    status: 'todo',
  },
  {
    title: '🚀 Phase 1: Supplier API Integration',
    description: `# Supplier API Integration - Real-time Material Pricing

## Summary
Integrate with major UK building supplier APIs for real-time material pricing to replace static pricing data.

## Target Suppliers
- **Travis Perkins**: Largest UK building supplier
- **Jewson**: Major trade supplier
- **Wickes**: Consumer and trade supplier
- **Selco**: Trade-focused supplier

## Technical Requirements
- API authentication and rate limiting
- Real-time price fetching with caching
- Fallback pricing when APIs unavailable
- Price comparison across suppliers
- Location-based supplier selection

## Implementation Plan
1. **API Research**: Document available supplier APIs and pricing structures
2. **Authentication Setup**: Register for API access with major suppliers
3. **Price Fetching Service**: Build service to fetch real-time prices
4. **Caching Layer**: Implement Redis caching for performance
5. **Fallback System**: Graceful degradation when APIs are down
6. **Price Comparison**: Show users best prices across suppliers

## Benefits
- Real-time accurate material pricing
- Location-based supplier recommendations
- Price comparison shopping
- Automatic price updates without manual maintenance

## Challenges
- API rate limits and costs
- Data format standardization
- Supplier API availability/reliability
- Price matching across different suppliers

## Success Metrics
- 90%+ price accuracy vs manual quotes
- <2 second price fetch response time
- 95%+ API uptime with fallbacks
- User satisfaction with price accuracy

🎯 **Priority**: High - Critical for pricing accuracy
📅 **Timeline**: 3-4 weeks post-MVP launch
🔗 **Dependencies**: Stable pricing system, supplier partnerships`,
    priority: 2, // High
    estimate: 8,
    status: 'todo',
  },
  {
    title: '🚀 Phase 2: ML Price Prediction Model',
    description: `# ML Price Prediction Model - Advanced Pricing Intelligence

## Summary
Build and train machine learning model using collected quote data to achieve 80%+ pricing accuracy within 6 months.

## Model Requirements
- **Input Features**: Project type, dimensions, materials, location, complexity
- **Training Data**: Real user quotes + industry pricing data
- **Target Accuracy**: 80% within ±15% of actual quotes
- **Response Time**: <500ms for price predictions
- **Continuous Learning**: Model retraining with new data

## Technical Architecture
- **Feature Engineering**: Extract meaningful features from project descriptions
- **Model Selection**: Evaluate regression models (Random Forest, XGBoost, Neural Networks)
- **Training Pipeline**: Automated retraining with new data
- **A/B Testing**: Compare ML predictions vs rule-based pricing
- **Model Monitoring**: Track accuracy degradation and trigger retraining

## Implementation Phases
### Phase 2A: Data Preparation (Month 1-2)
- Clean and structure collected quote data
- Feature engineering from project descriptions
- Create train/validation/test datasets
- Data quality assessment and cleaning

### Phase 2B: Model Development (Month 3-4)
- Baseline model development and evaluation
- Hyperparameter tuning and optimization
- Cross-validation and performance testing
- Model interpretability analysis

### Phase 2C: Production Deployment (Month 5-6)
- Production model serving infrastructure
- A/B testing framework
- Model monitoring and alerting
- Automated retraining pipeline

## Success Metrics
- **Accuracy**: 80% of predictions within ±15% of actual quotes
- **Coverage**: Model handles 90%+ of project types
- **Performance**: <500ms prediction response time
- **Improvement**: 20% accuracy improvement over rule-based system

## Data Requirements
- Minimum 500 quote comparisons for initial training
- Geographic and project type diversity
- Quality-validated data (outlier removal)
- Continuous data collection (50+ quotes/month)

## Risk Mitigation
- Fallback to rule-based pricing if model fails
- Regular model validation against new data
- Human review of prediction accuracy
- Gradual rollout with user feedback

🎯 **Priority**: Medium - Long-term accuracy improvement
📅 **Timeline**: 6 months post-MVP launch
🔗 **Dependencies**: Quote comparison system, supplier API integration, sufficient training data`,
    priority: 3, // Medium
    estimate: 13,
    status: 'todo',
  },
];

async function getWorkflowStates(teamId) {
  const data = await makeLinearRequest(GET_WORKFLOW_STATES_QUERY, { teamId });
  return data.workflowStates.nodes;
}

async function updateTicketStatus(issueId, stateId) {
  const data = await makeLinearRequest(UPDATE_ISSUE_MUTATION, {
    id: issueId,
    input: { stateId },
  });
  return data.issueUpdate;
}

async function createPricingTicket(ticket, teamId, workflowStates) {
  const priorityMap = {
    1: 1, // Urgent
    2: 2, // High
    3: 3, // Medium
  };

  const input = {
    teamId,
    title: ticket.title,
    description: ticket.description,
    priority: priorityMap[ticket.priority] || 3,
    estimate: ticket.estimate,
  };

  try {
    const data = await makeLinearRequest(
      `mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
          }
          lastSyncId
        }
      }`,
      { input }
    );

    if (data.issueCreate.success) {
      const issue = data.issueCreate.issue;

      // Update status for completed tickets
      if (ticket.status === 'completed') {
        const doneState = workflowStates.find(
          state =>
            state.name.toLowerCase().includes('done') ||
            state.name.toLowerCase().includes('completed') ||
            state.type === 'completed'
        );

        if (doneState) {
          console.log(`   Setting status to Done...`);
          await updateTicketStatus(issue.id, doneState.id);
        }
      }

      return issue;
    } else {
      throw new Error('Issue creation failed');
    }
  } catch (error) {
    console.error(`❌ Failed to create ${ticket.title}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🏗️ Creating Linear tickets for Pricing Enhancement Work...\n');

  try {
    // Get team ID
    console.log('📋 Getting team information...');
    const teamId = await getTeamId();
    console.log(`✅ Found AskToddy team: ${teamId}`);

    // Get workflow states
    console.log('🔄 Getting workflow states...');
    const workflowStates = await getWorkflowStates(teamId);
    console.log(`✅ Found ${workflowStates.length} workflow states\n`);

    // Create tickets
    console.log('🎫 Creating pricing enhancement tickets...\n');
    const results = [];

    for (const ticket of PRICING_TICKETS) {
      console.log(`Creating: ${ticket.title}...`);
      const result = await createPricingTicket(ticket, teamId, workflowStates);

      if (result) {
        console.log(`✅ Created: ${result.identifier} - ${result.title}`);
        console.log(`   URL: ${result.url}`);
        results.push(result);
      }

      console.log(''); // Empty line

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('='.repeat(80));
    console.log(`📊 PRICING ENHANCEMENT SUMMARY`);
    console.log('='.repeat(80));
    console.log(`✅ Created ${results.length}/${PRICING_TICKETS.length} tickets`);
    console.log('');

    console.log('📋 COMPLETED WORK:');
    results
      .filter((_, i) => PRICING_TICKETS[i].status === 'completed')
      .forEach((result, i) => {
        const ticket = PRICING_TICKETS.find(t => t.title === result.title);
        console.log(`   ${result.identifier}: ${result.title} (${ticket.estimate} points)`);
      });

    console.log('\n🚀 FUTURE ROADMAP:');
    results
      .filter((_, i) => PRICING_TICKETS[i].status === 'todo')
      .forEach((result, i) => {
        const ticket = PRICING_TICKETS.find(t => t.title === result.title);
        console.log(`   ${result.identifier}: ${result.title} (${ticket.estimate} points)`);
      });

    console.log('\n🎯 Next Steps:');
    console.log('1. ✅ Stable Material Calculation System - COMPLETED');
    console.log('2. ✅ Pricing Enhancement Pipeline - COMPLETED');
    console.log('3. 🚀 Begin Phase 1: Quote Comparison System');
    console.log('4. 🚀 Research Supplier API Integration');
    console.log('5. 🔬 Plan ML Price Prediction Model');

    console.log('\n📈 IMPACT SUMMARY:');
    console.log('- Material quantities now realistic (4,080 bricks vs 1)');
    console.log('- Materials cost realistic (£15k-30k vs £160-320)');
    console.log('- Tool hire pricing fixed (£165/day vs £414/day)');
    console.log('- 100% consistent calculations, <10ms response time');
    console.log('- Ready for Phase 1 post-MVP enhancements');
  } catch (error) {
    console.error('❌ Error creating pricing tickets:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PRICING_TICKETS, createPricingTicket };
