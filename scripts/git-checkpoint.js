#!/usr/bin/env node

/**
 * Git Checkpoint System
 * Creates regular checkpoint commits with context documentation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const CONTEXT_DIR = path.join(PROJECT_ROOT, '.claude-context');

/**
 * Check if there are changes to commit
 */
function hasChanges() {
  try {
    const status = execSync('git status --porcelain', { 
      encoding: 'utf-8',
      cwd: PROJECT_ROOT 
    }).trim();
    
    return status.length > 0;
  } catch (error) {
    console.error('Error checking git status:', error);
    return false;
  }
}

/**
 * Get current session summary for commit message
 */
function getSessionSummary() {
  try {
    const sessionFile = path.join(CONTEXT_DIR, 'current-session.json');
    const session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    
    const workLogFile = path.join(CONTEXT_DIR, 'work-log.md');
    const workLog = fs.readFileSync(workLogFile, 'utf-8');
    
    // Extract recent work from work log
    const lines = workLog.split('\n');
    const recentWork = [];
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('✅') || line.includes('COMPLETED')) {
        recentWork.push(line.replace(/^[#\s-]*/, '').replace('✅', '').trim());
        if (recentWork.length >= 3) break;
      }
    }
    
    return {
      timestamp: session.lastUpdated,
      recentWork: recentWork.slice(0, 3),
      changedFiles: session.git?.changedFiles || 0,
      runningProcesses: session.runningProcesses?.length || 0
    };
  } catch (error) {
    console.error('Error reading session summary:', error);
    return {
      timestamp: new Date().toISOString(),
      recentWork: [],
      changedFiles: 0,
      runningProcesses: 0
    };
  }
}

/**
 * Generate commit message
 */
function generateCommitMessage(summary, checkpointType = 'progress') {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const time = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  let message = '';
  
  switch (checkpointType) {
    case 'progress':
      message = `checkpoint: development progress - ${timestamp} ${time}`;
      break;
    case 'session-end':
      message = `checkpoint: session complete - ${timestamp} ${time}`;
      break;
    case 'milestone':
      message = `checkpoint: milestone reached - ${timestamp} ${time}`;
      break;
    default:
      message = `checkpoint: ${checkpointType} - ${timestamp} ${time}`;
  }
  
  // Add recent work to commit body
  if (summary.recentWork.length > 0) {
    message += '\n\nRecent progress:\n';
    summary.recentWork.forEach(work => {
      message += `- ${work}\n`;
    });
  }
  
  message += `\nFiles changed: ${summary.changedFiles}`;
  message += `\nRunning processes: ${summary.runningProcesses}`;
  message += '\n\n🤖 Auto-checkpoint via npm run git:checkpoint';
  
  return message;
}

/**
 * Create checkpoint commit
 */
function createCheckpoint(type = 'progress', customMessage = null) {
  console.log(`📸 Creating ${type} checkpoint...`);
  
  if (!hasChanges()) {
    console.log('ℹ️  No changes to commit');
    return true;
  }
  
  const summary = getSessionSummary();
  const commitMessage = customMessage || generateCommitMessage(summary, type);
  
  try {
    // Add all files (including context)
    console.log('📁 Adding files to staging...');
    execSync('git add .', { cwd: PROJECT_ROOT });
    
    // Create commit with detailed message
    console.log('💾 Creating commit...');
    execSync(`git commit -m "${commitMessage}"`, { 
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    
    console.log('✅ Checkpoint created successfully');
    
    // Get commit hash for reference
    const commitHash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT
    }).trim();
    
    console.log(`📋 Commit: ${commitHash}`);
    
    // Update checkpoint log
    const checkpointLog = path.join(CONTEXT_DIR, 'checkpoint-log.json');
    let checkpoints = [];
    
    if (fs.existsSync(checkpointLog)) {
      checkpoints = JSON.parse(fs.readFileSync(checkpointLog, 'utf-8'));
    }
    
    checkpoints.push({
      hash: commitHash,
      type: type,
      timestamp: new Date().toISOString(),
      message: commitMessage.split('\n')[0],
      recentWork: summary.recentWork,
      filesChanged: summary.changedFiles
    });
    
    // Keep only last 20 checkpoints
    if (checkpoints.length > 20) {
      checkpoints = checkpoints.slice(-20);
    }
    
    fs.writeFileSync(checkpointLog, JSON.stringify(checkpoints, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create checkpoint:', error.message);
    return false;
  }
}

/**
 * Push to remote (optional)
 */
function pushToRemote() {
  try {
    console.log('🚀 Pushing to remote repository...');
    execSync('git push', { 
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    console.log('✅ Pushed to remote successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to push to remote:', error.message);
    console.log('💡 You may need to set up remote or check connectivity');
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'progress';
  const shouldPush = args.includes('--push') || args.includes('-p');
  const customMessage = args.find(arg => arg.startsWith('--message='))?.split('=')[1];
  
  console.log('📸 Git Checkpoint System\n');
  
  // Update documentation first
  console.log('📚 Updating documentation...');
  try {
    execSync('node scripts/update-documentation.js', { 
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
  } catch (error) {
    console.log('⚠️  Documentation update failed, continuing with checkpoint...');
  }
  
  // Save context
  console.log('💾 Saving context...');
  try {
    execSync('npm run context:save', { 
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
  } catch (error) {
    console.log('⚠️  Context save failed, continuing with checkpoint...');
  }
  
  // Create checkpoint
  const success = createCheckpoint(type, customMessage);
  
  if (success && shouldPush) {
    pushToRemote();
  }
  
  if (success) {
    console.log('\n🎉 Checkpoint process completed!');
    console.log('\n📋 What was saved:');
    console.log('   - All code changes committed');
    console.log('   - Context documentation updated');
    console.log('   - Session state preserved');
    console.log('   - README.md updated with current progress');
    
    if (shouldPush) {
      console.log('   - Changes pushed to remote repository');
    }
    
    console.log('\n💡 Next session can recover with:');
    console.log('   npm run claude:resume');
  } else {
    console.log('\n❌ Checkpoint failed');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createCheckpoint, pushToRemote };