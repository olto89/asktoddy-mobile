# Context Recovery Checklist

## When Starting a New Claude Session

### 1. Quick Recovery (< 1 minute)
```bash
# Navigate to project
cd /Users/olivertodd/Desktop/asktoddy-mobile

# Check current context
cat .claude-context/current-session.json

# Check running processes
lsof -i :8081  # Expo server
```

### 2. Full Context Recovery (2-3 minutes)

#### Step 1: Review Previous Work
```bash
# Review work log
cat .claude-context/work-log.md

# Check decisions made
cat .claude-context/decisions.md

# See active Linear tickets (if configured)
cat .claude-context/linear-tickets.json
```

#### Step 2: Check Environment
```bash
# Verify dependencies installed
npm list @google/generative-ai

# Check environment variables
cat .env | grep EXPO_PUBLIC

# Check git status
git status
```

#### Step 3: Resume Services
```bash
# If Expo not running:
npm start

# If you need to test:
npm run ios  # or
npm run android
```

### 3. Update Context During Work

#### Regular Saves
```bash
# Save context every major milestone
npm run context:save

# Before ending session
npm run context:sync
```

#### Update Work Log
Add entries to `.claude-context/work-log.md`:
- What was completed
- What's in progress
- Known issues
- Next steps

### 4. Linear Integration (Manual Setup Required)

Since Linear CLI authentication requires interactive login, you'll need to:

1. **Option A: Use Linear Web**
   - Go to https://linear.app
   - Check your assigned tickets
   - Update `.claude-context/linear-tickets.json` manually

2. **Option B: Use Linear API**
   - Get API key from Linear settings
   - Update sync script to use API instead of CLI

3. **Option C: Install Linear Desktop App**
   - Download from https://linear.app/download
   - Keep it open for quick reference

### 5. Key Files to Check

| File | Purpose | When to Check |
|------|---------|---------------|
| `.claude-context/current-session.json` | Session state | Always first |
| `.claude-context/work-log.md` | Work history | To understand progress |
| `.claude-context/decisions.md` | Architecture choices | Before making changes |
| `.env` | API keys | If services fail |
| `package.json` | Dependencies | After package updates |

### 6. Common Recovery Scenarios

#### "What was I working on?"
```bash
cat .claude-context/current-session.json | grep -A5 "activeWork"
```

#### "What files did I modify?"
```bash
git status
git diff --name-only
```

#### "Is everything still running?"
```bash
npm run context:save  # Updates running processes
cat .claude-context/current-session.json | grep -A10 "runningProcesses"
```

#### "What errors were there?"
```bash
cat .claude-context/work-log.md | grep -i "error\|issue\|problem"
```

### 7. Quick Status Check Script

Create this alias in your shell:
```bash
alias claude-status='cd /Users/olivertodd/Desktop/asktoddy-mobile && npm run context:save && echo "=== CURRENT WORK ===" && cat .claude-context/current-session.json | grep -A5 "activeWork"'
```

## Emergency Recovery

If context files are corrupted or missing:

1. Check git history:
   ```bash
   git log --oneline -10
   git diff HEAD~1
   ```

2. Rebuild context:
   ```bash
   npm run context:save
   ```

3. Check recent terminal history:
   ```bash
   history | tail -50
   ```

4. Review recent file changes:
   ```bash
   find . -name "*.ts" -o -name "*.tsx" -mtime -1 | head -20
   ```