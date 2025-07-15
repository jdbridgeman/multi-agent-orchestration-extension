#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// AGENT CONFIGURATION - Change this line for each agent
const AGENT_NAME = 'AGENT_NAME_PLACEHOLDER'; // Replace with: 'claudeCode', 'copilot', or 'cursor'

const STATES_DIR = path.join(__dirname, '..', 'agent-states');
const MY_STATE_FILE = path.join(STATES_DIR, `${AGENT_NAME}.json`);
const UNIFIED_VIEW = path.join(STATES_DIR, 'unified-view.json');

class AgentUpdater {
  constructor() {
    this.ensureStateFile();
  }

  ensureStateFile() {
    if (!fs.existsSync(STATES_DIR)) {
      fs.mkdirSync(STATES_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(MY_STATE_FILE)) {
      this.writeState({
        agent: AGENT_NAME,
        status: 'idle',
        currentWork: null,
        lastHeartbeat: new Date().toISOString()
      });
    }
  }

  readState() {
    try {
      return JSON.parse(fs.readFileSync(MY_STATE_FILE, 'utf8'));
    } catch (error) {
      console.error('Error reading state:', error);
      return null;
    }
  }

  writeState(state) {
    state.agent = AGENT_NAME;
    state.lastHeartbeat = new Date().toISOString();
    
    try {
      fs.writeFileSync(MY_STATE_FILE, JSON.stringify(state, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing state:', error);
      return false;
    }
  }

  readUnifiedView() {
    try {
      if (fs.existsSync(UNIFIED_VIEW)) {
        return JSON.parse(fs.readFileSync(UNIFIED_VIEW, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not read unified view:', error.message);
    }
    return null;
  }

  start(files, task) {
    // Check unified view for conflicts
    const unified = this.readUnifiedView();
    if (unified?.fileOwnership) {
      const conflicts = [];
      files.forEach(file => {
        if (unified.fileOwnership[file] && unified.fileOwnership[file].agent !== AGENT_NAME) {
          conflicts.push({
            file: file,
            owner: unified.fileOwnership[file]
          });
        }
      });
      
      if (conflicts.length > 0) {
        console.error('\n⚠️  CONFLICT DETECTED!\n');
        conflicts.forEach(c => {
          const duration = Math.round((Date.now() - new Date(c.owner.since).getTime()) / 1000 / 60);
          console.error(`   📁 ${c.file}`);
          console.error(`   👤 Claimed by: ${c.owner.agent}`);
          console.error(`   📝 Their task: ${c.owner.task}`);
          console.error(`   ⏱️  Duration: ${duration} minutes\n`);
        });
        return false;
      }
    }

    // No conflicts, proceed
    const state = {
      agent: AGENT_NAME,
      status: 'active',
      currentWork: {
        files: files,
        task: task,
        started: new Date().toISOString()
      },
      lastHeartbeat: new Date().toISOString()
    };

    if (this.writeState(state)) {
      console.log(`\n✅ ${AGENT_NAME} Successfully Claimed Files\n`);
      console.log(`📁 Files: ${files.join(', ')}`);
      console.log(`📝 Task: ${task}`);
      console.log(`⏱️  Started: ${new Date().toLocaleTimeString()}\n`);
      return true;
    }
    return false;
  }

  complete() {
    const current = this.readState();
    if (!current || current.status !== 'active') {
      console.error('❌ No active work to complete');
      return false;
    }

    const duration = Math.round((Date.now() - new Date(current.currentWork.started).getTime()) / 1000 / 60);

    const state = {
      agent: AGENT_NAME,
      status: 'idle',
      currentWork: null,
      lastCompleted: {
        files: current.currentWork.files,
        task: current.currentWork.task,
        duration: duration,
        completed: new Date().toISOString()
      },
      lastHeartbeat: new Date().toISOString()
    };

    if (this.writeState(state)) {
      console.log(`\n✅ Work Completed!\n`);
      console.log(`📝 Task: ${current.currentWork.task}`);
      console.log(`⏱️  Duration: ${duration} minutes\n`);
      return true;
    }
    return false;
  }

  check() {
    const myState = this.readState();
    const unified = this.readUnifiedView();

    console.log(`\n🤖 ${AGENT_NAME} Status Report\n${'='.repeat(50)}\n`);

    // My status
    console.log('📊 My Status:');
    if (myState?.status === 'active') {
      const duration = Math.round((Date.now() - new Date(myState.currentWork.started).getTime()) / 1000 / 60);
      console.log(`   🟢 ACTIVE (${duration} min)`);
      console.log(`   📝 ${myState.currentWork.task}`);
      console.log(`   📁 ${myState.currentWork.files.join(', ')}`);
    } else {
      console.log(`   ⚪ IDLE`);
      if (myState?.lastCompleted) {
        console.log(`   ✅ Last: ${myState.lastCompleted.task} (${myState.lastCompleted.duration} min)`);
      }
    }

    // Other agents
    if (unified?.agents) {
      console.log('\n👥 Other Agents:');
      Object.entries(unified.agents).forEach(([agent, state]) => {
        if (agent !== AGENT_NAME && state.status === 'active') {
          console.log(`   ${agent}: ${state.currentWork.task}`);
        }
      });
    }

    // File ownership
    if (unified?.fileOwnership && Object.keys(unified.fileOwnership).length > 0) {
      console.log('\n📁 Current File Claims:');
      Object.entries(unified.fileOwnership).forEach(([file, owner]) => {
        const emoji = owner.agent === AGENT_NAME ? '✅' : '🔒';
        console.log(`   ${emoji} ${file} → ${owner.agent}`);
      });
    }

    // Conflicts
    if (unified?.conflicts && unified.conflicts.length > 0) {
      console.log('\n⚠️  Active Conflicts:');
      unified.conflicts.forEach(c => {
        console.log(`   ${c.file}: ${c.agents.join(' vs ')}`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }

  heartbeat() {
    const state = this.readState();
    if (state && state.status === 'active') {
      this.writeState(state);
      console.log(`💓 Heartbeat sent for ${AGENT_NAME}`);
    } else {
      console.log(`💤 ${AGENT_NAME} is idle, no heartbeat needed`);
    }
  }
}

// CLI Interface
const command = process.argv[2];
const updater = new AgentUpdater();

switch (command) {
  case 'start': {
    const filesArg = process.argv.indexOf('--files');
    const taskArg = process.argv.indexOf('--task');
    
    if (filesArg === -1 || taskArg === -1) {
      console.error(`Usage: node ${path.basename(process.argv[1])} start --files "file1.ts,file2.ts" --task "description"`);
      process.exit(1);
    }
    
    const files = process.argv[filesArg + 1].split(',').map(f => f.trim());
    const task = process.argv[taskArg + 1];
    
    if (!updater.start(files, task)) {
      process.exit(1);
    }
    break;
  }
  
  case 'complete':
    updater.complete();
    break;
    
  case 'check':
    updater.check();
    break;
    
  case 'heartbeat':
    updater.heartbeat();
    break;
    
  default:
    console.log(`
${AGENT_NAME} State Manager

Commands:
  start     - Claim files to work on
  complete  - Mark current work as complete  
  check     - View system status
  heartbeat - Send keepalive signal

Examples:
  node ${path.basename(process.argv[1])} start --files "audio-engine.ts" --task "Fix memory leak"
  node ${path.basename(process.argv[1])} complete
  node ${path.basename(process.argv[1])} check
`);
}