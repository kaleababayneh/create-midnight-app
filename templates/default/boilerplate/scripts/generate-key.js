#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Wallet key generator that:
 * 1. Generates a cryptographically secure 64-character hex seed
 * 2. Creates a wallet to get the address
 * 3. Updates the .env file with both seed and address
 */
class WalletKeyGenerator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..', '..');
    this.envPath = path.join(this.projectRoot, '.env');
  }

  /**
   * Generate a cryptographically secure 64-character hex seed phrase
   */
  generateRandomSeed() {
    const bytes = new Uint8Array(32);
    webcrypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create wallet instance to get the testnet address
   */
  async createWalletForAddress(seed) {
    try {
      // Import wallet builder dynamically to avoid module loading issues
      const { WalletBuilder } = await import('@midnight-ntwrk/wallet');
      const { getZswapNetworkId, setNetworkId, NetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
      
      // Set network to testnet before creating wallet
      setNetworkId(NetworkId.TestNet);
      
      // Use testnet configuration
      const indexer = 'https://indexer.testnet-02.midnight.network/api/v1/graphql';
      const indexerWS = 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws';
      const node = 'https://rpc.testnet-02.midnight.network';
      const proofServer = 'http://127.0.0.1:6300';
      
      console.log('🔗 Creating testnet wallet to get address...');
      
      const wallet = await WalletBuilder.buildFromSeed(
        indexer,
        indexerWS,
        proofServer,
        node,
        seed,
        getZswapNetworkId(),
        'info'
      );
      
      wallet.start();
      
      // Get the wallet state to extract the address
      const { firstValueFrom } = await import('rxjs');
      
      // Wait a moment for wallet to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const state = await firstValueFrom(wallet.state());
      const address = state.address;
      
      // Close the wallet
      await wallet.close();
      
      return address;
    } catch (error) {
      console.warn('⚠️  Could not create wallet to get address:', error.message);
      console.log('💡 You can manually check your address after first deployment');
      return null;
    }
  }

  /**
   * Update or create .env file with new wallet seed and address
   */
  updateEnvFile(seed, address = null) {
    let envContent = `# Midnight Testnet Configuration
# This seed phrase will be used for automated deployment
WALLET_SEED=${seed}`;
    
    if (address) {
      envContent += `
WALLET_ADDRESS=${address}`;
    }
    ;

    fs.writeFileSync(this.envPath, envContent);
  }

  /**
   * Main generation workflow
   */
  async generate() {
    try {
      console.log('🌙 Midnight Wallet Key Generator\n');
      
      const seed = this.generateRandomSeed();
      console.log('🔐 Generated new wallet seed:');
      console.log(`💰 Seed: ${seed}\n`);
      
      // Try to get wallet address
      const address = await this.createWalletForAddress(seed);
      
      if (address) {
        console.log('🏠 Generated wallet address:');
        console.log(`📍 Address: ${address}\n`);
      }
      
      this.updateEnvFile(seed, address);
      
      console.log('🚀 Setup completed!');
     
      console.log('\n💡 The seed phrase and address are now saved in your .env file');
      
    } catch (error) {
      console.error('\n❌ Key generation failed:', error.message);
      console.error('\n🔧 Troubleshooting:');
      console.error('   - Ensure you have write permissions in the project directory');
      console.error('   - Check that the project structure is correct');
      console.error('   - Make sure npm dependencies are installed\n');
      process.exit(1);
    }
  }

  /**
   * Display help information
   */
  showHelp() {
    console.log(`
🌙 Midnight Wallet Key Generator

Usage:
  npm run generate-key              Generate new wallet seed/address and update .env
  npm run generate-key -- --help    Show this help message

What this does:
  1. Generates a cryptographically secure 64-character hex seed
  2. Creates a wallet instance to derive the address
  3. Automatically updates your .env file with WALLET_SEED and WALLET_ADDRESS
  4. Prepares you for automated deployment

After running this command:
  - Your .env file will contain WALLET_SEED and WALLET_ADDRESS
  - You can run 'npm run deploy' without manual seed entry
  - The wallet will be funded automatically on testnet

Example workflow:
  npm run generate-key    # Generate new wallet seed and address
  npm run deploy          # Deploy with automated wallet creation

Security Note:
  - The seed phrase is stored in .env (which should be in .gitignore)
  - This is for development/testing purposes
  - For production, use a secure key management system
`);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  const generator = new WalletKeyGenerator();
  generator.showHelp();
  process.exit(0);
}

// Run wallet generation
const generator = new WalletKeyGenerator();
generator.generate().catch(console.error);
