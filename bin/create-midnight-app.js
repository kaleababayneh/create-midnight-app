#!/usr/bin/env node

import { program } from 'commander';
import { createMidnightApp } from '../lib/setup-project.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

console.log(chalk.blue.bold('🌙 Welcome to Create Midnight App!'));
console.log(chalk.gray(`Version ${packageJson.version}`));
console.log('');

program
  .name('create-midnight-app')
  .description('Create a new Midnight smart contract project with automated CLI generation')
  .argument('[project-name]', 'name of the project')
  .option('-t, --template <type>', 'template to use (currently only "default" available)', 'default')
  .option('--skip-install', 'skip installing dependencies')
  .option('--verbose', 'enable verbose logging')
  .version(packageJson.version)
  .addHelpText('after', `
Examples:
  $ npx create-midnight-app my-voting-contract
  $ npx create-midnight-app my-dapp --skip-install
  $ npx create-midnight-app my-project --verbose

After creating your project:
  1. Create a .compact file with your smart contract
  2. Run 'npm run dev' to generate CLI
  3. Run 'npm run deploy' to deploy to testnet
  4. Run 'npm run wallet' to generate a new wallet

Documentation: https://github.com/kaleababayneh/create-midnight-app
`)
  .action(async (projectName, options) => {
    try {
      // Default project name if none provided
      if (!projectName) {
        projectName = 'my-midnight-app';
        console.log(chalk.yellow(`No project name provided, using: ${chalk.bold(projectName)}`));
        console.log('');
      }
      
      await createMidnightApp(projectName, options);
    } catch (error) {
      console.error(chalk.red('❌ Error creating project:'), error.message);
      if (options.verbose) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();
