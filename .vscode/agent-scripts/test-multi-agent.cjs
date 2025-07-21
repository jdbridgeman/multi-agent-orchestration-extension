#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple test script to demonstrate multi-agent coordination
// This won't hang because it doesn't use continuous file watching

const STATES_DIR = path.join(__dirname, '..', 'agent-states');

function testMultiAgent() {
   console.log('🧪 Testing Multi-Agent System\n');

   // Check if state directory exists
   if (!fs.existsSync(STATES_DIR)) {
      console.log('📁 Creating state directory...');
      fs.mkdirSync(STATES_DIR, { recursive: true });
   }

   // Simulate agent activities
   const agents = ['claudeCode', 'copilot', 'cursor'];

   console.log('🤖 Simulating agent activities...\n');

   agents.forEach((agent, index) => {
      const stateFile = path.join(STATES_DIR, `${agent}.json`);

      // Create different states for each agent
      const state = {
         agent: agent,
         status: index === 0 ? 'active' : 'idle',
         currentWork: index === 0 ? {
            files: ['test-file.ts'],
            task: 'Testing multi-agent system',
            started: new Date().toISOString()
         } : null,
         lastHeartbeat: new Date().toISOString()
      };

      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
      console.log(`✅ ${agent}: ${state.status}${state.currentWork ? ` (${state.currentWork.task})` : ''}`);
   });

   // Create unified view
   const unified = {
      lastUpdated: new Date().toISOString(),
      agents: {},
      fileOwnership: {
         'test-file.ts': {
            agent: 'claudeCode',
            since: new Date().toISOString(),
            task: 'Testing multi-agent system'
         }
      },
      conflicts: [],
      staleAgents: []
   };

   // Read agent states
   agents.forEach(agent => {
      const stateFile = path.join(STATES_DIR, `${agent}.json`);
      const content = fs.readFileSync(stateFile, 'utf8');
      unified.agents[agent] = JSON.parse(content);
   });

   fs.writeFileSync(path.join(STATES_DIR, 'unified-view.json'), JSON.stringify(unified, null, 2));

   console.log('\n📊 Current System State:');
   console.log('========================');

   Object.entries(unified.agents).forEach(([agent, state]) => {
      const emoji = state.status === 'active' ? '🟢' : '⚪';
      console.log(`${emoji} ${agent}: ${state.status}`);
      if (state.currentWork) {
         console.log(`   📝 ${state.currentWork.task}`);
         console.log(`   📁 ${state.currentWork.files.join(', ')}`);
      }
   });

   console.log('\n📁 File Ownership:');
   Object.entries(unified.fileOwnership).forEach(([file, owner]) => {
      console.log(`   🔒 ${file} → ${owner.agent}`);
   });

   console.log('\n✅ Multi-agent test completed successfully!');
   console.log('💡 No hanging issues with this approach');
}

// Run the test
testMultiAgent(); 