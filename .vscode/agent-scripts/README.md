# Multi-Agent Coordination System

Enhanced coordination system for Claude Code, Copilot, and Cursor with intelligent conflict resolution, progress tracking, and smart assignment capabilities.

## Overview

This system prevents conflicts and ensures smooth collaboration between AI coding agents through:

- **Real-time conflict detection** with 30-second stale thresholds
- **Automatic conflict resolution** with force override capabilities  
- **Progress tracking** with percentage completion reporting
- **Smart assignment** based on agent expertise and workload
- **Graceful handoffs** with automatic recommendations

## Quick Start

### Basic Usage

```bash
# Check system status
npm run cc-check

# Claim files for work
npm run cc-start --files "file1.ts,file2.ts" --task "Fix memory leak"

# Update progress
node .vscode/agent-scripts/claude-update.cjs progress --percentage 50 --message "Fixed first issue"

# Complete work
npm run cc-done

# Release files early (for handoffs)
node .vscode/agent-scripts/claude-update.cjs release --reason "blocked on dependency"
```

### Smart Assignment

```bash
# Get agent recommendations
npm run agent:suggest --files "neural-melody.ts,ml-cache.ts" --task "Fix ML inference bug"

# Output shows best agent match based on expertise
```

## File Structure

```
.vscode/agent-scripts/
├── README.md                    # This documentation
├── claude-update.cjs           # Claude Code agent manager  
├── copilot-update.cjs          # Copilot agent manager
├── cursor-update.cjs           # Cursor agent manager
├── smart-assignment.cjs        # Intelligent task assignment
├── update-unified-view.cjs     # State aggregation engine
├── test-multi-agent.cjs        # Testing utilities
└── demo-multi-agent.cjs        # Demo scenarios

.vscode/agent-states/
├── claudeCode.json             # Claude Code state
├── copilot.json                # Copilot state  
├── cursor.json                 # Cursor state
├── unified-view.json           # Aggregated system state
└── handoffs.json               # File handoff notifications
```

## Agent Commands

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `start` | Claim files for work | `--files "a.ts,b.ts" --task "fix bug" [--force]` |
| `complete` | Mark work as finished | No parameters |
| `release` | Release files early | `--reason "switching tasks"` |
| `progress` | Update completion % | `--percentage 75 --message "almost done"` |
| `check` | View system status | No parameters |
| `heartbeat` | Send keepalive signal | No parameters |

### Enhanced Features

#### Conflict Resolution
- **Automatic stale detection**: Files from agents inactive >30s are auto-claimable
- **Force override**: Use `--force` flag to manually resolve conflicts
- **Clear reporting**: Shows agent status, task details, and duration

#### Progress Tracking
```bash
node .vscode/agent-scripts/claude-update.cjs progress --percentage 50 --message "Fixed core issue"
```
- Updates visible in status checks and heartbeats
- Helps other agents understand work completion status

#### Smart Assignment
```bash
npm run agent:suggest --files "components/ui/button.tsx" --task "Fix accessibility"
# Recommends: Cursor (UI specialist)

npm run agent:suggest --files "lib/audio/ml/neural-melody.ts" --task "Optimize inference"  
# Recommends: Copilot (ML specialist)
```

## Agent Expertise

### Claude Code
- **Primary**: Architecture, foundation, refactoring, documentation
- **Files**: `*.md`, `*config*`, `package.json`, `*.yml`
- **Keywords**: architect, foundation, refactor, document, structure

### Copilot  
- **Primary**: ML, algorithms, data processing, optimization
- **Files**: `*/ml/*`, `*neural*`, `*algorithm*`, `*inference*`
- **Keywords**: ml, neural, algorithm, inference, model, training

### Cursor
- **Primary**: UI, integration, testing, frontend
- **Files**: `*/components/*`, `*/ui/*`, `*.test.*`, `*.tsx`
- **Keywords**: ui, component, test, integration, frontend, react

## State Management

### Agent States
```json
{
  "agent": "claudeCode",
  "status": "active|idle|stale",
  "currentWork": {
    "files": ["file1.ts", "file2.ts"],
    "task": "Fix memory leak",
    "started": "2025-01-16T10:30:00.000Z",
    "progress": {
      "percentage": 75,
      "message": "Almost complete",
      "updated": "2025-01-16T10:45:00.000Z"
    }
  },
  "lastHeartbeat": "2025-01-16T10:45:00.000Z"
}
```

### Unified View
```json
{
  "lastUpdated": "2025-01-16T10:45:00.000Z",
  "agents": { /* all agent states */ },
  "fileOwnership": {
    "file1.ts": {
      "agent": "claudeCode", 
      "since": "2025-01-16T10:30:00.000Z",
      "task": "Fix memory leak"
    }
  },
  "conflicts": [],
  "staleAgents": []
}
```

## Workflow Examples

### Normal Workflow
```bash
# 1. Check what others are doing
npm run cc-check

# 2. Get smart assignment recommendation  
npm run agent:suggest --files "audio-engine.ts" --task "Fix latency"

# 3. Claim files (auto-resolves stale conflicts)
npm run cc-start --files "audio-engine.ts" --task "Fix latency"

# 4. Work on files, updating progress
node .vscode/agent-scripts/claude-update.cjs progress --percentage 50 --message "Identified bottleneck"

# 5. Complete work
npm run cc-done
```

### Conflict Resolution
```bash
# Soft conflict (wait for completion)
npm run cc-start --files "file.ts" --task "my task"
# Error: File claimed by copilot

# Force override (emergency situations)  
npm run cc-start --files "file.ts" --task "urgent fix" --force
# Success: Overriding conflict...
```

### Handoff Workflow
```bash
# Agent A: Start work
npm run cc-start --files "complex-feature.ts" --task "Implement feature"

# Agent A: Get blocked, release gracefully
node .vscode/agent-scripts/claude-update.cjs release --reason "blocked on API spec"
# System suggests best next agent

# Agent B: Claim released files
npm run cp-start --files "complex-feature.ts" --task "Continue feature implementation"
```

## Monitoring & Debugging

### Real-time Monitoring
```bash
# Watch file ownership changes
npm run agent:monitor

# Check all agent statuses
npm run agent:status

# View handoff history
cat .vscode/agent-states/handoffs.json
```

### Troubleshooting

#### Stale System
```bash
# If unified view is stale
npm run agent:update

# Reset entire system
npm run agent:reset && npm run agent:start
```

#### State Corruption
```bash
# Stop aggregator
npm run agent:stop

# Clean slate
npm run agent:reset  

# Restart
npm run agent:start
```

## Configuration

### Thresholds
- **Agent stale threshold**: 30 seconds
- **Unified view stale threshold**: 60 seconds  
- **Handoff history**: Last 10 entries

### Expertise Weights
- **File pattern match**: 40%
- **Task keyword match**: 40% 
- **Current workload**: 20%

## Integration

### With CLAUDE.md
The system is integrated with the project's CLAUDE.md multi-agent instructions:

```bash
# Always check before starting work
node .vscode/agent-scripts/claude-update.cjs check

# Claim files and start
node .vscode/agent-scripts/claude-update.cjs start --files "..." --task "..."

# Send heartbeats every 10 minutes
node .vscode/agent-scripts/claude-update.cjs heartbeat

# Complete when done
node .vscode/agent-scripts/claude-update.cjs complete
```

### NPM Script Shortcuts
All commands available via npm shortcuts in `package.json`:

```json
{
  "cc-check": "node .vscode/agent-scripts/claude-update.cjs check",
  "cc-start": "node .vscode/agent-scripts/claude-update.cjs start", 
  "cc-done": "node .vscode/agent-scripts/claude-update.cjs complete",
  "cc-heartbeat": "node .vscode/agent-scripts/claude-update.cjs heartbeat",
  "agent:suggest": "node .vscode/agent-scripts/smart-assignment.cjs suggest"
}
```

## Best Practices

### For Agents
1. **Always check before starting**: `npm run cc-check`
2. **Use smart assignment**: `npm run agent:suggest` for recommendations
3. **Update progress regularly**: Use `progress` command for long tasks
4. **Release gracefully**: Use `release` instead of just stopping
5. **Send heartbeats**: Every 10 minutes during active work

### For Conflict Resolution
1. **Respect active agents**: Don't use `--force` unless urgent
2. **Check stale threshold**: >30s inactive agents are auto-claimable
3. **Communicate intent**: Use descriptive task names
4. **Monitor handoffs**: Check `handoffs.json` for available files

### For Smart Assignment  
1. **Include relevant files**: More files = better expertise matching
2. **Use descriptive tasks**: Keywords help route to right specialist
3. **Consider workload**: System factors in current agent activity
4. **Follow recommendations**: The scoring system is tuned for optimal allocation

## API Reference

See individual script files for detailed function documentation:
- `claude-update.cjs` - Core agent management
- `smart-assignment.cjs` - Intelligent task routing
- `update-unified-view.cjs` - State aggregation

---

*Last updated: 2025-01-16*
*System version: Enhanced Multi-Agent v2.0*