#!/usr/bin/env node

/**
 * test-integration.js - Testes de integração para hooks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, '../..');

console.log('=== TESTES DE INTEGRAÇÃO: HOOKS ===\n');
console.log(`Project dir: ${projectDir}\n`);

let passed = 0;
let failed = 0;

// ============================================================================
// TEST 1: legal-braniac-loader.js (SessionStart)
// ============================================================================

console.log('[TEST 1] legal-braniac-loader.js');
try {
  const result = execSync('node .claude/hooks/legal-braniac-loader.js', {
    cwd: projectDir,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir }
  });

  // Parse output JSON
  const output = JSON.parse(result.split('\n').find(line => line.startsWith('{')));

  // Verificações
  if (!output.continue) {
    throw new Error('continue != true');
  }

  if (!output.systemMessage.includes('Legal-Braniac')) {
    throw new Error('systemMessage não contém "Legal-Braniac"');
  }

  // Verificar se legal-braniac-session.json foi criado
  const sessionPath = path.join(projectDir, '.claude', 'legal-braniac-session.json');
  if (!fs.existsSync(sessionPath)) {
    throw new Error('legal-braniac-session.json não foi criado');
  }

  // Verificar estrutura do session state
  const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  if (!sessionState.sessionId) throw new Error('sessionId ausente');
  if (!sessionState.agentes) throw new Error('agentes ausente');
  if (!sessionState.skills) throw new Error('skills ausente');

  console.log('  ✅ Hook executa corretamente');
  console.log('  ✅ Session state criado');
  console.log(`  ✅ Descobriu ${Object.keys(sessionState.agentes).length} agentes`);
  console.log(`  ✅ Descobriu ${Object.keys(sessionState.skills).length} skills`);
  console.log('  ✅ PASS\n');
  passed++;

} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}\n`);
  failed++;
}

// ============================================================================
// TEST 2: context-collector.js (UserPromptSubmit)
// ============================================================================

console.log('[TEST 2] context-collector.js');
try {
  const result = execSync('node .claude/hooks/context-collector.js', {
    cwd: projectDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: projectDir,
      CLAUDE_USER_PROMPT: 'Test prompt'
    }
  });

  // Parse output JSON
  const output = JSON.parse(result.split('\n').find(line => line.startsWith('{')));

  // Verificações
  if (typeof output.continue !== 'boolean') {
    throw new Error('continue ausente ou inválido');
  }

  if (typeof output.systemMessage !== 'string') {
    throw new Error('systemMessage ausente ou inválido');
  }

  console.log('  ✅ Hook executa corretamente');
  console.log('  ✅ Output JSON válido');
  console.log('  ✅ PASS\n');
  passed++;

} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}\n`);
  failed++;
}

// ============================================================================
// TEST 3: hook-wrapper.js (tracking)
// ============================================================================

console.log('[TEST 3] hook-wrapper.js + tracking');
try {
  const result = execSync('node .claude/hooks/hook-wrapper.js .claude/hooks/legal-braniac-loader.js', {
    cwd: projectDir,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir }
  });

  // Verificar se hooks-status.json foi criado
  const statusPath = path.join(projectDir, '.claude', 'statusline', 'hooks-status.json');
  if (!fs.existsSync(statusPath)) {
    throw new Error('hooks-status.json não foi criado pelo wrapper');
  }

  // Verificar estrutura do status
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  if (!status['legal-braniac-loader']) {
    throw new Error('legal-braniac-loader não registrado no status');
  }

  const hookStatus = status['legal-braniac-loader'];
  if (hookStatus.status !== 'success') {
    throw new Error(`Status esperado: success, recebido: ${hookStatus.status}`);
  }

  console.log('  ✅ Wrapper executa corretamente');
  console.log('  ✅ hooks-status.json criado');
  console.log(`  ✅ Status: ${hookStatus.status}`);
  console.log('  ✅ PASS\n');
  passed++;

} catch (error) {
  console.log(`  ❌ FAIL: ${error.message}\n`);
  failed++;
}

// ============================================================================
// RESULTADO FINAL
// ============================================================================

console.log('=== RESULTADO FINAL ===');
console.log(`✅ Passou: ${passed}/3`);
console.log(`❌ Falhou: ${failed}/3`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
