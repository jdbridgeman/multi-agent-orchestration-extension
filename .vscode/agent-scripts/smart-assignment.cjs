#!/usr/bin/env node

/**
 * SMART ASSIGNMENT SYSTEM
 * 
 * Intelligent task routing for multi-agent coordination.
 * Recommends the best agent for files and tasks based on:
 * - File pattern expertise matching (40% weight)
 * - Task keyword analysis (40% weight) 
 * - Current agent workload (20% weight)
 * 
 * Usage:
 *   npm run agent:suggest --files "file1.ts,file2.ts" --task "description"
 *   node smart-assignment.cjs suggest --files "..." --task "..."
 * 
 * Integration:
 *   Used by release() function in agent update scripts
 *   Automatically suggests next agent for handed-off files
 */

const fs = require('fs');
const path = require('path');

// Agent expertise mapping based on your feedback
const AGENT_EXPERTISE = {
  claudeCode: {
    primary: ['architecture', 'foundation', 'refactoring', 'documentation'],
    secondary: ['tests', 'config', 'build'],
    filePatterns: [
      /.*\.md$/,
      /.*architecture.*$/,
      /.*config.*$/,
      /.*\.config\./,
      /CLAUDE\.md$/,
      /package\.json$/,
      /.*\.yml$/,
      /.*\.yaml$/
    ],
    taskKeywords: ['architect', 'foundation', 'refactor', 'document', 'structure', 'design', 'organize']
  },
  
  copilot: {
    primary: ['ml', 'algorithms', 'data-processing', 'optimization'],
    secondary: ['tests', 'config', 'performance'],
    filePatterns: [
      /.*\/ml\/.*$/,
      /.*machine.*learning.*$/,
      /.*neural.*$/,
      /.*algorithm.*$/,
      /.*probabilistic.*$/,
      /.*inference.*$/,
      /.*markov.*$/
    ],
    taskKeywords: ['ml', 'machine learning', 'neural', 'algorithm', 'inference', 'model', 'training', 'optimization']
  },

  cursor: {
    primary: ['ui', 'integration', 'testing', 'frontend'],
    secondary: ['config', 'api'],
    filePatterns: [
      /.*\/components\/.*$/,
      /.*\/ui\/.*$/,
      /.*\.test\..*$/,
      /.*\.spec\..*$/,
      /.*integration.*$/,
      /.*\.tsx?$/,
      /.*hooks.*$/,
      /.*pages.*$/
    ],
    taskKeywords: ['ui', 'component', 'test', 'integration', 'frontend', 'interface', 'user', 'visual', 'react']
  }
};

const WORKLOAD_WEIGHTS = {
  idle: 0,
  active: 10,
  stale: 5  // Stale agents get lower weight
};

class SmartAssignment {
  constructor() {
    this.statesDir = path.join(__dirname, '..', 'agent-states');
    this.unifiedView = path.join(this.statesDir, 'unified-view.json');
  }

  readUnifiedView() {
    try {
      if (fs.existsSync(this.unifiedView)) {
        return JSON.parse(fs.readFileSync(this.unifiedView, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not read unified view:', error.message);
    }
    return null;
  }

  calculateFileScore(agent, files) {
    let score = 0;
    const expertise = AGENT_EXPERTISE[agent];
    
    if (!expertise) return 0;

    files.forEach(file => {
      // Check file patterns
      for (const pattern of expertise.filePatterns) {
        if (pattern.test(file)) {
          score += 10;
          break;
        }
      }
    });

    return score;
  }

  calculateTaskScore(agent, task) {
    let score = 0;
    const expertise = AGENT_EXPERTISE[agent];
    
    if (!expertise) return 0;

    const taskLower = task.toLowerCase();

    // Primary keywords get higher weight
    expertise.taskKeywords.forEach(keyword => {
      if (taskLower.includes(keyword.toLowerCase())) {
        if (expertise.primary.some(p => keyword.toLowerCase().includes(p))) {
          score += 20;
        } else {
          score += 10;
        }
      }
    });

    return score;
  }

  calculateWorkloadScore(agent, unified) {
    const agentState = unified?.agents?.[agent];
    if (!agentState) return 100; // Unknown agent gets neutral score

    const weight = WORKLOAD_WEIGHTS[agentState.status] || 0;
    
    // Invert so lower workload = higher score
    return Math.max(0, 100 - weight);
  }

  recommendAgent(files, task) {
    const unified = this.readUnifiedView();
    const agents = Object.keys(AGENT_EXPERTISE);
    const recommendations = [];

    agents.forEach(agent => {
      const fileScore = this.calculateFileScore(agent, files);
      const taskScore = this.calculateTaskScore(agent, task);
      const workloadScore = this.calculateWorkloadScore(agent, unified);
      
      // Weighted total score
      const totalScore = (fileScore * 0.4) + (taskScore * 0.4) + (workloadScore * 0.2);
      
      recommendations.push({
        agent,
        score: totalScore,
        breakdown: {
          files: fileScore,
          task: taskScore,
          workload: workloadScore
        },
        status: unified?.agents?.[agent]?.status || 'unknown'
      });
    });

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations;
  }

  suggest(files, task) {
    console.log(`\n🎯 Smart Assignment Recommendation\n${'='.repeat(50)}\n`);
    console.log(`📁 Files: ${files.join(', ')}`);
    console.log(`📝 Task: ${task}\n`);

    const recommendations = this.recommendAgent(files, task);
    
    console.log('🏆 Recommended Agents (by score):');
    recommendations.forEach((rec, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const status = rec.status === 'active' ? '🟢' : rec.status === 'idle' ? '⚪' : '🔴';
      
      console.log(`${emoji} ${rec.agent} ${status} (Score: ${rec.score.toFixed(1)})`);
      console.log(`    📊 Files: ${rec.breakdown.files}, Task: ${rec.breakdown.task}, Workload: ${rec.breakdown.workload}`);
    });

    console.log(`\n💡 Best choice: ${recommendations[0].agent}\n`);
    
    return recommendations;
  }
}

// CLI Interface
const command = process.argv[2];
const assigner = new SmartAssignment();

switch (command) {
  case 'suggest': {
    const filesArg = process.argv.indexOf('--files');
    const taskArg = process.argv.indexOf('--task');
    
    if (filesArg === -1 || taskArg === -1) {
      console.error('Usage: node smart-assignment.js suggest --files "file1.ts,file2.ts" --task "description"');
      process.exit(1);
    }
    
    const files = process.argv[filesArg + 1].split(',').map(f => f.trim());
    const task = process.argv[taskArg + 1];
    
    assigner.suggest(files, task);
    break;
  }
  
  default:
    console.log(`
Smart Assignment System

Commands:
  suggest   - Get agent recommendations for files and task

Examples:
  node smart-assignment.js suggest --files "neural-melody.ts,ml-cache.ts" --task "Fix ML inference bug"
`);
}

module.exports = { SmartAssignment };