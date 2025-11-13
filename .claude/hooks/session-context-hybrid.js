#!/usr/bin/env node

/**
 * session-context-hybrid.js - Injeta contexto do projeto (HÍBRIDO SessionStart + UserPromptSubmit)
 *
 * SOLUÇÃO para Windows CLI subprocess polling issue:
 * - Usa run-once guard (via env var CLAUDE_SESSION_CONTEXT_LOADED)
 * - Funciona tanto em SessionStart quanto UserPromptSubmit
 * - Evita execuções repetidas quando usado em UserPromptSubmit
 *
 * Compatibilidade:
 * - SessionStart (Web/Linux): executa normalmente
 * - UserPromptSubmit (Windows CLI): executa apenas na 1ª vez
 *
 * Baseado em: https://github.com/DennisLiuCk/cc-toolkit/commit/09ab8674
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// RUN-ONCE GUARD
// ============================================================================

/**
 * Verifica se hook já foi executado nesta sessão
 * Usa variável de ambiente para detectar execuções repetidas
 */
function shouldSkip() {
  // Se já executou, retorna true para pular
  if (process.env.CLAUDE_SESSION_CONTEXT_LOADED === 'true') {
    return true;
  }

  // Marca como executado para próximas invocações
  process.env.CLAUDE_SESSION_CONTEXT_LOADED = 'true';

  return false;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function outputJSON(obj) {
  console.log(JSON.stringify(obj));
}

function fileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch {
    return false;
  }
}

function dirExists(dirpath) {
  try {
    const stat = fs.statSync(dirpath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

// ============================================================================
// DETECÇÃO DE AMBIENTE
// ============================================================================

function detectEnvironment() {
  const isWindows = process.platform === 'win32';
  const isRemote = process.env.TERM_PROGRAM === 'vscode' && process.env.VSCODE_PID;

  return {
    isWindows,
    isRemote,
    platform: process.platform
  };
}

// ============================================================================
// MAIN LOGIC
// ============================================================================

function main() {
  // RUN-ONCE GUARD: Skip se já executou
  if (shouldSkip()) {
    outputJSON({
      continue: true,
      systemMessage: '' // Silent skip (já injetou contexto antes)
    });
    return;
  }

  const env = detectEnvironment();
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  let context = `📂 Projeto: ${path.basename(projectDir)}\n`;

  // Estrutura .claude/
  const claudeDir = path.join(projectDir, '.claude');
  if (dirExists(claudeDir)) {
    const agentsDir = path.join(claudeDir, 'agents');
    const hooksDir = path.join(claudeDir, 'hooks');
    const skillsDir = path.join(projectDir, 'skills');

    let agentCount = 0;
    let hookCount = 0;
    let skillCount = 0;

    if (dirExists(agentsDir)) {
      agentCount = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md')).length;
    }

    if (dirExists(hooksDir)) {
      hookCount = fs.readdirSync(hooksDir).filter(f => f.endsWith('.js') || f.endsWith('.sh')).length;
    }

    if (dirExists(skillsDir)) {
      skillCount = fs.readdirSync(skillsDir).filter(d => {
        const stat = fs.statSync(path.join(skillsDir, d));
        return stat.isDirectory();
      }).length;
    }

    context += `🤖 Agentes: ${agentCount} | ⚙️  Hooks: ${hookCount} | 🛠️  Skills: ${skillCount}\n`;
  }

  // Arquitetura do projeto
  context += `📁 Arquitetura: CODE (Git) | ENV (.venv) | DATA (externo)\n`;
  context += `⚠️  Regras: RULE_006 (venv obrigatório) | RULE_004 (sem hardcode paths)\n`;

  // Ambiente atual
  if (env.isRemote) {
    context += `🌐 Ambiente: Web (Linux)\n`;
  } else if (env.isWindows) {
    context += `💻 Ambiente: Windows CLI\n`;
  } else {
    context += `🖥️  Ambiente: ${env.platform}\n`;
  }

  outputJSON({
    continue: true,
    systemMessage: context
  });
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

try {
  main();
} catch (error) {
  outputJSON({
    continue: true,
    systemMessage: `⚠️ session-context-hybrid error: ${error.message}`
  });
}
