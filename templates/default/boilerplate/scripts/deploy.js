#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced deployment script for Midnight testnet:
 * 1. Runs npm run dev (compile and generate CLI)
 * 2. Connects to testnet and deploys the contract automatically
 */
class MidnightDeployer {
  constructor(deployMode = 'new') {
    this.projectRoot = path.resolve(__dirname, '..', '..');
    this.cliDir = path.join(this.projectRoot, 'boilerplate', 'contract-cli');
    this.deployMode = deployMode; // 'new' or 'join'
  }

  /**
   * Run a command and return a promise
   */
  runCommand(command, args, cwd, description, env = {}) {
    return new Promise((resolve, reject) => {
      console.log(`\n🔄 ${description}...`);
      console.log(`📍 Running: ${command} ${args.join(' ')}`);
      console.log(`📁 Working directory: ${cwd}`);
      
      const child = spawn(command, args, {
        cwd,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, ...env }  // Merge environment variables
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${description} completed successfully`);
          resolve();
        } else {
          console.error(`❌ ${description} failed with code ${code}`);
          reject(new Error(`${description} failed`));
        }
      });

      child.on('error', (error) => {
        console.error(`❌ ${description} error:`, error);
        reject(error);
      });
    });
  }

  /**
   * Check prerequisites for testnet deployment
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...\n');
    
    // Check if .compact file exists
    const fs = await import('node:fs');
    const compactFiles = fs.readdirSync(this.projectRoot).filter(f => f.endsWith('.compact'));
    
    if (compactFiles.length === 0) {
      console.error('❌ No .compact contract file found in project root');
      console.error('💡 Create a .compact file first, e.g.: touch my-contract.compact');
      return false;
    }
    
    console.log(`✅ Found contract file(s): ${compactFiles.join(', ')}`);
    console.log('✅ All prerequisites met\n');
    return true;
  }

  /**
   * Dry run - show what would be executed
   */
  async dryRun() {
    console.log('🔍 DRY RUN - Commands that would be executed:\n');
    
    console.log('1️⃣ npm run dev');
    console.log('   📁 Working directory:', this.projectRoot);
    console.log('   📝 Compiles contract and generates CLI\n');
    
    console.log('2️⃣ npm run testnet-remote');
    console.log('   📁 Working directory:', this.cliDir);
    console.log('   📝 Connects to testnet and deploys contract\n');
    
    console.log('💡 Run without --dry-run to execute these commands');
  }

  /**
   * Main deployment workflow for testnet
   */
  async deploy() {
    try {
      const modeText = this.deployMode === 'join' ? 'Joining Existing Contract' : 'Deploying New Contract';
      
      console.log(`🚀 Starting Midnight Contract ${modeText} on testnet...\n`);
      
      // Check prerequisites
      const prereqsOk = await this.checkPrerequisites();
      if (!prereqsOk) {
        process.exit(1);
      }
      
      console.log('📋 Deployment Steps:');
      console.log('   1. 🔨 Compile contract and generate CLI');
      console.log('   2. 🌐 Connect to testnet');
      if (this.deployMode === 'join') {
        console.log('   3. 🔗 Join existing contract on testnet');
      } else {
        console.log('   3. 📦 Deploy new contract to testnet');
      }
      console.log('   4. 🎯 Launch interactive CLI\n');

      // Step 1: Run npm run dev (compile and generate)
      await this.runCommand(
        'npm', 
        ['run', 'dev'], 
        this.projectRoot,
        'Compiling contract and generating CLI'
      );

      // Step 2 & 3 & 4: Run testnet-remote (connects to testnet, deploys, and launches CLI)
      await this.runCommand(
        'npm', 
        ['run', 'testnet-remote'], 
        this.cliDir,
        'Connecting to testnet and deploying contract',
        { 
          AUTO_DEPLOY: 'true',
          DEPLOY_MODE: this.deployMode || 'new'
        }
      );

      console.log(`\n🎉 ${modeText} on testnet completed successfully!`);
      console.log('💡 The interactive CLI should now be running.');
      if (this.deployMode === 'join') {
        console.log('   You can now interact with the existing contract.');
      } else {
        console.log('   You can deploy contracts, call functions, and test your app.');
      }

    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      console.error('\n🔧 Troubleshooting:');
      console.error('   - Check your testnet connection');
      console.error('   - Verify your wallet has sufficient testnet balance');
      console.error('   - Check that your .compact contract file exists');
      console.error('   - Verify npm dependencies are installed');
      console.error('   - Ensure WALLET_SEED is set in .env file (or will be prompted)\n');
      process.exit(1);
    }
  }

  /**
   * Display help information
   */
  showHelp() {
    console.log(`
🌙 Midnight Contract Deployment Tool - Testnet Only

Usage:
  npm run deploy                         Deploy new contract to testnet
  npm run deploy:new                     Deploy new contract to testnet (same as above)
  npm run deploy:join                    Join existing contract on testnet
  npm run wallet                         Interactive testnet deployment
  npm run deploy -- --dry-run            Show what commands would be executed
  npm run deploy -- --help               Show this help message

What this does:
  1. Compiles your .compact contract
  2. Generates TypeScript types and CLI
  3. Connects to Midnight testnet
  4. Deploys/joins your contract automatically
  5. Launches an interactive CLI for testing

Requirements:
  - Node.js 18+
  - .compact contract file in project root
  - Wallet with testnet funds

Environment Variables:
  - WALLET_SEED: Set your wallet seed phrase to skip manual entry

Setup for automated deployment:
  1. Copy .env.example to .env
  2. Add your WALLET_SEED=your-seed-phrase-here
  3. Run deployment commands without prompts

Examples:
  npm run deploy                         # Deploy new contract to testnet
  npm run deploy:join                    # Join existing contract on testnet
  npm run wallet                         # Interactive testnet CLI
`);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

// Parse deploy mode from arguments
let deployMode = 'new'; // default
if (args.includes('--new')) {
  deployMode = 'new';
} else if (args.includes('--join')) {
  deployMode = 'join';
}

if (args.includes('--help') || args.includes('-h')) {
  const deployer = new MidnightDeployer();
  deployer.showHelp();
  process.exit(0);
}

if (args.includes('--dry-run')) {
  const deployer = new MidnightDeployer(deployMode);
  await deployer.dryRun();
  process.exit(0);
}

// Run deployment with selected mode
const deployer = new MidnightDeployer(deployMode);
deployer.deploy().catch(console.error);
