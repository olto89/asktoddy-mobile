#!/usr/bin/env node

/**
 * Linear Webhook Server
 * Receives webhook events from Linear and updates local context
 * 
 * To use:
 * 1. Run this server: node scripts/linear-webhook-server.js
 * 2. Use ngrok to expose it: ngrok http 3333
 * 3. Add webhook URL to Linear settings: https://linear.app/settings/api/webhooks
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const PORT = process.env.LINEAR_WEBHOOK_PORT || 3333;
const LINEAR_WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET || 'your_webhook_secret';
const CONTEXT_DIR = path.join(__dirname, '..', '.claude-context');
const EVENTS_FILE = path.join(CONTEXT_DIR, 'linear-events.json');

// Import the sync function
const { fetchLinearTickets } = require('./sync-linear-api');

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  const hash = crypto
    .createHmac('sha256', LINEAR_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return `sha256=${hash}` === signature;
}

/**
 * Process webhook event
 */
async function processWebhookEvent(event) {
  console.log(`📨 Processing ${event.type} event for ${event.data?.identifier || 'unknown'}`);
  
  // Log event
  logEvent(event);
  
  // Handle different event types
  switch (event.type) {
    case 'Issue':
      await handleIssueEvent(event);
      break;
    case 'IssueComment':
      await handleCommentEvent(event);
      break;
    case 'Project':
      await handleProjectEvent(event);
      break;
    default:
      console.log(`   Unhandled event type: ${event.type}`);
  }
  
  // Update work log with important events
  if (shouldUpdateWorkLog(event)) {
    updateWorkLog(event);
  }
}

/**
 * Handle issue events
 */
async function handleIssueEvent(event) {
  const issue = event.data;
  const action = event.action;
  
  console.log(`   Issue ${action}: [${issue.identifier}] ${issue.title}`);
  
  // Check if it's mobile related
  if (isMobileRelated(issue)) {
    console.log('   📱 Mobile ticket detected - updating context');
    
    // Trigger full sync
    const data = await fetchLinearTickets();
    if (data) {
      updateLocalContext(data);
    }
    
    // Send notification to terminal
    console.log('\n🔔 NOTIFICATION: Mobile ticket updated!');
    console.log(`   [${issue.identifier}] ${issue.title}`);
    console.log(`   Status: ${issue.state?.name || 'Unknown'}`);
    console.log(`   Priority: ${getPriorityLabel(issue.priority)}`);
  }
}

/**
 * Handle comment events
 */
async function handleCommentEvent(event) {
  const comment = event.data;
  console.log(`   Comment added to [${comment.issue?.identifier}]`);
}

/**
 * Handle project events
 */
async function handleProjectEvent(event) {
  const project = event.data;
  console.log(`   Project ${event.action}: ${project.name}`);
}

/**
 * Check if issue is mobile related
 */
function isMobileRelated(issue) {
  const title = (issue.title || '').toLowerCase();
  const description = (issue.description || '').toLowerCase();
  const labels = (issue.labels?.nodes || []).map(l => l.name.toLowerCase());
  
  return title.includes('mobile') ||
         title.includes('react native') ||
         title.includes('app') ||
         description.includes('mobile') ||
         description.includes('react native') ||
         labels.some(l => l.includes('mobile') || l.includes('app'));
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
    4: 'Low'
  };
  return labels[priority] || 'Unknown';
}

/**
 * Log event to file
 */
function logEvent(event) {
  const eventsFile = path.join(CONTEXT_DIR, 'linear-events.json');
  
  let events = [];
  if (fs.existsSync(eventsFile)) {
    events = JSON.parse(fs.readFileSync(eventsFile, 'utf-8'));
  }
  
  // Add new event
  events.unshift({
    timestamp: new Date().toISOString(),
    type: event.type,
    action: event.action,
    identifier: event.data?.identifier,
    title: event.data?.title,
    url: event.url
  });
  
  // Keep only last 50 events
  events = events.slice(0, 50);
  
  fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
}

/**
 * Should update work log
 */
function shouldUpdateWorkLog(event) {
  // Update for important issue events
  if (event.type === 'Issue') {
    const importantActions = ['create', 'update', 'remove'];
    const importantStates = ['started', 'completed', 'canceled'];
    
    return importantActions.includes(event.action) ||
           (event.action === 'update' && 
            event.updatedFrom?.state?.type !== event.data?.state?.type &&
            importantStates.includes(event.data?.state?.type));
  }
  
  return false;
}

/**
 * Update work log
 */
function updateWorkLog(event) {
  const workLogFile = path.join(CONTEXT_DIR, 'work-log.md');
  let content = fs.readFileSync(workLogFile, 'utf-8');
  
  const timestamp = new Date().toISOString();
  const entry = `\n### Linear Update - ${timestamp}\n`;
  const issue = event.data;
  
  let update = entry;
  update += `- **Ticket:** [${issue.identifier}] ${issue.title}\n`;
  update += `- **Action:** ${event.action}\n`;
  update += `- **Status:** ${issue.state?.name || 'Unknown'}\n`;
  update += `- **URL:** ${issue.url}\n\n`;
  
  // Append to work log
  content += update;
  fs.writeFileSync(workLogFile, content);
  
  console.log('   📝 Updated work log');
}

/**
 * Update local context files
 */
function updateLocalContext(data) {
  const ticketsFile = path.join(CONTEXT_DIR, 'linear-tickets.json');
  
  const ticketsData = {
    lastSynced: new Date().toISOString(),
    lastWebhookUpdate: new Date().toISOString(),
    user: data.user,
    teams: data.teams,
    summary: {
      total: data.allTickets.length,
      mobile: data.mobileTickets.length
    },
    mobileTickets: data.mobileTickets
  };
  
  fs.writeFileSync(ticketsFile, JSON.stringify(ticketsData, null, 2));
  console.log('   ✅ Updated local tickets file');
}

/**
 * Create HTTP server
 */
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // Verify signature (if configured)
        const signature = req.headers['linear-signature'];
        if (LINEAR_WEBHOOK_SECRET !== 'your_webhook_secret' && signature) {
          if (!verifyWebhookSignature(body, signature)) {
            console.log('❌ Invalid webhook signature');
            res.writeHead(401);
            res.end('Unauthorized');
            return;
          }
        }
        
        // Parse and process event
        const event = JSON.parse(body);
        await processWebhookEvent(event);
        
        res.writeHead(200);
        res.end('OK');
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

/**
 * Start server
 */
function startServer() {
  server.listen(PORT, () => {
    console.log(`🚀 Linear webhook server running on http://localhost:${PORT}`);
    console.log('\n📋 Setup Instructions:');
    console.log('1. Install ngrok: brew install ngrok');
    console.log(`2. Expose local server: ngrok http ${PORT}`);
    console.log('3. Copy the HTTPS URL from ngrok');
    console.log('4. Go to Linear Settings > API > Webhooks');
    console.log('5. Create webhook with:');
    console.log(`   - URL: <ngrok-url>/webhook`);
    console.log('   - Events: Issue (all), IssueComment (all), Project (all)');
    console.log('6. Save the webhook secret to .env as LINEAR_WEBHOOK_SECRET');
    console.log('\n✅ Ready to receive webhooks!');
    console.log('Press Ctrl+C to stop\n');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down webhook server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
if (require.main === module) {
  startServer();
}