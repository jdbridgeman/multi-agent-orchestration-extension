#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { watch } = require('fs');

class StateAggregator {
  constructor() {
    this.stateDir = path.join(__dirname, 'agent-states');
    this.agents = ['claudeCode', 'copilot', 'cursor'];
    this.unifiedViewPath = path.join(this.stateDir, 'unified-view.json');
    
    // Ensure directory exists
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
    
    this.setupWatchers();
    this.updateUnifiedView();
    
    console.log('🚀 State aggregator started');
    console.log(`📁 Watching: ${this.stateDir}`);
    console.log(`📊 Unified view: ${this.unifiedViewPath}`);
  }

  setupWatchers() {
    // Watch each agent's state file
    this.agents.forEach(agent => {
      const filePath = path.join(this.stateDir, `${agent}.json`);
      
      // Create initial empty state if doesn't exist
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({
          agent: agent,
          status: 'idle',
          currentWork: null,
          lastHeartbeat: new Date().toISOString()
        }, null, 2));
      }
      
      // Watch for changes
      fs.watchFile(filePath, { interval: 1000 }, () => {
        console.log(`📝 ${agent} state updated`);
        this.updateUnifiedView();
      });
    });
  }

  updateUnifiedView() {
    const unified = {
      lastUpdated: new Date().toISOString(),
      agents: {},
      fileOwnership: {},
      conflicts: [],
      staleAgents: []
    };

    const now = Date.now();
    const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes

    // Read each agent's state
    this.agents.forEach(agent => {
      try {
        const filePath = path.join(this.stateDir, `${agent}.json`);
        const content = fs.readFileSync(filePath, 'utf8');
        const agentState = JSON.parse(content);
        
        // Check if agent is stale
        const lastHeartbeat = new Date(agentState.lastHeartbeat).getTime();
        if (agentState.status === 'active' && (now - lastHeartbeat) > STALE_THRESHOLD) {
          unified.staleAgents.push({
            agent: agent,
            lastSeen: agentState.lastHeartbeat,
            minutesAgo: Math.round((now - lastHeartbeat) / 1000 / 60)
          });
          // Mark as stale but don't modify their file
          agentState.status = 'stale';
        }
        
        unified.agents[agent] = agentState;
        
        // Track file ownership for active agents
        if (agentState.status === 'active' && agentState.currentWork?.files) {
          agentState.currentWork.files.forEach(file => {
            if (unified.fileOwnership[file]) {
              // Conflict detected!
              unified.conflicts.push({
                file: file,
                agents: [unified.fileOwnership[file].agent, agent],
                detected: new Date().toISOString()
              });
            } else {
              unified.fileOwnership[file] = {
                agent: agent,
                since: agentState.currentWork.started,
                task: agentState.currentWork.task
              };
            }
          });
        }
      } catch (error) {
        console.error(`❌ Error reading ${agent} state:`, error.message);
        unified.agents[agent] = {
          agent: agent,
          status: 'error',
          error: error.message
        };
      }
    });

    // Write unified view
    try {
      fs.writeFileSync(
        this.unifiedViewPath,
        JSON.stringify(unified, null, 2)
      );
    } catch (error) {
      console.error('❌ Error writing unified view:', error);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down aggregator...');
  process.exit(0);
});

// Start the aggregator
new StateAggregator();