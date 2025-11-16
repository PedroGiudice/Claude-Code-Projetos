#!/usr/bin/env node

/**
 * test-libs.js - Testes unitários básicos para lib/*
 */

const path = require('path');

async function testLibExports() {
  console.log('=== TESTES UNITÁRIOS: lib/* ===\n');

  const tests = [
    {
      name: 'validations.js',
      module: './lib/validations.js',
      exports: ['runValidations']
    },
    {
      name: 'skill-detector.js',
      module: './lib/skill-detector.js',
      exports: ['detectSkill']
    },
    {
      name: 'agent-orchestrator.js',
      module: './lib/agent-orchestrator.js',
      exports: ['orchestrateAgents']
    },
    {
      name: 'aesthetic-enforcer.js',
      module: './lib/aesthetic-enforcer.js',
      exports: ['enforceAesthetics']
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`[TEST] ${test.name}`);

      // Importar módulo
      const module = require(test.module);

      // Verificar exports
      for (const exportName of test.exports) {
        if (typeof module[exportName] !== 'function') {
          throw new Error(`Export "${exportName}" não encontrado ou não é função`);
        }
        console.log(`  ✅ Export: ${exportName}`);
      }

      console.log(`  ✅ PASS\n`);
      passed++;

    } catch (error) {
      console.log(`  ❌ FAIL: ${error.message}\n`);
      failed++;
    }
  }

  console.log('=== RESULTADO ===');
  console.log(`✅ Passou: ${passed}/${tests.length}`);
  console.log(`❌ Falhou: ${failed}/${tests.length}`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Executar
testLibExports().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
