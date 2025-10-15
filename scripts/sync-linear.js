#!/usr/bin/env node

/**
 * Sync Linear tickets with local context
 * This script fetches active Linear tickets and updates the local context
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONTEXT_DIR = path.join(__dirname, '..', '.claude-context');
const TICKETS_FILE = path.join(CONTEXT_DIR, 'linear-tickets.json');

// Ensure context directory exists
if (!fs.existsSync(CONTEXT_DIR)) {
  fs.mkdirSync(CONTEXT_DIR, { recursive: true });
}

/**
 * Fetch tickets from Linear using CLI
 */
function fetchLinearTickets() {
  try {
    console.log('📋 Fetching Linear tickets...');
    
    // Get current user's assigned issues
    const myIssues = execSync('linear issue list --mine --json', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to suppress warnings
    });
    
    const issues = JSON.parse(myIssues || '[]');
    
    // Filter for AskToddy Mobile related tickets
    const mobileTickets = issues.filter(issue => 
      issue.title.toLowerCase().includes('mobile') ||
      issue.title.toLowerCase().includes('react native') ||
      issue.labels?.some(label => 
        label.toLowerCase().includes('mobile') || 
        label.toLowerCase().includes('app')
      )
    );
    
    return mobileTickets.map(ticket => ({
      id: ticket.identifier,
      title: ticket.title,
      description: ticket.description,
      status: ticket.state?.name || 'Unknown',
      priority: ticket.priority,
      labels: ticket.labels || [],
      assignee: ticket.assignee?.name || 'Unassigned',
      url: ticket.url,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }));
    
  } catch (error) {
    console.error('❌ Failed to fetch Linear tickets:', error.message);
    console.log('💡 Make sure you are logged in: linear login');
    return null;
  }
}

/**
 * Update local tickets file
 */
function updateTicketsFile(tickets) {
  if (!tickets) {
    console.log('⚠️  No tickets to update');
    return;
  }
  
  const ticketsData = {
    lastSynced: new Date().toISOString(),
    totalCount: tickets.length,
    tickets: tickets,
    byStatus: tickets.reduce((acc, ticket) => {
      const status = ticket.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(ticket.id);
      return acc;
    }, {})
  };
  
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(ticketsData, null, 2));
  console.log(`✅ Updated ${tickets.length} tickets in ${TICKETS_FILE}`);
  
  // Print summary
  console.log('\n📊 Ticket Summary:');
  Object.entries(ticketsData.byStatus).forEach(([status, ids]) => {
    console.log(`   ${status}: ${ids.length} ticket(s)`);
  });
}

/**
 * Create a markdown summary of active tickets
 */
function createTicketSummary(tickets) {
  if (!tickets || tickets.length === 0) return;
  
  const summaryFile = path.join(CONTEXT_DIR, 'active-tickets.md');
  
  let content = `# Active Linear Tickets\n\n`;
  content += `Last Updated: ${new Date().toISOString()}\n\n`;
  
  // Group by status
  const byStatus = {};
  tickets.forEach(ticket => {
    const status = ticket.status;
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(ticket);
  });
  
  // Write tickets by status
  ['In Progress', 'Todo', 'Backlog', 'Done'].forEach(status => {
    if (byStatus[status] && byStatus[status].length > 0) {
      content += `## ${status}\n\n`;
      byStatus[status].forEach(ticket => {
        content += `### [${ticket.id}] ${ticket.title}\n`;
        if (ticket.description) {
          content += `${ticket.description.substring(0, 200)}...\n`;
        }
        content += `- Priority: ${ticket.priority || 'None'}\n`;
        content += `- [View in Linear](${ticket.url})\n`;
        content += `\n`;
      });
    }
  });
  
  fs.writeFileSync(summaryFile, content);
  console.log(`📝 Created ticket summary in ${summaryFile}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 Starting Linear sync...\n');
  
  // Check if Linear CLI is installed
  try {
    execSync('linear --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Linear CLI not found. Install with: npm install -g @linear/cli');
    process.exit(1);
  }
  
  // Fetch and update tickets
  const tickets = fetchLinearTickets();
  if (tickets) {
    updateTicketsFile(tickets);
    createTicketSummary(tickets);
    console.log('\n✅ Linear sync completed successfully!');
  } else {
    console.log('\n⚠️  Linear sync completed with warnings');
  }
}

// Run the script
if (require.main === module) {
  main();
}