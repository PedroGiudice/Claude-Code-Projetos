#!/usr/bin/env node
/**
 * permission-wrapper.js - Wrapper para hooks de permissão
 *
 * Executa verificações contextuais ANTES do hookify:
 * 1. Bloqueia git commit na branch main/master
 *
 * Se não bloqueia, delega para hookify-permission-engine.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Ler stdin
let input = '';
try {
  input = fs.readFileSync(0, 'utf8');
} catch (e) {
  // Sem input - delegar para hookify
  delegateToHookify(input);
  process.exit(0);
}

if (!input.trim()) {
  delegateToHookify(input);
  process.exit(0);
}

let data;
try {
  data = JSON.parse(input);
} catch (e) {
  delegateToHookify(input);
  process.exit(0);
}

const toolName = data.toolName || data.tool_name || '';
const toolInput = data.toolInput || data.tool_input || {};
const command = toolInput.command || '';

// Verificação contextual: git commit na main
if (toolName === 'Bash' && isGitCommit(command)) {
  const branch = getCurrentBranch();
  if (branch === 'main' || branch === 'master') {
    console.log(JSON.stringify({
      behavior: 'deny',
      message: `🛑 **COMMIT EM ${branch.toUpperCase()} BLOQUEADO**

Você está na branch \`${branch}\`. Commits diretos são bloqueados.

**O que fazer:**
1. O hook \`auto-branch.sh\` deveria ter criado uma branch de trabalho
2. Se não criou, execute: \`git checkout -b work/sua-tarefa\`
3. Faça o commit na nova branch
4. Abra um PR para merge

> Hook: .claude/hooks/permission-wrapper.js`
    }));
    process.exit(0);
  }
}

// Não bloqueou - delegar para hookify
delegateToHookify(input);

function isGitCommit(cmd) {
  return /\bgit\s+commit\b/.test(cmd);
}

function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', {
      cwd: PROJECT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (e) {
    return null;
  }
}

function delegateToHookify(input) {
  const hookify = spawn('bun', ['run', path.join(PROJECT_DIR, '.claude/hooks/hookify-permission-engine.js')], {
    cwd: PROJECT_DIR,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  hookify.stdin.write(input);
  hookify.stdin.end();
}
