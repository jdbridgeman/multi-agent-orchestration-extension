# Multi-Agent Orchestration Extension

🤝 A VS Code extension that enables Claude Code, GitHub Copilot, and Cursor to work together seamlessly without file conflicts.

## Features

- **🚫 Conflict Prevention**: Automatically prevents multiple AI agents from editing the same files
- **👀 Real-time Monitoring**: See which agent is working on which files
- **💓 Heartbeat System**: Detect and handle stale/crashed agents (30-second timeout)
- **📊 Unified Dashboard**: Single view of all agent activities
- **🧠 Smart Assignment**: Recommends the best agent for each task
- **📈 Progress Tracking**: Monitor completion percentage of tasks

## Installation

### From VS Code Marketplace
```bash
# Coming soon - install directly from VS Code Extensions
```

### From Source
```bash
# Clone the repository
git clone https://github.com/jdbridgeman/multi-agent-orchestration-extension
cd multi-agent-orchestration-extension

# Install dependencies
npm install

# Initial setup
npm run setup
```

## Quick Start

### 1️⃣ Initial Setup

```bash
# Create required directories
mkdir -p .vscode/agent-states

# Copy example configuration
cp .vscode/agent-config.example.json .vscode/agent-config.json

# Make scripts executable (Unix/macOS)
chmod +x .vscode/agent-scripts/*.cjs

# Start the orchestrator
npm run agent:start
```

### 2️⃣ Basic Usage

```bash
# Check system status
npm run agent:status

# Before starting work - check for conflicts
npm run cc-check  # For Claude Code
npm run cp-check  # For Copilot
npm run cu-check  # For Cursor

# Claim files
npm run cc-start --files "file1.ts,file2.ts" --task "Fix authentication"

# Complete work
npm run cc-done
```

## How It Works

Each AI agent writes to its own state file. The extension monitors these files and creates a unified view, preventing conflicts automatically.

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

## Command Reference

### NPM Scripts (Shortcuts)

```json
{
  // System commands
  "agent:start": "Start the orchestrator",
  "agent:stop": "Stop the orchestrator",
  "agent:status": "View current status",
  "agent:reset": "Reset all states (emergency)",
  
  // Claude Code shortcuts
  "cc-check": "Check Claude's status",
  "cc-start": "Start work with Claude",
  "cc-done": "Complete Claude's work",
  
  // Copilot shortcuts
  "cp-check": "Check Copilot's status",
  "cp-start": "Start work with Copilot",
  "cp-done": "Complete Copilot's work",
  
  // Cursor shortcuts
  "cu-check": "Check Cursor's status",
  "cu-start": "Start work with Cursor",
  "cu-done": "Complete Cursor's work",
  
  // Smart features
  "agent:suggest": "Get agent recommendation"
}
```

### Full Command Syntax

```bash
# Start work (claim files)
node .vscode/agent-scripts/[agent]-update.cjs start --files "file1,file2" --task "description"

# Update progress
node .vscode/agent-scripts/[agent]-update.cjs progress --percentage 50 --message "Halfway done"

# Send heartbeat (keep-alive)
node .vscode/agent-scripts/[agent]-update.cjs heartbeat

# Release files early
node .vscode/agent-scripts/[agent]-update.cjs release --reason "Blocked on API"

# Emergency release (Cursor only - interactive)
node .vscode/agent-scripts/cursor-release.cjs
```

## Smart Assignment

Get recommendations for which agent should handle specific tasks:

```bash
npm run agent:suggest --files "Button.tsx,Modal.tsx" --task "Fix accessibility"
# → Recommends: Cursor (UI specialist)

npm run agent:suggest --files "neural-network.ts" --task "Optimize training"
# → Recommends: Copilot (ML specialist)

npm run agent:suggest --files "architecture.md,package.json" --task "Refactor structure"
# → Recommends: Claude Code (Architecture specialist)
```

### Agent Specialties

| Agent | Best For | File Patterns | Keywords |
|-------|----------|---------------|----------|
| **Claude Code** | Architecture, docs, refactoring | `*.md`, `*config*`, `*.yml` | architect, refactor, document |
| **Copilot** | ML, algorithms, optimization | `*/ml/*`, `*neural*`, `*algorithm*` | ml, neural, algorithm, optimize |
| **Cursor** | UI, frontend, testing | `*/components/*`, `*.tsx`, `*.test.*` | ui, component, test, frontend |

## Configuration

Edit `.vscode/agent-config.json`:

```json
{
  "heartbeatInterval": 600000,     // 10 minutes
  "staleThreshold": 30000,         // 30 seconds
  "conflictResolution": "auto",    // auto | manual
  "priorities": {
    "claudeCode": ["architecture", "documentation"],
    "copilot": ["ml", "algorithms"],
    "cursor": ["ui", "testing"]
  }
}
```

## Monitoring

### Real-time Status
```bash
# Watch file ownership
npm run agent:monitor

# Check conflicts
cat .vscode/agent-states/unified-view.json | jq .conflicts

# View active agents
cat .vscode/agent-states/unified-view.json | jq '.agents | to_entries | map(select(.value.status == "active"))'
```

### Status Indicators
- 🟢 **Active**: Agent is working on files
- 🟡 **Idle**: Agent is connected but not working
- 🔴 **Stale**: No heartbeat for >30 seconds (files can be claimed)

## Troubleshooting

### Common Issues

#### Files Stuck as Claimed
```bash
# Option 1: Wait for 30-second timeout
# Option 2: Emergency release (Cursor only)
node .vscode/agent-scripts/cursor-release.cjs
# Option 3: Force override
npm run cc-start --files "stuck.ts" --task "urgent" --force
```

#### System Not Responding
```bash
npm run agent:stop
npm run agent:reset
npm run agent:start
```

#### Permission Errors (Unix/macOS)
```bash
chmod +x .vscode/agent-scripts/*.cjs
```

#### State File Corruption
```bash
# Stop everything
npm run agent:stop

# Clean state files
rm -rf .vscode/agent-states
mkdir -p .vscode/agent-states

# Restart
npm run agent:start
```

## File Structure

```
.vscode/
├── agent-scripts/          # Coordination scripts
│   ├── claude-update.cjs   # Claude Code manager
│   ├── copilot-update.cjs  # Copilot manager
│   ├── cursor-update.cjs   # Cursor manager
│   ├── cursor-release.cjs  # Emergency release tool
│   └── smart-assignment.cjs # AI recommendation engine
├── agent-states/           # Runtime state (gitignored)
│   ├── claudeCode.json     # Claude's state
│   ├── copilot.json        # Copilot's state
│   ├── cursor.json         # Cursor's state
│   └── unified-view.json   # Aggregated view
└── agent-config.json       # Configuration (gitignored)
```

## Best Practices

1. **Always check before starting**: Prevents conflicts
2. **Use descriptive task names**: Helps other agents understand your work
3. **Send heartbeats**: Every 10 minutes for long tasks
4. **Complete or release**: Don't leave files locked
5. **Follow smart assignments**: The AI knows best

## Caveats & Limitations

- **30-second timeout**: Stale agents release files automatically
- **No nested locks**: Can't claim files within subdirectories recursively
- **State persistence**: States are lost on system restart
- **Single machine**: Doesn't sync across multiple computers
- **Manual heartbeats**: Agents must remember to send keep-alives

## API Reference

For detailed API documentation, see:
- `claude-update.cjs` - Claude Code agent management
- `smart-assignment.cjs` - Intelligent task routing
- `update-unified-view.cjs` - State aggregation engine

## Requirements

- VS Code 1.85.0+
- Node.js 14+
- Unix-like environment (Linux, macOS, WSL)
- jq (optional, for pretty JSON viewing)

## Contributing

1. **Test changes**: Run `npm run agent:demo` before submitting
2. **Maintain compatibility**: Don't break existing commands
3. **Update docs**: Keep README in sync with changes
4. **Discuss big changes**: Open an issue first

## Roadmap

- [ ] VS Code Marketplace publication
- [ ] GUI status panel
- [ ] Automatic heartbeats
- [ ] Multi-machine sync
- [ ] Recursive directory claiming
- [ ] Conflict queue system

## License

MIT

## Support

- 🐛 [Issues](https://github.com/jdbridgeman/multi-agent-orchestration-extension/issues)
- 💬 [Discussions](https://github.com/jdbridgeman/multi-agent-orchestration-extension/discussions)

---


