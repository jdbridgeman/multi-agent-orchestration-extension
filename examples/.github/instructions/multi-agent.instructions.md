---
applyTo: '**'
---


# Multi-Agent Coordination Instructions

You are working in a multi-agent environment with Claude Code, Copilot, and Cursor.

## Your Identity

You are: Copilot
Your update script: .vscode/agent-scripts/copilot-update.cjs

## Required Workflow

### Before starting ANY work

```bash
node .vscode/agent-scripts/copilot-update.cjs check
```

### To claim files

```bash
node .vscode/agent-scripts/copilot-update.cjs start --files "file1.ts,file2.ts" --task "what you're doing"
```

### When finished

```bash
node .vscode/agent-scripts/copilot-update.cjs complete
```

### Every 10 minutes while working

```bash
node .vscode/agent-scripts/copilot-update.cjs heartbeat
```

## CRITICAL RULES

1. NEVER write to other agents' state files
2. NEVER write to unified-view.json  
3. ALWAYS check before claiming files
4. ALWAYS complete when done
5. If you see a conflict, work on different files

## File Priority

- Architecture files: Claude Code > Copilot > Cursor
- Test files: Cursor > Copilot > Claude Code
- UI components: Cursor > Copilot > Claude Code
- Config files: Copilot > Claude Code > Cursor

## Quick Reference Commands

### Package.json shortcuts

```bash
npm run agent:start     # Start the aggregator
npm run agent:stop      # Stop the aggregator
npm run agent:reset     # Reset all state files
npm run agent:status    # View unified state (requires jq)
npm run claude:check    # Check Claude Code status
npm run copilot:check   # Check Copilot status
npm run cursor:check    # Check Cursor status
```

### Manual commands

```bash
# Start aggregator
node .vscode/state-aggregator.cjs

# Agent operations
node .vscode/agent-scripts/claudeCode-update.cjs start --files "audio-engine.ts" --task "Fix memory leak"
node .vscode/agent-scripts/claudeCode-update.cjs complete
node .vscode/agent-scripts/claudeCode-update.cjs check
node .vscode/agent-scripts/claudeCode-update.cjs heartbeat

# Monitor file ownership in real-time
watch -n 1 'cat .vscode/agent-states/unified-view.json | jq .fileOwnership'

# Check for conflicts
cat .vscode/agent-states/unified-view.json | jq .conflicts

# See all active work
cat .vscode/agent-states/unified-view.json | jq ".agents | to_entries | map(select(.value.status == \"active\"))"

# Check stale agents
cat .vscode/agent-states/unified-view.json | jq .staleAgents
```

## Architecture Benefits

- **No write conflicts**: Each agent only writes to their own file
- **Automatic conflict detection**: Aggregator detects when multiple agents claim same file
- **Stale agent detection**: Marks agents that haven't sent heartbeat in 30+ minutes
- **Simple recovery**: Just delete corrupted state file and restart
- **Real-time monitoring**: Unified view updates within 1 second of any change

## Example Usage Session

```bash
# Terminal 1: Start the aggregator
npm run agent:start

# Terminal 2: Check what's happening
npm run claude:check

# Terminal 3: Claim some files to work on
node .vscode/agent-scripts/claudeCode-update.cjs start --files "audio-playback-engine.ts,instrument-presets.ts" --task "Refactor audio initialization"

# Work on the files...

# Send heartbeat every 10 minutes
node .vscode/agent-scripts/claudeCode-update.cjs heartbeat

# When done
node .vscode/agent-scripts/claudeCode-update.cjs complete
```

## Troubleshooting

### If you see conflicts

1. Check who owns the files: `npm run agent:status`
2. Wait for them to complete, or
3. Work on different files, or
4. Coordinate directly with the other agent

### If the system seems stuck

1. Check for stale agents: `cat .vscode/agent-states/unified-view.json | jq .staleAgents`
2. Reset if needed: `npm run agent:reset`
3. Restart aggregator: `npm run agent:start`

### If state files get corrupted

1. Stop aggregator: `npm run agent:stop`
2. Reset state: `npm run agent:reset`
3. Restart: `npm run agent:start`

Remember: This system prevents conflicts and ensures smooth collaboration between all AI coding agents!
