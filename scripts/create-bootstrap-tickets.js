#!/usr/bin/env node

/**
 * Create Linear tickets for bootstrap urgent fixes
 * This script creates specific tickets for the bootstrap pricing improvements
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_API_URL = 'https://api.linear.app/graphql';

/**
 * Make a GraphQL request to Linear
 */
function queryLinear(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });

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
            console.error('GraphQL errors:', result.errors);
            reject(new Error(result.errors[0]?.message || 'Unknown GraphQL error'));
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

/**
 * Get team ID for creating tickets
 */
async function getTeamId() {
  const query = `
    query {
      teams {
        nodes {
          id
          key
          name
        }
      }
    }
  `;

  const result = await queryLinear(query);
  const team = result.teams.nodes.find(
    t => t.key === 'ASK' || t.name.toLowerCase().includes('asktoddy')
  );

  if (!team) {
    throw new Error('Could not find ASK team');
  }

  return team.id;
}

/**
 * Get label IDs for bootstrap tags
 */
async function getLabelIds() {
  const query = `
    query {
      issueLabels {
        nodes {
          id
          name
          color
        }
      }
    }
  `;

  const result = await queryLinear(query);
  const labels = {};

  // Find existing labels or we'll create tickets without them
  result.issueLabels.nodes.forEach(label => {
    if (label.name === 'bootstrap') labels.bootstrap = label.id;
    if (label.name === 'pricing') labels.pricing = label.id;
    if (label.name === 'quick-win') labels.quickWin = label.id;
    if (label.name === 'deployment') labels.deployment = label.id;
  });

  return labels;
}

/**
 * Create a Linear ticket
 */
async function createTicket(teamId, title, description, priority = 1, estimate = 1, labelIds = []) {
  const mutation = `
    mutation CreateIssue($teamId: String!, $title: String!, $description: String, $priority: Int, $estimate: Int, $labelIds: [String!]) {
      issueCreate(input: {
        teamId: $teamId
        title: $title
        description: $description
        priority: $priority
        estimate: $estimate
        labelIds: $labelIds
      }) {
        success
        issue {
          id
          identifier
          title
        }
      }
    }
  `;

  const variables = {
    teamId,
    title,
    description,
    priority,
    estimate,
    labelIds: labelIds.filter(Boolean), // Remove any undefined/null values
  };

  const result = await queryLinear(mutation, variables);
  return result.issueCreate;
}

/**
 * Bootstrap tickets to create
 */
const bootstrapTickets = [
  {
    title: '🚀 Bootstrap: Update London Regional Multiplier',
    description: `Update London regional multiplier from 1.25x to 1.35x in LocationService.ts to match bootstrap pricing strategy. Simple one-line change that improves London pricing accuracy.

**Acceptance Criteria:**
- London multiplier changed from 1.25 to 1.35 in UK_REGIONS
- Stable endpoint uses updated multiplier  
- Test with London postcode confirms 1.35x pricing

**Files to modify:**
- LocationService.ts (UK_REGIONS constant)

**Impact:** 
- Improves London pricing accuracy from 60% to ~65%
- Zero cost implementation
- One-line change`,
    priority: 1, // Urgent
    estimate: 1,
    labels: ['bootstrap', 'pricing', 'quick-win'],
  },
  {
    title: '🚀 Bootstrap: Implement Seasonal Pricing Adjustments',
    description: `Add seasonal multipliers to stable calculation endpoint. Spring/Summer building boom (+10%), Winter slower period (-5%), Autumn normal (1.0x).

**Acceptance Criteria:**
- Seasonal multiplier function implemented
- Integrated into MaterialCalculationService
- March-August: 1.10x multiplier
- November-February: 0.95x multiplier  
- September-October: 1.0x multiplier

**Implementation Notes:**
- Add getSeasonalMultiplier() function
- Integrate into existing pricing calculation
- Use JavaScript Date() to determine current season

**Impact:**
- Accounts for construction industry seasonal patterns
- Improves accuracy by ~5-8%
- Zero cost implementation`,
    priority: 1, // Urgent
    estimate: 2,
    labels: ['bootstrap', 'pricing', 'quick-win'],
  },
  {
    title: '🚀 Bootstrap: Add Project Size Scaling',
    description: `Implement project size multipliers for economies of scale. Large projects get bulk discounts, small projects have premium pricing due to setup costs.

**Acceptance Criteria:**
- Size multiplier function implemented
- >50m²: 0.92x (8% discount for economies of scale)
- 25-50m²: 0.96x (4% discount)
- <10m²: 1.08x (8% premium for small jobs)
- 10-25m²: 1.0x (standard pricing)

**Implementation Notes:**
- Add getProjectSizeMultiplier(estimatedArea) function
- Integrate into existing pricing calculation
- Handle cases where area is not provided (default to 1.0x)

**Impact:**
- Reflects real-world pricing economics
- Improves accuracy by ~3-5%
- Zero cost implementation`,
    priority: 1, // Urgent
    estimate: 2,
    labels: ['bootstrap', 'pricing', 'quick-win'],
  },
  {
    title: '🚀 Bootstrap: Deploy Updated Stable Endpoint',
    description: `Deploy the stable calculation endpoint with all bootstrap improvements (regional, seasonal, size scaling) and verify 75%+ accuracy improvement.

**Acceptance Criteria:**
- All multipliers integrated into stable endpoint
- Deployment successful to staging and production
- Test cases confirm all multipliers working
- Documentation updated with new accuracy expectations

**Dependencies:**
- London Regional Multiplier (ASK-X)
- Seasonal Pricing Adjustments (ASK-Y)  
- Project Size Scaling (ASK-Z)

**Testing Plan:**
- Test London postcodes show 1.35x multiplier
- Test different seasons apply correct multipliers
- Test different project sizes apply correct scaling
- Verify combined multipliers work correctly

**Impact:**
- Deploys all bootstrap improvements together
- Expected accuracy improvement from 60% to 75%+
- Zero cost implementation`,
    priority: 2, // High (depends on others being complete)
    estimate: 1,
    labels: ['bootstrap', 'deployment', 'quick-win'],
  },
];

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Creating Linear tickets for bootstrap urgent fixes...\n');

    if (!LINEAR_API_KEY) {
      throw new Error('LINEAR_API_KEY environment variable is required');
    }

    // Get team and label information
    console.log('📋 Getting team information...');
    const teamId = await getTeamId();
    console.log(`✅ Found team ID: ${teamId}\n`);

    console.log('🏷️ Getting label information...');
    const labels = await getLabelIds();
    console.log(`✅ Found labels: ${Object.keys(labels).join(', ')}\n`);

    // Create each ticket
    const createdTickets = [];

    for (let i = 0; i < bootstrapTickets.length; i++) {
      const ticket = bootstrapTickets[i];
      const labelIds = ticket.labels
        .map(labelName => {
          // Map label names to IDs
          if (labelName === 'quick-win') return labels.quickWin;
          return labels[labelName];
        })
        .filter(Boolean);

      console.log(`📝 Creating ticket ${i + 1}/4: ${ticket.title}...`);

      try {
        const result = await createTicket(
          teamId,
          ticket.title,
          ticket.description,
          ticket.priority,
          ticket.estimate,
          labelIds
        );

        if (result.success) {
          console.log(`✅ Created: ${result.issue.identifier} - ${result.issue.title}`);
          createdTickets.push(result.issue);
        } else {
          console.log(`❌ Failed to create ticket: ${ticket.title}`);
        }
      } catch (error) {
        console.error(`❌ Error creating ticket "${ticket.title}":`, error.message);
      }

      console.log(''); // Add spacing between tickets
    }

    // Summary
    console.log('📊 Bootstrap Tickets Summary:');
    console.log(`✅ Successfully created: ${createdTickets.length}/4 tickets`);
    console.log('\n🎯 Created tickets:');
    createdTickets.forEach(ticket => {
      console.log(`   - ${ticket.identifier}: ${ticket.title}`);
    });

    if (createdTickets.length === 4) {
      console.log('\n🚀 All bootstrap tickets created successfully!');
      console.log(
        '💡 These quick wins can improve pricing accuracy from 60% to 75% with zero cost.'
      );
      console.log(
        '⚡ Ready to implement this week - start with the London multiplier for immediate impact.'
      );
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
