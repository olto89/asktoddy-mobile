#!/usr/bin/env node

/**
 * Sync Linear tickets using the Linear API
 * This script fetches tickets directly from Linear's GraphQL API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CONTEXT_DIR = path.join(__dirname, '..', '.claude-context');
const TICKETS_FILE = path.join(CONTEXT_DIR, 'linear-tickets.json');
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_API_URL = 'https://api.linear.app/graphql';

// Ensure context directory exists
if (!fs.existsSync(CONTEXT_DIR)) {
  fs.mkdirSync(CONTEXT_DIR, { recursive: true });
}

/**
 * Make a GraphQL request to Linear
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
        Authorization: LINEAR_API_KEY,
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

/**
 * Fetch assigned issues from Linear
 */
async function fetchLinearTickets() {
  const query = `
    query {
      viewer {
        id
        name
        email
      }
      issues(
        filter: {
          state: { type: { nin: ["canceled", "duplicate"] } }
        }
        orderBy: updatedAt
      ) {
        nodes {
          id
          identifier
          title
          description
          priority
          state {
            name
            type
          }
          assignee {
            name
            email
          }
          labels {
            nodes {
              name
              color
            }
          }
          project {
            name
          }
          team {
            name
            key
          }
          createdAt
          updatedAt
          url
          estimate
          dueDate
          parent {
            identifier
            title
          }
          children {
            nodes {
              identifier
              title
            }
          }
        }
      }
      teams {
        nodes {
          name
          key
        }
      }
    }
  `;

  try {
    console.log('📋 Fetching Linear tickets via API...');
    const data = await queryLinear(query);

    // Filter for mobile/React Native related tickets
    const allIssues = data.issues.nodes;
    const mobileTickets = allIssues.filter(issue => {
      const titleLower = issue.title.toLowerCase();
      const descLower = (issue.description || '').toLowerCase();
      const labels = issue.labels.nodes.map(l => l.name.toLowerCase());
      const projectName = (issue.project?.name || '').toLowerCase();

      return (
        titleLower.includes('mobile') ||
        titleLower.includes('react native') ||
        titleLower.includes('toddy mobile') ||
        titleLower.includes('app') ||
        descLower.includes('mobile') ||
        descLower.includes('react native') ||
        labels.some(
          label =>
            label.includes('mobile') || label.includes('app') || label.includes('react-native')
        ) ||
        projectName.includes('mobile') ||
        projectName.includes('toddy mobile')
      );
    });

    console.log(`Found ${allIssues.length} total issues, ${mobileTickets.length} mobile-related`);

    return {
      user: data.viewer,
      allTickets: allIssues.map(formatTicket),
      mobileTickets: mobileTickets.map(formatTicket),
      teams: data.teams.nodes,
    };
  } catch (error) {
    console.error('❌ Failed to fetch Linear tickets:', error.message);
    if (!LINEAR_API_KEY) {
      console.log('💡 LINEAR_API_KEY not found in .env file');
    }
    return null;
  }
}

/**
 * Format ticket data
 */
function formatTicket(ticket) {
  return {
    id: ticket.identifier,
    linearId: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.state.name,
    stateType: ticket.state.type,
    priority: ticket.priority,
    priorityLabel: getPriorityLabel(ticket.priority),
    estimate: ticket.estimate,
    dueDate: ticket.dueDate,
    labels: ticket.labels.nodes.map(l => ({
      name: l.name,
      color: l.color,
    })),
    assignee: ticket.assignee?.name || 'Unassigned',
    project: ticket.project?.name,
    team: ticket.team?.name,
    teamKey: ticket.team?.key,
    url: ticket.url,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    parent: ticket.parent
      ? {
          id: ticket.parent.identifier,
          title: ticket.parent.title,
        }
      : null,
    children: ticket.children.nodes.map(c => ({
      id: c.identifier,
      title: c.title,
    })),
  };
}

/**
 * Get priority label
 */
function getPriorityLabel(priority) {
  const labels = {
    0: 'No Priority',
    1: 'Urgent',
    2: 'High',
    3: 'Medium',
    4: 'Low',
  };
  return labels[priority] || 'Unknown';
}

/**
 * Update local tickets file
 */
function updateTicketsFile(data) {
  if (!data) {
    console.log('⚠️  No tickets to update');
    return;
  }

  const { user, allTickets, mobileTickets, teams } = data;

  const ticketsData = {
    lastSynced: new Date().toISOString(),
    user: {
      name: user.name,
      email: user.email,
    },
    teams: teams,
    summary: {
      total: allTickets.length,
      mobile: mobileTickets.length,
    },
    byStatus: mobileTickets.reduce((acc, ticket) => {
      const status = ticket.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push({
        id: ticket.id,
        title: ticket.title,
      });
      return acc;
    }, {}),
    byPriority: mobileTickets.reduce((acc, ticket) => {
      const priority = ticket.priorityLabel;
      if (!acc[priority]) acc[priority] = [];
      acc[priority].push({
        id: ticket.id,
        title: ticket.title,
      });
      return acc;
    }, {}),
    allTickets: allTickets,
    mobileTickets: mobileTickets,
  };

  fs.writeFileSync(TICKETS_FILE, JSON.stringify(ticketsData, null, 2));
  console.log(`✅ Updated ${mobileTickets.length} mobile tickets in ${TICKETS_FILE}`);

  // Print summary
  console.log('\n📊 Mobile Tickets Summary:');
  console.log(`   User: ${user.name} (${user.email})`);
  Object.entries(ticketsData.byStatus).forEach(([status, tickets]) => {
    console.log(`   ${status}: ${tickets.length} ticket(s)`);
  });

  console.log('\n🎯 By Priority:');
  ['Urgent', 'High', 'Medium', 'Low', 'No Priority'].forEach(priority => {
    const tickets = ticketsData.byPriority[priority];
    if (tickets && tickets.length > 0) {
      console.log(`   ${priority}: ${tickets.length} ticket(s)`);
    }
  });
}

/**
 * Create a markdown summary
 */
function createTicketSummary(data) {
  if (!data || !data.mobileTickets) return;

  const summaryFile = path.join(CONTEXT_DIR, 'active-tickets.md');
  const { user, mobileTickets, teams } = data;

  let content = `# Active Linear Tickets (Mobile)\n\n`;
  content += `**Last Updated:** ${new Date().toISOString()}\n`;
  content += `**Assigned to:** ${user.name} (${user.email})\n`;
  content += `**Total Mobile Tickets:** ${mobileTickets.length}\n\n`;

  // Group by status type
  const statusGroups = {
    unstarted: { title: '📋 Not Started', tickets: [] },
    started: { title: '🚧 In Progress', tickets: [] },
    completed: { title: '✅ Completed', tickets: [] },
    canceled: { title: '❌ Canceled', tickets: [] },
  };

  mobileTickets.forEach(ticket => {
    const group = statusGroups[ticket.stateType] || statusGroups['unstarted'];
    group.tickets.push(ticket);
  });

  // Write each group
  Object.values(statusGroups).forEach(group => {
    if (group.tickets.length === 0) return;

    content += `## ${group.title}\n\n`;

    // Sort by priority within each group
    group.tickets.sort((a, b) => (a.priority || 5) - (b.priority || 5));

    group.tickets.forEach(ticket => {
      content += `### [${ticket.id}] ${ticket.title}\n`;
      content += `- **Status:** ${ticket.status}\n`;
      content += `- **Priority:** ${ticket.priorityLabel}\n`;

      if (ticket.project) {
        content += `- **Project:** ${ticket.project}\n`;
      }

      if (ticket.labels.length > 0) {
        content += `- **Labels:** ${ticket.labels.map(l => l.name).join(', ')}\n`;
      }

      if (ticket.estimate) {
        content += `- **Estimate:** ${ticket.estimate} points\n`;
      }

      if (ticket.dueDate) {
        content += `- **Due:** ${new Date(ticket.dueDate).toLocaleDateString()}\n`;
      }

      if (ticket.description) {
        const desc = ticket.description.substring(0, 200);
        content += `\n${desc}${ticket.description.length > 200 ? '...' : ''}\n`;
      }

      content += `\n[View in Linear](${ticket.url})\n\n`;
      content += `---\n\n`;
    });
  });

  // Add quick actions section
  content += `## Quick Actions\n\n`;
  content += `- [Create New Issue](https://linear.app/new)\n`;
  content += `- [View All My Issues](https://linear.app/issues?filter=assigned:me)\n`;
  content += `- [Mobile Project Board](https://linear.app/toddy/project/mobile)\n`;

  fs.writeFileSync(summaryFile, content);
  console.log(`\n📝 Created detailed summary in ${summaryFile}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🔄 Starting Linear API sync...\n');

  if (!LINEAR_API_KEY) {
    console.error('❌ LINEAR_API_KEY not found in environment');
    console.log('💡 Add LINEAR_API_KEY to your .env file');
    process.exit(1);
  }

  // Fetch and update tickets
  const data = await fetchLinearTickets();
  if (data) {
    updateTicketsFile(data);
    createTicketSummary(data);
    console.log('\n✅ Linear sync completed successfully!');

    // Show next actions for high priority items
    const urgent = data.mobileTickets.filter(t => t.priority === 1);
    const high = data.mobileTickets.filter(t => t.priority === 2);

    if (urgent.length > 0) {
      console.log('\n🚨 URGENT tickets requiring immediate attention:');
      urgent.forEach(t => console.log(`   - [${t.id}] ${t.title}`));
    }

    if (high.length > 0) {
      console.log('\n⚡ HIGH priority tickets:');
      high.forEach(t => console.log(`   - [${t.id}] ${t.title}`));
    }
  } else {
    console.log('\n⚠️  Linear sync completed with warnings');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fetchLinearTickets };
