# Multi-Agent Quick Reference

## 🚀 Essential Commands

```bash
# Check system status
npm run cc-check

# Get smart recommendations  
npm run agent:suggest --files "file.ts" --task "description"

# Start work (with auto-conflict resolution)
npm run cc-start --files "file1.ts,file2.ts" --task "fix bug"

# Update progress during work
node .vscode/agent-scripts/claude-update.cjs progress --percentage 50 --message "halfway done"

# Complete work
npm run cc-done

# Release files early (for handoffs)
node .vscode/agent-scripts/claude-update.cjs release --reason "switching tasks"
```

## 🏆 Agent Expertise

| Agent | Specializes In | Example Files |
|-------|----------------|---------------|
| **Claude Code** | Architecture, docs, config | `*.md`, `package.json`, `*config*` |
| **Copilot** | ML, algorithms, optimization | `*/ml/*`, `*neural*`, `*inference*` |  
| **Cursor** | UI, testing, integration | `*/components/*`, `*.test.*`, `*.tsx` |

## ⚡ Conflict Resolution

```bash
# Normal start (respects conflicts)
npm run cc-start --files "file.ts" --task "my task"

# Force override (emergency only)
npm run cc-start --files "file.ts" --task "urgent fix" --force

# Auto-claim from stale agents (>30s inactive)
# Happens automatically - no special command needed
```

## 📊 Progress Tracking

```bash
# Update progress with message
node .vscode/agent-scripts/claude-update.cjs progress --percentage 75 --message "fixing tests"

# Progress shows in status checks
npm run cc-check
# Output: 🟢 ACTIVE (15 min) [75%]
#         💬 fixing tests
```

## 🔄 Handoff Workflow

```bash
# Agent A: Release files  
node .vscode/agent-scripts/claude-update.cjs release --reason "blocked on API"
# Output: 💡 Suggested next agent: cursor

# Agent B: Check handoffs and claim
npm run cursor-check
npm run cursor-start --files "..." --task "continue work"
```

## 🐛 Troubleshooting

```bash
# System stale? Update unified view
npm run agent:update

# Total reset (nuclear option)
npm run agent:reset && npm run agent:start

# Monitor in real-time
npm run agent:monitor
```

## 📋 Status Indicators

| Symbol | Meaning |
|--------|---------|
| 🟢 | Agent actively working |
| ⚪ | Agent idle |  
| 🔴 | Agent stale/error |
| 📊 | Progress percentage |
| 💬 | Progress message |
| ⚠️ | Conflict detected |
| 🚀 | Force override mode |
| 💡 | Smart assignment suggestion |

## 🎯 Best Practices

1. **Always check first**: `npm run cc-check`
2. **Get recommendations**: `npm run agent:suggest`  
3. **Update progress**: For tasks >5 minutes
4. **Release gracefully**: Don't just stop working
5. **Use descriptive tasks**: Helps routing and debugging

---
*Quick reference for the Enhanced Multi-Agent Coordination System*