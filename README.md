# 🌙 Create Midnight App

[![Midnight Network](https://img.shields.io/badge/Midnight-Network-blue)](https://midnight.network)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![NPM](https://img.shields.io/badge/NPM-2.0.0-red)](https://npmjs.com/package/create-midnight-app)

**The fastest way to build Midnight smart contracts with automated CLI generation.**

Create a new Midnight smart contract project in seconds with zero configuration. This scaffold provides everything you need to build, test, and deploy smart contracts on the Midnight blockchain with enhanced data type support and professional tooling.

**🚀 From contract to production in minutes, not hours.**
# **It feels almost a magic**

## ✨ What You Get

- 🚀 **Zero Configuration** - Just create a `.compact` file and everything auto-generates
- 🔄 **Auto-generating CLI** that adapts to your contract functions with intelligent parameter detection
- 🌐 **Seamless testnet deployment** with automated wallet management and balance checking
- 💰 **Built-in wallet tools** for balance checking, faucet requests, and transaction management
- 📊 **Smart contract analysis** with automatic type generation and parameter detection
- 📝 **Comprehensive documentation** with built-in debugging guides and troubleshooting
- 🎯 **Enhanced Data Type Support** - Full support for all Midnight contract types including complex parameters
- 🛠️ **Professional Tooling** with error handling, validation, dry-run support, and clear feedback
- 🔍 **Witness Function Support** - Automatically detects and includes private state functions
- 🐳 **Docker Integration** - Automated local Midnight node management for testing

## 🚀 Quick Start

**Get started with Midnight development in under 2 minutes:**

```bash
# Create a new project
npx create-midnight-app my-contract

# Navigate to project
cd my-contract

# Set up your wallet environment
mv .env.example .env

# Create your smart contract
touch voting.compact
```

**📝 Write Your First Contract:**

Edit your contract file:
```compact
pragma language_version 0.15;
import CompactStandardLibrary;

export ledger votes: Counter;

export circuit vote(): [] {
  votes.increment(1);
}

export circuit get_votes(): Uint<64> {
  return votes;
}
```

**🎯 Generate Everything Automatically:**

```bash
# Auto-generate CLI and compile contract
npm run dev
```

This single command:
- 🔄 Syncs your contract to the build system
- 🔨 Compiles contract and generates ZK keys
- 📝 Creates TypeScript types and API functions  
- 🖥️ Builds a dynamic CLI that adapts to your contract
- ✅ Everything ready to use!

**🚀 Deploy & Test:**


```bash

# For testnet deployment
npm run wallet

# For testnet wallet generation
npm run deploy

```

## 📋 Available Commands

| Command | Description | Environment |
|---------|-------------|-------------|
| `npm run dev` | 🔄 Main development command - syncs, compiles, generates CLI | Local |
| `npm run deploy` | 🚀 Deploy to  Midnight testnet | Testnet |
| `npm run wallet` | 🌐 generate a new key-pair wallet on Midnight | Testnet |
| `npm run balance` | 💰 Check current testnet wallet balance | Testnet |
| `npm run faucet` | 🚰 Request testnet tokens  | Testnet |
| `npm run check` | ✅ Verify scaffold is ready and show status | Local |
| `npm run build` | 🔨 Build all workspaces | Local |
| `npm run deploy:new` | 🔨  Deploy to  Midnight testnet(default) | Testnet |
| `npm run deploy:join"` | 🔨 Auto-join existing contract | Testnet |


deploy:new

### 🔧 Deployment Flags

| Flag | Behavior | Use Case |
|------|----------|----------|
| `--dry-run` | Preview commands only | Testing scripts |
| `--help` | Show detailed help | Documentation |

## 🎯 Development Workflow

1. **Create Contract** - Write your `.compact` file in the project root
2. **Auto-Generate** - Run `npm run dev` to generate everything automatically
3. **Deploy & Test** - Use `npm run deploy` for testnet deployment or `npm run wallet` for wallet generation
4. **Iterate** - Edit contract, run `npm run dev`, repeat

### 🔄 How the Auto-Generation Works

1. **📝 Edit**: Modify your `.compact` contract in the project root
2. **🔄 Sync**: `npm run dev` copies it to build directory
3. **🔨 Compile**: Contract compiles with ZK keys generation
4. **📝 Generate**: TypeScript types and API functions auto-generated
5. **🖥️ Build**: CLI updates with new contract functions
6. **✅ Ready**: Everything synchronized and ready to use

## 🚀 Enhanced Features

### ✨ **Zero-Configuration Development**
- **Auto-Detection**: Automatically finds and analyzes your `.compact` contracts
- **Smart Contract Analysis**: Works with any contract structure and function names  
- **Zero Manual Updates**: Change functions → regenerate → everything adapts automatically
- **Witness Function Support**: Automatically detects and includes private state functions

### 🌐 **Complete Deployment Pipeline**
- **One-Command Testnet Deployment**: `npm run deploy` for full testnet development setup
- **Docker Integration**: Automatically manages local Midnight node containers
- **Testnet Deployment**: Seamless testnet integration with automated wallet management
- **Dry Run Support**: Preview deployment with `--dry-run` flag

### 🔧 **Developer-Friendly Workflow**
- **Root-Level Editing**: Edit contracts directly in project root for easy access
- **Auto-Sync Pipeline**: Automatically syncs contracts to build directories
- **Clean Builds**: Removes old artifacts before rebuilding
- **Hot Reload**: Instant updates when contract changes
- **Enhanced Data Type Support**: Full support for complex Midnight contract types

### 💰 **Wallet & Balance Management**  
- **Automatic Wallet Generation**: Creates secure wallets with one command
- **Balance Checking**: Real-time testnet balance monitoring with `npm run balance`
- **Faucet Integration**: Automated and manual token requesting with `npm run faucet`
- **Transaction Management**: Full transaction lifecycle support

## 🏗️ Project Structure

```
my-project/
├── my-contract.compact      ← 📝 Your smart contract (edit here!)
├── package.json            ← 📦 Main project configuration
├── .env                    ← 🔐 Wallet configuration (auto-generated)
├── README.md               ← 📖 Project documentation
└── boilerplate/            ← 🏗️ Auto-generated tooling
    ├── contract/           ← 🔨 Contract compilation workspace
    │   └── src/           ← 📄 Auto-synced contracts & witnesses
    │       ├── my-contract.compact    ← Synced from root
    │       ├── witnesses.ts           ← 🔑 Private state functions
    │       └── managed/               ← 🏗️ Compiled output & ZK keys
    ├── contract-cli/       ← 🖥️ Generated CLI application
    │   ├── src/           ← 🎯 Dynamic CLI code
    │   │   ├── api.ts     ← 🔌 Contract interaction API with enhanced data type support
    │   │   ├── cli.ts     ← 🖥️ Interactive CLI interface
    │   │   └── enhanced-api.ts ← 📊 Contract metadata & analysis
    │   └── standalone.yml ← 🐳 Docker configuration for local node
    └── scripts/           ← ⚙️ Build & deployment automation
        ├── auto-generator.js ← 🔄 Core auto-generation engine
        ├── deploy.js         ← 🚀 Deployment orchestrator
        ├── check-balance.js  ← 💰 Wallet balance checker
        └── request-faucet.js ← 🚰 Testnet token requests
```

## 🔧 How It Works

The scaffold uses **source-driven development**:

1. **Contract Analysis** - Parses your `.compact` file to find all functions
2. **Dynamic Generation** - Creates TypeScript APIs for each function
3. **CLI Creation** - Builds interactive menus for contract interaction
4. **Testnet Integration** - Provides wallet and deployment tools

## 📚 Examples & Contract Templates

### 🔢 Simple Counter
```compact
pragma language_version 0.15;
import CompactStandardLibrary;

export ledger count: Counter;

export circuit increment(value: Uint<16>): [] {
  count.increment(value);
}

export circuit decrement(value: Uint<16>): [] {
  count.decrement(value);
}

export circuit get_count(): Uint<64> {
  return count;
}
```

### 🗳️ Voting System with Enhanced Data Types
```compact
pragma language_version 0.15;
import CompactStandardLibrary;

export ledger votes_for: Counter;
export ledger votes_against: Counter;

export circuit vote_yes(): [] {
  votes_for.increment(1);
}

export circuit vote_no(): [] {
  votes_against.increment(1);
}

export circuit get_results(): [Uint<64>, Uint<64>] {
  return [votes_for, votes_against];
}
```

### 📋 Bulletin Board with Complex Types
```compact
pragma language_version 0.15;
import CompactStandardLibrary;

export ledger messages: BulletinBoard;

export circuit post(author: Opaque<"string">, content: Opaque<"string">): [] {
  messages.post(author, content);
}

export circuit get_messages(): MessageList {
  return messages.getAll();
}
```

## 🏗️ How It Works

### **Auto-Detection System**
The system automatically:

1. **Scans** the root directory for `.compact` files
2. **Copies** them to the contract source directory (replacing old ones)
3. **Analyzes** contract functions and ledger state
4. **Generates** TypeScript types and API functions with enhanced data type support
5. **Builds** a dynamic CLI that adapts to your contract

### **Function Discovery & Enhanced Data Types**
```javascript
// Automatically detected from your contract:
export circuit increment(value: Uint<16>): [] { ... }
export circuit post(message: Opaque<"string">): [] { ... }
export circuit get_count(): Uint<64> { ... }

// Becomes CLI options with intelligent parameter handling:
// 1. Increment (numeric parameter with validation)
// 2. Post (string parameter with opaque type conversion)
// 3. Get Count (read-only function)
```

### **Smart CLI Generation**
- **Parameter Detection**: Automatically detects function parameters and types
- **Enhanced Data Type Support**: Handles complex Midnight types including opaque strings
- **Type Safety**: Generates TypeScript interfaces with full type checking
- **Read-Only Functions**: Identifies and marks query functions
- **Interactive Menus**: Creates numbered options for all functions
- **Input Validation**: Validates parameters before contract calls

## 🛠️ Requirements

**System Requirements:**
- **Node.js 18+** (20+ recommended)
- **NPM** or **Yarn**
- **Midnight Development Tools** - Install `compactc` compiler
- **Docker Desktop** (for local development)

### 📋 Prerequisites

```bash
# Check system requirements
node --version && docker --version && git --version

# Install Midnight compiler (if not installed)
# Follow Midnight documentation for compactc installation
```

## 🔧 Troubleshooting

### 🚨 Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Contract not detected** | "No .compact files found" | Ensure `.compact` file is in project root |
| **Compilation errors** | Build fails, ZK key generation errors | Check `pragma language_version` directive |
| **CLI generation failed** | Missing menu options | Verify `export circuit` function syntax |
| **Docker issues** | Local deployment fails | Ensure Docker Desktop is running |
| **Testnet connection** | Wallet sync timeouts | Check internet connection, try `npm run balance` |
| **Zero balance** | Deployment fails with "insufficient funds" | Run `npm run faucet` or use manual faucet |
| **Permission errors** | File system access denied | Run with appropriate permissions or check file ownership |

### 🔍 Debug Commands

```bash
# Verify contract syntax
npm run build

# Check wallet status
npm run balance

# View detailed logs
npm run deploy --dry-run

# Test local environment
docker ps

```

## ⚙️ Advanced Configuration

### 🔧 Environment Variables

Create a `.env` file for configuration:

```bash
# Wallet Configuration
WALLET_SEED=your-64-character-hex-seed-phrase
WALLET_ADDRESS=your-wallet-address
```

### 💰 Wallet Management

**Option 1: Auto-generate wallet (Recommended)**
```bash
npm run wallet
```

**Option 2: Manual setup**
```bash
# Copy example configuration
cp .env.example .env

# Edit .env file and add your seed
WALLET_SEED=your-64-character-hex-seed-phrase-here
```

### 💰 Balance & Faucet Management

```bash
# Check wallet balance
npm run balance

# Request testnet tokens
npm run faucet
```

## 🛠️ Architecture

### **Auto-Generator Pipeline**
```
Root .compact → Sync to src/ → Compile Contract → Generate ZK Keys → 
Update TypeScript → Build CLI → Ready to Use!
```

### **CLI Components**
- **Contract Analyzer**: Parses contract functions and types with enhanced data type support
- **Dynamic Generator**: Creates CLI menus and handlers for all parameter types
- **API Layer**: Handles contract interactions with type conversion
- **Wallet Integration**: Manages testnet connections and balance checking

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 📋 Contribution Guidelines

**Types of contributions welcome:**
- 🐛 **Bug fixes** - Fix issues with the scaffold or data type handling
- ✨ **New features** - Add functionality to improve developer experience
- 📚 **Documentation** - Improve guides, examples, and API docs
- 🎨 **UI/UX** - Enhance CLI interface and user experience
- 🧪 **Tests** - Add test coverage and improve reliability
- 🔧 **Data Type Support** - Improve handling of complex Midnight types

## 📊 Project Status

| Feature | Status | Notes |
|---------|--------|-------|
| ✅ Auto-CLI Generation | Complete | Supports all contract types |
| ✅ Enhanced Data Type Support | Complete | Full support for complex Midnight types |
| ✅ Local Development | Complete | Docker-based Midnight node |
| ✅ Testnet Deployment | Complete | Automated wallet management |
| ✅ Deployment Flags | Complete | Dry-run, auto-deploy options |
| ✅ Wallet Tools | Complete | Balance checking, faucet integration |
| ✅ Documentation | Complete | Comprehensive guides and troubleshooting |
| 🔄 Multi-Contract Support | Planned | Support multiple contracts per project |
| 🔄 GUI Interface | Planned | Web-based contract interaction |
| 🔄 Contract Templates | Planned | Pre-built contract examples |

## 📄 License

MIT License - feel free to use this for any project!

## 🌟 Why Use Create Midnight App?

**Before**: Hours of manual setup, hardcoded configurations, manual CLI updates, type conversion issues
**After**: Create contract → run command → deploy to testnet with full data type support

This scaffold eliminates all the friction from Midnight smart contract development, handles complex data types automatically, and gets you building immediately.

---

**Last Updated**: June 13, 2025  
**Version**: 2.0.0  
Built with ❤️ for the Midnight ecosystem 🌙

**Happy coding on Midnight! 🌙✨**

Empowering developers to build privacy-preserving applications with zero-knowledge proofs and enhanced data type support.
