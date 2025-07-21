#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// AGENT CONFIGURATION - This is the only line that differs between agents
const AGENT_NAME = 'claudeCode'; // Change to 'copilot' or 'cursor' for other agents

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

  start(files, task, options = {}) {
    // Check if unified view is stale
    const unified = this.readUnifiedView();
    if (unified) {
      const unifiedAge = Date.now() - new Date(unified.lastUpdated).getTime();
      if (unifiedAge > 60000) { // 1 minute stale threshold for unified view
        console.warn(`⚠️  Unified view is ${Math.round(unifiedAge/1000)}s old. Running update...`);
        // Trigger unified view update
        require('./update-unified-view.cjs').updateUnifiedView();
      }
    }

    // Check unified view for conflicts after potential update
    const freshUnified = this.readUnifiedView();
    if (freshUnified?.fileOwnership) {
      const conflicts = [];
      files.forEach(file => {
        if (freshUnified.fileOwnership[file] && freshUnified.fileOwnership[file].agent !== AGENT_NAME) {
          const owner = freshUnified.fileOwnership[file];
          
          // Check if owning agent is stale
          const ownerState = freshUnified.agents[owner.agent];
          const ownerAge = ownerState ? Date.now() - new Date(ownerState.lastHeartbeat).getTime() : Infinity;
          
          if (ownerAge > 30000) { // 30 second stale threshold
            console.log(`🕐 Owner ${owner.agent} appears stale (${Math.round(ownerAge/1000)}s), auto-claiming file: ${file}`);
            // Continue - we can claim stale files
          } else {
            conflicts.push({
              file: file,
              owner: owner,
              ownerState: ownerState
            });
          }
        }
      });
      
      if (conflicts.length > 0) {
        if (options.force) {
          console.log('\n🚀 FORCE MODE: Overriding conflicts...\n');
          conflicts.forEach(c => {
            console.log(`   ⚡ Taking ${c.file} from ${c.owner.agent}`);
          });
        } else {
          console.error('\n⚠️  CONFLICT DETECTED!\n');
          conflicts.forEach(c => {
            const duration = Math.round((Date.now() - new Date(c.owner.since).getTime()) / 1000 / 60);
            const lastSeen = Math.round((Date.now() - new Date(c.ownerState.lastHeartbeat).getTime()) / 1000);
            console.error(`   📁 ${c.file}`);
            console.error(`   👤 Claimed by: ${c.owner.agent} (last seen ${lastSeen}s ago)`);
            console.error(`   📝 Their task: ${c.owner.task}`);
            console.error(`   ⏱️  Duration: ${duration} minutes`);
          });
          console.error('\n💡 Use --force to override conflicts or wait for them to complete.\n');
          return false;
        }
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
      console.log(`⏱️  Duration: ${duration} minutes`);
      
      // Create handoff notification for other agents
      this.createHandoffNotification(current.currentWork.files, 'completed');
      
      return true;
    }
    return false;
  }

  release(reason = 'manual') {
    const current = this.readState();
    if (!current || current.status !== 'active') {
      console.error('❌ No active work to release');
      return false;
    }

    const duration = Math.round((Date.now() - new Date(current.currentWork.started).getTime()) / 1000 / 60);

    const state = {
      agent: AGENT_NAME,
      status: 'idle',
      currentWork: null,
      lastReleased: {
        files: current.currentWork.files,
        task: current.currentWork.task,
        reason: reason,
        duration: duration,
        released: new Date().toISOString()
      },
      lastHeartbeat: new Date().toISOString()
    };

    if (this.writeState(state)) {
      console.log(`\n🔓 Files Released!\n`);
      console.log(`📝 Task: ${current.currentWork.task}`);
      console.log(`📁 Files: ${current.currentWork.files.join(', ')}`);
      console.log(`❓ Reason: ${reason}`);
      console.log(`⏱️  Duration: ${duration} minutes`);
      
      // Create handoff notification for other agents
      this.createHandoffNotification(current.currentWork.files, reason);
      
      return true;
    }
    return false;
  }

  createHandoffNotification(files, reason) {
    try {
      const handoffFile = path.join(path.dirname(MY_STATE_FILE), 'handoffs.json');
      let handoffs = [];
      
      if (fs.existsSync(handoffFile)) {
        handoffs = JSON.parse(fs.readFileSync(handoffFile, 'utf8'));
      }

      // Add new handoff notification
      handoffs.push({
        from: AGENT_NAME,
        files: files,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      // Keep only last 10 handoffs
      handoffs = handoffs.slice(-10);

      fs.writeFileSync(handoffFile, JSON.stringify(handoffs, null, 2));
      console.log(`📢 Handoff notification created for other agents`);
      
      // Suggest best agent for these files
      if (reason !== 'completed') {
        this.suggestNextAgent(files);
      }
      
    } catch (error) {
      console.warn('Could not create handoff notification:', error.message);
    }
  }

  suggestNextAgent(files) {
    try {
      const { SmartAssignment } = require('./smart-assignment.cjs');
      const assigner = new SmartAssignment();
      const recommendations = assigner.recommendAgent(files, 'File handoff');
      
      if (recommendations.length > 0) {
        console.log(`💡 Suggested next agent: ${recommendations[0].agent}`);
      }
    } catch (error) {
      // Smart assignment not available, skip
    }
  }

  check() {
    const myState = this.readState();
    const unified = this.readUnifiedView();

    console.log(`\n🤖 ${AGENT_NAME} Status Report\n${'='.repeat(50)}\n`);

    // My status
    console.log('📊 My Status:');
    if (myState?.status === 'active') {
      const duration = Math.round((Date.now() - new Date(myState.currentWork.started).getTime()) / 1000 / 60);
      const progress = myState.currentWork?.progress;
      const progressText = progress ? ` [${progress.percentage}%]` : '';
      console.log(`   🟢 ACTIVE (${duration} min)${progressText}`);
      console.log(`   📝 ${myState.currentWork.task}`);
      if (progress?.message) {
        console.log(`   💬 ${progress.message}`);
      }
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

  progress(percentage, message = null) {
    const state = this.readState();
    if (!state || state.status !== 'active') {
      console.error('❌ Cannot update progress - no active work');
      return false;
    }

    state.currentWork.progress = {
      percentage: Math.min(100, Math.max(0, percentage)),
      message: message,
      updated: new Date().toISOString()
    };

    if (this.writeState(state)) {
      const msg = message ? `: ${message}` : '';
      console.log(`📊 Progress: ${percentage}%${msg}`);
      return true;
    }
    return false;
  }

  heartbeat() {
    const state = this.readState();
    if (state && state.status === 'active') {
      this.writeState(state);
      const progressInfo = state.currentWork?.progress ? 
        ` (${state.currentWork.progress.percentage}%)` : '';
      console.log(`💓 Heartbeat sent for ${AGENT_NAME}${progressInfo}`);
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
    const forceFlag = process.argv.includes('--force');
    
    if (filesArg === -1 || taskArg === -1) {
      console.error('Usage: node claude-update.js start --files "file1.ts,file2.ts" --task "description" [--force]');
      process.exit(1);
    }
    
    const files = process.argv[filesArg + 1].split(',').map(f => f.trim());
    const task = process.argv[taskArg + 1];
    const options = { force: forceFlag };
    
    if (!updater.start(files, task, options)) {
      process.exit(1);
    }
    break;
  }
  
  case 'complete':
    updater.complete();
    break;
    
  case 'release': {
    const reasonArg = process.argv.indexOf('--reason');
    const reason = reasonArg !== -1 ? process.argv[reasonArg + 1] : 'manual';
    
    if (!updater.release(reason)) {
      process.exit(1);
    }
    break;
  }
    
  case 'check':
    updater.check();
    break;
    
  case 'heartbeat':
    updater.heartbeat();
    break;
    
  case 'progress': {
    const percentageArg = process.argv.indexOf('--percentage');
    const messageArg = process.argv.indexOf('--message');
    
    if (percentageArg === -1) {
      console.error('Usage: node claude-update.js progress --percentage 50 [--message "description"]');
      process.exit(1);
    }
    
    const percentage = parseInt(process.argv[percentageArg + 1]);
    const message = messageArg !== -1 ? process.argv[messageArg + 1] : null;
    
    if (!updater.progress(percentage, message)) {
      process.exit(1);
    }
    break;
  }
    
  default:
    console.log(`
${AGENT_NAME} State Manager

Commands:
  start     - Claim files to work on
  complete  - Mark current work as complete  
  release   - Release files without completing (for handoffs)
  progress  - Update work progress percentage
  check     - View system status
  heartbeat - Send keepalive signal

Examples:
  node ${path.basename(process.argv[1])} start --files "audio-engine.ts" --task "Fix memory leak" [--force]
  node ${path.basename(process.argv[1])} progress --percentage 50 --message "Fixed first bug"
  node ${path.basename(process.argv[1])} release --reason "switching to different task"
  node ${path.basename(process.argv[1])} complete
  node ${path.basename(process.argv[1])} check
`);
}