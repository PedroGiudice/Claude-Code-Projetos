#!/usr/bin/env node

/**
 * context-collector.js - Coleta contexto e delega para Legal-Braniac
 *
 * Trigger: UserPromptSubmit (Nx por sessão)
 * Função: Coletar contexto + invocar Decision Engine
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { runValidations } = require('./lib/validations');
const { detectSkill } = require('./lib/skill-detector');
const { orchestrateAgents } = require('./lib/agent-orchestrator');
const { enforceAesthetics } = require('./lib/aesthetic-enforcer');

// ============================================================================
// CONTEXT COLLECTION
// ============================================================================

async function collectContext(projectDir, stdinData = null) {
  // Obter prompt com fallbacks robustos (stdin JSON → env var → vazio)
  // CRITICAL FIX: Claude Code envia prompt via stdin JSON, não env var
  let prompt = '';

  // Fonte 1: stdin JSON (fonte primária - Claude Code padrão)
  if (stdinData) {
    prompt = stdinData.prompt ||           // Campo padrão Claude Code
             stdinData.userPrompt ||       // Campo alternativo
             stdinData.message ||          // Outro formato possível
             stdinData.input ||            // Fallback genérico
             '';
  }

  // Fonte 2: env var (fallback - pode não estar disponível)
  if (!prompt) {
    prompt = process.env.CLAUDE_USER_PROMPT || '';
  }

  // Prompt vazio é esperado em alguns casos (não logar)

  const context = {
    timestamp: Date.now(),
    prompt,
    projectDir,
    git: {
      modifiedFiles: [],
      status: 'unknown',
      lastCommitAge: null
    },
    env: {
      venvActive: !!process.env.VIRTUAL_ENV,
      venvPath: process.env.VIRTUAL_ENV || null,
      platform: process.platform
    }
  };

  // Git context (se disponível)
  try {
    const modifiedFiles = execSync('git diff --name-only', {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'] // Silenciar stderr
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    const gitStatus = execSync('git status --porcelain', {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    // Tentar obter idade do último commit
    try {
      const gitIndexPath = path.join(projectDir, '.git', 'index');
      const gitIndexStat = await fs.stat(gitIndexPath);
      context.git.lastCommitAge = Date.now() - gitIndexStat.mtimeMs;
    } catch {
      // .git/index não acessível - OK
    }

    context.git = {
      modifiedFiles,
      status: gitStatus ? 'dirty' : 'clean',
      lastCommitAge: context.git.lastCommitAge
    };
  } catch {
    // Não é repo Git ou erro - usar defaults
    context.git.status = 'not-a-git-repo';
  }

  return context;
}

// ============================================================================
// LEGAL-BRANIAC DECISION ENGINE
// ============================================================================

async function legalBraniacDecide(context, sessionState) {
  const decisions = {
    validations: [],
    skillActivation: null,
    agentOrchestration: null,
    aestheticEnforcement: null
  };

  // 1. VALIDATIONS
  decisions.validations = await runValidations(context, sessionState.validations);

  // 2. SKILL DETECTION (v2.2: context-aware com file path triggers)
  decisions.skillActivation = detectSkill(context.prompt, context.git?.modifiedFiles || []);

  // 3. AGENT ORCHESTRATION (só para prompts complexos)
  decisions.agentOrchestration = await orchestrateAgents(
    context,
    sessionState.agentes
  );

  // 4. AESTHETIC ENFORCEMENT (se git commit detectado)
  if (context.prompt.toLowerCase().includes('git commit')) {
    decisions.aestheticEnforcement = await enforceAesthetics(context);
  }

  return decisions;
}

// ============================================================================
// OUTPUT FORMATTING v3 - COMPACT & CLEAN
// ============================================================================

function formatOutput(decisions) {
  const parts = [];

  // Validations (só critical failures - 1 linha)
  const failures = decisions.validations.filter(v => !v.passed);
  if (failures.length > 0) {
    parts.push(`⚠️ ${failures.map(f => f.message).join(' | ')}`);
  }

  // Skill + Agent em formato compacto unificado
  const hasSkills = decisions.skillActivation?.topSkills?.length > 0;
  const hasOrch = decisions.agentOrchestration && decisions.agentOrchestration.complexity !== 'LOW';

  if (hasSkills || hasOrch) {
    const skillNames = hasSkills
      ? decisions.skillActivation.topSkills.slice(0, 3).map(s => s.skillName)
      : [];

    // Extrair agentes únicos de subtasks
    const agents = hasOrch && decisions.agentOrchestration.subtasks
      ? [...new Set(decisions.agentOrchestration.subtasks.map(st => st.agente))]
      : [];

    // Formato compacto: 🎯 Skills: [a, b] │ Agents: [x, y]
    const skillPart = skillNames.length ? `Skills: [${skillNames.join(', ')}]` : '';
    const agentPart = agents.length ? `Agents: [${agents.join(', ')}]` : '';

    if (skillPart || agentPart) {
      parts.push(`🎯 ${[skillPart, agentPart].filter(Boolean).join(' │ ')}`);
    }
  }

  // Aesthetic (só se falhou)
  if (decisions.aestheticEnforcement && !decisions.aestheticEnforcement.passed) {
    parts.push(`🎨 ${decisions.aestheticEnforcement.violations.join(' | ')}`);
  }

  return parts.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  // Ler stdin JSON (fonte primária do prompt no Claude Code)
  let stdinData = null;
  try {
    const fs = require('fs');
    const stdinBuffer = fs.readFileSync(0, 'utf-8');
    if (stdinBuffer.trim()) {
      stdinData = JSON.parse(stdinBuffer);
    }
  } catch (error) {
    // Silently ignore stdin read errors
  }

  try {
    // Carregar session state (criado por legal-braniac-loader.js)
    const sessionPath = path.join(projectDir, '.claude', 'hooks', 'legal-braniac-session.json');

    let sessionState;
    try {
      const sessionContent = await fs.readFile(sessionPath, 'utf8');
      sessionState = JSON.parse(sessionContent);
    } catch (error) {
      // Session state não existe ou corrompido - recriar silenciosamente

      execSync('node .claude/hooks/legal-braniac-loader.js', { cwd: projectDir });

      // Tentar novamente
      const sessionContent = await fs.readFile(sessionPath, 'utf8');
      sessionState = JSON.parse(sessionContent);
    }

    // Coletar contexto (com fallback stdin)
    const context = await collectContext(projectDir, stdinData);

    // Legal-Braniac decide
    const decisions = await legalBraniacDecide(context, sessionState);

    // Formatar output
    const message = formatOutput(decisions);

    // Determinar se deve continuar
    const shouldContinue = decisions.aestheticEnforcement
      ? decisions.aestheticEnforcement.passed
      : true;

    // Output para Claude Code
    console.log(
      JSON.stringify({
        continue: shouldContinue,
        systemMessage: message
      })
    );

    // Exit code (para aesthetic enforcement blocker)
    if (!shouldContinue) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`[ERROR] context-collector: ${error.message}`);
    console.log(
      JSON.stringify({
        continue: true,
        systemMessage: `⚠️  Context collector: ${error.message}`
      })
    );
  }
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true, systemMessage: '' }));
});
