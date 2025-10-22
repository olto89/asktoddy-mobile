# Claude Context Directory

This directory maintains session context and work continuity for Claude Code sessions.

## Purpose

- Preserve work context between sessions
- Track Linear tickets and their status
- Document important decisions and implementation details
- Enable seamless session recovery

## Structure

```
.claude-context/
├── README.md                    # This file
├── current-session.json         # Current session state
├── linear-tickets.json          # Active Linear tickets
├── work-log.md                  # Chronological work log
├── decisions.md                 # Architecture & implementation decisions
└── recovery-checklist.md        # Steps to recover context
```

## Usage

When starting a new session, Claude should:

1. Read `current-session.json` for immediate context
2. Check `linear-tickets.json` for active work
3. Review `decisions.md` for important architectural choices
4. Continue logging work in `work-log.md`

## Automation

The `scripts/sync-context.js` script automatically:

- Fetches latest Linear tickets
- Updates session state
- Commits context changes
