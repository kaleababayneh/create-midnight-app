import fs from 'node:fs';
import path from 'node:path';

export interface ContractFunction {
  name: string;
  parameters: Array<{
    name: string;
    type: string;
  }>;
  returnType: string;
  description?: string;
}

export interface ContractWitness {
  name: string;
  ledgerType: string;
  privateType: string;
  returns: string[];
}

export interface ContractAnalysis {
  contractName: string;
  functions: ContractFunction[];
  ledgerState: {
    [key: string]: string;
  };
  witnesses: ContractWitness[];
}

/**
 * Analyzes the contract to extract function signatures and information
 */
export class ContractAnalyzer {
  private contractPath: string;
  private typesPath: string;
  private contractAnalysis: ContractAnalysis | null = null;

  constructor() {
    // Use relative path to the compiled contract - fix URL decoding
    const currentDir = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));
    const contractSourceDir = path.resolve(currentDir, '..', '..', 'contract', 'src');
    const managedDir = path.join(contractSourceDir, 'managed');
    
    // Auto-detect the contract from the actual .compact file in source
    const contractName = this.detectContractFromSource(contractSourceDir);
    this.contractPath = path.join(managedDir, contractName);
    this.typesPath = path.join(this.contractPath, 'contract', 'index.d.cts');
  }

  /**
   * Auto-detect the contract name from the actual .compact file in source directory
   * This ensures we always use the current contract file, not old managed directories
   */
  private detectContractFromSource(contractSourceDir: string): string {
    if (!fs.existsSync(contractSourceDir)) {
      throw new Error(`Contract source directory not found: ${contractSourceDir}`);
    }

    // Look for .compact files in the source directory
    const files = fs.readdirSync(contractSourceDir);
    const compactFiles = files.filter(file => file.endsWith('.compact'));
    
    if (compactFiles.length === 0) {
      throw new Error(`No .compact files found in ${contractSourceDir}`);
    }
    
    if (compactFiles.length > 1) {
      console.log(`⚠️  Found ${compactFiles.length} .compact files: ${compactFiles.join(', ')}`);
      console.log(`📄 Using the first one: ${compactFiles[0]}`);
    }
    
    // Get the contract name from the .compact file (without extension)
    const contractFileName = compactFiles[0];
    const contractName = path.basename(contractFileName, '.compact');
    
    console.log(`🔍 Auto-detected contract from source: ${contractName} (from ${contractFileName})`);
    
    // Verify the managed directory exists
    const managedDir = path.join(contractSourceDir, 'managed');
    const expectedManagedPath = path.join(managedDir, contractName);
    
    if (!fs.existsSync(expectedManagedPath)) {
      console.log(`⚠️  Managed directory not found: ${expectedManagedPath}`);
      console.log(`💡 You may need to run: npm run auto-generate`);
    }
    
    return contractName;
  }

  /**
   * Analyze the contract and return all info, including witnesses
   */
  async analyzeContract(): Promise<ContractAnalysis> {
    try {
      // Read the contract types file
      const typesContent = await fs.promises.readFile(this.typesPath, 'utf-8');
      
      // Parse the contract functions from the types
      const functions = this.parseFunctions(typesContent);
      const ledgerState = this.parseLedgerState(typesContent);
      
      // Extract contract name from the contract path
      const contractBaseName = path.basename(this.contractPath);
      const contractName = `${contractBaseName.charAt(0).toUpperCase() + contractBaseName.slice(1)} Contract`;
      
      // Find the witnesses.ts file
      const contractSourceDir = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..', '..', 'contract', 'src');
      const witnessesPath = path.join(contractSourceDir, 'witnesses.ts');
      let witnesses: ContractWitness[] = [];
      if (fs.existsSync(witnessesPath)) {
        const content = fs.readFileSync(witnessesPath, 'utf-8');
        const lines = content.split('\n');
        let inWitnesses = false;
        let buffer = '';
        let braceCount = 0;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!inWitnesses && line.includes('export const witnesses')) {
            const idx = line.indexOf('{');
            if (idx !== -1) {
              inWitnesses = true;
              braceCount += (line.slice(idx).match(/\{/g) || []).length;
              braceCount -= (line.slice(idx).match(/\}/g) || []).length;
              buffer += line.slice(idx + 1) + '\n';
              if (braceCount === 0) break;
            }
            continue;
          }
          if (inWitnesses) {
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            if (braceCount < 0) break;
            if (braceCount === 0) {
              break;
            }
            buffer += line + '\n';
          }
        }
        // Now buffer contains all witness lines
        // Final robust regex: allow any return type annotation before =>, then match => [ ... ]
        const witnessLineRegex = /(\w+):\s*\(\{[^}]*\}\s*:\s*WitnessContext<([\w.]+|typeof [\w.]+),\s*([^>]+)>\)\s*:\s*[^=]+=>[\s\n]*\[((?:.|\n)*?)\][,\n]?/gs;
        let match;
        while ((match = witnessLineRegex.exec(buffer)) !== null) {
          witnesses.push({
            name: match[1],
            ledgerType: match[2],
            privateType: match[3],
            returns: match[4].split(',').map(s => s.trim()).filter(Boolean),
          });
        }
      }
      
      const analysis = {
        contractName,
        functions,
        ledgerState,
        witnesses
      };
      
      // Store the analysis for later use
      this.contractAnalysis = analysis;
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing contract:', error);
      throw new Error(`Failed to analyze contract: ${error}`);
    }
  }

  /**
   * Parse function signatures from TypeScript definitions
   */
  private parseFunctions(content: string): ContractFunction[] {
    const functions: ContractFunction[] = [];
    
    // Parse ImpureCircuits (state-modifying functions)
    const impureCircuitsMatch = content.match(/export type ImpureCircuits<T> = \{([^}]+)\}/s);
    if (impureCircuitsMatch) {
      const functionsBlock = impureCircuitsMatch[1];
      this.parseFunctionSignatures(functionsBlock, functions, false);
    }
    
    // Parse PureCircuits (read-only functions)
    const pureCircuitsMatch = content.match(/export type PureCircuits = \{([^}]+)\}/s);
    if (pureCircuitsMatch) {
      const functionsBlock = pureCircuitsMatch[1];
      this.parsePureFunctionSignatures(functionsBlock, functions);
    }
    
    return functions;
  }

  /**
   * Parse impure function signatures (state-modifying functions)
   */
  private parseFunctionSignatures(functionsBlock: string, functions: ContractFunction[], isReadOnly: boolean): void {
    // Parse each function signature - updated regex to handle the actual format
    const functionRegex = /(\w+)\(context:\s*__compactRuntime\.CircuitContext<T>(?:,\s*([^)]+))?\):\s*__compactRuntime\.CircuitResults<T,\s*([^>]+)>/g;
    let match;
    
    while ((match = functionRegex.exec(functionsBlock)) !== null) {
      const [, name, paramStr, returnType] = match;
      
      const parameters: Array<{name: string, type: string}> = [];
      
      // Parse parameters if they exist
      if (paramStr && paramStr.trim()) {
        // Handle parameters like "index_0: bigint"
        const params = paramStr.split(',').map(p => p.trim());
        params.forEach((param, index) => {
          const colonIndex = param.indexOf(':');
          if (colonIndex > 0) {
            const paramName = param.substring(0, colonIndex).trim();
            const paramType = param.substring(colonIndex + 1).trim();
            
            // Clean up parameter name (remove _0 suffix)
            const cleanName = paramName.replace(/_\d+$/, '');
            
            parameters.push({
              name: cleanName || `param_${index}`,
              type: this.mapTypeScriptTypeToUserFriendly(paramType)
            });
          }
        });
      }
      
      functions.push({
        name,
        parameters,
        returnType: this.mapTypeScriptTypeToUserFriendly(returnType.trim()),
        description: this.generateFunctionDescription(name, parameters)
      });
    }
  }

  /**
   * Parse pure function signatures (read-only functions)
   */
  private parsePureFunctionSignatures(functionsBlock: string, functions: ContractFunction[]): void {
    // Parse pure functions with simpler signature format: functionName(param: Type): ReturnType;
    const functionRegex = /(\w+)\(([^)]*)\):\s*([^;]+);/g;
    let match;
    
    while ((match = functionRegex.exec(functionsBlock)) !== null) {
      const [, name, paramStr, returnType] = match;
      
      const parameters: Array<{name: string, type: string}> = [];
      
      // Parse parameters if they exist
      if (paramStr && paramStr.trim()) {
        const params = paramStr.split(',').map(p => p.trim());
        params.forEach((param, index) => {
          const colonIndex = param.indexOf(':');
          if (colonIndex > 0) {
            const paramName = param.substring(0, colonIndex).trim();
            const paramType = param.substring(colonIndex + 1).trim();
            
            // Clean up parameter name (remove _0 suffix)
            const cleanName = paramName.replace(/_\d+$/, '');
            
            parameters.push({
              name: cleanName || `param_${index}`,
              type: this.mapTypeScriptTypeToUserFriendly(paramType)
            });
          }
        });
      }
      
      functions.push({
        name,
        parameters,
        returnType: this.mapTypeScriptTypeToUserFriendly(returnType.trim()),
        description: this.generateFunctionDescription(name, parameters)
      });
    }
  }

  /**
   * Parse ledger state structure from TypeScript definitions
   */
  private parseLedgerState(content: string): {[key: string]: string} {
    const ledgerState: {[key: string]: string} = {};
    
    const ledgerTypeMatch = content.match(/export type Ledger = \{([^}]+)\}/s);
    if (ledgerTypeMatch) {
      const ledgerBlock = ledgerTypeMatch[1];
      
      // Parse each property - handle both readonly and regular properties
      const lines = ledgerBlock.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      for (const line of lines) {
        // Match patterns like "readonly round: bigint;" or "items: { ... }"
        const simpleMatch = line.match(/(?:readonly\s+)?(\w+):\s*(bigint|boolean|string|number);?/);
        if (simpleMatch) {
          const [, name, type] = simpleMatch;
          ledgerState[name] = this.mapTypeScriptTypeToUserFriendly(type);
        } else if (line.includes(':') && line.includes('{')) {
          // Handle complex types like "items: { ... }"
          const complexMatch = line.match(/(?:readonly\s+)?(\w+):\s*\{/);
          if (complexMatch) {
            const [, name] = complexMatch;
            ledgerState[name] = 'Set<data>';
          }
        }
      }
    }
    
    return ledgerState;
  }

  /**
   * Map TypeScript types to user-friendly names
   */
  private mapTypeScriptTypeToUserFriendly(type: string): string {
    const typeMap: {[key: string]: string} = {
      'bigint': 'number',
      'Uint8Array': 'bytes',
      '[]': 'void',
      'boolean': 'boolean',
      'string': 'text'
    };
    
    return typeMap[type] || type;
  }

  // IMPORTANT: if none of the specific patterns match, it falls back to a generic description at the end of the method.

  private generateFunctionDescription(name: string, parameters: Array<{name: string, type: string}>): string {
    // Generate generic descriptions based on function name patterns
    if (name.startsWith('get_') || name.startsWith('query_') || name.startsWith('read_')) {
      return `Get ${name.replace(/^(get_|query_|read_)/, '').replace(/_/g, ' ')} information`;
    }
    
    if (name.startsWith('set_') || name.startsWith('update_')) {
      return `Update ${name.replace(/^(set_|update_)/, '').replace(/_/g, ' ')} value`;
    }
    
    if (name.includes('increment') || name.includes('add')) {
      return `Increment or add to ${name.replace(/_/g, ' ')}`;
    }
    
    if (name.includes('decrement') || name.includes('subtract')) {
      return `Decrement or subtract from ${name.replace(/_/g, ' ')}`;
    }
    
    // Generic description for any function
    const paramCount = parameters.length;
    if (paramCount === 0) {
      return `Execute ${name.replace(/_/g, ' ')} operation`;
    } else {
      return `Execute ${name.replace(/_/g, ' ')} with ${paramCount} parameter${paramCount > 1 ? 's' : ''}`;
    }
  }

  /**
   * Check if a function is a read-only function (doesn't modify state)
   */
  isReadOnlyFunction(functionName: string): boolean {
    if (!this.contractAnalysis) {
      return false;
    }
    
    // Find the function in our analysis
    const func = this.contractAnalysis.functions.find((f: ContractFunction) => f.name === functionName);
    if (!func) {
      return false;
    }
    
    // A function is read-only if:
    // 1. It has a non-void return type (not empty [] or void)
    // 2. It matches common naming patterns for read-only functions
    const hasReturnValue = func.returnType && 
                          func.returnType !== '[]' && 
                          func.returnType !== 'void' && 
                          func.returnType.trim() !== '';
    
    // Identify read-only functions based on common naming patterns
    const readOnlyPatterns = [
      /^get_/,           // get_something
      /^query_/,         // query_something  
      /^read_/,          // read_something
      /^view_/,          // view_something
      /^check_/,         // check_something
      /^display_/,       // display_something
      /^show_/,          // show_something
      /^fetch_/,         // fetch_something
      /^retrieve_/       // retrieve_something
    ];
    
    const matchesReadOnlyPattern = readOnlyPatterns.some(pattern => pattern.test(functionName));
    
    // A function is read-only if it has a return value OR matches naming patterns
    return hasReturnValue || matchesReadOnlyPattern;
  }

  /**
   * Check if a function requires special parameter handling
   */
  requiresSpecialHandling(paramName: string): boolean {
    const specialParams = ['index'];
    return specialParams.includes(paramName);
  }
}
