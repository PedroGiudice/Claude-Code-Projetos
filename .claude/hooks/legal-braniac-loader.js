#!/usr/bin/env node

/**
 * legal-braniac-loader.js - Carrega Legal-Braniac no início da sessão
 *
 * Trigger: SessionStart (1x por sessão)
 * Função: Auto-discovery de agentes/skills, criar estado persistente
 */

const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

// ============================================================================
// AUTO-DISCOVERY
// ============================================================================

async function discoverAgentes(projectDir) {
  const agentsDir = path.join(projectDir, '.claude', 'agents');

  try {
    const files = await fs.readdir(agentsDir);

    const agentes = {};
    for (const file of files) {
      if (!file.endsWith('.md') || file === 'legal-braniac.md') continue;

      const name = file.replace('.md', '');
      const filePath = path.join(agentsDir, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Extrair descrição do frontmatter ou primeira linha
      const descMatch = content.match(/description:\s*(.+)/i);
      const firstLineMatch = content.match(/^#\s+(.+)/m);

      agentes[name] = {
        path: `.claude/agents/${file}`,
        especialidade: descMatch
          ? descMatch[1].trim()
          : firstLineMatch
          ? firstLineMatch[1].trim()
          : 'N/A'
      };
    }

    return agentes;
  } catch (error) {
    console.error(`[WARN] Erro ao descobrir agentes: ${error.message}`);
    return {};
  }
}

async function discoverSkills(projectDir) {
  const skillsDir = path.join(projectDir, 'skills');

  try {
    const dirs = await fs.readdir(skillsDir);

    const skills = {};
    for (const dir of dirs) {
      const skillMdPath = path.join(skillsDir, dir, 'SKILL.md');

      try {
        await fs.access(skillMdPath);

        // Carregar triggers da skill (para skill-detector.js)
        const content = await fs.readFile(skillMdPath, 'utf8');

        // Parsear triggers (formato: keywords: ["palavra1", "palavra2"])
        const triggersMatch = content.match(/keywords?:\s*\[([^\]]+)\]/i);

        skills[dir] = {
          path: `skills/${dir}/SKILL.md`,
          triggers: triggersMatch
            ? triggersMatch[1]
                .split(',')
                .map(t => t.trim().replace(/['"]/g, ''))
                .filter(Boolean)
            : []
        };
      } catch {
        // Diretório sem SKILL.md - skip
      }
    }

    return skills;
  } catch (error) {
    console.error(`[WARN] Erro ao descobrir skills: ${error.message}`);
    return {};
  }
}

// ============================================================================
// SESSION STATE CREATION
// ============================================================================

async function createSessionState(projectDir, agentes, skills) {
  const sessionState = {
    sessionId: randomUUID(),
    startTime: Date.now(),
    agentes,
    skills,
    validations: {
      enabled: ['venv', 'git-status', 'data-layer', 'deps', 'corporate'],
      thresholds: {
        gitCommitAge: 3600000, // 1 hour
        dependencyDrift: 2592000000 // 30 days
      }
    }
  };

  const sessionPath = path.join(projectDir, '.claude', 'legal-braniac-session.json');
  await fs.writeFile(sessionPath, JSON.stringify(sessionState, null, 2), 'utf8');

  return sessionState;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  console.error('[DEBUG] legal-braniac-loader: Iniciando auto-discovery...');

  try {
    // Auto-discovery paralelo
    const [agentes, skills] = await Promise.all([
      discoverAgentes(projectDir),
      discoverSkills(projectDir)
    ]);

    console.error(
      `[DEBUG] Descobertos: ${Object.keys(agentes).length} agentes, ${Object.keys(skills).length} skills`
    );

    // Criar session state persistente
    const sessionState = await createSessionState(projectDir, agentes, skills);

    console.error(`[DEBUG] Session state criado: ${sessionState.sessionId}`);

    // Output para Claude Code
    const agentList =
      Object.keys(agentes).length <= 3
        ? Object.keys(agentes).join(', ')
        : `${Object.keys(agentes).slice(0, 2).join(', ')}, +${Object.keys(agentes).length - 2}`;

    const skillList =
      Object.keys(skills).length <= 3
        ? Object.keys(skills).join(', ')
        : `${Object.keys(skills).slice(0, 2).join(', ')}, +${Object.keys(skills).length - 2}`;

    console.log(
      JSON.stringify({
        continue: true,
        systemMessage:
          `🧠 Legal-Braniac: Supervisor ativo\n` +
          `📋 Agentes (${Object.keys(agentes).length}): ${agentList}\n` +
          `🛠️  Skills (${Object.keys(skills).length}): ${skillList}\n` +
          `Session ID: ${sessionState.sessionId.substring(0, 8)}`
      })
    );
  } catch (error) {
    console.error(`[ERROR] legal-braniac-loader: ${error.message}`);
    console.log(
      JSON.stringify({
        continue: true,
        systemMessage: `⚠️  Legal-Braniac: Erro no carregamento (${error.message})`
      })
    );
  }
}

main().catch(err => {
  console.error(`[FATAL] legal-braniac-loader: ${err.message}`);
  console.log(JSON.stringify({ continue: true, systemMessage: '' }));
});
