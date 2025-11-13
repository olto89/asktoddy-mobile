#!/usr/bin/env node

/**
 * Create Linear Tickets for Pricing Enhancement Work
 * Uses the same approach as sync-linear-api.js
 */

const https = require('https');
require('dotenv').config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.log('❌ LINEAR_API_KEY environment variable required');
  console.log('💡 Get your API key from: https://linear.app/settings/api');
  console.log('💡 Add it to your .env file: LINEAR_API_KEY=your_key_here');
  process.exit(1);
}

/**
 * Make a GraphQL request to Linear (same as sync-linear-api.js)
 */
function queryLinear(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });

    const options = {
      hostname: 'api.linear.app',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${LINEAR_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.errors) {
            reject(new Error(`Linear API Error: ${JSON.stringify(result.errors)}`));
          } else {
            resolve(result.data);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
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

🎯 **Priority**: Medium - Long-term accuracy improvement
📅 **Timeline**: 6 months post-MVP launch
🔗 **Dependencies**: Quote comparison system, supplier API integration, sufficient training data`,
    priority: 3, // Medium
    estimate: 13,
  },
];

async function getTeamId() {
  const query = `
    query {
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
  `;

  try {
    const data = await queryLinear(query);
    const askToddyTeam = data.teams.nodes.find(
      team => team.name.toLowerCase().includes('asktoddy') || team.key === 'ASK'
    );

    if (!askToddyTeam) {
      console.log(
        'Available teams:',
        data.teams.nodes.map(t => `${t.name} (${t.key})`)
      );
      throw new Error('AskToddy team not found');
    }

    return askToddyTeam.id;
  } catch (error) {
    console.error('Error getting team ID:', error.message);
    throw error;
  }
}

async function createTicket(ticket, teamId) {
  const priorityMap = {
    1: 1, // Urgent
    2: 2, // High
    3: 3, // Medium
  };

  const mutation = `
    mutation {
      issueCreate(input: {
        teamId: "${teamId}",
        title: ${JSON.stringify(ticket.title)},
        description: ${JSON.stringify(ticket.description)},
        priority: ${priorityMap[ticket.priority] || 3},
        estimate: ${ticket.estimate}
      }) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;

  try {
    const data = await queryLinear(mutation);

    if (data.issueCreate.success) {
      return data.issueCreate.issue;
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
    console.log(`✅ Found AskToddy team: ${teamId}\n`);

    // Create tickets
    console.log('🎫 Creating pricing enhancement tickets...\n');
    const results = [];

    for (const ticket of PRICING_TICKETS) {
      console.log(`Creating: ${ticket.title}...`);
      const result = await createTicket(ticket, teamId);

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
    results.slice(0, 2).forEach((result, i) => {
      console.log(
        `   ${result.identifier}: ${result.title} (${PRICING_TICKETS[i].estimate} points)`
      );
    });

    console.log('\n🚀 FUTURE ROADMAP:');
    results.slice(2).forEach((result, i) => {
      console.log(
        `   ${result.identifier}: ${result.title} (${PRICING_TICKETS[i + 2].estimate} points)`
      );
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

module.exports = { PRICING_TICKETS, createTicket };
