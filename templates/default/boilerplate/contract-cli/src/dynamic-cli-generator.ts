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
      // Only show (read-only) for utility functions like "Display contract state" and "Exit"
      const isUtilityFunction = item.id === 'display_state' || item.id === 'exit';
      const readOnlyIndicator = (item.isReadOnly && isUtilityFunction) ? ' (read-only)' : '';
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

      // Get the full ledger state
      try {
        const contractState = await providers.publicDataProvider.queryContractState(contract.deployTxData.public.contractAddress);
        if (contractState) {
          // Import contract module to get ledger function
          const { contracts } = await import('@midnight-ntwrk/contract');
          const contractNames = Object.keys(contracts);
          if (contractNames.length > 0) {
            const contractModule = contracts[contractNames[0]];
            const ledgerState = contractModule.ledger(contractState.data);
            
            // Display each ledger state variable
            for (const [stateName, stateType] of Object.entries(this.contractAnalysis.ledgerState)) {
              try {
                let value: any;
                
                if (stateName === 'items' && typeof ledgerState[stateName] === 'object') {
                  // Handle Set<data> - check for size and isEmpty methods
                  const itemsSet = ledgerState[stateName];
                  if (typeof itemsSet.size === 'function' && typeof itemsSet.isEmpty === 'function') {
                    const size = itemsSet.size();
                    const isEmpty = itemsSet.isEmpty();
                    if (isEmpty) {
                      value = 'Empty set';
                    } else {
                      this.logger.info('Checking items set...');
                      // Try to iterate through items
                      const items: string[] = [];
                      try {
                        for (const item of itemsSet) {
                          items.push(Array.from(item).join(','));
                          if (items.length >= 10) break; // Limit to 10 items for display
                        }
                        value = `Set with ${size} item(s)${items.length > 0 ? ': [' + items.join(', ') + ']' : ''}`;
                      } catch {
                        value = `Set with ${size} item(s)`;
                      }
                      this.logger.info(`Found ${size} items in set`);
                    }
                  } else {
                    value = 'Set<data>';
                  }
                } else {
                  // Handle regular state variables
                  value = ledgerState[stateName];
                  if (typeof value === 'bigint') {
                    value = value.toString();
                  }
                }
                
                this.logger.info(`${stateName} (${stateType}): ${value}`);
              } catch (error) {
                this.logger.warn(`Could not fetch ${stateName}: ${error}`);
                this.logger.info(`${stateName} (${stateType}): Error reading value`);
              }
            }
          } else {
            this.logger.error('No contract module found');
          }
        } else {
          this.logger.error('Could not query contract state');
        }
      } catch (error) {
        this.logger.error(`Failed to fetch contract state: ${error}`);
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
    
      this.logger.info(`Read-only function ${functionName} executed with args: ${JSON.stringify(args)}`);
    
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
