# Multi-Agent Orchestration Extension

🤝 A lightweight coordination system that enables multiple AI coding assistants (Claude Code, Cursor, Copilot) to work together seamlessly without file conflicts.

## Features

- **🚫 Conflict Prevention**: Automatically prevents multiple agents from editing the same files
- **👀 Real-time Visibility**: See what each AI agent is working on in real-time
- **💓 Heartbeat Monitoring**: Detect and handle stale/crashed agents
- **📊 Unified Dashboard**: Single view of all agent activities
- **🔧 Simple Integration**: Drop-in solution for any codebase

## Quick Start

```bash
# 1. Install the package
npm install multi-agent-orchestration-extension

# 2. Start the orchestrator
npm run agent:start

# 3. Check agent status
npm run agent:status
```

## How It Works

Each AI agent writes to its own JSON state file. The orchestrator monitors these files and creates a unified view, detecting conflicts and stale agents automatically.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Claude Code │     │   Cursor    │     │   Copilot   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│claudeCode.  │     │ cursor.json │     │copilot.json │
│   json      │     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Aggregator  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │unified-view │
                    │   .json     │
                    └─────────────┘
```

## Agent Commands

### For Claude Code
```bash
# Check status
node .vscode/agent-scripts/claude-update.cjs check

# Start work
node .vscode/agent-scripts/claude-update.cjs start --files "file1.ts,file2.ts" --task "Refactoring auth system"

# Send heartbeat (every 10 mins)
node .vscode/agent-scripts/claude-update.cjs heartbeat

# Complete work
node .vscode/agent-scripts/claude-update.cjs complete
```

### For Cursor
```bash
node .vscode/agent-scripts/cursor-update.cjs check
node .vscode/agent-scripts/cursor-update.cjs start --files "Button.tsx" --task "Update UI components"
node .vscode/agent-scripts/cursor-update.cjs heartbeat
node .vscode/agent-scripts/cursor-update.cjs complete
```

### For Copilot
```bash
node .vscode/agent-scripts/copilot-update.cjs check
node .vscode/agent-scripts/copilot-update.cjs start --files "api.ts" --task "Add error handling"
node .vscode/agent-scripts/copilot-update.cjs heartbeat
node .vscode/agent-scripts/copilot-update.cjs complete
```

## NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "agent:start": "node .vscode/state-aggregator.cjs",
    "agent:stop": "pkill -f state-aggregator.cjs",
    "agent:reset": "rm -rf .vscode/agent-states && mkdir -p .vscode/agent-states",
    "agent:status": "cat .vscode/agent-states/unified-view.json | jq",
    "claude:check": "node .vscode/agent-scripts/claude-update.cjs check",
    "copilot:check": "node .vscode/agent-scripts/copilot-update.cjs check",
    "cursor:check": "node .vscode/agent-scripts/cursor-update.cjs check"
  }
}
```

## Monitoring

### Real-time Status
```bash
# Watch file ownership in real-time
watch -n 1 'cat .vscode/agent-states/unified-view.json | jq .fileOwnership'

# Check for conflicts
cat .vscode/agent-states/unified-view.json | jq .conflicts

# See active agents
cat .vscode/agent-states/unified-view.json | jq ".agents | to_entries | map(select(.value.status == \"active\"))"

# Check stale agents
cat .vscode/agent-states/unified-view.json | jq .staleAgents
```

## Agent Configuration

### Claude Code (CLAUDE.md)
Add the multi-agent instructions to your `CLAUDE.md` file. See `examples/CLAUDE.md` for a complete example.

### Cursor (.cursor/rules/)
Copy `examples/.cursor/rules/multi-agent.mdc` to your `.cursor/rules/` directory.

### GitHub Copilot (.github/instructions/)
Copy `examples/.github/instructions/multi-agent.instructions.md` to your `.github/instructions/` directory.

## Troubleshooting

### Conflict Resolution
If agents conflict over files:
1. Check ownership: `npm run agent:status`
2. Wait for the current agent to complete, or
3. Have the blocked agent work on different files

### Stale Agent Cleanup
If an agent crashes or becomes unresponsive:
```bash
# Check for stale agents
cat .vscode/agent-states/unified-view.json | jq .staleAgents

# Reset if needed
npm run agent:reset
npm run agent:start
```

### State File Corruption
If state files become corrupted:
```bash
npm run agent:stop
npm run agent:reset
npm run agent:start
```

## Architecture Benefits

- **No Write Conflicts**: Each agent only writes to its own state file
- **Atomic Operations**: State updates are atomic JSON writes
- **Fault Tolerant**: Individual agent failures don't affect others
- **Simple Recovery**: Just delete corrupted files and restart
- **Minimal Overhead**: < 1% CPU usage, instant updates

## Requirements

- Node.js 14+
- jq (optional, for pretty status viewing)
- Unix-like environment (Linux, macOS, WSL)

## License

MIT

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## Support

- 🐛 [Report Issues](https://github.com/yourusername/multi-agent-orchestration-extension/issues)
- 💬 [Discussions](https://github.com/yourusername/multi-agent-orchestration-extension/discussions)
- 📚 [Documentation](https://github.com/yourusername/multi-agent-orchestration-extension/wiki)