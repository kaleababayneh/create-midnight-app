import path from 'node:path';
import fs from 'node:fs';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

/**
 * Auto-detect the contract directory from the source .compact file
 * This ensures we always use the current contract, not old managed directories
 */
function detectContractPath(): string {
  const contractSourceDir = path.resolve(currentDir, '..', '..', 'contract', 'src');
  const managedDir = path.join(contractSourceDir, 'managed');
  
  if (!fs.existsSync(contractSourceDir)) {
    throw new Error(`Contract source directory not found: ${contractSourceDir}`);
  }

  // Look for .compact files in the source directory
  const files = fs.readdirSync(contractSourceDir);
  const compactFiles = files.filter(file => file.endsWith('.compact'));
  
  if (compactFiles.length === 0) {
    throw new Error(`No .compact files found in ${contractSourceDir}`);
  }
  
  // Get the contract name from the .compact file (without extension)
  const contractFileName = compactFiles[0];
  const contractName = path.basename(contractFileName, '.compact');
  const expectedManagedPath = path.join(managedDir, contractName);
  
  console.log(`🔍 Config: Auto-detected contract from source: ${contractName} (from ${contractFileName})`);
  
  // Verify the managed directory exists
  if (!fs.existsSync(expectedManagedPath)) {
    console.log(`⚠️  Config: Managed directory not found: ${expectedManagedPath}`);
    console.log(`💡 You may need to run: npm run auto-generate`);
    // Return path anyway so it can be created
  }
  
  return expectedManagedPath;
}

export const contractConfig = {
  privateStateStoreName: 'counter-private-state',
  zkConfigPath: detectContractPath(),
};

export interface Config {
  readonly logDir: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
}

export class TestnetLocalConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'testnet-local', `${new Date().toISOString()}.log`);
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId(NetworkId.TestNet);
  }
}

export class StandaloneConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString()}.log`);
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId(NetworkId.Undeployed);
  }
}

export class TestnetRemoteConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'testnet-remote', `${new Date().toISOString()}.log`);
  indexer = 'https://indexer.testnet-02.midnight.network/api/v1/graphql';
  indexerWS = 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws';
  node = 'https://rpc.testnet-02.midnight.network';
  proofServer = 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId(NetworkId.TestNet);
  }
}
