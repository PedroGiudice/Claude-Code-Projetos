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
// VIRTUAL AGENTS SYSTEM
// ============================================================================

/**
 * VirtualAgentFactory - Cria agentes temporários on-demand
 *
 * Funcionalidades:
 * - Criar agentes virtuais baseado em gaps detectados
 * - Track invocações e success rate
 * - Promover a agente permanente após 2+ usos com sucesso
 */
class VirtualAgentFactory {
  constructor(projectDir) {
    this.virtualAgents = new Map();
    this.projectDir = projectDir;
    this.sessionDir = path.join(projectDir, '.claude', 'statusline');
  }

  /**
   * Criar agente virtual baseado em task description
   */
  createVirtualAgent(taskDescription, requiredCapabilities) {
    const agentId = `virtual-${Date.now()}-${this._hash(taskDescription)}`;
    const agentName = this._inferAgentName(taskDescription, requiredCapabilities);

    const virtualAgent = {
      id: agentId,
      name: agentName,
      capabilities: requiredCapabilities,
      createdAt: Date.now(),
      sessionScoped: true,
      invocationCount: 0,
      successCount: 0,
      successRate: 0,
      definition: this._generateAgentDefinition(agentName, taskDescription, requiredCapabilities)
    };

    this.virtualAgents.set(agentId, virtualAgent);
    console.error(`[DEBUG] Virtual agent created: ${agentName} (${agentId.substring(0, 12)}...)`);

    return virtualAgent;
  }

  /**
   * Registrar invocação de virtual agent
   */
  recordInvocation(agentId, success = true) {
    const agent = this.virtualAgents.get(agentId);
    if (!agent) return;

    agent.invocationCount++;
    if (success) agent.successCount++;
    agent.successRate = agent.successCount / agent.invocationCount;

    console.error(`[DEBUG] Virtual agent ${agent.name}: ${agent.invocationCount} invocações, ${Math.round(agent.successRate * 100)}% sucesso`);

    // Auto-promote se critérios atingidos
    if (agent.invocationCount >= 2 && agent.successRate >= 0.7) {
      this.promoteToRealAgent(agentId);
    }
  }

  /**
   * Promover virtual agent a agente permanente
   */
  async promoteToRealAgent(agentId) {
    const virtual = this.virtualAgents.get(agentId);
    if (!virtual) return;

    const agentPath = path.join(this.projectDir, '.claude', 'agents', `${virtual.name}.md`);

    try {
      await fs.writeFile(agentPath, virtual.definition, 'utf8');
      console.error(`✨ Virtual agent "${virtual.name}" promovido a agente permanente`);
      console.error(`📁 Criado: .claude/agents/${virtual.name}.md`);

      this.virtualAgents.delete(agentId);
    } catch (error) {
      console.error(`[ERROR] Falha ao promover virtual agent: ${error.message}`);
    }
  }

  /**
   * Inferir nome do agente baseado na task
   */
  _inferAgentName(taskDescription, capabilities) {
    const lower = taskDescription.toLowerCase();

    // Legal domain patterns
    if (lower.includes('estratégia') || lower.includes('estrategia')) {
      return 'legal-strategy-planner';
    }
    if (lower.includes('peça') || lower.includes('petição') || lower.includes('peticao')) {
      return 'legal-document-drafter';
    }
    if (lower.includes('argumento') || lower.includes('tese')) {
      return 'legal-argumentation-architect';
    }
    if (lower.includes('monitorar') || lower.includes('acompanhar')) {
      return 'process-monitor';
    }

    // Generic fallback
    const firstCap = capabilities[0] || 'general';
    return `${firstCap.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-agent`;
  }

  /**
   * Gerar definição do agente (formato .md)
   */
  _generateAgentDefinition(name, taskDescription, capabilities) {
    const timestamp = new Date().toISOString();

    return `# ${name}

**Tipo**: Agente Virtual Promovido
**Criado**: ${timestamp}
**Origem**: Auto-gerado pelo Legal-Braniac

## Descrição

Agente criado automaticamente para atender à task:

> ${taskDescription}

## Capabilities

${capabilities.map(cap => `- ${cap}`).join('\n')}

## Especialização

Este agente foi promovido após demonstrar 2+ invocações bem-sucedidas.

## Tools/Skills Recomendadas

${this._recommendSkills(capabilities).map(skill => `- ${skill}`).join('\n')}

## Uso

Este agente deve ser invocado para tasks similares a:
- ${taskDescription}

## Histórico

- Criado como virtual agent
- Promovido após validação em sessão de uso real

---

**Nota**: Este arquivo foi gerado automaticamente. Revise e ajuste conforme necessário.
`;
  }

  /**
   * Recomendar skills baseado em capabilities
   */
  _recommendSkills(capabilities) {
    const skillMap = {
      'strategic-planning': ['strategy-planner', 'decision-tree-builder'],
      'document-drafting': ['petition-drafter', 'legal-docx-formatter'],
      'legal-analysis': ['legal-lens', 'legal-articles-finder'],
      'process-monitoring': ['monitor-notify']
    };

    const skills = new Set();
    for (const cap of capabilities) {
      const recommended = skillMap[cap] || [];
      recommended.forEach(s => skills.add(s));
    }

    return Array.from(skills);
  }

  /**
   * Hash simples para gerar IDs únicos
   */
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Salvar estado de virtual agents
   */
  async saveState() {
    const state = {
      virtualAgents: Array.from(this.virtualAgents.values()),
      timestamp: Date.now(),
      session: process.env.CLAUDE_SESSION_ID || 'unknown'
    };

    const statePath = path.join(this.sessionDir, 'virtual-agents-state.json');
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
  }

  /**
   * Carregar estado de sessão anterior (se recente)
   */
  async loadState() {
    const statePath = path.join(this.sessionDir, 'virtual-agents-state.json');

    try {
      const content = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(content);

      // Carregar apenas se sessão foi nas últimas 24h
      if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
        state.virtualAgents.forEach(agent => {
          this.virtualAgents.set(agent.id, agent);
        });
        console.error(`[DEBUG] Carregados ${state.virtualAgents.length} virtual agents de sessão anterior`);
      }
    } catch {
      // Sem estado anterior - ok
    }
  }
}

/**
 * Detectar gap: nenhum agente disponível atende ao task
 */
function detectAgentGap(task, availableAgents) {
  const requiredCapabilities = extractCapabilities(task);

  // Verificar se algum agente disponível atende
  const matches = Object.keys(availableAgents).filter(agentName => {
    const agent = availableAgents[agentName];
    // Match simples por keywords na especialidade
    return requiredCapabilities.some(cap =>
      agent.especialidade.toLowerCase().includes(cap.toLowerCase())
    );
  });

  if (matches.length === 0) {
    return {
      hasGap: true,
      requiredCapabilities,
      suggestedAgentName: inferAgentNameFromCapabilities(requiredCapabilities),
      confidence: 0.85
    };
  }

  return { hasGap: false };
}

/**
 * Extrair capabilities necessárias do task (NLU-based)
 */
function extractCapabilities(task) {
  const keywords = {
    'estratégia': ['strategic-planning', 'risk-assessment'],
    'estrategia': ['strategic-planning', 'risk-assessment'],
    'peça': ['document-drafting', 'legal-writing'],
    'petição': ['document-drafting', 'legal-writing'],
    'peticao': ['document-drafting', 'legal-writing'],
    'análise': ['legal-analysis', 'case-research'],
    'analise': ['legal-analysis', 'case-research'],
    'monitorar': ['process-monitoring', 'alert-system'],
    'acompanhar': ['process-monitoring', 'alert-system'],
    'argumento': ['argumentation', 'thesis-construction'],
    'tese': ['argumentation', 'thesis-construction']
  };

  const capabilities = [];
  const lowerTask = task.toLowerCase();

  for (const [term, caps] of Object.entries(keywords)) {
    if (lowerTask.includes(term)) {
      capabilities.push(...caps);
    }
  }

  return capabilities.length > 0 ? capabilities : ['general-purpose'];
}

/**
 * Inferir nome de agente baseado em capabilities
 */
function inferAgentNameFromCapabilities(capabilities) {
  if (capabilities.includes('strategic-planning')) return 'legal-strategy-planner';
  if (capabilities.includes('document-drafting')) return 'legal-document-drafter';
  if (capabilities.includes('legal-analysis')) return 'legal-analyst';
  if (capabilities.includes('process-monitoring')) return 'process-monitor';
  if (capabilities.includes('argumentation')) return 'legal-argumentation-architect';

  return 'general-legal-agent';
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  console.error('[DEBUG] legal-braniac-loader: Iniciando auto-discovery...');

  try {
    // Inicializar Virtual Agent Factory
    const virtualAgentFactory = new VirtualAgentFactory(projectDir);
    await virtualAgentFactory.loadState();

    // Auto-discovery paralelo
    const [agentes, skills] = await Promise.all([
      discoverAgentes(projectDir),
      discoverSkills(projectDir)
    ]);

    // Incluir virtual agents no inventário
    const virtualAgentsList = {};
    for (const [id, agent] of virtualAgentFactory.virtualAgents.entries()) {
      virtualAgentsList[agent.name] = {
        path: `virtual:${id.substring(0, 12)}...`,
        especialidade: `[VIRTUAL] ${agent.capabilities.join(', ')}`,
        invocationCount: agent.invocationCount,
        successRate: agent.successRate
      };
    }

    const allAgentes = { ...agentes, ...virtualAgentsList };

    console.error(
      `[DEBUG] Descobertos: ${Object.keys(agentes).length} agentes, ` +
      `${virtualAgentFactory.virtualAgents.size} virtual agents, ` +
      `${Object.keys(skills).length} skills`
    );

    // Criar session state persistente (incluindo virtual agents)
    const sessionState = await createSessionState(projectDir, allAgentes, skills);
    sessionState.virtualAgentFactory = {
      virtualAgentsCount: virtualAgentFactory.virtualAgents.size,
      agents: Array.from(virtualAgentFactory.virtualAgents.values()).map(a => ({
        id: a.id.substring(0, 12) + '...',
        name: a.name,
        invocations: a.invocationCount
      }))
    };

    // Salvar estado de virtual agents
    await virtualAgentFactory.saveState();

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

    const virtualInfo = virtualAgentFactory.virtualAgents.size > 0
      ? `\n🔧 Virtual Agents (${virtualAgentFactory.virtualAgents.size}): ${Array.from(virtualAgentFactory.virtualAgents.values()).map(a => a.name).join(', ')}`
      : '';

    console.log(
      JSON.stringify({
        continue: true,
        systemMessage:
          `🧠 Legal-Braniac: Supervisor ativo\n` +
          `📋 Agentes (${Object.keys(agentes).length}): ${agentList}\n` +
          `🛠️  Skills (${Object.keys(skills).length}): ${skillList}${virtualInfo}\n` +
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
