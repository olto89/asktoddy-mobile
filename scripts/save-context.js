#!/usr/bin/env node

/**
 * Save current session context
 * This script updates the session state for Claude to recover from
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONTEXT_DIR = path.join(__dirname, '..', '.claude-context');
const SESSION_FILE = path.join(CONTEXT_DIR, 'current-session.json');

// Ensure context directory exists
if (!fs.existsSync(CONTEXT_DIR)) {
  fs.mkdirSync(CONTEXT_DIR, { recursive: true });
}

/**
 * Get current git status
 */
function getGitStatus() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf-8' }).trim();
    const status = execSync('git status --short', { encoding: 'utf-8' }).trim();
    
    return {
      branch,
      lastCommit,
      hasUncommittedChanges: status.length > 0,
      changedFiles: status.split('\n').filter(Boolean).length
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get running processes
 */
function getRunningProcesses() {
  const processes = [];
  
  // Check if Expo is running
  try {
    execSync('lsof -i :8081', { stdio: 'ignore' });
    processes.push({
      command: 'npm start',
      port: 8081,
      status: 'running',
      service: 'Expo Dev Server'
    });
  } catch (e) {
    // Port 8081 not in use
  }
  
  // Check if Metro is running
  try {
    execSync('lsof -i :19001', { stdio: 'ignore' });
    processes.push({
      command: 'metro',
      port: 19001,
      status: 'running',
      service: 'Metro Bundler'
    });
  } catch (e) {
    // Port 19001 not in use
  }
  
  return processes;
}

/**
 * Get recently modified files
 */
function getRecentFiles() {
  try {
    // Get files modified in the last 24 hours
    const files = execSync(
      'find src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) -mtime -1 | head -20',
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    ).trim().split('\n').filter(Boolean);
    
    return files;
  } catch (error) {
    return [];
  }
}

/**
 * Read package.json for project info
 */
function getProjectInfo() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
  );
  
  return {
    name: packageJson.name,
    version: packageJson.version,
    dependencies: {
      expo: packageJson.dependencies?.expo,
      'react-native': packageJson.dependencies?.['react-native'],
      '@google/generative-ai': packageJson.dependencies?.['@google/generative-ai']
    }
  };
}

/**
 * Update session file
 */
function updateSession(customData = {}) {
  const existingSession = fs.existsSync(SESSION_FILE) 
    ? JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'))
    : {};
  
  const session = {
    ...existingSession,
    lastUpdated: new Date().toISOString(),
    project: getProjectInfo(),
    git: getGitStatus(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ...existingSession.environment
    },
    runningProcesses: getRunningProcesses(),
    recentFiles: getRecentFiles(),
    ...customData
  };
  
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
  console.log(`✅ Session context saved to ${SESSION_FILE}`);
  
  return session;
}

/**
 * Main execution
 */
function main() {
  console.log('💾 Saving session context...\n');
  
  const session = updateSession();
  
  console.log('📊 Session Summary:');
  console.log(`   Project: ${session.project.name} v${session.project.version}`);
  if (session.git) {
    console.log(`   Git Branch: ${session.git.branch}`);
    console.log(`   Uncommitted Changes: ${session.git.changedFiles} files`);
  }
  console.log(`   Running Processes: ${session.runningProcesses.length}`);
  console.log(`   Recent Files: ${session.recentFiles.length}`);
  
  console.log('\n✅ Context saved successfully!');
  console.log('💡 Run "npm run context:sync" to sync with Linear');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateSession };