import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';  // ← Add execSync here
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CompactCLIAutoGenerator {
  constructor(config) {
    this.config = config;
    this.isGenerating = false;
    this.lastGenerationTime = 0;
    this.debounceMs = 2000; 
  }

  // TODO  contract syntax validation

  async start() {
    console.log('🚀 Starting Compact Contract CLI Auto-Generator...');
      // Validate environment first
    this.validateEnvironment();

    console.log('📁 Contract source:', this.config.contractSourceDir);
    console.log('🎯 Target CLI:', this.config.cliSourceDir);
    console.log('📄 Contract file:', this.config.contractFileName);

    try {
      await this.generateCLI('Manual generation');
      console.log('✅ Auto-generation complete!');
    } catch (error) {
      console.error('❌ Auto-generation failed:', error);
      process.exit(1);
    }
  }

  async generateCLI(reason) {
    const now = Date.now();
    if (this.isGenerating || (now - this.lastGenerationTime) < this.debounceMs) {
      if (this.config.verbose) {
        console.log(`⏳ Skipping generation (debounce): ${reason}`);
      }
      return;
    }

    this.isGenerating = true;
    this.lastGenerationTime = now;

    try {
      console.log(`\n🔄 Starting generation: ${reason}`);
      console.log('⏰', new Date().toLocaleTimeString());

      // Step 0: Sync .compact files from root directory to contract/src/
      await this.syncFromRoot();

      // Step 1: Parse the contract to extract information
      const contractInfo = await this.parseContract();
      console.log(`📋 Found ${contractInfo.functions.length} functions and ${Object.keys(contractInfo.ledgerState).length} state variables`);

      // Step 2: Compile the contract
      await this.compileContract();

      // Step 3: Build the contract TypeScript
      await this.buildContract();

      // Step 4: Update core API to match contract functions
      await this.updateCoreAPI(contractInfo);

      // Step 5: Generate CLI files
      await this.generateCLIFiles(contractInfo);

      // Step 6: Build CLI
      await this.buildCLI();

      console.log('✅ Generation complete!\n');
    } catch (error) {
      console.error('❌ Generation failed:', error);
    } finally {
      this.isGenerating = false;
    }
  }

  async syncFromRoot() {
    // Get the root directory (two levels up from scripts/)
    const rootDir = path.resolve(__dirname, '..', '..');
    
    console.log('🔍 Checking for .compact files in root directory...');
    
    if (!fs.existsSync(rootDir)) {
      console.error('❌ Project root directory not found');
      console.error('💡 Make sure you\'re running this from the project root');
      console.error('📁 Expected root: ' + rootDir);
      return false;
    }

    // Look for .compact files in root
    const rootFiles = fs.readdirSync(rootDir);
    const rootCompactFiles = rootFiles.filter(file => file.endsWith('.compact'));
    
    if (rootCompactFiles.length === 0) {
      console.log('📁 No .compact files found in root directory');
      console.log('💡 Create a .compact file in the root to get started:');
      console.log('   touch my-contract.compact');
      console.log('📖 See README.md for examples');
      return false;
    }

    console.log(`📋 Found ${rootCompactFiles.length} .compact file(s) in root: ${rootCompactFiles.join(', ')}`);
    
    // Ensure contract source directory exists
    if (!fs.existsSync(this.config.contractSourceDir)) {
      fs.mkdirSync(this.config.contractSourceDir, { recursive: true });
    }

    // Clean up: Remove all existing .compact files from contract/src/
    const existingFiles = fs.readdirSync(this.config.contractSourceDir);
    const existingCompactFiles = existingFiles.filter(file => file.endsWith('.compact'));
    
    if (existingCompactFiles.length > 0) {
      console.log(`🧹 Cleaning up ${existingCompactFiles.length} existing .compact file(s): ${existingCompactFiles.join(', ')}`);
      for (const oldFile of existingCompactFiles) {
        const oldPath = path.join(this.config.contractSourceDir, oldFile);
        try {
          fs.unlinkSync(oldPath);
          console.log(`🗑️  Deleted: ${oldFile}`);
        } catch (error) {
          console.error(`❌ Failed to delete ${oldFile}:`, error.message);
        }
      }
    }

    // Copy each .compact file from root to contract/src/
    let copiedFiles = [];
    for (const compactFile of rootCompactFiles) {
      const sourcePath = path.join(rootDir, compactFile);
      const targetPath = path.join(this.config.contractSourceDir, compactFile);
      
      try {
        const content = fs.readFileSync(sourcePath, 'utf8');
        
        // Basic contract validation
        if (!content.includes('pragma language_version')) {
          console.warn(`⚠️  ${compactFile}: Missing pragma language_version directive`);
        }
        if (!content.includes('export circuit')) {
          console.warn(`⚠️  ${compactFile}: No export circuit functions found`);
        }
        
        fs.writeFileSync(targetPath, content, 'utf8');
        copiedFiles.push(compactFile);
        console.log(`📄 ✅ Copied: ${compactFile} → contract/src/`);
      } catch (error) {
        console.error(`❌ Failed to copy ${compactFile}:`, error.message);
      }
    }

    if (copiedFiles.length > 0) {
      console.log(`🎉 Successfully synced ${copiedFiles.length} contract file(s) from root to contract/src/`);
      return true;
    }

    return false;
  }
  validateEnvironment() {
  const errors = [];
  
  // Check if we're in the right directory
  if (!fs.existsSync(path.resolve(process.cwd(), 'package.json'))) {
    errors.push('❌ No package.json found. Make sure you\'re in the project root directory.');
  }
  
  // Check if boilerplate structure exists
  if (!fs.existsSync(path.resolve(process.cwd(), 'boilerplate'))) {
    errors.push('❌ Boilerplate directory not found. This doesn\'t appear to be a scaffold-midnight project.');
  }
  
  // Check for compactc compiler
  try {
    execSync('which compactc', { stdio: 'ignore' });
  } catch (error) {
    errors.push('❌ Compact compiler (compactc) not found. Please install the Midnight development tools.');
  }
  
  if (errors.length > 0) {
    console.error('\n🚨 Environment validation failed:\n');
    errors.forEach(error => console.error(error));
    console.error('\n💡 Please fix these issues and try again.\n');
    process.exit(1);
  }
  }

  detectContractFile() {
    const contractDir = this.config.contractSourceDir;
    
    if (!fs.existsSync(contractDir)) {
      throw new Error(`Contract directory not found: ${contractDir}`);
    }

    // Look for the single .compact file in the contract directory
    const files = fs.readdirSync(contractDir);
    const compactFiles = files.filter(file => file.endsWith('.compact'));
    
    if (compactFiles.length === 0) {
      throw new Error(`No .compact files found in ${contractDir}`);
    }
    
    if (compactFiles.length > 1) {
      console.log(`⚠️  Found ${compactFiles.length} .compact files: ${compactFiles.join(', ')}`);
      console.log(`📄 Using the first one: ${compactFiles[0]}`);
    }
    
    const detectedFile = compactFiles[0];
    console.log(`🔍 Auto-detected contract file: ${detectedFile}`);
    
    return detectedFile;
  }

  /**
   * Parse witness functions from witnesses.ts
   */
  parseWitnesses(witnessesPath) {
    if (!fs.existsSync(witnessesPath)) return [];
    const content = fs.readFileSync(witnessesPath, 'utf-8');
    const lines = content.split('\n');
    const witnesses = [];
    let inWitnesses = false;
    let buffer = '';
    let braceCount = 0;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (!inWitnesses && line.includes('export const witnesses')) {
        const idx = line.indexOf('{');
        if (idx !== -1) {
          inWitnesses = true;
          // Count braces on this line
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
        if (braceCount < 0) break; // Defensive: shouldn't happen
        if (braceCount === 0) {
          // Don't include the closing } line
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
    // Remove debug log - witnesses parsing is working fine
    return witnesses;
  }

  async parseContract() {
    let contractFileName = this.config.contractFileName;

    if (!contractFileName) {
      contractFileName = this.detectContractFile();
      this.config.contractFileName = contractFileName;
    } else {
      const explicitPath = path.join(this.config.contractSourceDir, contractFileName);
      if (!fs.existsSync(explicitPath)) {
        console.log(`⚠️  Specified contract file not found: ${contractFileName}`);
        contractFileName = this.detectContractFile();
        this.config.contractFileName = contractFileName;
      }
    }
    
    const contractPath = path.join(this.config.contractSourceDir, contractFileName);
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found: ${contractPath}`);
    }
    const contractContent = await fs.promises.readFile(contractPath, 'utf-8');
    const parser = new CompactContractParser();
    const contractInfo = parser.parse(contractContent, contractFileName);
    // Parse witnesses
    const witnessesPath = path.join(this.config.contractSourceDir, 'witnesses.ts');
    contractInfo.witnesses = this.parseWitnesses(witnessesPath);
    return contractInfo;
  }


  async compileContract() {
    console.log('🔨 Compiling contract...');
    
    const contractDir = path.dirname(this.config.contractSourceDir);
    const contractName = path.basename(this.config.contractFileName, '.compact');
    const outputDir = path.join(this.config.contractSourceDir, 'managed', contractName);

    await this.runCommand('compactc', [
      path.join(this.config.contractSourceDir, this.config.contractFileName),
      outputDir
    ], contractDir);

    console.log('✅ Contract compiled');
  }


  async buildContract() {
    console.log('🔧 Building contract TypeScript...');
    
    const contractDir = path.dirname(this.config.contractSourceDir);
    await this.runCommand('npm', ['run', 'build'], contractDir);

    console.log('✅ Contract built');
  }

  async generateAPIWrapper(contractInfo) {
    const contractName = path.basename(this.config.contractFileName, '.compact');
    const content = `// Enhanced API wrapper for ${contractInfo.contractName}
// Generated on: ${new Date().toISOString()}
// Auto-generated from ${this.config.contractFileName}

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
          description: func.description || \`Execute \${func.name} function\`
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
      throw new Error(\`Failed to initialize enhanced API: \${error instanceof Error ? error.message : String(error)}\`);
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

  // Dynamic function mapping based on contract analysis${contractInfo.functions.map((func) => `
  /**
   * ${func.description || `Execute ${func.name} function`}
   */
  async ${func.name}(...args: any[]): Promise<any> {
    return await (originalApi as any).${func.name}(...args);
  }`).join('')}
}

// Export contract metadata for reference
export const CONTRACT_METADATA = {
  name: '${contractInfo.contractName}',
  fileName: '${this.config.contractFileName}',
  generatedAt: '${new Date().toISOString()}',
  functions: ${JSON.stringify(contractInfo.functions, null, 2)},
  ledgerState: ${JSON.stringify(contractInfo.ledgerState, null, 2)},
  witnesses: ${JSON.stringify(contractInfo.witnesses, null, 2)}
} as const;
`;

    const outputPath = path.join(this.config.cliSourceDir, 'src', 'enhanced-api.ts');
    await fs.promises.writeFile(outputPath, content, 'utf-8');
  }

  async generateCLIFiles(contractInfo) {
    console.log('📝 Generating CLI files...');

    // Generate updated API wrapper
    await this.generateAPIWrapper(contractInfo);

    // Update core API file
    await this.updateCoreAPI(contractInfo);

   
    console.log('✅ CLI files generated (including witnesses)');
  }

  async buildCLI() {
    console.log('🔧 Building CLI...');
    
    await this.runCommand('npm', ['run', 'build'], this.config.cliSourceDir);

    console.log('✅ CLI built');
  }

  /**
   * Update the core API file to match contract functions
   */
  async updateCoreAPI(contractInfo) {
    console.log('🔧 Updating core API to match contract functions...');
    
    const apiPath = path.join(this.config.cliSourceDir, 'src', 'api.ts');
    let apiContent = await fs.promises.readFile(apiPath, 'utf-8');
    
    // Update zkConfigProvider types to use actual function names from contract
    const impureFunctionNames = contractInfo.functions
      .filter(f => !f.readOnly)
      .map(f => `'${f.name}'`)
      .join(' | ');
    
    if (impureFunctionNames) {
      // Update NodeZkConfigProvider type parameter
      apiContent = apiContent.replace(
        /new NodeZkConfigProvider<[^>]+>/g,
        `new NodeZkConfigProvider<${impureFunctionNames}>`
      );
      
      apiContent = apiContent.replace(
        /NodeZkConfigProvider<[^>]+>/g,
        `NodeZkConfigProvider<${impureFunctionNames}>`
      );
    }
    
    // Add dynamic contract module accessor if not present
    if (!apiContent.includes('const contractModule = ') && !apiContent.includes('getContractModule')) {
      const importSection = apiContent.match(/(import[\s\S]*?from[^;]+;)\s*\n/g);
      if (importSection) {
        const lastImport = importSection[importSection.length - 1];
        const insertPoint = apiContent.indexOf(lastImport) + lastImport.length;
        const dynamicHelperCode = `
// Get the dynamic contract module
const getContractModule = () => {
  const contractNames = Object.keys(contracts);
  if (contractNames.length === 0) {
    throw new Error('No contract found in contracts object');
  }
  return contracts[contractNames[0]];
};

const contractModule = getContractModule();
`;
        apiContent = apiContent.slice(0, insertPoint) + dynamicHelperCode + apiContent.slice(insertPoint);
      }
    }
    
    // Write the updated API file
    await fs.promises.writeFile(apiPath, apiContent, 'utf8');
    console.log('✅ Core API updated');
  }

  /**
   * Run a command and return a promise
   */
  runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd,
        stdio: this.config.verbose ? 'inherit' : 'pipe'
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}

/**
 * Simple parser for Compact contracts
 */
class CompactContractParser {
  parse(content, fileName) {
    const contractName = path.basename(fileName, '.compact');
    const functions = [];
    const ledgerState = [];

    // Parse ledger declarations
    const ledgerRegex = /export\s+ledger\s+(\w+):\s*([^;]+);/g;
    let match;
    while ((match = ledgerRegex.exec(content)) !== null) {
      const [, name, type] = match;
      ledgerState.push({
        name: name.trim(),
        type: type.trim()
      });
    }

    // Parse circuit functions
    const circuitRegex = /export\s+circuit\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^{]+)\s*\{/g;
    while ((match = circuitRegex.exec(content)) !== null) {
      const [, name, params, returnType] = match;
      
      const parameters = [];
      if (params.trim()) {
        const paramList = params.split(',').map(p => p.trim()).filter(p => p);
        for (const param of paramList) {
          const colonIndex = param.indexOf(':');
          if (colonIndex > 0) {
            const paramName = param.substring(0, colonIndex).trim();
            const paramType = param.substring(colonIndex + 1).trim();
            parameters.push({
              name: paramName,
              type: paramType
            });
          }
        }
      }

      // Determine if function is read-only based on return type and naming patterns
      const readOnly = (returnType.trim() !== '[]' && returnType.trim() !== '') || 
                      name.startsWith('get_') || 
                      name.startsWith('query_') || 
                      name.startsWith('read_') || 
                      name.startsWith('view_') || 
                      name.startsWith('check_') || 
                      name.startsWith('display_') || 
                      name.startsWith('show_') || 
                      name.startsWith('fetch_') || 
                      name.startsWith('retrieve_');

      functions.push({
        name,
        parameters,
        returnType: returnType.trim(),
        readOnly,
      });
    }

    return {
      contractName: `${contractName.charAt(0).toUpperCase() + contractName.slice(1)} Contract`,
      functions,
      ledgerState
    };
  }


}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = {
    contractSourceDir: path.resolve(__dirname, '..', 'contract', 'src'),
    contractBuildDir: path.resolve(__dirname, '..', 'contract', 'dist'),
    cliSourceDir: path.resolve(__dirname, '..', 'contract-cli'),
    contractFileName: null, // Auto-detect any .compact file
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v')
  };

  const generator = new CompactCLIAutoGenerator(config);
  generator.start().catch(console.error);
}

export { CompactCLIAutoGenerator };
