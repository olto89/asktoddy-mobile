#!/usr/bin/env node

/**
 * Update completed pricing enhancement tickets to Done status
 */

const https = require('https');
require('dotenv').config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.log('❌ LINEAR_API_KEY environment variable required');
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

// Tickets to mark as completed
const COMPLETED_TICKETS = ['ASK-54', 'ASK-55'];

async function getTeamWorkflowStates(teamId) {
  const query = `
    query {
      workflowStates(filter: { team: { id: { eq: "${teamId}" } } }) {
        nodes {
          id
          name
          type
          team {
            id
          }
        }
      }
    }
  `;

  try {
    const data = await queryLinear(query);
    return data.workflowStates.nodes;
  } catch (error) {
    console.error('Error getting workflow states:', error.message);
    throw error;
  }
}

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
      throw new Error('AskToddy team not found');
    }

    return askToddyTeam.id;
  } catch (error) {
    console.error('Error getting team ID:', error.message);
    throw error;
  }
}

async function updateTicketStatus(ticketIdentifier, stateId) {
  const mutation = `
    mutation {
      issueUpdate(id: "${ticketIdentifier}", input: { stateId: "${stateId}" }) {
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

  try {
    const data = await queryLinear(mutation);

    if (data.issueUpdate.success) {
      return data.issueUpdate.issue;
    } else {
      throw new Error('Issue update failed');
    }
  } catch (error) {
    console.error(`❌ Failed to update ${ticketIdentifier}:`, error.message);
    return null;
  }
}

async function getIssueId(identifier) {
  const query = `
    query {
      issue(id: "${identifier}") {
        id
        identifier
        title
      }
    }
  `;

  try {
    const data = await queryLinear(query);
    return data.issue;
  } catch (error) {
    console.error(`Error getting issue ${identifier}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔄 Updating completed pricing enhancement tickets...\n');

  try {
    // Get team ID
    console.log('📋 Getting team information...');
    const teamId = await getTeamId();
    console.log(`✅ Found AskToddy team: ${teamId}`);

    // Get workflow states
    console.log('🔄 Getting workflow states...');
    const workflowStates = await getTeamWorkflowStates(teamId);
    console.log(`✅ Found ${workflowStates.length} workflow states`);

    // Find the "Done" or "Completed" state
    const doneState = workflowStates.find(
      state =>
        state.name.toLowerCase().includes('done') ||
        state.name.toLowerCase().includes('completed') ||
        state.type === 'completed'
    );

    if (!doneState) {
      console.log(
        'Available states:',
        workflowStates.map(s => s.name)
      );
      throw new Error('No "Done" or "Completed" state found');
    }

    console.log(`✅ Found completion state: "${doneState.name}" (${doneState.id})\n`);

    // Update completed tickets
    console.log('🎫 Updating completed tickets...\n');

    for (const ticketIdentifier of COMPLETED_TICKETS) {
      console.log(`Updating ${ticketIdentifier} to Done...`);

      // Get the issue first
      const issue = await getIssueId(ticketIdentifier);
      if (!issue) {
        console.log(`❌ Could not find issue ${ticketIdentifier}`);
        continue;
      }

      // Update to Done state
      const result = await updateTicketStatus(issue.id, doneState.id);

      if (result) {
        console.log(`✅ Updated: ${result.identifier} - Status: ${result.state.name}`);
      }

      console.log(''); // Empty line

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('='.repeat(80));
    console.log(`📊 STATUS UPDATE SUMMARY`);
    console.log('='.repeat(80));
    console.log(`✅ Updated ${COMPLETED_TICKETS.length} tickets to "Done" status`);
    console.log('\n📋 COMPLETED TICKETS:');
    console.log('   ASK-54: ✅ Stable Material Calculation System');
    console.log('   ASK-55: ✅ Pricing Enhancement Pipeline');
    console.log('\n🚀 FUTURE TICKETS (Todo):');
    console.log('   ASK-56: 🚀 Quote Comparison System');
    console.log('   ASK-57: 🚀 Supplier API Integration');
    console.log('   ASK-58: 🚀 ML Price Prediction Model');
  } catch (error) {
    console.error('❌ Error updating tickets:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
