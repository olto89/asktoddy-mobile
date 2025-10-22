# Linear Integration Setup

## Getting Your Linear API Key

1. Go to https://linear.app/settings/api
2. Create a new personal API key
3. Add it to your `.env` file:
   ```
   LINEAR_API_KEY=your_key_here
   ```

## Manual Ticket Management

Until the API key is configured, you can:

### View Tickets

1. Visit https://linear.app
2. Filter by:
   - Assigned to me
   - Labels: "mobile", "react-native", "app"
   - Project: AskToddy

### Update Ticket Status in Context

Manually update `.claude-context/linear-tickets.json`:

```json
{
  "lastSynced": "2025-01-15T20:00:00Z",
  "tickets": [
    {
      "id": "TODD-XXX",
      "title": "Ticket title",
      "status": "In Progress",
      "description": "What needs to be done"
    }
  ]
}
```

## Common Linear Workflows

### Starting Work on a Ticket

1. Move ticket to "In Progress" in Linear
2. Add to `.claude-context/work-log.md`
3. Create a git branch: `git checkout -b TODD-XXX-feature-name`

### Completing a Ticket

1. Commit changes with ticket ID: `git commit -m "TODD-XXX: Description"`
2. Update ticket status to "In Review"
3. Update context: `npm run context:save`

### Creating a New Ticket

```bash
# Via Linear web UI
# Or use this template in work-log.md:

## New Ticket Needed
**Title:** [Brief description]
**Type:** Bug/Feature/Task
**Priority:** Urgent/High/Medium/Low
**Description:**
- What needs to be done
- Acceptance criteria
- Technical notes
```

## Ticket Naming Convention

- `TODD-XXX`: Main AskToddy tickets
- `MOBILE-XXX`: Mobile-specific tickets
- `BUG-XXX`: Bug fixes
- `FEAT-XXX`: New features

## Priority Levels

1. **Urgent**: Blocking production
2. **High**: Needed this sprint
3. **Medium**: Next sprint
4. **Low**: Backlog

## Labels to Use

- `mobile`: React Native specific
- `ai`: AI/ML related
- `ui`: UI/UX work
- `backend`: API/Backend
- `bug`: Something broken
- `enhancement`: Improvement
- `documentation`: Docs needed
