# Session Recovery Guide

## 🚀 **Quick Session Start (1 minute)**

### **For New Claude Sessions:**
```bash
cd /Users/olivertodd/Desktop/asktoddy-mobile
npm run claude:resume
```

This shows you the immediate context and current state.

---

## 📋 **Full Context Recovery (2-3 minutes)**

### **Step 1: Check Current Status**
```bash
# Quick status check
npm run claude:resume

# See what's running
lsof -i :8081  # Expo server

# Check git status
git status
```

### **Step 2: Read Work History**
```bash
# Read latest work log
cat .claude-context/work-log.md

# Check recent decisions
tail -30 .claude-context/work-log.md

# Review architecture decisions
cat .claude-context/decisions.md
```

### **Step 3: Check Linear Tickets**
```bash
# Get latest tickets
npm run context:linear

# Read ticket summary
cat .claude-context/active-tickets.md

# Check specific roadmap
cat .claude-context/api-first-roadmap.md
```

### **Step 4: Resume Development**
```bash
# Start Expo if not running
npm start

# Sync all context
npm run context:sync

# Update documentation
npm run docs:update
```

---

## 🎯 **Current Project State (Auto-Generated)**

**Last Session:** 2025-01-15 21:00-21:30  
**Status:** API-First Roadmap Complete  
**Next Phase:** Week 1 - Supabase Edge Functions

### **Key Files to Review:**
- `.claude-context/api-first-roadmap.md` - Complete technical plan
- `.claude-context/linear-tickets-api-first.md` - 12 specific tickets
- `.claude-context/work-log.md` - Session history
- `README.md` - Auto-updated project overview

### **Architecture Decision:**
- **WRONG:** Build frontend first → Create technical debt
- **RIGHT:** Build Supabase middleware first → Thin client mobile app

### **Current Priority:**
1. Create Linear tickets from detailed specs
2. Start Week 1: Supabase Edge Functions infrastructure
3. Migrate AIMiddleware (455 lines) to Edge Function
4. Build UK pricing services integration

---

## 🔧 **Development Workflow**

### **Starting Work Session:**
```bash
npm run session:start
```
This will:
- Sync Linear tickets
- Update documentation  
- Prepare development environment

### **During Development:**
```bash
# Save progress regularly
npm run context:save

# Create checkpoint commits
npm run git:checkpoint

# Update documentation
npm run docs:update
```

### **Ending Work Session:**
```bash
npm run session:end
```
This will:
- Save complete context
- Update all documentation
- Create session-end commit
- Prepare for next session

### **Major Milestones:**
```bash
npm run session:milestone
```
This will:
- Create milestone commit
- Push to remote repository
- Full documentation update

---

## 📊 **Context Files Explained**

| File | Purpose | When to Read |
|------|---------|--------------|
| `current-session.json` | Latest session state | Always first |
| `work-log.md` | Chronological development history | To understand progress |
| `decisions.md` | Architecture & implementation choices | Before making changes |
| `linear-tickets.json` | Synced Linear ticket data | To check priorities |
| `active-tickets.md` | Human-readable ticket summary | Quick ticket overview |
| `api-first-roadmap.md` | Complete technical strategy | Implementation planning |
| `linear-tickets-api-first.md` | Detailed ticket specs | Creating Linear tickets |
| `recovery-checklist.md` | Step-by-step recovery | Session recovery |

---

## 🚨 **Emergency Recovery**

### **If Context Files Missing:**
```bash
# Reconstruct from git
git log --oneline -10
git show HEAD

# Rebuild context
npm run context:save
npm run docs:update
```

### **If Development Server Not Working:**
```bash
# Clear Expo cache
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules
npm install
npm start
```

### **If AI Services Not Working:**
```bash
# Check environment variables
cat .env

# Test AI service
node -e "
const { AIService } = require('./src/services/ai');
AIService.healthCheck().then(console.log);
"
```

### **If Linear Integration Broken:**
```bash
# Test Linear API
npm run context:linear

# Check API key
echo $LINEAR_API_KEY

# Manual ticket check
curl -H "Authorization: $LINEAR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"query": "{ viewer { name } }"}' \
     https://api.linear.app/graphql
```

---

## 🎯 **Session Handoff Checklist**

### **Before Ending Session:**
- [ ] Run `npm run session:end`
- [ ] Verify README.md is updated
- [ ] Check all context files saved
- [ ] Confirm git changes committed
- [ ] Note specific next steps in work log

### **Starting New Session:**
- [ ] Run `npm run claude:resume`
- [ ] Read latest work log entries
- [ ] Check Linear tickets for priorities
- [ ] Review architecture decisions
- [ ] Understand current phase

### **Handoff Notes Template:**
```markdown
## Session Handoff - [DATE]

### Completed This Session:
- [Work completed]

### In Progress:
- [Current work state]

### Next Priorities:
1. [Immediate next task]
2. [Secondary priority]
3. [Future work]

### Important Notes:
- [Any blocking issues]
- [Key decisions made]
- [Context to remember]

### Files Modified:
- [Key files changed]

### Next Session Should Start With:
- [Specific first action]
```

---

## 🔄 **Automated Systems Active**

### **Git Hooks Installed:**
- **Pre-commit:** Updates README.md automatically
- **Post-commit:** Updates session context
- **Commit-msg:** Enhances commit messages

### **Available Commands:**
```bash
# Context Management
npm run context:save          # Save session state
npm run context:linear        # Sync Linear tickets  
npm run context:sync         # Save + sync

# Documentation
npm run docs:update          # Update README.md
npm run git:checkpoint       # Create checkpoint commit
npm run git:checkpoint:push  # Checkpoint + push

# Session Management  
npm run session:start        # Start work session
npm run session:end          # End work session
npm run session:milestone    # Major milestone

# Recovery
npm run claude:resume        # Quick status check
npm run setup:hooks          # Reinstall git hooks
npm run setup:complete       # Full setup + start
```

---

## 📞 **Key Information**

### **Project Details:**
- **Location:** `/Users/olivertodd/Desktop/asktoddy-mobile`
- **Branch:** `main`
- **Expo Port:** `8081`
- **Linear API:** Configured with key ending in `...35ue3`

### **Current Architecture:**
- **Current:** Camera-first with direct AI integration
- **Target:** Chat-first with Supabase Edge Functions middleware
- **Timeline:** 3 weeks, 29 points, API-first approach

### **Key Dependencies:**
- React Native 0.81.4
- Expo SDK 54
- Google Generative AI 0.24.1
- Supabase client configured

---

**🤖 This guide is auto-updated by the documentation system**  
**Last Update:** [AUTO-GENERATED TIMESTAMP]

*For technical implementation details, see `.claude-context/api-first-roadmap.md`*