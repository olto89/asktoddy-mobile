/**
 * Create Linear Tickets via API
 * Run with: LINEAR_API_KEY=your_key node create-linear-tickets.js
 */

const { TICKETS } = require('./create-roadmap-tickets.js');

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.log('❌ LINEAR_API_KEY environment variable required');
  console.log('💡 Get your API key from: https://linear.app/settings/api');
  console.log('💡 Then run: LINEAR_API_KEY=your_key node create-linear-tickets.js');
  process.exit(1);
}

// GraphQL mutation to create issue
const CREATE_ISSUE_MUTATION = `
  mutation CreateIssue($input: IssueCreateInput!) {
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
  }
`;

// GraphQL query to get team ID
const GET_TEAMS_QUERY = `
  query Teams {
    teams {
      nodes {
        id
        name
        key
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

async function getTeamId() {
  try {
    const data = await makeLinearRequest(GET_TEAMS_QUERY);
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

  const input = {
    teamId,
    title: ticket.title,
    description: ticket.description,
    priority: priorityMap[ticket.priority] || 3,
    estimate: ticket.estimate,
  };

  try {
    const data = await makeLinearRequest(CREATE_ISSUE_MUTATION, { input });

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
  console.log('🚀 Creating Linear tickets for AskToddy Enhancement Roadmap...\n');

  try {
    // Get team ID
    console.log('📋 Getting team information...');
    const teamId = await getTeamId();
    console.log(`✅ Found AskToddy team: ${teamId}\n`);

    // Create tickets
    console.log('🎫 Creating tickets...\n');
    const results = [];

    for (const ticket of TICKETS) {
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
    console.log(`📊 SUMMARY: Created ${results.length}/${TICKETS.length} tickets`);
    console.log('='.repeat(80));

    results.forEach(result => {
      console.log(`${result.identifier}: ${result.title}`);
    });

    console.log('\n🚀 Next Steps:');
    console.log('1. Check Linear dashboard for new tickets');
    console.log('2. Start with ASK-101 (Pricing Enhancement Pipeline)');
    console.log('3. Begin pricing engine development');
  } catch (error) {
    console.error('❌ Error creating tickets:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createTicket, getTeamId };
