#!/usr/bin/env node

/**
 * Automated Documentation Update System
 * Updates README.md with current session state and progress
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONTEXT_DIR = path.join(__dirname, '..', '.claude-context');
const README_PATH = path.join(__dirname, '..', 'README.md');
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Read current session context
 */
function getCurrentContext() {
  try {
    const sessionFile = path.join(CONTEXT_DIR, 'current-session.json');
    const workLogFile = path.join(CONTEXT_DIR, 'work-log.md');
    const ticketsFile = path.join(CONTEXT_DIR, 'linear-tickets.json');

    const session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    const workLog = fs.readFileSync(workLogFile, 'utf-8');
    const tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf-8'));

    return { session, workLog, tickets };
  } catch (error) {
    console.error('Error reading context:', error);
    return null;
  }
}

/**
 * Get git status information
 */
function getGitStatus() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    }).trim();

    const lastCommit = execSync('git log -1 --oneline', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    }).trim();

    const status = execSync('git status --porcelain', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    }).trim();

    const changedFiles = status.split('\n').filter(Boolean).length;

    return {
      branch,
      lastCommit,
      hasChanges: status.length > 0,
      changedFiles,
    };
  } catch (error) {
    return {
      branch: 'unknown',
      lastCommit: 'No commits',
      hasChanges: false,
      changedFiles: 0,
    };
  }
}

/**
 * Get project statistics
 */
function getProjectStats() {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    );

    // Count TypeScript files
    const tsFiles = execSync('find src -name "*.ts" -o -name "*.tsx" | wc -l', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    }).trim();

    // Count lines of code
    const loc = execSync(
      'find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk \'{print $1}\'',
      { encoding: 'utf-8', cwd: PROJECT_ROOT }
    ).trim();

    return {
      name: packageJson.name,
      version: packageJson.version,
      dependencies: Object.keys(packageJson.dependencies || {}).length,
      devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      tsFiles: parseInt(tsFiles) || 0,
      linesOfCode: parseInt(loc) || 0,
    };
  } catch (error) {
    return {
      name: 'asktoddy-mobile',
      version: '1.0.0',
      dependencies: 0,
      devDependencies: 0,
      tsFiles: 0,
      linesOfCode: 0,
    };
  }
}

/**
 * Generate progress summary from work log
 */
function generateProgressSummary(workLog) {
  const lines = workLog.split('\n');
  const completed = [];
  const inProgress = [];
  const decisions = [];

  let currentSection = '';

  lines.forEach(line => {
    if (line.includes('✅') || line.includes('COMPLETED')) {
      completed.push(line.replace(/^[#\s-]*/, ''));
    } else if (line.includes('🚧') || line.includes('in progress')) {
      inProgress.push(line.replace(/^[#\s-]*/, ''));
    } else if (line.includes('Decisions Made:')) {
      currentSection = 'decisions';
    } else if (currentSection === 'decisions' && line.match(/^\d+\./)) {
      decisions.push(line.replace(/^\d+\.\s*/, ''));
    }
  });

  return {
    completed: completed.slice(0, 5), // Last 5 completed items
    inProgress: inProgress.slice(0, 3), // Current work
    decisions: decisions.slice(0, 5), // Key decisions
  };
}

/**
 * Generate Linear tickets summary
 */
function generateTicketsSummary(tickets) {
  if (!tickets.mobileTickets || tickets.mobileTickets.length === 0) {
    return {
      total: 0,
      byStatus: {},
      urgent: [],
      high: [],
    };
  }

  const byStatus = {};
  const urgent = [];
  const high = [];

  tickets.mobileTickets.forEach(ticket => {
    const status = ticket.status || 'Unknown';
    if (!byStatus[status]) byStatus[status] = 0;
    byStatus[status]++;

    if (ticket.priorityLabel === 'Urgent') {
      urgent.push(ticket);
    } else if (ticket.priorityLabel === 'High') {
      high.push(ticket);
    }
  });

  return {
    total: tickets.mobileTickets.length,
    byStatus,
    urgent: urgent.slice(0, 3),
    high: high.slice(0, 3),
  };
}

/**
 * Generate README content
 */
function generateReadmeContent(context, git, stats, progress, ticketsSummary) {
  const timestamp = new Date().toISOString();

  return `# AskToddy Mobile

> **Last Updated:** ${timestamp}  
> **Branch:** ${git.branch} | **Status:** ${git.hasChanges ? '🔄 In Development' : '✅ Clean'}

## 🚀 **Current Status**

### **Project Progress**
- **Architecture:** API-First with Supabase Edge Functions
- **UI Approach:** Chat-First (ChatGPT-style) with camera integration
- **Current Phase:** ${progress.inProgress.length > 0 ? progress.inProgress[0] : 'Planning Complete'}

### **Technical Stack**
- **Platform:** React Native + Expo ${context.session.project.dependencies.expo}
- **AI Integration:** Google Gemini + OpenAI (switchable providers)
- **Backend:** Supabase Edge Functions
- **Design System:** AskToddy brand colors (Orange #FF6B35, Navy #2C3E50)

## 📊 **Project Statistics**

| Metric | Value |
|--------|-------|
| **TypeScript Files** | ${stats.tsFiles} |
| **Lines of Code** | ${stats.linesOfCode.toLocaleString()} |
| **Dependencies** | ${stats.dependencies} |
| **Dev Dependencies** | ${stats.devDependencies} |
| **Git Changes** | ${git.changedFiles} files |

## 🎯 **Recent Achievements**

${progress.completed.map(item => `- ✅ ${item}`).join('\n')}

## 🚧 **Currently Working On**

${
  progress.inProgress.length > 0
    ? progress.inProgress.map(item => `- 🔄 ${item}`).join('\n')
    : '- 📋 Ready for next sprint'
}

## 📋 **Linear Tickets Summary**

**Total Mobile Tickets:** ${ticketsSummary.total}

### **By Status:**
${Object.entries(ticketsSummary.byStatus)
  .map(([status, count]) => `- **${status}:** ${count} ticket(s)`)
  .join('\n')}

### **🚨 Urgent Priorities:**
${
  ticketsSummary.urgent.length > 0
    ? ticketsSummary.urgent.map(t => `- [${t.id}] ${t.title}`).join('\n')
    : '- No urgent tickets'
}

### **⚡ High Priority:**
${
  ticketsSummary.high.length > 0
    ? ticketsSummary.high.map(t => `- [${t.id}] ${t.title}`).join('\n')
    : '- No high priority tickets'
}

## 🏗️ **Architecture Decisions**

${progress.decisions.map(decision => `- 📋 ${decision}`).join('\n')}

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator

### **Setup**
\`\`\`bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android  
npm run android
\`\`\`

### **Context Management**
\`\`\`bash
# Save current session
npm run context:save

# Sync Linear tickets
npm run context:linear

# Full context sync
npm run context:sync

# Quick status check
npm run claude:resume
\`\`\`

## 📁 **Project Structure**

\`\`\`
asktoddy-mobile/
├── src/
│   ├── components/ui/          # Reusable UI components
│   ├── screens/               # App screens
│   ├── services/              # Business logic services
│   │   ├── ai/               # AI middleware & providers
│   │   └── pricing/          # UK construction pricing
│   ├── contexts/             # React contexts
│   ├── navigation/           # Navigation setup
│   └── styles/               # Design system
├── .claude-context/          # Session persistence
│   ├── current-session.json  # Latest session state
│   ├── work-log.md           # Development history
│   ├── linear-tickets.json   # Synced tickets
│   └── recovery-checklist.md # Recovery procedures
└── scripts/                  # Automation scripts
    ├── sync-linear-api.js    # Linear integration
    ├── save-context.js       # Context management
    └── update-documentation.js # This script
\`\`\`

## 🔧 **Available Scripts**

| Command | Description |
|---------|-------------|
| \`npm start\` | Start Expo development server |
| \`npm run ios\` | Run on iOS simulator |
| \`npm run android\` | Run on Android emulator |
| \`npm run context:save\` | Save current session state |
| \`npm run context:linear\` | Sync Linear tickets |
| \`npm run context:sync\` | Save context + sync tickets |
| \`npm run claude:resume\` | Quick context check |
| \`npm run docs:update\` | Update this README |
| \`npm run git:checkpoint\` | Create checkpoint commit |

## 🔄 **Context Recovery**

If starting a new Claude session:

1. **Quick Recovery:**
   \`\`\`bash
   npm run claude:resume
   \`\`\`

2. **Full Context:**
   \`\`\`bash
   cat .claude-context/work-log.md
   cat .claude-context/linear-tickets.json
   \`\`\`

3. **Next Steps:**
   Check \`.claude-context/api-first-roadmap.md\` for detailed implementation plan.

## 📞 **Key Information**

- **Linear API:** Configured with \`lin_api_ArBBR9NahN2lhArFLCRsnM6Fo722k6AsHOx35ue3\`
- **Supabase:** Ready for Edge Functions deployment
- **AI Providers:** Gemini (primary) + OpenAI (secondary) + Mock (fallback)
- **Git Branch:** ${git.branch}
- **Last Commit:** ${git.lastCommit}

## 🎯 **Next Session Priorities**

1. Create detailed Linear tickets from \`.claude-context/linear-tickets-api-first.md\`
2. Start Week 1: Supabase Edge Functions setup
3. Migrate AIMiddleware (455 lines) to Edge Function
4. Build UK pricing services integration
5. Implement OpenAI provider for LLM switching

---

**🤖 Auto-generated by \`npm run docs:update\` on ${timestamp}**

*For detailed technical documentation, see \`.claude-context/\` directory.*`;
}

/**
 * Update README.md
 */
function updateReadme() {
  console.log('📚 Updating README.md with current project state...');

  const context = getCurrentContext();
  if (!context) {
    console.error('❌ Failed to read context files');
    return false;
  }

  const git = getGitStatus();
  const stats = getProjectStats();
  const progress = generateProgressSummary(context.workLog);
  const ticketsSummary = generateTicketsSummary(context.tickets);

  const readmeContent = generateReadmeContent(context, git, stats, progress, ticketsSummary);

  try {
    fs.writeFileSync(README_PATH, readmeContent);
    console.log('✅ README.md updated successfully');

    // Update last documentation update time
    const metadataFile = path.join(CONTEXT_DIR, 'documentation-metadata.json');
    const metadata = {
      lastUpdate: new Date().toISOString(),
      readmeLength: readmeContent.length,
      sectionsGenerated: [
        'Project Progress',
        'Technical Stack',
        'Recent Achievements',
        'Linear Tickets',
        'Architecture Decisions',
        'Quick Start Guide',
      ],
      stats: {
        totalTickets: ticketsSummary.total,
        completedTasks: progress.completed.length,
        inProgressTasks: progress.inProgress.length,
        gitChanges: git.changedFiles,
      },
    };

    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    console.log('📊 Documentation metadata updated');

    return true;
  } catch (error) {
    console.error('❌ Failed to write README.md:', error);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('📚 Starting documentation update...\n');

  const success = updateReadme();

  if (success) {
    console.log('\n✅ Documentation update completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - README.md updated with current project state');
    console.log('   - Linear tickets summary included');
    console.log('   - Progress tracking updated');
    console.log('   - Recovery instructions updated');
    console.log(
      '\n💡 Run "git add README.md && git commit -m \'docs: update README with current progress\'" to commit changes'
    );
  } else {
    console.log('\n❌ Documentation update failed');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateReadme, getCurrentContext };
