#!/usr/bin/env node

/**
 * Automated Testing Script for Claude Agent
 *
 * This script provides autonomous testing capabilities for the mobile app
 * without requiring human intervention.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutomatedTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      success: false,
      tests: {},
      summary: {},
      errors: [],
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📋';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      this.log(`Running: ${command} ${args.join(' ')}`);

      const process = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0,
        });
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runLinting() {
    this.log('🔍 Running ESLint checks...');
    const result = await this.runCommand('npm', ['run', 'lint']);

    this.results.tests.lint = {
      success: result.success,
      output: result.stdout,
      errors: result.stderr,
    };

    if (result.success) {
      this.log('ESLint passed successfully', 'success');
    } else {
      this.log('ESLint found issues', 'error');
      this.results.errors.push('Linting errors detected');
    }

    return result.success;
  }

  async runTypeChecking() {
    this.log('🔍 Running TypeScript type checking...');
    const result = await this.runCommand('npm', ['run', 'type-check']);

    this.results.tests.typeCheck = {
      success: result.success,
      output: result.stdout,
      errors: result.stderr,
    };

    if (result.success) {
      this.log('TypeScript type checking passed', 'success');
    } else {
      this.log('TypeScript type errors found', 'error');
      this.results.errors.push('Type checking errors detected');
    }

    return result.success;
  }

  async runUnitTests() {
    this.log('🧪 Running unit tests...');
    const result = await this.runCommand('npm', ['run', 'test:unit']);

    // Parse Jest output for test results
    const testOutput = result.stdout;
    const testSuites = this.parseTestResults(testOutput);

    this.results.tests.unit = {
      success: result.success,
      output: testOutput,
      errors: result.stderr,
      suites: testSuites,
    };

    if (result.success) {
      this.log('Unit tests passed successfully', 'success');
    } else {
      this.log('Unit tests failed', 'error');
      this.results.errors.push('Unit test failures detected');
    }

    return result.success;
  }

  async runIntegrationTests() {
    this.log('🔗 Running integration tests...');
    const result = await this.runCommand('npm', ['run', 'test:integration']);

    const testOutput = result.stdout;
    const testSuites = this.parseTestResults(testOutput);

    this.results.tests.integration = {
      success: result.success,
      output: testOutput,
      errors: result.stderr,
      suites: testSuites,
    };

    if (result.success) {
      this.log('Integration tests passed successfully', 'success');
    } else {
      this.log('Integration tests failed', 'error');
      this.results.errors.push('Integration test failures detected');
    }

    return result.success;
  }

  async runCoverageTests() {
    this.log('📊 Running test coverage analysis...');
    const result = await this.runCommand('npm', ['run', 'test:coverage']);

    const coverageInfo = this.parseCoverageResults(result.stdout);

    this.results.tests.coverage = {
      success: result.success,
      output: result.stdout,
      errors: result.stderr,
      coverage: coverageInfo,
    };

    if (result.success) {
      this.log('Coverage analysis completed', 'success');
    } else {
      this.log('Coverage analysis had issues', 'warning');
    }

    return result.success;
  }

  parseTestResults(output) {
    const lines = output.split('\n');
    const results = {
      totalSuites: 0,
      passedSuites: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    };

    lines.forEach(line => {
      if (line.includes('Test Suites:')) {
        const match = line.match(/(\d+) passed.*?(\d+) total/);
        if (match) {
          results.passedSuites = parseInt(match[1]);
          results.totalSuites = parseInt(match[2]);
        }
      }

      if (line.includes('Tests:')) {
        const passedMatch = line.match(/(\d+) passed/);
        const totalMatch = line.match(/(\d+) total/);
        const failedMatch = line.match(/(\d+) failed/);

        if (passedMatch) results.passedTests = parseInt(passedMatch[1]);
        if (totalMatch) results.totalTests = parseInt(totalMatch[1]);
        if (failedMatch) results.failedTests = parseInt(failedMatch[1]);
      }
    });

    return results;
  }

  parseCoverageResults(output) {
    const coverage = {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    };

    const lines = output.split('\n');
    lines.forEach(line => {
      if (line.includes('All files')) {
        const parts = line.split('|').map(s => s.trim());
        if (parts.length >= 5) {
          coverage.statements = parseFloat(parts[1]) || 0;
          coverage.branches = parseFloat(parts[2]) || 0;
          coverage.functions = parseFloat(parts[3]) || 0;
          coverage.lines = parseFloat(parts[4]) || 0;
        }
      }
    });

    return coverage;
  }

  generateSummary() {
    const { tests } = this.results;

    let totalTests = 0;
    let passedTests = 0;
    let totalSuites = 0;
    let passedSuites = 0;

    Object.values(tests).forEach(test => {
      if (test.suites) {
        totalTests += test.suites.totalTests || 0;
        passedTests += test.suites.passedTests || 0;
        totalSuites += test.suites.totalSuites || 0;
        passedSuites += test.suites.passedSuites || 0;
      }
    });

    this.results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      totalSuites,
      passedSuites,
      failedSuites: totalSuites - passedSuites,
      coverage: tests.coverage?.coverage || {},
      allTestsPassed: passedTests === totalTests && totalTests > 0,
      lintPassed: tests.lint?.success || false,
      typeCheckPassed: tests.typeCheck?.success || false,
    };

    this.results.success =
      this.results.summary.allTestsPassed &&
      this.results.summary.lintPassed &&
      this.results.summary.typeCheckPassed &&
      this.results.errors.length === 0;
  }

  async saveResults() {
    const resultsDir = path.join(__dirname, 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    this.log(`Test results saved to: ${filepath}`, 'info');
  }

  printSummary() {
    console.log('\n📊 AUTOMATED TESTING SUMMARY');
    console.log('═'.repeat(50));

    const { summary } = this.results;

    console.log(`🧪 Tests: ${summary.passedTests}/${summary.totalTests} passed`);
    console.log(`📦 Test Suites: ${summary.passedSuites}/${summary.totalSuites} passed`);
    console.log(`📝 Linting: ${summary.lintPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🔍 Type Check: ${summary.typeCheckPassed ? '✅ PASSED' : '❌ FAILED'}`);

    if (summary.coverage.statements !== undefined) {
      console.log(`📊 Coverage:`);
      console.log(`   Statements: ${summary.coverage.statements}%`);
      console.log(`   Branches: ${summary.coverage.branches}%`);
      console.log(`   Functions: ${summary.coverage.functions}%`);
      console.log(`   Lines: ${summary.coverage.lines}%`);
    }

    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.results.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`🎯 OVERALL RESULT: ${this.results.success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    console.log('═'.repeat(50));
  }

  async runFullTestSuite() {
    this.log('🚀 Starting automated testing suite...');

    try {
      // Run all test phases
      await this.runLinting();
      await this.runTypeChecking();
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runCoverageTests();

      // Generate summary and save results
      this.generateSummary();
      await this.saveResults();
      this.printSummary();

      // Exit with appropriate code
      process.exit(this.results.success ? 0 : 1);

    } catch (error) {
      this.log(`Fatal error during testing: ${error.message}`, 'error');
      this.results.errors.push(`Fatal error: ${error.message}`);
      this.results.success = false;

      await this.saveResults();
      this.printSummary();
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new AutomatedTester();
  tester.runFullTestSuite();
}

module.exports = AutomatedTester;