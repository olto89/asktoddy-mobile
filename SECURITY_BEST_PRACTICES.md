# AskToddy Mobile - Security Best Practices

## 🔐 API Key Security Guidelines

### ✅ **DO THIS:**

#### 1. Environment Variables Only

```bash
# .env.local (never commit this file)
GEMINI_API_KEY=your-api-key-here
```

#### 2. Supabase Secrets for Production

```bash
# Set secrets in Supabase (server-side only)
npx supabase secrets set GEMINI_API_KEY="your-key" --project-ref iezmuqawughmwsxlqrim
```

#### 3. Test Scripts Use Environment Variables

```javascript
// ✅ CORRECT - Load from environment
require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('API key not found in environment');
  process.exit(1);
}
```

### ❌ **NEVER DO THIS:**

#### 1. Hardcoded Keys in Files

```javascript
// ❌ WRONG - This will be leaked!
const API_KEY = 'AIzaSy...';
```

#### 2. Keys in Git-Tracked Files

```json
// ❌ WRONG - eas.json, package.json, etc.
{
  "env": {
    "EXPO_PUBLIC_GEMINI_API_KEY": "AIzaSy..."
  }
}
```

#### 3. Keys in Documentation

```markdown
❌ WRONG - Don't include real keys in docs!
Update the API key to: AIzaSy...
```

## 🚨 **Why Keys Keep Getting Leaked**

### The Leak Chain:

1. **Repository is PUBLIC on GitHub** → Anyone can see all files
2. **Keys get into ANY file** → Bots scrape and find them
3. **"Fixes" don't address root cause** → Just rotate compromised keys

### Common Leak Sources:

- Test scripts with hardcoded keys
- Documentation with example keys
- EAS configuration files
- Environment files committed to Git
- Session/debug files with exposed keys

## 🛡️ **Current Security Setup**

### Files That Are Secure:

- ✅ `.env.local` - In .gitignore, never committed
- ✅ Supabase secrets - Server-side only
- ✅ `test-quote-poc-secure.js` - Uses environment variables

### Files to Watch:

- ⚠️ Any new test scripts
- ⚠️ Documentation files
- ⚠️ Session context files
- ⚠️ Debug output files

## 📋 **Security Checklist**

### Before Creating Any File:

- [ ] Does it contain API keys? → Use environment variables
- [ ] Will it be committed to Git? → No secrets allowed
- [ ] Is it for testing? → Load keys from `.env.local`
- [ ] Is it documentation? → Use placeholder values

### Regular Security Audit:

```bash
# Search for potential leaks
grep -r "AIzaSy" --exclude-dir=node_modules .
grep -r "sk-" --exclude-dir=node_modules .
grep -r "Bearer " --exclude-dir=node_modules .
```

### If a Key Gets Leaked:

1. **Revoke immediately** at https://aistudio.google.com/app/apikey
2. **Generate new key**
3. **Update Supabase secrets**
4. **Clean up any files** containing the old key
5. **Never share the new key** in chat/email/docs

## 🔧 **Secure Development Workflow**

### Local Testing:

```bash
# 1. Create .env.local with your key
echo "GEMINI_API_KEY=your-key-here" > .env.local

# 2. Use secure test script
node test-quote-poc-secure.js

# 3. Verify .env.local is ignored
git status  # Should not show .env.local
```

### Production Deployment:

```bash
# 1. Update Supabase secrets
npx supabase secrets set GEMINI_API_KEY="your-key" --project-ref iezmuqawughmwsxlqrim

# 2. Deploy edge functions
npx supabase functions deploy analyze-construction

# 3. Test via edge functions (no direct API key exposure)
```

## 🎯 **Repository Security Options**

### Option 1: Make Repository Private (Recommended)

- Go to https://github.com/olto89/asktoddy-mobile/settings
- Change visibility to "Private"
- **Instantly stops all leaks**

### Option 2: Enhanced Public Repository Security

- Never put ANY secrets in files
- Use environment variables exclusively
- Regular security audits
- Automated scanning tools

## 📚 **Resources**

- [Google AI Studio API Keys](https://aistudio.google.com/app/apikey)
- [Supabase Secrets Management](https://supabase.com/docs/guides/cli/config#managing-environment-variables)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

## ⚡ **Quick Commands**

```bash
# Update API key securely
npx supabase secrets set GEMINI_API_KEY="new-key" --project-ref iezmuqawughmwsxlqrim

# Test securely
node test-quote-poc-secure.js

# Check for leaks
grep -r "AIzaSy" --exclude-dir=node_modules . || echo "No leaks found"

# Verify git ignore
git check-ignore .env.local && echo "✅ .env.local is ignored"
```

---

**Remember: The best security is prevention. Never put API keys in files that might be shared, committed, or made public.**
