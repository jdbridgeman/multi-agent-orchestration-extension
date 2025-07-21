# .vscode Directory

This directory contains VS Code configuration and the multi-agent orchestration system for the Anthemic project.

## Contents

### Configuration Files
- `settings.json` - Shared VS Code settings for the project
- `agent-config.example.json` - Example configuration for multi-agent system

### Multi-Agent System
- `agent-scripts/` - Coordination scripts for Claude Code, Copilot, and Cursor
- `agent-states.example/` - Example state files showing the expected format
- `MULTI_AGENT_SETUP.md` - Complete setup guide for the multi-agent system

### Local Files (Not in Git)
The following are created locally and should not be committed:
- `agent-states/` - Runtime state for agent coordination
- `agent-config.json` - Your personal agent configuration
- `*.local.json` - Any local settings overrides

## Setup Instructions

See `MULTI_AGENT_SETUP.md` for detailed instructions on setting up the multi-agent development system.

## Important Notes

- The multi-agent system prevents conflicts when multiple AI assistants work on the same codebase
- State files in `agent-states/` are automatically managed - do not edit manually
- All `*.local.json` files are gitignored for personal preferences