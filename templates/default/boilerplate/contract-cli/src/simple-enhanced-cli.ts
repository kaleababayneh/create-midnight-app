// Simple enhanced CLI wrapper
// Generated on: 2025-06-08T21:15:00.000Z
// Auto-generated from zkvote.compact

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Configure dotenv to load from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

import { type Resource } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import { type Logger } from 'pino';
import { type CounterProviders, type DeployedCounterContract } from './common-types.js';
import { type Config } from './config.js';
import { ContractAnalyzer, type ContractAnalysis } from './contract-analyzer.js';
import { DynamicCLIGenerator, type MenuItem } from './dynamic-cli-generator.js';
import * as api from './api.js';

/**
 * Simple Enhanced CLI that dynamically adapts to contract functions
 */
export class SimpleEnhancedCLI {
  private analyzer: ContractAnalyzer;
  private cliGenerator: DynamicCLIGenerator;
  private contractInfo: ContractAnalysis | null = null;
  private contract: DeployedCounterContract | null = null;

  constructor(private logger: Logger) {
    this.analyzer = new ContractAnalyzer();
    this.cliGenerator = new DynamicCLIGenerator(logger);
  }

  async initialize(): Promise<void> {
    try {
      this.contractInfo = await this.analyzer.analyzeContract();
      await this.cliGenerator.initialize();
      this.logger.info('🎯 Enhanced CLI initialized with dynamic contract analysis');
    } catch (error) {
      this.logger.error(`Failed to initialize: ${(error as Error).message}`);
      throw error;
    }
  }

  async runEnhancedCLI(providers: CounterProviders, rli: Interface): Promise<void> {
    if (!this.contractInfo) {
      throw new Error('Contract info not available');
    }

    this.logger.info(`=== ${this.contractInfo.contractName} CLI ===`);
    this.logger.info(`📊 Available functions: ${this.contractInfo.functions.map(f => f.name).join(', ')}`);
    
    const menuItems = this.cliGenerator.generateMenuItems();
    
    while (true) {
      const question = this.cliGenerator.generateMenuQuestion(menuItems);
      const choice = await rli.question(question);
      
      try {
        const choiceNum = parseInt(choice, 10) - 1;
        
        if (choiceNum >= 0 && choiceNum < menuItems.length) {
          const selectedItem = menuItems[choiceNum];
          
          if (selectedItem.id === 'exit') {
            this.logger.info('👋 Goodbye!');
            break;
          }
          
          if (this.contract) {
            await selectedItem.action(providers, this.contract, rli);
          } else {
            this.logger.error('❌ No contract available');
          }
        } else {
          this.logger.error(`❌ Invalid choice: ${choice}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(`❌ Operation failed: ${error.message}`);
          if (error.message.includes('member')) {
            this.logger.warn('💡 This might be because you have already voted. Each wallet can only vote once.');
          }
        } else {
          this.logger.error(`❌ Unknown error occurred: ${String(error)}`);
        }
        this.logger.info('You can try another operation or exit.');
      }
    }
  }

  async deployOrJoin(providers: CounterProviders, rli: Interface): Promise<DeployedCounterContract | null> {
    if (!this.contractInfo) {
      throw new Error('Contract info not available');
    }
    
    // Check if auto-deploy is enabled (set by deployment script)
    if (process.env.AUTO_DEPLOY === 'true') {
      const deployMode = process.env.DEPLOY_MODE || 'new';
      
      if (deployMode === 'join') {
        this.logger.info('🔗 Auto-joining existing contract...');
        const contractAddress = await rli.question('What is the contract address (in hex)? ');
        this.contract = await api.joinContract(providers, contractAddress);
        this.logger.info(`🔗 Successfully joined ${this.contractInfo.contractName}!`);
        return this.contract;
      } else {
        this.logger.info('🚀 Auto-deploying new contract...');
        this.contract = await api.deploy(providers, { secretKey: new Uint8Array(32).fill(1) });
        this.logger.info(`🎉 Successfully deployed ${this.contractInfo.contractName}!`);
        return this.contract;
      }
    }
    
    const question = `
You can do one of the following:
  1. Deploy a new ${this.contractInfo.contractName}
  2. Join an existing ${this.contractInfo.contractName}
  3. Exit
Which would you like to do? `;

    while (true) {
      const choice = await rli.question(question);
      switch (choice) {
        case '1':
          this.contract = await api.deploy(providers, { secretKey: new Uint8Array(32).fill(1) });
          this.logger.info(`🎉 Successfully deployed ${this.contractInfo.contractName}!`);
          return this.contract;
        case '2':
          const contractAddress = await rli.question('What is the contract address (in hex)? ');
          this.contract = await api.joinContract(providers, contractAddress);
          this.logger.info(`🔗 Successfully joined ${this.contractInfo.contractName}!`);
          return this.contract;
        case '3':
          this.logger.info('Exiting...');
          return null;
        default:
          this.logger.error(`Invalid choice: ${choice}`);
      }
    }
  }

  async run(config: Config, logger: Logger, dockerEnv?: boolean): Promise<void> {
    // Set the global logger for API functions
    api.setLogger(logger);
    
    await this.initialize();
    
    const rli = createInterface({ input, output, terminal: true });
    
    try {
      // Check for seed phrase in environment variable first
      let seedPhrase = process.env.WALLET_SEED;
      
      if (!seedPhrase) {
        logger.info('No WALLET_SEED found in environment variables. Please enter manually or add to .env file.');
        seedPhrase = await rli.question('Enter your wallet seed: ');
      } else {
        logger.info('✅ Using wallet seed from environment variable');
      }
      
      const wallet = await api.buildWalletAndWaitForFunds(config, seedPhrase, '');
      if (wallet !== null) {
        const providers = await api.configureProviders(wallet, config);
        
        const contract = await this.deployOrJoin(providers, rli);
        if (contract !== null) {
          this.contract = contract;
          await this.runEnhancedCLI(providers, rli);
        }
      }
    } catch (error) {
      logger.error(`CLI error: ${(error as Error).message}`);
    } finally {
      rli.close();
    }
  }
}

// Export for backward compatibility
export const runEnhanced = async (config: Config, logger: Logger, dockerEnv?: boolean): Promise<void> => {
  const enhancedCli = new SimpleEnhancedCLI(logger);
  await enhancedCli.run(config, logger, dockerEnv);
};

// Also export original run function
export { run as runOriginal } from './cli.js';
