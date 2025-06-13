import fs from 'node:fs';
import path from 'node:path';
import { ContractAnalyzer } from './contract-analyzer.js';


class CLIAutoGenerator {
  private analyzer: ContractAnalyzer;
  private outputDir: string;

  constructor() {
    this.analyzer = new ContractAnalyzer();
    this.outputDir = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
  }

  async generate(): Promise<void> {
    console.log('🔍 Analyzing contract...');
    
    try {
      const analysis = await this.analyzer.analyzeContract();
      
      console.log(`✅ Contract analyzed: ${analysis.contractName}`);
      console.log(`📋 Found ${analysis.functions.length} functions:`);
      
      analysis.functions.forEach(func => {
        const params = func.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
        console.log(`   - ${func.name}(${params}) -> ${func.returnType}`);
      });

      await this.generateAPIWrappers(analysis);
      
      
      console.log('🎉 CLI auto-generation complete!');
      console.log('💡 The CLI will now dynamically adapt to your contract functions.');
      
    } catch (error) {
      console.error('❌ Failed to analyze contract:', error);
      console.error('🔧 Make sure your contract is compiled and built before running the CLI.');
      process.exit(1);
    }
  }
  /**
   * Generate API wrapper functions for better type safety and documentation
   */
  private async generateAPIWrappers(analysis: any): Promise<void> {
    const wrapperContent = this.generateAPIWrapperContent(analysis);
    const wrapperPath = path.join(this.outputDir, 'generated-api-wrappers.ts');
    
    await fs.promises.writeFile(wrapperPath, wrapperContent, 'utf-8');
    console.log(`📝 Generated API wrappers: ${path.relative(process.cwd(), wrapperPath)}`);
  }
  /**
   * Generate the content for API wrapper file
   */
  private generateAPIWrapperContent(analysis: any): string {
    return `// Auto-generated API wrappers for ${analysis.contractName}
    // Generated on: ${new Date().toISOString()}
    // DO NOT EDIT MANUALLY - This file is auto-generated

    import { type CounterProviders, type DeployedCounterContract } from './common-types.js';
    import { type FinalizedTxData } from '@midnight-ntwrk/midnight-js-types';
    import { type Logger } from 'pino';

    /**
     * Auto-generated API wrappers for contract functions
     */
    export class GeneratedAPIWrappers {
      private logger: Logger;

      constructor(logger: Logger) {
        this.logger = logger;
      }

    ${analysis.functions.map((func: any) => this.generateFunctionWrapper(func)).join('\n\n')}
    }

    /**
     * Function parameter types
     */
    export interface FunctionParameters {
    ${analysis.functions.map((func: any) => 
      `  ${func.name}: [${func.parameters.map((p: any) => this.mapToTypeScriptType(p.type)).join(', ')}];`
    ).join('\n')}
    }

    /**
     * Contract state interface
     */
    export interface ContractState {
    ${Object.entries(analysis.ledgerState).map(([name, type]) => 
      `  ${name}: ${this.mapToTypeScriptType(type as string)};`
    ).join('\n')}
    }
    `;
  }

  /**
   * Generate a wrapper function for a contract function
   */
  private generateFunctionWrapper(func: any): string {
    const paramList = func.parameters.map((p: any) => 
      `${p.name}: ${this.mapToTypeScriptType(p.type)}`
    ).join(', ');
    
    const paramArgs = func.parameters.map((p: any) => p.name).join(', ');
    
    const returnType = func.returnType === 'void' ? 'Promise<FinalizedTxData>' : 'Promise<any>';
    
    return `  /**
   * ${func.description}
   * @param contract - The deployed contract instance
  ${func.parameters.map((p: any) => `   * @param ${p.name} - ${p.type} parameter`).join('\n')}
    */
    async ${func.name}(contract: DeployedCounterContract${paramList ? `, ${paramList}` : ''}): ${returnType} {
      this.logger.info(\`🔧 Executing ${func.name}...\`);
      
      try {
        const result = await contract.callTx.${func.name}(${paramArgs});
        this.logger.info(\`Transaction \${result.public.txId} added in block \${result.public.blockHeight}\`);
        return result.public;
      } catch (error) {
        this.logger.error(\`Failed to execute ${func.name}:\`, error);
        throw error;
      }
    }`;
  }

  // IMPORTANT: used to map from compact to TypeScript types
  private mapToTypeScriptType(userType: string): string {
    const typeMap: {[key: string]: string} = {
      'number': 'bigint',
      'bytes': 'Uint8Array',
      'void': 'void',
      'boolean': 'boolean',
      'text': 'string'
    };
    
    return typeMap[userType] || 'any';
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new CLIAutoGenerator();
  generator.generate().catch(console.error);
}

export { CLIAutoGenerator };
