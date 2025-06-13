# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.6] - 2025-06-14

### 🔧 State Display Fixes

#### ✨ Fixed
- **Contract State Display**: Fixed "Not available" issue in contract state display
- **Dynamic State Reading**: Now properly reads all ledger state variables (round, votesA, votesB, items)
- **Ledger Integration**: Improved integration with contract ledger state queries
- **Set Handling**: Enhanced handling of Set<data> types in contract state

#### 🎯 Improved
- **Real-time Values**: Contract state now shows actual current values instead of placeholders
- **Error Handling**: Better error handling for state queries
- **Type Support**: Enhanced support for bigint and complex types in state display

## [2.1.4] - 2025-06-14

### 🚀 Final Production Release

#### ✨ Complete Integration
- **Fully Tested**: All improvements from example-counter integrated and tested
- **Pure Function Support**: Complete support for functions with return values
- **Clean UI**: Polished menu display without unnecessary labels
- **Production Ready**: All features working seamlessly

#### 🔧 What's New
- **Enhanced Function Detection**: Detects both `ImpureCircuits` and `PureCircuits`
- **Smart Type Analysis**: Functions classified by return types and patterns
- **Improved Auto-Generator**: Clean, production-ready code generation
- **Better UX**: Streamlined CLI interface

## [2.1.3] - 2025-06-14

### 🎯 Production-Ready Integration

#### ✨ Added
- **Complete Integration**: Fully integrated all working improvements from example-counter
- **Tested Functionality**: All features tested and verified to work correctly
- **Clean Implementation**: Removed debug logs and polished user experience

#### 🔧 Updated
- **Latest Improvements**: All template files updated with the most recent enhancements
- **API Enhancements**: Updated API files with latest functionality
- **Generator Improvements**: Auto-generator refined for production use

## [2.1.2] - 2025-06-14

### 🚀 Enhanced Function Detection & UI Improvements

#### ✨ Added
- **Pure Function Support**: Now detects and displays pure functions (read-only functions with return values)
- **Improved Parsing**: Enhanced contract analyzer to parse both `ImpureCircuits` and `PureCircuits` types
- **Better Return Type Detection**: Functions with return values are automatically marked as read-only

#### 🎨 Improved
- **Cleaner UI**: Removed "(read-only)" labels from regular contract functions in CLI menu
- **Reduced Noise**: Removed debug logging for witness parsing

#### 🔧 Fixed
- **Missing Functions**: Fixed issue where functions with return values weren't appearing in CLI menus
- **Type Analysis**: Improved function classification based on return types, not just naming patterns

## [2.1.0] - 2025-06-13

### 🎯 Dynamic Type Detection & Automatic Import Generation

This release introduces intelligent contract analysis with dynamic type detection, eliminating the need for manual type configuration when switching between different contract types.

### ✨ Added

#### Dynamic Type System
- **Auto-Detection**: Automatically detects private state types from contract witnesses
- **Dynamic Imports**: Generates clean `common-types.ts` with correct imports for any contract
- **Generic Support**: Works seamlessly with any contract type (Counter, BBoard, Voting, etc.)
- **Smart Mapping**: Comprehensive type mapping that handles various naming patterns
- **Zero Configuration**: No manual intervention needed when switching contract types

#### Improved Auto-Generator
- **Enhanced Type Analysis**: Reads witness functions to determine correct private state structure
- **Comprehensive Updates**: Updates all CLI files with contract-specific types automatically
- **Error Prevention**: Eliminates type mismatch errors when changing contracts
- **Better Feedback**: Clear console output showing type detection and updates

### 🔧 Improved
- Auto-generator now works universally with any contract type
- Enhanced error handling for type detection
- Better console output and debugging information
- More robust contract analysis and parsing

## [2.0.0] - 2025-06-13

### 🚀 Major Release - Enhanced Data Type Support & Professional Tooling

This major release brings comprehensive improvements to create-midnight-app, incorporating advanced features from the proven example-counter scaffold. The focus is on enhanced data type support, professional development tooling, and an improved developer experience.

### ✨ Added

#### Enhanced Data Type Support
- **Opaque String Handling**: Full support for `Opaque<"string">` parameters with automatic type conversion
- **Complex Type Support**: Enhanced handling of all Midnight contract types including arrays, tuples, and custom types
- **Type Validation**: Improved parameter validation with intelligent type checking
- **createOpaqueString API**: New utility function for converting strings to opaque types

#### Professional Development Tooling
- **Docker Integration**: Automated local Midnight node management for testing
- **Enhanced CLI Generation**: Intelligent parameter detection and handling for all data types
- **Deployment Flags**: Support for `--new`, `--join`, `--dry-run`, and `--help` flags
- **Wallet Management**: Comprehensive wallet tools with balance checking and faucet integration
- **Auto-Sync Pipeline**: Improved contract synchronization from root to build directories

#### New Commands
- `npm run deploy` - Local deployment with Docker integration
- `npm run balance` - Real-time wallet balance checking
- `npm run faucet` - Automated testnet token requests
- `npm run clean` - Clean all generated files

#### Documentation & Examples
- **Comprehensive README**: Enhanced documentation with troubleshooting guides
- **Contract Templates**: Examples showcasing enhanced data type support
- **Architecture Guide**: Detailed explanation of auto-generation pipeline
- **Troubleshooting Section**: Common issues and solutions

#### Advanced Features
- **Witness Function Support**: Automatic detection and inclusion of private state functions
- **Smart Contract Analysis**: Enhanced contract parsing with metadata generation
- **Interactive Menus**: Improved CLI interface with numbered options and validation
- **Error Handling**: Professional error handling with clear feedback

### 🔧 Improved

#### Template Structure
- **Complete Boilerplate**: Updated template with full scaffold structure from example-counter
- **Enhanced API Layer**: Improved contract interaction API with type conversion support
- **Build System**: Optimized build process with better dependency management
- **Configuration**: Streamlined environment variable setup with `.env` support

#### Developer Experience
- **Root-Level Editing**: Edit contracts directly in project root for easy access
- **Hot Reload**: Instant updates when contract changes
- **Clean Builds**: Automatic removal of old artifacts before rebuilding
- **Comprehensive Logging**: Detailed build and deployment logs

#### CLI Interface
- **Parameter Detection**: Automatic detection of function parameters and types
- **Input Validation**: Validates parameters before contract calls
- **Read-Only Functions**: Identifies and marks query functions appropriately
- **Enhanced Feedback**: Clear success/error messages and progress indicators

### 🛠️ Technical Improvements

#### Code Quality
- **TypeScript**: Enhanced TypeScript interfaces with full type checking
- **Error Handling**: Robust error handling throughout the application
- **Code Organization**: Improved project structure and module organization
- **Testing**: Enhanced test coverage and reliability

#### Performance
- **Build Optimization**: Faster compilation and generation processes
- **Memory Management**: Improved memory usage during contract compilation
- **Caching**: Better caching of compiled artifacts and ZK keys

### 📦 Dependencies

#### Updated
- Enhanced boilerplate structure with latest dependencies
- Improved TypeScript configuration and build tools
- Updated Docker configurations for local development

#### Added
- New utility functions for data type conversion
- Enhanced API functions for contract interaction
- Additional development and debugging tools

### 🔄 Migration Guide

#### From 1.x to 2.0.0

**Automatic Migration**: Existing projects will automatically benefit from new features when regenerated with `npm run dev`.

**New Features Available**:
1. Enhanced data type support - no code changes needed
2. New commands (`npm run balance`, `npm run faucet`, `npm run deploy`)
3. Docker integration for local development
4. Improved CLI with better parameter handling

**Recommended Actions**:
1. Update to Node.js 18+ (20+ recommended)
2. Install Docker Desktop for local development features
3. Run `npm run dev` to regenerate with new enhancements
4. Try new commands for improved development workflow

### 🐛 Fixed

- **Buffer Error**: Resolved "Cannot read properties of undefined (reading 'buffer')" error for opaque string parameters
- **Type Conversion**: Fixed issues with complex parameter type handling
- **CLI Generation**: Improved reliability of dynamic CLI generation
- **Build Process**: Enhanced stability of contract compilation and ZK key generation
- **Parameter Validation**: Better validation and error messages for invalid inputs

### 🔒 Security

- **Wallet Security**: Enhanced wallet generation and management security
- **Input Validation**: Improved validation to prevent malformed contract calls
- **Error Handling**: Better error handling to prevent information leakage

### 📋 Requirements

- **Node.js**: 18+ (20+ recommended)
- **Docker Desktop**: Required for local development features
- **Midnight Compiler**: compactc for contract compilation
- **NPM/Yarn**: For package management

---

## [1.0.1] - 2025-06-01

### 🔧 Fixed
- Minor bug fixes and improvements
- Updated documentation

## [1.0.0] - 2025-05-15

### 🚀 Initial Release
- Basic scaffold for Midnight smart contracts
- Auto-generating CLI from contract functions
- Testnet deployment support
- Basic wallet integration
- Simple contract examples

---

**Version 2.0.0** represents a major milestone in making Midnight smart contract development more accessible and professional. The enhanced data type support, combined with improved tooling and documentation, provides developers with everything needed to build sophisticated privacy-preserving applications on the Midnight blockchain.

For support and contributions, visit our [GitHub repository](https://github.com/kaleababayneh/create-midnight-app).