#!/usr/bin/env node

/**
 * Validation script for create-midnight-app
 * Run this before publishing to ensure everything works correctly
 */

import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

const TEST_PROJECT_NAME = 'test-validation-project';

async function runTest() {
  console.log(chalk.blue.bold('🧪 Running create-midnight-app validation tests'));
  console.log('');

  try {
    // Test 1: Create project
    console.log(chalk.blue('📋 Test 1: Creating test project...'));
    await runCommand('create-midnight-app', [TEST_PROJECT_NAME, '--skip-install'], process.cwd());
    console.log(chalk.green('✅ Project creation successful'));

    // Test 2: Check files exist
    console.log(chalk.blue('📋 Test 2: Checking project structure...'));
    const projectDir = path.join(process.cwd(), TEST_PROJECT_NAME);
    
    const requiredFiles = [
      'package.json',
      'README.md',
      'boilerplate/scripts/auto-generator.js',
      'boilerplate/contract/package.json',
      'boilerplate/contract-cli/package.json'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(projectDir, file);
      if (!(await fs.pathExists(filePath))) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    console.log(chalk.green('✅ Project structure validation successful'));

    // Test 3: Check package.json was updated
    console.log(chalk.blue('📋 Test 3: Checking package.json customization...'));
    const packageJson = await fs.readJson(path.join(projectDir, 'package.json'));
    if (packageJson.name !== TEST_PROJECT_NAME) {
      throw new Error(`Package name not updated: expected ${TEST_PROJECT_NAME}, got ${packageJson.name}`);
    }
    console.log(chalk.green('✅ Package.json customization successful'));

    // Test 4: Install dependencies
    console.log(chalk.blue('📋 Test 4: Installing dependencies...'));
    await runCommand('npm', ['install'], projectDir);
    console.log(chalk.green('✅ Dependency installation successful'));

    // Test 5: Run check command
    console.log(chalk.blue('📋 Test 5: Running check command...'));
    await runCommand('npm', ['run', 'check'], projectDir);
    console.log(chalk.green('✅ Check command successful'));

    console.log('');
    console.log(chalk.green.bold('🎉 All validation tests passed!'));
    console.log(chalk.blue('Your create-midnight-app package is ready for publishing.'));

  } catch (error) {
    console.log('');
    console.error(chalk.red.bold('❌ Validation failed:'), error.message);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('');
    console.log(chalk.gray('🧹 Cleaning up test project...'));
    try {
      await fs.remove(path.join(process.cwd(), TEST_PROJECT_NAME));
      console.log(chalk.gray('✅ Cleanup complete'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Manual cleanup needed for:', TEST_PROJECT_NAME));
    }
  }
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to run command: ${error.message}`));
    });
  });
}

runTest();
