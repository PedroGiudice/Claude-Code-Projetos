#!/usr/bin/env node

/**
 * invoke-legal-braniac-hybrid.js - Auto-discovery Legal-Braniac (HÍBRIDO)
 *
 * SOLUÇÃO para Windows CLI subprocess polling issue:
 * - Usa run-once guard (via env var CLAUDE_LEGAL_BRANIAC_LOADED)
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

function shouldSkip() {
  if (process.env.CLAUDE_LEGAL_BRANIAC_LOADED === 'true') {
    return true;
  }

  process.env.CLAUDE_LEGAL_BRANIAC_LOADED = 'true';
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

  // Detecção heurística de ambiente corporativo
  let possibleCorporate = false;

  if (isWindows && !isRemote) {
    const username = process.env.USERNAME || '';

    // Heurística 1: username formato corporativo (2-4 letras maiúsculas ou FirstLast)
    if (/^[A-Z]{2,4}$/.test(username) || /^[A-Z][a-z]+[A-Z][a-z]+$/.test(username)) {
      possibleCorporate = true;
    }

    // Heurística 2: USERDOMAIN diferente de hostname (domínio Windows)
    const domain = process.env.USERDOMAIN || '';
    const hostname = process.env.COMPUTERNAME || '';
    if (domain && domain !== hostname && domain !== 'WORKGROUP') {
      possibleCorporate = true;
    }
  }

  return {
    isWindows,
    isRemote,
    possibleCorporate,
    platform: process.platform
  };
}

// ============================================================================
// AUTO-DISCOVERY
// ============================================================================

function discoverAgentes(projectDir) {
  const agentsDir = path.join(projectDir, '.claude', 'agents');
  if (!dirExists(agentsDir)) return [];

  try {
    return fs.readdirSync(agentsDir)
      .filter(f => f.endsWith('.md') && f !== 'legal-braniac.md')
      .map(f => f.replace('.md', ''))
      .sort();
  } catch {
    return [];
  }
}

function discoverSkills(projectDir) {
  const skillsDir = path.join(projectDir, 'skills');
  if (!dirExists(skillsDir)) return [];

  try {
    return fs.readdirSync(skillsDir)
      .filter(d => {
        try {
          const stat = fs.statSync(path.join(skillsDir, d));
          return stat.isDirectory() && fileExists(path.join(skillsDir, d, 'SKILL.md'));
        } catch {
          return false;
        }
      })
      .sort();
  } catch {
    return [];
  }
}

// ============================================================================
// FORMATAÇÃO
// ============================================================================

function formatMessage(agentes, skills, env) {
  const agentesStr = agentes.length <= 3
    ? agentes.join(', ')
    : `${agentes.slice(0, 2).join(', ')}, +${agentes.length - 2}`;

  const skillsStr = skills.length <= 3
    ? skills.join(', ')
    : `${skills.slice(0, 2).join(', ')}, +${skills.length - 2}`;

  let message = `🧠 Legal-Braniac: Orquestrador ativo\n`;

  if (agentes.length > 0) {
    message += `📋 Agentes (${agentes.length}): ${agentesStr}\n`;
  }

  if (skills.length > 0) {
    message += `🛠️  Skills (${skills.length}): ${skillsStr}`;
  }

  return message;
}

// ============================================================================
// MAIN LOGIC
// ============================================================================

function main() {
  // RUN-ONCE GUARD: Skip se já executou
  if (shouldSkip()) {
    outputJSON({
      continue: true,
      systemMessage: '' // Silent skip
    });
    return;
  }

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const env = detectEnvironment();

  // Skip no Windows CLI corporativo (EPERM risk)
  if (!env.isRemote && env.isWindows && env.possibleCorporate) {
    outputJSON({
      continue: true,
      systemMessage: '' // Silent skip
    });
    return;
  }

  try {
    const agentes = discoverAgentes(projectDir);
    const skills = discoverSkills(projectDir);

    // Se não tem nada, skip silencioso
    if (agentes.length === 0 && skills.length === 0) {
      outputJSON({
        continue: true,
        systemMessage: '🧠 Legal-Braniac: Ativo (sem agentes/skills descobertos)'
      });
      return;
    }

    const message = formatMessage(agentes, skills, env);

    outputJSON({
      continue: true,
      systemMessage: message
    });

  } catch (error) {
    outputJSON({
      continue: true,
      systemMessage: `🧠 Legal-Braniac: Erro durante auto-discovery (${error.message})`
    });
  }
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

try {
  main();
} catch (error) {
  outputJSON({
    continue: true,
    systemMessage: ''
  });
}
