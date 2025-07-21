#!/usr/bin/env node
/**
 * cursor-release.cjs - CLI to release Cursor's file checkouts
 *
 * Usage:
 *   node .vscode/agent-scripts/cursor-release.cjs           # Interactive release
 *   node .vscode/agent-scripts/cursor-release.cjs --all     # Release all files
 *   node .vscode/agent-scripts/cursor-release.cjs --files "file1,file2"
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CURSOR_STATE = path.resolve(__dirname, '../agent-states/cursor.json');
const UPDATE_SCRIPT = path.resolve(__dirname, 'cursor-update.cjs');

function getArg(flag) {
   const idx = process.argv.indexOf(flag);
   if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
   return null;
}

function updateUnifiedView() {
   // Run the update script to refresh the unified view
   const { spawnSync } = require('child_process');
   spawnSync('node', [UPDATE_SCRIPT, 'complete'], { stdio: 'inherit' });
}

function printFiles(files) {
   if (!files || files.length === 0) {
      console.log('No files currently claimed by Cursor.');
      return;
   }
   console.log('Files currently claimed by Cursor:');
   files.forEach((f, i) => console.log(`  [${i + 1}] ${f}`));
}

function saveCursorState(state) {
   fs.writeFileSync(CURSOR_STATE, JSON.stringify(state, null, 2));
}

function releaseAll(state) {
   state.status = 'idle';
   state.currentWork = undefined;
   saveCursorState(state);
   updateUnifiedView();
   console.log('✅ All files released and status set to idle.');
}

function releaseFiles(state, filesToRelease) {
   if (!state.currentWork || !state.currentWork.files) return;
   state.currentWork.files = state.currentWork.files.filter(f => !filesToRelease.includes(f));
   if (state.currentWork.files.length === 0) {
      state.status = 'idle';
      state.currentWork = undefined;
   }
   saveCursorState(state);
   updateUnifiedView();
   console.log(`✅ Released files: ${filesToRelease.join(', ')}`);
}

function interactiveRelease(state) {
   if (!state.currentWork || !state.currentWork.files || state.currentWork.files.length === 0) {
      console.log('No files currently claimed by Cursor.');
      return;
   }
   printFiles(state.currentWork.files);
   const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
   rl.question('Enter file numbers to release (comma-separated), or "all" to release all: ', answer => {
      rl.close();
      if (answer.trim().toLowerCase() === 'all') {
         releaseAll(state);
         return;
      }
      const nums = answer.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      const filesToRelease = nums.map(n => state.currentWork.files[n - 1]).filter(Boolean);
      if (filesToRelease.length === 0) {
         console.log('No valid files selected.');
         return;
      }
      releaseFiles(state, filesToRelease);
   });
}

// Main
if (!fs.existsSync(CURSOR_STATE)) {
   console.error('Cursor state file not found:', CURSOR_STATE);
   process.exit(1);
}
const state = JSON.parse(fs.readFileSync(CURSOR_STATE, 'utf8'));
const allFlag = process.argv.includes('--all');
const filesArg = getArg('--files');

if (allFlag) {
   releaseAll(state);
} else if (filesArg) {
   const filesToRelease = filesArg.split(',').map(f => f.trim()).filter(Boolean);
   releaseFiles(state, filesToRelease);
} else {
   interactiveRelease(state);
} 