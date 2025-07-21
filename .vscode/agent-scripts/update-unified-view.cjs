#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple script to update unified view without hanging
// Run this manually or from agent scripts when needed

const STATES_DIR = path.join(__dirname, '..', 'agent-states');
const UNIFIED_VIEW = path.join(STATES_DIR, 'unified-view.json');
const AGENTS = ['claudeCode', 'copilot', 'cursor'];

function updateUnifiedView() {
   console.log('🔄 Updating unified view...');

   const unified = {
      lastUpdated: new Date().toISOString(),
      agents: {},
      fileOwnership: {},
      conflicts: [],
      staleAgents: []
   };

   const now = Date.now();
   const STALE_THRESHOLD = 30 * 1000; // 30 seconds

   // Read each agent's state
   AGENTS.forEach(agent => {
      try {
         const filePath = path.join(STATES_DIR, `${agent}.json`);

         if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Creating missing state file for ${agent}`);
            fs.writeFileSync(filePath, JSON.stringify({
               agent: agent,
               status: 'idle',
               currentWork: null,
               lastHeartbeat: new Date().toISOString()
            }, null, 2));
         }

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
            error: error.message,
            lastHeartbeat: new Date().toISOString()
         };
      }
   });

   // Write unified view
   try {
      fs.writeFileSync(UNIFIED_VIEW, JSON.stringify(unified, null, 2));
      console.log('✅ Unified view updated successfully');

      // Show summary
      const activeAgents = Object.values(unified.agents).filter(a => a.status === 'active');
      const conflicts = unified.conflicts.length;
      const staleAgents = unified.staleAgents.length;

      console.log(`📊 Summary: ${activeAgents.length} active agents, ${conflicts} conflicts, ${staleAgents} stale agents`);

   } catch (error) {
      console.error('❌ Error writing unified view:', error.message);
   }
}

// Run if called directly
if (require.main === module) {
   updateUnifiedView();
}

module.exports = { updateUnifiedView }; 