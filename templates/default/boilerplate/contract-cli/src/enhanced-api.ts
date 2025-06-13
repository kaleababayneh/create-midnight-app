// Enhanced API wrapper for Counter Contract
// Generated on: 2025-06-13T20:26:30.666Z
// Auto-generated from counter.compact

import { type Logger } from 'pino';
import { ContractAnalyzer } from './contract-analyzer.js';
import { DynamicCLIGenerator } from './dynamic-cli-generator.js';
import * as originalApi from './api.js';

// Re-export all original API functions
export * from './api.js';

/**
 * Contract information interface
 */
export interface ContractInfo {
  contractName: string;
  functions: Array<{
    name: string;
    parameters: Array<{ name: string; type: string }>;
    returnType: string;
    readOnly: boolean;
    description: string;
  }>;
  ledgerState: Array<{ name: string; type: string }>;
  witnesses: Array<{
    name: string;
    ledgerType: string;
    privateType: string;
    returns: string[];
  }>;
}

/**
 * Enhanced API with dynamic contract analysis
 */
export class EnhancedContractAPI {
  private analyzer: ContractAnalyzer;
  private cliGenerator: DynamicCLIGenerator;
  private contractInfo: ContractInfo | null;

  constructor(logger: Logger) {
    this.analyzer = new ContractAnalyzer();
    this.cliGenerator = new DynamicCLIGenerator(logger);
    this.contractInfo = null;
  }

  async initialize(): Promise<ContractInfo> {
    try {
      const analysis = await this.analyzer.analyzeContract();
      await this.cliGenerator.initialize();
      
      // Convert ContractAnalysis to ContractInfo format
      this.contractInfo = {
        contractName: analysis.contractName,
        functions: analysis.functions.map(func => ({
          ...func,
          readOnly: this.analyzer.isReadOnlyFunction(func.name),
          description: func.description || `Execute ${func.name} function`
        })),
        ledgerState: Object.entries(analysis.ledgerState).map(([name, type]) => ({ name, type })),
        witnesses: analysis.witnesses.map(witness => ({
          name: witness.name,
          ledgerType: witness.ledgerType,
          privateType: witness.privateType,
          returns: witness.returns
        }))
      };
      
      return this.contractInfo;
    } catch (error) {
      throw new Error(`Failed to initialize enhanced API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getContractInfo(): ContractInfo | null {
    return this.contractInfo;
  }

  generateMenuItems(): any[] {
    return this.cliGenerator.generateMenuItems();
  }

  generateMenuQuestion(menuItems: any[]): string {
    return this.cliGenerator.generateMenuQuestion(menuItems);
  }

  // Dynamic function mapping based on contract analysis
  /**
   * Execute increment function
   */
  async increment(...args: any[]): Promise<any> {
    return await (originalApi as any).increment(...args);
  }
  /**
   * Execute decrement function
   */
  async decrement(...args: any[]): Promise<any> {
    return await (originalApi as any).decrement(...args);
  }
  /**
   * Execute publicKey function
   */
  async publicKey(...args: any[]): Promise<any> {
    return await (originalApi as any).publicKey(...args);
  }
}

// Export contract metadata for reference
export const CONTRACT_METADATA = {
  name: 'Counter Contract',
  fileName: 'counter.compact',
  generatedAt: '2025-06-13T20:26:30.666Z',
  functions: [
  {
    "name": "increment",
    "parameters": [],
    "returnType": "[]",
    "readOnly": false
  },
  {
    "name": "decrement",
    "parameters": [
      {
        "name": "sk",
        "type": "Bytes<32>"
      }
    ],
    "returnType": "[]",
    "readOnly": false
  },
  {
    "name": "publicKey",
    "parameters": [
      {
        "name": "sk",
        "type": "Bytes<32>"
      }
    ],
    "returnType": "Bytes<32>",
    "readOnly": true
  }
],
  ledgerState: [
  {
    "name": "organizer",
    "type": "Bytes<32>"
  },
  {
    "name": "restrictedCounter",
    "type": "Counter"
  },
  {
    "name": "round",
    "type": "Counter"
  }
],
  witnesses: []
} as const;
