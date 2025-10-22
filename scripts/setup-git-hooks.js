#!/usr/bin/env node

/**
 * Setup Git Hooks for Automatic Documentation
 * Installs pre-commit and post-commit hooks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const GIT_HOOKS_DIR = path.join(PROJECT_ROOT, '.git', 'hooks');

/**
 * Create pre-commit hook
 */
function createPreCommitHook() {
  const hookContent = `#!/bin/sh
#
# Pre-commit hook: Update documentation before commit
#

echo "📚 Updating documentation before commit..."

# Update README.md with current state
node scripts/update-documentation.js

# Add updated README to staging if it was modified
if git diff --cached --name-only | grep -q "README.md"; then
  echo "📋 README.md already staged"
else
  if git diff --name-only | grep -q "README.md"; then
    echo "📋 Adding updated README.md to staging"
    git add README.md
  fi
fi

# Save context before commit
npm run context:save > /dev/null 2>&1

echo "✅ Pre-commit documentation update completed"
`;

  const hookPath = path.join(GIT_HOOKS_DIR, 'pre-commit');

  try {
    fs.writeFileSync(hookPath, hookContent);
    execSync(`chmod +x "${hookPath}"`);
    console.log('✅ Pre-commit hook installed');
    return true;
  } catch (error) {
    console.error('❌ Failed to install pre-commit hook:', error);
    return false;
  }
}

/**
 * Create post-commit hook
 */
function createPostCommitHook() {
  const hookContent = `#!/bin/sh
#
# Post-commit hook: Update context after commit
#

echo "📊 Updating context after commit..."

# Update session context with new commit info
npm run context:save > /dev/null 2>&1

# Update Linear tickets if API key is available
if [ -n "$LINEAR_API_KEY" ]; then
  npm run context:linear > /dev/null 2>&1
fi

echo "✅ Post-commit context update completed"
`;

  const hookPath = path.join(GIT_HOOKS_DIR, 'post-commit');

  try {
    fs.writeFileSync(hookPath, hookContent);
    execSync(`chmod +x "${hookPath}"`);
    console.log('✅ Post-commit hook installed');
    return true;
  } catch (error) {
    console.error('❌ Failed to install post-commit hook:', error);
    return false;
  }
}

/**
 * Create commit-msg hook for better commit messages
 */
function createCommitMsgHook() {
  const hookContent = `#!/bin/sh
#
# Commit-msg hook: Enhance commit messages with context
#

commit_file=$1
commit_msg=$(cat "$commit_file")

# Skip if this is already an auto-generated commit
if echo "$commit_msg" | grep -q "🤖\\|Auto-checkpoint\\|auto-generated"; then
  exit 0
fi

# Add context footer to manual commits
echo "" >> "$commit_file"
echo "📊 Session Context:" >> "$commit_file"
echo "- Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$commit_file"
echo "- Files changed: $(git diff --cached --name-only | wc -l | tr -d ' ')" >> "$commit_file"

# Add current branch info
branch=$(git rev-parse --abbrev-ref HEAD)
echo "- Branch: $branch" >> "$commit_file"

echo "✅ Commit message enhanced with context"
`;

  const hookPath = path.join(GIT_HOOKS_DIR, 'commit-msg');

  try {
    fs.writeFileSync(hookPath, hookContent);
    execSync(`chmod +x "${hookPath}"`);
    console.log('✅ Commit-msg hook installed');
    return true;
  } catch (error) {
    console.error('❌ Failed to install commit-msg hook:', error);
    return false;
  }
}

/**
 * Setup automatic documentation workflow
 */
function setupWorkflow() {
  console.log('🔧 Setting up automated documentation workflow...\n');

  // Check if .git directory exists
  if (!fs.existsSync(GIT_HOOKS_DIR)) {
    console.error('❌ .git/hooks directory not found. Initialize git repository first.');
    return false;
  }

  let success = true;

  // Install hooks
  success &= createPreCommitHook();
  success &= createPostCommitHook();
  success &= createCommitMsgHook();

  if (success) {
    console.log('\n🎉 Git hooks installed successfully!');
    console.log('\n📋 What was set up:');
    console.log('   - Pre-commit: Updates README.md and context before commits');
    console.log('   - Post-commit: Updates session context after commits');
    console.log('   - Commit-msg: Enhances commit messages with context');

    console.log('\n🔄 Automatic workflow:');
    console.log('   1. Before commit: Documentation updated');
    console.log('   2. During commit: Message enhanced with context');
    console.log('   3. After commit: Session state updated');

    console.log('\n💡 Manual commands available:');
    console.log('   - npm run docs:update         # Update README manually');
    console.log('   - npm run git:checkpoint      # Create checkpoint commit');
    console.log('   - npm run session:end         # End session with full backup');
    console.log('   - npm run session:milestone   # Create milestone + push');

    return true;
  } else {
    console.log('\n❌ Some hooks failed to install');
    return false;
  }
}

/**
 * Test the workflow
 */
function testWorkflow() {
  console.log('\n🧪 Testing documentation workflow...');

  try {
    // Test documentation update
    console.log('📚 Testing documentation update...');
    execSync('npm run docs:update', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
    });
    console.log('✅ Documentation update working');

    // Test context save
    console.log('💾 Testing context save...');
    execSync('npm run context:save', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
    });
    console.log('✅ Context save working');

    console.log('✅ All workflow components working correctly');
    return true;
  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Git Hooks & Documentation Automation Setup\n');

  const workflowSuccess = setupWorkflow();

  if (workflowSuccess) {
    const testSuccess = testWorkflow();

    if (testSuccess) {
      console.log('\n🎉 Setup completed successfully!');
      console.log('\n🚀 Ready for automated documentation and context management');
      console.log('\n📋 Next steps:');
      console.log('   1. Make commits as usual - documentation updates automatically');
      console.log('   2. Use "npm run session:end" when ending work sessions');
      console.log('   3. Use "npm run session:milestone" for major milestones');
      console.log('   4. Recovery: "npm run claude:resume" in new sessions');
    } else {
      console.log('\n⚠️  Setup completed but tests failed');
      console.log('Please check the error messages above');
    }
  } else {
    console.log('\n❌ Setup failed');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { setupWorkflow, testWorkflow };
