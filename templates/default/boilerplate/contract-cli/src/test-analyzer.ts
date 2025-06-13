#!/usr/bin/env node

import { ContractAnalyzer } from './contract-analyzer.js';

async function testAnalyzer() {
  try {
    console.log('🔍 Testing Contract Analyzer...');
    
    const analyzer = new ContractAnalyzer();
    const analysis = await analyzer.analyzeContract();
    
    console.log(`✅ Contract analyzed: ${analysis.contractName}`);
    console.log(`📋 Found ${analysis.functions.length} functions:`);
    
    analysis.functions.forEach(func => {
      const params = func.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
      console.log(`   - ${func.name}(${params}) -> ${func.returnType}`);
    });

    console.log(`🏛️ Ledger state properties: ${Object.keys(analysis.ledgerState).length}`);
    Object.entries(analysis.ledgerState).forEach(([name, type]) => {
      console.log(`   - ${name}: ${type}`);
    });
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

testAnalyzer();
