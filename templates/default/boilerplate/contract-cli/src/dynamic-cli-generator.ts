import { type Interface } from 'node:readline/promises';
import { type Logger } from 'pino';
import { ContractAnalyzer, type ContractAnalysis, type ContractFunction } from './contract-analyzer.js';
import { type CounterProviders, type DeployedCounterContract } from './common-types.js';

export interface MenuItem {
  id: string;
  label: string;
  description: string;
  action: (providers: CounterProviders, contract: DeployedCounterContract, rli: Interface) => Promise<void>;
  isReadOnly: boolean;
}

/**
 * Dynamically generates CLI menus and handlers based on contract analysis
 */
export class DynamicCLIGenerator {
  private analyzer: ContractAnalyzer;
  private logger: Logger;
  private contractAnalysis: ContractAnalysis | null = null;

  constructor(logger: Logger) {
    this.analyzer = new ContractAnalyzer();
    this.logger = logger;
  }

  /**
   * Initialize the CLI generator by analyzing the contract
   */
  async initialize(): Promise<void> {
    try {
      this.contractAnalysis = await this.analyzer.analyzeContract();
      this.logger.info(`Analyzed contract: ${this.contractAnalysis.contractName}`);
      this.logger.info(`Found ${this.contractAnalysis.functions.length} functions`);
    } catch (error) {
      this.logger.error('Failed to analyze contract:', error);
      throw error;
    }
  }

  /**
   * Generate menu items based on contract functions
   */
  generateMenuItems(): MenuItem[] {
    if (!this.contractAnalysis) {
      throw new Error('Contract analysis not initialized. Call initialize() first.');
    }

    const menuItems: MenuItem[] = [];

    // Add contract functions
    this.contractAnalysis.functions.forEach((func, index) => {
      const menuItem: MenuItem = {
        id: `func_${func.name}`,
        label: this.formatFunctionLabel(func),
        description: func.description || `Execute ${func.name}`,
        action: this.createFunctionHandler(func),
        isReadOnly: this.analyzer.isReadOnlyFunction(func.name)
      };
      menuItems.push(menuItem);
    });

    // Add utility functions
    menuItems.push({
      id: 'display_state',
      label: 'Display contract state',
      description: 'Show current values of all ledger state',
      action: this.createStateDisplayHandler(),
      isReadOnly: true
    });

    menuItems.push({
      id: 'exit',
      label: 'Exit',
      description: 'Exit the CLI',
      action: async () => {
        this.logger.info('Exiting...');
        return;
      },
      isReadOnly: true
    });

    return menuItems;
  }

  /**
   * Generate the main menu question text
   */
  generateMenuQuestion(menuItems: MenuItem[]): string {
    let question = '\nYou can do one of the following:\n';
    
    menuItems.forEach((item, index) => {
      const number = index + 1;
      const readOnlyIndicator = item.isReadOnly ? ' (read-only)' : '';
      question += `  ${number}. ${item.label}${readOnlyIndicator}\n`;
    });
    
    question += 'Which would you like to do? ';
    return question;
  }

  /**
   * Create a function handler for a specific contract function
   */
  private createFunctionHandler(func: ContractFunction): (providers: CounterProviders, contract: DeployedCounterContract, rli: Interface) => Promise<void> {
    return async (providers: CounterProviders, contract: DeployedCounterContract, rli: Interface) => {
      try {
        this.logger.info(`🔧 Executing ${func.name}...`);

        // Collect parameters if needed
        const args: any[] = [];
        for (const param of func.parameters) {
          const value = await this.collectParameter(param, rli);
          args.push(value);
        }

        // Execute the function
        if (this.analyzer.isReadOnlyFunction(func.name)) {
          // For read-only functions, call them and display the result
          await this.executeReadOnlyFunction(func.name, args, providers, contract);
        } else {
          // For state-changing functions, execute them through the contract
          await this.executeStateChangingFunction(func.name, args, contract);
        }

        this.logger.info(`✅ ${func.name} executed successfully!`);
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.logger.error(`❌ Operation failed: ${error.message}`);
          if (error.message.includes('member')) {
            this.logger.warn('💡 This might be because you have already voted. Each wallet can only vote once.');
          }
        } else {
          this.logger.error(`❌ Unknown error occurred: ${error}`);
        }
      }
    };
  }

  /**
   * Create a handler for displaying contract state
   */
  private createStateDisplayHandler(): (providers: CounterProviders, contract: DeployedCounterContract, rli: Interface) => Promise<void> {
    return async (providers: CounterProviders, contract: DeployedCounterContract) => {
      if (!this.contractAnalysis) return;

      const api = await import('./api.js');
      
      this.logger.info('=== Contract State ===');
      this.logger.info(`Contract Address: ${contract.deployTxData.public.contractAddress}`);

      // Display ledger state
      for (const [stateName, stateType] of Object.entries(this.contractAnalysis.ledgerState)) {
        try {
          let value: any;
          
          switch (stateName) {
            case 'round':
              value = await api.getCounterLedgerState(providers, contract.deployTxData.public.contractAddress);
              break;
            case 'votesA':
              value = await api.getVotesA(providers, contract.deployTxData.public.contractAddress);
              break;
            case 'votesB':
              value = await api.getVotesB(providers, contract.deployTxData.public.contractAddress);
              break;
            case 'items':
              // Handle Set<Bytes<32>> - get the set contents
              try {
                const itemsArray = await api.getItemsSet(providers, contract.deployTxData.public.contractAddress);
                if (itemsArray.length > 0) {
                  value = `Set with ${itemsArray.length} item(s): [${itemsArray.join(', ')}]`;
                } else {
                  value = 'Empty set';
                }
              } catch (setError) {
                this.logger.debug(`Set extraction error: ${setError}`);
                value = 'Set contents not accessible';
              }
              break;
            default:
              value = 'Not available';
          }
          
          this.logger.info(`${stateName} (${stateType}): ${value}`);
        } catch (error) {
          this.logger.warn(`Could not fetch ${stateName}: ${error}`);
        }
      }
    };
  }

  /**
   * Collect a parameter value from user input
   */
  private async collectParameter(param: {name: string, type: string}, rli: Interface): Promise<any> {
    if (this.analyzer.requiresSpecialHandling(param.name)) {
      return await this.collectSpecialParameter(param, rli);
    }

    const prompt = `Enter ${param.name} (${param.type}): `;
    const input = await rli.question(prompt);

    // Convert input based on type
    switch (param.type) {
      case 'number':
        const num = parseInt(input, 10);
        if (isNaN(num)) {
          throw new Error(`Invalid number: ${input}`);
        }
        return BigInt(num);
      case 'boolean':
        return input.toLowerCase() === 'true' || input === '1';
      case 'bytes':
        // Convert hex string to Uint8Array
        if (input.startsWith('0x')) {
          return new Uint8Array(Buffer.from(input.slice(2), 'hex'));
        }
        return new Uint8Array(Buffer.from(input, 'utf8'));
      case 'text':
        // Handle opaque string types by creating proper opaque value
        const api = await import('./api.js');
        try {
          // Create opaque string value - remove quotes if they exist
          const cleanInput = input.replace(/^["']|["']$/g, '');
          return api.createOpaqueString(cleanInput);
        } catch (error) {
          // Fallback to plain string if opaque creation fails
          this.logger.debug(`Failed to create opaque string, using plain string: ${error}`);
          return input.replace(/^["']|["']$/g, '');
        }
      default:
        return input;
    }
  }

  /**
   * Handle special parameter collection (e.g., voting options)
   */
  private async collectSpecialParameter(param: {name: string, type: string}, rli: Interface): Promise<any> {
    if (param.name.includes('index')) {
      // For vote_for and get_vote_count functions
      const choice = await rli.question(
        'Select option:\n  0. Option A\n  1. Option B\nEnter choice (0 or 1): '
      );
      const index = parseInt(choice, 10);
      if (index !== 0 && index !== 1) {
        throw new Error('Invalid choice. Please enter 0 or 1.');
      }
      return BigInt(index);
    }

    // Fallback to normal parameter collection
    return await this.collectParameter(param, rli);
  }

  /**
   * Execute a read-only function and display results
   */
  private async executeReadOnlyFunction(
    functionName: string,
    args: any[],
    providers: CounterProviders,
    contract: DeployedCounterContract
  ): Promise<void> {
    const api = await import('./api.js');
    
    switch (functionName) {
      case 'get_vote_count':
        const option = args[0] === 0n ? 'A' : 'B';
        const votes = args[0] === 0n 
          ? await api.getVotesA(providers, contract.deployTxData.public.contractAddress)
          : await api.getVotesB(providers, contract.deployTxData.public.contractAddress);
        this.logger.info(`Option ${option} has ${votes || 0} votes`);
        break;
      default:
        this.logger.info(`Read-only function ${functionName} executed with args: ${JSON.stringify(args)}`);
    }
  }

  /**
   * Execute a state-changing function
   */
  private async executeStateChangingFunction(
    functionName: string,
    args: any[],
    contract: DeployedCounterContract
  ): Promise<void> {
    // Use dynamic property access to call the function
    const contractFunction = (contract.callTx as any)[functionName];
    if (!contractFunction) {
      throw new Error(`Function ${functionName} not found on contract`);
    }

    const result = await contractFunction(...args);
    this.logger.info(`Transaction ${result.public.txId} added in block ${result.public.blockHeight}`);
  }

  /**
   * Format function name for display
   */
  private formatFunctionLabel(func: ContractFunction): string {
    // Convert snake_case to title case and add parameter info
    const formatted = func.name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const paramCount = func.parameters.length;
    const paramInfo = paramCount > 0 ? ` (${paramCount} param${paramCount > 1 ? 's' : ''})` : '';
    
    return `${formatted}${paramInfo}`;
  }
}
