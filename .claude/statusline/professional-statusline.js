#!/usr/bin/env node
// professional-statusline.js - Statusline profissional para Claude Code
//
// Layout de 3 linhas:
// 1. Context & Active Tasks (venv, git, hooks, skills)
// 2. VibbinLoggin + MCP
// 3. Session Metrics (duration, cost, context %)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Importar módulos
const { colors, colorize, separator } = require('./lib/color-palette');
const spinner = require('./lib/liquid-spinner');
const skillsTracker = require('./lib/skills-tracker');
const vibeIntegration = require('./lib/vibe-integration');
const mcpMonitor = require('./lib/mcp-monitor');

// ============================================================================
// LINHA 1: Context & Active Tasks
// ============================================================================

function getVenvStatus() {
  const venv = process.env.VIRTUAL_ENV;
  if (venv) {
    const venvName = path.basename(venv);
    return colorize(`📦 Python: ${venvName}`, 'cyan');
  }
  return colorize('📦 Python: no venv', 'gray');
}

function getGitStatus() {
  try {
    const branch = execSync('git branch --show-current 2>/dev/null', {
      encoding: 'utf8',
      timeout: 100
    }).trim();

    if (!branch) return null;

    // Verificar se há mudanças
    const status = execSync('git status --porcelain 2>/dev/null', {
      encoding: 'utf8',
      timeout: 100
    }).trim();

    const hasChanges = status.length > 0;
    const statusIcon = hasChanges ? '±' : '✓';
    const statusColor = hasChanges ? 'yellow' : 'green';

    return `${colorize('🌿 Git:', 'gray')} ${colorize(branch, 'cyan')} ${colorize(statusIcon, statusColor)}`;
  } catch {
    return null;
  }
}

function getHooksStatus() {
  // Verificar se há hooks rodando (via marker file)
  const hooksStatusFile = path.join(
    process.env.HOME || '/home/cmr-auto',
    '.claude/statusline/hooks-status.json'
  );

  try {
    if (fs.existsSync(hooksStatusFile)) {
      const data = JSON.parse(fs.readFileSync(hooksStatusFile, 'utf8'));
      if (data.status === 'running' && data.hooks && data.hooks.length > 0) {
        const frame = spinner.getCurrentFrame();
        const hookName = data.hooks[0].replace('.js', '').replace(/-/g, ' ');
        return `${colorize('⚡ Hooks:', 'gray')} ${colorize(frame + ' ' + hookName, 'blue')}`;
      }
    }
  } catch {}

  // Idle
  return colorize('⚡ Hooks: idle', 'gray');
}

function getSkillsStatus() {
  const total = skillsTracker.getTotalCount();
  const active = skillsTracker.getActiveCount();

  if (total === 0) {
    return colorize('✨ Skills: none installed', 'gray');
  }

  if (active > 0) {
    return `${colorize('✨ Skills:', 'gray')} ${colorize(`${active}/${total} active`, 'blue')}`;
  }

  return `${colorize('✨ Skills:', 'gray')} ${colorize(`${total} available`, 'blue')}`;
}

function line1() {
  const parts = [
    getVenvStatus(),
    getGitStatus(),
    getHooksStatus(),
    getSkillsStatus()
  ].filter(Boolean);

  return parts.join(` ${separator()} `);
}

// ============================================================================
// LINHA 2: VibbinLoggin + MCP
// ============================================================================

function getVibeStatus() {
  if (!vibeIntegration.isAvailable()) {
    return `${colorize('💫 VibbinLoggin:', 'gray')} ${colorize('offline', 'gray')}`;
  }

  const prompts = vibeIntegration.getPromptsToday();
  const score = vibeIntegration.getAvgScore();

  if (prompts === 0) {
    return `${colorize('💫 VibbinLoggin:', 'gray')} ${colorize('no data yet', 'gray')}`;
  }

  return `${colorize('💫 VibbinLoggin:', 'purple')} ${colorize(prompts + ' prompts analyzed', 'purple')} ${separator()} ${colorize('Quality: ' + score + '/10', 'purple')}`;
}

function getMCPStatus() {
  if (!mcpMonitor.isAvailable()) {
    return `${colorize('🔌 MCP Servers:', 'gray')} ${colorize('not configured', 'gray')}`;
  }

  const servers = mcpMonitor.getServers();
  if (servers.length === 0) {
    return `${colorize('🔌 MCP Servers:', 'gray')} ${colorize('none', 'gray')}`;
  }

  const statuses = mcpMonitor.getServerStatuses();
  const healthy = Object.values(statuses).filter(Boolean).length;
  const total = servers.length;

  if (healthy === total) {
    const serverList = servers.join(', ');
    return `${colorize('🔌 MCP Servers:', 'blue')} ${colorize(`${total} active`, 'green')} ${colorize('(' + serverList + ')', 'gray')}`;
  } else {
    return `${colorize('🔌 MCP Servers:', 'blue')} ${colorize(`${healthy}/${total} active`, 'yellow')}`;
  }
}

function getAgentsStatus() {
  // Detectar agentes disponíveis
  const agentsDir = path.join(process.cwd(), 'agentes');

  try {
    if (!fs.existsSync(agentsDir)) {
      return `${colorize('🦾 Agents:', 'gray')} ${colorize('none', 'gray')}`;
    }

    const agents = fs.readdirSync(agentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    if (agents.length === 0) {
      return `${colorize('🦾 Agents:', 'gray')} ${colorize('none', 'gray')}`;
    }

    // TODO: Detectar agentes em execução via process table ou marker files
    const activeAgents = 0;  // Placeholder

    if (activeAgents > 0) {
      return `${colorize('🦾 Agents:', 'blue')} ${colorize(`${activeAgents}/${agents.length} running`, 'green')}`;
    }

    return `${colorize('🦾 Agents:', 'blue')} ${colorize(`${agents.length} available`, 'cyan')}`;
  } catch {
    return `${colorize('🦾 Agents:', 'gray')} ${colorize('error detecting', 'gray')}`;
  }
}

function line2() {
  const parts = [
    getVibeStatus(),
    getMCPStatus(),
    getAgentsStatus()
  ].filter(Boolean);

  return parts.join(` ${separator()} `);
}

// ============================================================================
// LINHA 3: Session Metrics
// ============================================================================

function getSessionDuration() {
  // Tentar ler do session file do Claude Code
  const sessionFile = path.join(
    process.env.HOME || '/home/cmr-auto',
    '.claude/statusline/session-start.json'
  );

  try {
    if (fs.existsSync(sessionFile)) {
      const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      const startTime = data.timestamp || Date.now();
      const elapsed = Date.now() - startTime;

      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h${minutes.toString().padStart(2, '0')}m`;
      } else {
        return `${minutes}m`;
      }
    }
  } catch {}

  return '0m';
}

function getTokenCost() {
  // TODO: Implementar leitura real de token usage
  // Por ora, retornar placeholder
  return 0.00;
}

function getContextPercentage() {
  // Calcular % de contexto usado
  // Claude Code tem limite de ~200k tokens de contexto
  const CONTEXT_LIMIT = 200000;

  try {
    // Tentar ler do session file ou calcular baseado em mensagens
    // Por ora, retornar placeholder
    const used = 45000;  // Exemplo
    const percent = Math.min(100, Math.round((used / CONTEXT_LIMIT) * 100));
    return percent;
  } catch {
    return 0;
  }
}

function line3() {
  const duration = getSessionDuration();
  const cost = getTokenCost();
  const contextPct = getContextPercentage();

  const parts = [
    `${colorize('⏱ Session:', 'gray')} ${colorize(duration, 'cyan')}`
  ];

  if (cost > 0) {
    parts.push(`${colorize('💰 Cost:', 'gray')} ${colorize('$' + cost.toFixed(2), 'yellow')}`);
  }

  // Contexto % (com cor baseada em uso)
  let contextColor = 'green';
  if (contextPct > 80) contextColor = 'red';
  else if (contextPct > 60) contextColor = 'yellow';

  parts.push(`${colorize('🧠 Context:', 'gray')} ${colorize(contextPct + '%', contextColor)}`);

  return parts.join(` ${separator()} `);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  try {
    const l1 = line1();
    const l2 = line2();
    const l3 = line3();

    // Output
    console.log(l1);
    if (l2) console.log(l2);
    console.log(l3);
  } catch (err) {
    // Fallback: output mínimo
    console.error('Statusline error:', err.message);
    console.log(colorize('⚡ statusline error', 'red'));
  }
}

main();
