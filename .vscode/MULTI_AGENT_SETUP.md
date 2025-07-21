# 🤖 Multi-Agent Development System Setup

This repository includes a sophisticated multi-agent orchestration system that coordinates between Claude Code, GitHub Copilot, and Cursor AI to prevent conflicts and improve development efficiency.

## 🚀 Quick Setup

### 1. Initial Setup

```bash
# Create the agent states directory
mkdir -p .vscode/agent-states

# Copy example files
cp .vscode/agent-config.example.json .vscode/agent-config.json
cp -r .vscode/agent-states.example/* .vscode/agent-states/

# Make scripts executable
chmod +x .vscode/agent-scripts/*.cjs

# Install dependencies (if not already installed)
npm install
```

### 2. Start the System

```bash
# Start the agent state aggregator
npm run agent:start

# Verify it's running
npm run agent:status
```

### 3. Configure Your Agent

Depending on which AI assistant you're using:

- **Claude Code**: Your update script is `claude-update.cjs`
- **GitHub Copilot**: Your update script is `copilot-update.cjs`
- **Cursor**: Your update script is `cursor-update.cjs`

## 📋 How It Works

The multi-agent system prevents file conflicts by tracking which agent is working on which files:

1. **Before starting work**: Check file availability
2. **Claim files**: Register your intent to work on specific files
3. **Send heartbeats**: Keep your claim active (every 10 minutes)
4. **Complete work**: Release files when done

## 🎯 Common Commands

### For All Agents

```bash
# Check system status
npm run agent:status

# Monitor file ownership in real-time
npm run agent:monitor

# Reset system (emergency use only)
npm run agent:reset
```

### Agent-Specific Workflows

#### Claude Code
```bash
# Check what you're working on
node .vscode/agent-scripts/claude-update.cjs check

# Start work on files
node .vscode/agent-scripts/claude-update.cjs start --files "file1.ts,file2.ts" --task "Fix bug"

# Send heartbeat (every 10 minutes)
node .vscode/agent-scripts/claude-update.cjs heartbeat

# Complete work
node .vscode/agent-scripts/claude-update.cjs complete
```

#### Cursor
```bash
# Similar commands, but using cursor-update.cjs
node .vscode/agent-scripts/cursor-update.cjs check
node .vscode/agent-scripts/cursor-update.cjs start --files "..." --task "..."
node .vscode/agent-scripts/cursor-update.cjs heartbeat
node .vscode/agent-scripts/cursor-update.cjs complete

# Emergency release (interactive)
node .vscode/agent-scripts/cursor-release.cjs
```

## 🔧 Configuration

Edit `.vscode/agent-config.json` to customize:

- Agent priorities and specialties
- Heartbeat intervals
- Stale threshold times
- Conflict resolution strategies

## 📁 File Structure

```
.vscode/
├── agent-scripts/          # Coordination scripts
│   ├── claude-update.cjs   # Claude Code commands
│   ├── copilot-update.cjs  # Copilot commands
│   ├── cursor-update.cjs   # Cursor commands
│   └── ...                 # Other utilities
├── agent-states/           # Runtime state (gitignored)
│   ├── claudeCode.json     # Claude's current state
│   ├── copilot.json        # Copilot's state
│   ├── cursor.json         # Cursor's state
│   └── unified-view.json   # Aggregated view
└── agent-config.json       # Your configuration (gitignored)
```

## 🚨 Troubleshooting

### System Not Responding
```bash
npm run agent:stop
npm run agent:start
```

### Files Stuck as Claimed
```bash
# Use the release script (for Cursor)
node .vscode/agent-scripts/cursor-release.cjs

# Or reset everything
npm run agent:reset
```

### Permission Errors
```bash
chmod +x .vscode/agent-scripts/*.cjs
```

## 📚 Additional Resources

- Full command reference: `docs/developer-guides/multi-agent-commands.md`
- Architecture overview: `docs/developer-guides/multi-agent-architecture.md`
- Example workflows: `.vscode/agent-scripts/demo-multi-agent.cjs`

## ⚠️ Important Notes

1. **Never edit** the state files directly - use the provided commands
2. **Always complete** your work to free up files for others
3. **Send heartbeats** regularly when working on long tasks
4. The `agent-states/` directory is gitignored - it contains runtime data

## 🤝 Contributing

When contributing to this system:

1. Don't modify the core orchestration logic without discussion
2. Test changes with the demo script: `npm run agent:demo`
3. Update documentation if adding new features
4. Keep backwards compatibility with existing commands

---

*For questions or issues with the multi-agent system, check the troubleshooting section or file an issue.*