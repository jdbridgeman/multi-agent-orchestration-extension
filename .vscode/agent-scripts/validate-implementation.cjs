#!/usr/bin/env node

/**
 * MULTI-AGENT IMPLEMENTATION VALIDATOR
 * 
 * Cross-references our enhanced multi-agent system (v2.0) against
 * documented requirements and issues from docs/logs/7-15/
 * 
 * Usage: node validate-implementation.cjs
 */

const fs = require('fs');
const path = require('path');

class ImplementationValidator {
  constructor() {
    this.logsDir = path.join(__dirname, '..', '..', 'docs', 'logs', '7-15');
    this.agentScriptsDir = __dirname;
    this.results = {
      requirements: [],
      issues: [],
      features: [],
      coverage: {
        documented: 0,
        implemented: 0,
        missing: []
      }
    };
  }

  readLogFiles() {
    console.log('📚 Reading 7-15 log files...\n');
    
    const logFiles = [
      'copilot-work-log.md',
      'cursor-work-log.md', 
      'remaining-test-cleanup-plan.md',
      'test-results-action-plan.md',
      'typescript-error-fix-plan.md'
    ];

    const allContent = [];
    
    logFiles.forEach(file => {
      const filePath = path.join(this.logsDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        allContent.push({ file, content });
        console.log(`✅ Read: ${file} (${content.length} chars)`);
      } else {
        console.log(`⚠️  Missing: ${file}`);
      }
    });

    return allContent;
  }

  extractRequirements(logContent) {
    console.log('\n🔍 Extracting multi-agent requirements...\n');
    
    const patterns = {
      coordination: /coordination|conflict|claim|ownership|agent/gi,
      stale: /stale|timeout|inactive|heartbeat/gi,
      progress: /progress|status|percentage|tracking/gi,
      assignment: /assign|recommend|expertise|smart/gi,
      handoff: /handoff|release|transfer|complete/gi,
      force: /force|override|manual|emergency/gi
    };

    logContent.forEach(({ file, content }) => {
      console.log(`📝 Analyzing ${file}:`);
      
      Object.entries(patterns).forEach(([category, pattern]) => {
        const matches = content.match(pattern) || [];
        if (matches.length > 0) {
          console.log(`   ${category}: ${matches.length} mentions`);
          this.results.requirements.push({
            file,
            category,
            mentions: matches.length,
            samples: matches.slice(0, 3)
          });
        }
      });
    });
  }

  checkImplementedFeatures() {
    console.log('\n🚀 Checking implemented v2.0 features...\n');

    const features = [
      {
        name: 'Smart Assignment System',
        file: 'smart-assignment.cjs',
        keywords: ['expertise', 'recommendation', 'scoring']
      },
      {
        name: 'Progress Tracking',
        file: 'claude-update.cjs',
        keywords: ['progress', 'percentage', 'message']
      },
      {
        name: 'Auto-Conflict Resolution',
        file: 'claude-update.cjs', 
        keywords: ['force', 'stale', 'auto-claim']
      },
      {
        name: 'Graceful Handoffs',
        file: 'claude-update.cjs',
        keywords: ['release', 'handoff', 'notification']
      },
      {
        name: 'Health Checks',
        file: 'update-unified-view.cjs',
        keywords: ['30.*second', 'stale.*threshold', 'health']
      },
      {
        name: 'Documentation System',
        file: 'README.md',
        keywords: ['comprehensive', 'README', 'documentation']
      },
      {
        name: 'Agent Coordination',
        file: 'claude-update.cjs',
        keywords: ['AGENT_NAME', 'unified.*view', 'fileOwnership']
      }
    ];

    features.forEach(feature => {
      const filePath = path.join(this.agentScriptsDir, feature.file);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const implemented = feature.keywords.some(keyword => {
          const regex = new RegExp(keyword, 'i');
          return regex.test(content);
        });
        
        console.log(`${implemented ? '✅' : '❌'} ${feature.name}`);
        this.results.features.push({
          name: feature.name,
          implemented,
          file: feature.file
        });
        
        if (implemented) {
          this.results.coverage.implemented++;
        }
      } else {
        console.log(`❌ ${feature.name} (file missing: ${feature.file})`);
        this.results.features.push({
          name: feature.name,
          implemented: false,
          file: feature.file
        });
      }
      
      this.results.coverage.documented++;
    });
  }

  validateDocumentation() {
    console.log('\n📖 Validating documentation completeness...\n');

    const docFiles = [
      { name: 'Main README', file: 'README.md', required: true },
      { name: 'Quick Reference', file: 'QUICK-REFERENCE.md', required: true },
      { name: 'Changelog', file: 'CHANGELOG.md', required: true },
      { name: 'Smart Assignment', file: 'smart-assignment.cjs', required: true }
    ];

    docFiles.forEach(({ name, file, required }) => {
      const filePath = path.join(this.agentScriptsDir, file);
      const exists = fs.existsSync(filePath);
      
      if (exists) {
        const stats = fs.statSync(filePath);
        const size = Math.round(stats.size / 1024);
        console.log(`✅ ${name}: ${file} (${size}KB)`);
      } else {
        console.log(`${required ? '❌' : '⚠️'} ${name}: ${file} (missing)`);
        if (required) {
          this.results.coverage.missing.push(file);
        }
      }
    });
  }

  crossReferenceIssues(logContent) {
    console.log('\n🔎 Cross-referencing against known issues...\n');

    const knownIssues = [
      'stale agent detection',
      'conflict resolution', 
      'file ownership tracking',
      'heartbeat system',
      'agent coordination',
      'terminal hanging',
      'state corruption',
      'manual override'
    ];

    const resolvedIssues = [];
    const unaddressedIssues = [];

    knownIssues.forEach(issue => {
      // Check if issue appears in logs
      const mentionedInLogs = logContent.some(({ content }) => 
        content.toLowerCase().includes(issue.toLowerCase())
      );

      // Check if we have implementation for this issue
      const hasImplementation = this.results.features.some(feature => 
        feature.implemented && 
        feature.name.toLowerCase().includes(issue.split(' ')[0])
      );

      if (mentionedInLogs) {
        if (hasImplementation) {
          console.log(`✅ ${issue}: Mentioned in logs, implemented in v2.0`);
          resolvedIssues.push(issue);
        } else {
          console.log(`⚠️  ${issue}: Mentioned in logs, but not clearly implemented`);
          unaddressedIssues.push(issue);
        }
      }
    });

    this.results.issues = { resolved: resolvedIssues, unaddressed: unaddressedIssues };
  }

  generateReport() {
    console.log('\n📊 VALIDATION REPORT\n' + '='.repeat(50) + '\n');

    // Coverage Summary
    const coveragePercent = Math.round(
      (this.results.coverage.implemented / this.results.coverage.documented) * 100
    );
    console.log(`📈 Feature Coverage: ${this.results.coverage.implemented}/${this.results.coverage.documented} (${coveragePercent}%)`);

    // Requirements Analysis
    const totalMentions = this.results.requirements.reduce((sum, req) => sum + req.mentions, 0);
    console.log(`📝 Total requirement mentions found: ${totalMentions}`);

    // Issues Resolution
    console.log(`✅ Resolved issues: ${this.results.issues.resolved.length}`);
    console.log(`⚠️  Unaddressed issues: ${this.results.issues.unaddressed.length}`);

    // Missing Components
    if (this.results.coverage.missing.length > 0) {
      console.log(`\n❌ Missing required files:`);
      this.results.coverage.missing.forEach(file => {
        console.log(`   - ${file}`);
      });
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (coveragePercent >= 90) {
      console.log('   🎯 Excellent coverage! System appears complete.');
    } else if (coveragePercent >= 75) {
      console.log('   👍 Good coverage, minor gaps to address.');
    } else {
      console.log('   🔧 Significant gaps found, review needed.');
    }

    if (this.results.issues.unaddressed.length > 0) {
      console.log('   📋 Review unaddressed issues from logs.');
    }

    if (totalMentions > 50) {
      console.log('   📚 High coordination complexity - documentation is crucial.');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Validation complete!');
  }

  async run() {
    console.log('🔍 Multi-Agent Implementation Validator\n');
    
    try {
      const logContent = this.readLogFiles();
      this.extractRequirements(logContent);
      this.checkImplementedFeatures();
      this.validateDocumentation();
      this.crossReferenceIssues(logContent);
      this.generateReport();
      
      return this.results;
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new ImplementationValidator();
  validator.run();
}

module.exports = { ImplementationValidator };