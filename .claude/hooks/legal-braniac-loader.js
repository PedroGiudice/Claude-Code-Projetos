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
// HOOKS PARSING
// ============================================================================

async function parseHooksFromSettings(projectDir) {
  try {
    const settingsPath = path.join(projectDir, '.claude', 'settings.json');
    const content = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(content);

    const hooks = {};

    if (settings.hooks) {
      // Count hooks by trigger type
      for (const [triggerType, hookConfigs] of Object.entries(settings.hooks)) {
        if (!Array.isArray(hookConfigs)) continue;

        for (const config of hookConfigs) {
          if (config.hooks && Array.isArray(config.hooks)) {
            for (const hook of config.hooks) {
              if (hook.command) {
                let hookName;

                // Extract hook name from command
                // Handle both direct commands and hook-wrapper.js wrapped commands
                const commandParts = hook.command.split(/\s+/);

                // Check if it's an npx command (like "npx vibe-log-cli")
                if (commandParts[0] === 'npx' && commandParts.length > 1) {
                  hookName = commandParts[1]; // e.g., "vibe-log-cli"
                } else {
                  // Find the actual script (last .js or .sh file in command)
                  const scriptPaths = commandParts.filter(p => p.includes('.js') || p.includes('.sh'));
                  const scriptPath = scriptPaths[scriptPaths.length - 1]; // Get last one (the actual hook, not wrapper)

                  if (scriptPath) {
                    hookName = path.basename(scriptPath, path.extname(scriptPath));
                  }
                }

                if (hookName) {
                  if (!hooks[hookName]) {
                    hooks[hookName] = {
                      triggers: [],
                      command: hook.command,
                      note: hook._note || ''
                    };
                  }

                  if (!hooks[hookName].triggers.includes(triggerType)) {
                    hooks[hookName].triggers.push(triggerType);
                  }
                }
              }
            }
          }
        }
      }
    }

    return hooks;
  } catch (error) {
    console.error(`[WARN] Erro ao parsear hooks de settings.json: ${error.message}`);
    return {};
  }
}

// ============================================================================
// SESSION STATE CREATION
// ============================================================================

async function createSessionState(projectDir, agentes, skills) {
  const now = Date.now();

  // Parse hooks from settings.json
  const hooks = await parseHooksFromSettings(projectDir);

  const sessionState = {
    sessionId: randomUUID(),
    sessionStart: now, // For statusline compatibility
    startTime: now,    // Backward compatibility
    lastUpdate: now,
    agents: {
      available: Object.keys(agentes),
      details: agentes
    },
    skills: {
      available: Object.keys(skills),
      details: skills
    },
    hooks: hooks, // Populated from settings.json
    validations: {
      enabled: ['venv', 'git-status', 'data-layer', 'deps', 'corporate'],
      thresholds: {
        gitCommitAge: 3600000, // 1 hour
        dependencyDrift: 2592000000 // 30 days
      }
    }
  };

  // Save to hooks directory (statusline expects it there)
  const hooksDir = path.join(projectDir, '.claude', 'hooks');
  await fs.mkdir(hooksDir, { recursive: true });

  const sessionPath = path.join(hooksDir, 'legal-braniac-session.json');
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
// ENGINE UPGRADES (Decision 2.0, Orchestration 2.0, Delegation 2.0)
// ============================================================================

/**
 * DecisionEngine - Análise multi-dimensional e decisão adaptativa
 */
class DecisionEngine {
  /**
   * Analisar complexidade multi-dimensional da task
   */
  static analyzeComplexity(task, availableAgents, availableSkills) {
    return {
      technical: this._assessTechnicalComplexity(task),
      legal: this._assessLegalComplexity(task),
      temporal: this._assessTimeConstraints(task),
      interdependency: this._assessInterdependency(task)
    };
  }

  /**
   * Fazer decisão adaptativa: ORCHESTRATE, DELEGATE, CREATE_VIRTUAL, ASK_USER
   */
  static makeDecision(task, complexity, availableAgents) {
    const confidence = this._calculateConfidence(complexity, availableAgents);

    // Baixa confiança → perguntar ao usuário
    if (confidence < 0.5) {
      return {
        action: 'ASK_USER',
        reason: 'Ambiguidade alta - necessário clarificação',
        confidence
      };
    }

    // Tarefa simples → legal-braniac orquestra diretamente
    if (complexity.legal < 30 && complexity.technical < 30) {
      return {
        action: 'ORCHESTRATE',
        reason: 'Tarefa simples, orquestração direta',
        confidence
      };
    }

    // Nenhum agente disponível → criar virtual
    if (Object.keys(availableAgents).length === 0) {
      return {
        action: 'CREATE_VIRTUAL',
        reason: 'Nenhum agente disponível',
        confidence
      };
    }

    // Caso normal → delegar para agentes
    return {
      action: 'DELEGATE',
      reason: 'Delegação a agentes especializados',
      confidence,
      agents: this._selectTopAgents(task, availableAgents)
    };
  }

  static _assessTechnicalComplexity(task) {
    let score = 0;
    const lower = task.toLowerCase();

    // Termos técnicos aumentam complexidade
    const technicalTerms = ['api', 'database', 'docker', 'kubernetes', 'microservice', 'pipeline'];
    score += technicalTerms.filter(t => lower.includes(t)).length * 15;

    // Múltiplas tecnologias aumentam complexidade
    const techStack = ['python', 'node', 'react', 'django', 'flask'];
    score += techStack.filter(t => lower.includes(t)).length * 10;

    return Math.min(score, 100);
  }

  static _assessLegalComplexity(task) {
    let score = 0;
    const lower = task.toLowerCase();

    // Termos jurídicos complexos
    const complexTerms = ['estratégia', 'estrategia', 'recurso', 'apelação', 'apelacao'];
    score += complexTerms.filter(t => lower.includes(t)).length * 25;

    // Termos jurídicos simples
    const simpleTerms = ['buscar', 'consultar', 'listar'];
    score += simpleTerms.filter(t => lower.includes(t)).length * 10;

    // Múltiplas instâncias jurídicas aumentam complexidade
    const instances = ['stf', 'stj', 'trf', 'tjsp', 'tjrj'];
    score += instances.filter(t => lower.includes(t)).length * 15;

    return Math.min(score, 100);
  }

  static _assessTimeConstraints(task) {
    const lower = task.toLowerCase();

    if (lower.includes('urgente') || lower.includes('imediato')) return 'urgent';
    if (lower.includes('prazo') || lower.includes('deadline')) return 'deadline';
    if (lower.includes('quando possível')) return 'flexible';

    return 'normal';
  }

  static _assessInterdependency(task) {
    const steps = task.split(/\be\b|,|;/);
    return steps.length > 1 ? steps.length : 0;
  }

  static _calculateConfidence(complexity, availableAgents) {
    let confidence = 0.8; // Base confidence

    // Reduz confiança se complexidade alta
    if (complexity.legal > 70 || complexity.technical > 70) {
      confidence -= 0.3;
    }

    // Reduz confiança se sem agentes especializados
    if (Object.keys(availableAgents).length === 0) {
      confidence -= 0.2;
    }

    // Aumenta confiança se baixa complexidade
    if (complexity.legal < 30 && complexity.technical < 30) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  static _selectTopAgents(task, availableAgents) {
    // TODO: Implementar ranking (será feito no Delegation Engine)
    return Object.keys(availableAgents).slice(0, 3);
  }
}

/**
 * OrchestrationEngine - Dependency graph e execução paralela
 */
class OrchestrationEngine {
  /**
   * Criar grafo de dependências de tasks
   */
  static buildDependencyGraph(tasks) {
    return new TaskGraph(tasks);
  }

  /**
   * Executar tasks em paralelo respeitando dependências
   */
  static async executeParallel(taskGraph, delegationEngine) {
    const results = {};
    const batches = taskGraph.getParallelBatches();

    console.error(`[DEBUG] Executando ${batches.length} batches de tasks`);

    for (const batch of batches) {
      console.error(`[DEBUG] Batch com ${batch.length} tasks paralelas`);

      const promises = batch.map(task =>
        delegationEngine.execute(task).catch(err => ({
          task,
          error: err,
          success: false
        }))
      );

      const batchResults = await Promise.all(promises);

      for (const result of batchResults) {
        results[result.task.id] = result;
      }
    }

    return results;
  }
}

/**
 * TaskGraph - Grafo de dependências com validação de ciclos
 */
class TaskGraph {
  constructor(tasks) {
    this.tasks = tasks;
    this.adjacencyList = this._buildGraph(tasks);
    this._validateNoCycles();
  }

  _buildGraph(tasks) {
    const graph = {};

    for (const task of tasks) {
      graph[task.id] = {
        task,
        dependencies: task.dependencies || [],
        dependents: []
      };
    }

    // Build reverse edges (dependents)
    for (const taskId in graph) {
      const deps = graph[taskId].dependencies;
      for (const depId of deps) {
        if (graph[depId]) {
          graph[depId].dependents.push(taskId);
        }
      }
    }

    return graph;
  }

  _validateNoCycles() {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = this.adjacencyList[nodeId];
      for (const depId of node.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId in this.adjacencyList) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) {
          throw new Error(`Ciclo detectado no grafo de dependências: ${nodeId}`);
        }
      }
    }
  }

  getParallelBatches() {
    const batches = [];
    const completed = new Set();
    const inProgress = new Set();

    while (completed.size < this.tasks.length) {
      const batch = [];

      for (const taskId in this.adjacencyList) {
        if (completed.has(taskId) || inProgress.has(taskId)) continue;

        const node = this.adjacencyList[taskId];
        const depsCompleted = node.dependencies.every(depId => completed.has(depId));

        if (depsCompleted) {
          batch.push(node.task);
          inProgress.add(taskId);
        }
      }

      if (batch.length === 0) {
        throw new Error('Deadlock detectado - nenhuma task pode ser executada');
      }

      batches.push(batch);

      // Mark batch as completed
      for (const task of batch) {
        inProgress.delete(task.id);
        completed.add(task.id);
      }
    }

    return batches;
  }
}

/**
 * DelegationEngine - Ranking de agentes e retry com backoff
 */
class DelegationEngine {
  constructor(availableAgents, availableSkills) {
    this.availableAgents = availableAgents;
    this.availableSkills = availableSkills;
    this.agentLoadMap = new Map();
    this.maxConcurrentPerAgent = 3;
  }

  /**
   * Selecionar agentes com ranking
   */
  selectAgents(task) {
    const candidates = this._filterCandidates(task);

    if (candidates.length === 0) {
      return { match: false, reason: 'Nenhum agente candidato' };
    }

    // Ranking por: performance histórica (50%) + load (30%) + skill match (20%)
    const ranked = candidates.map(agentName => {
      const agent = this.availableAgents[agentName];
      const load = this.agentLoadMap.get(agentName) || 0;
      const historicalSuccess = agent.successRate || 0.5;
      const skillMatch = this._calculateSkillMatch(agent, task);

      const score =
        historicalSuccess * 0.5 +
        (1 - load / this.maxConcurrentPerAgent) * 0.3 +
        skillMatch * 0.2;

      return { agentName, agent, score };
    }).sort((a, b) => b.score - a.score);

    return {
      match: true,
      agents: ranked.slice(0, 3), // Top 3
      topAgent: ranked[0]
    };
  }

  _filterCandidates(task) {
    const requiredCaps = extractCapabilities(task);

    return Object.keys(this.availableAgents).filter(agentName => {
      const agent = this.availableAgents[agentName];

      return requiredCaps.some(cap =>
        agent.especialidade.toLowerCase().includes(cap.toLowerCase())
      );
    });
  }

  _calculateSkillMatch(agent, task) {
    // Placeholder - match simples por keywords
    const taskLower = task.toLowerCase();
    const specialtyLower = agent.especialidade.toLowerCase();

    const keywords = taskLower.split(/\s+/).filter(w => w.length > 3);
    const matches = keywords.filter(kw => specialtyLower.includes(kw));

    return matches.length / Math.max(keywords.length, 1);
  }

  /**
   * Executar task com retry exponencial
   */
  async execute(task, maxRetries = 3) {
    const selection = this.selectAgents(task);

    if (!selection.match) {
      throw new Error(`Nenhum agente disponível para: ${task}`);
    }

    const agent = selection.topAgent.agentName;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Incrementar load
        this.agentLoadMap.set(agent, (this.agentLoadMap.get(agent) || 0) + 1);

        // Simular delegação (TODO: integrar com Task tool)
        console.error(`[DEBUG] Delegando "${task}" para ${agent} (tentativa ${attempt}/${maxRetries})`);

        const result = await this._delegateToAgent(task, agent);

        // Decrementar load
        this.agentLoadMap.set(agent, Math.max(0, (this.agentLoadMap.get(agent) || 1) - 1));

        // Atualizar success rate
        this._updateSuccessRate(agent, true);

        return result;
      } catch (error) {
        console.error(`[ERROR] Tentativa ${attempt} falhou: ${error.message}`);

        // Decrementar load
        this.agentLoadMap.set(agent, Math.max(0, (this.agentLoadMap.get(agent) || 1) - 1));

        if (attempt === maxRetries) {
          // Atualizar failure rate
          this._updateSuccessRate(agent, false);
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        await this._sleep(Math.pow(2, attempt - 1) * 1000);
      }
    }
  }

  async _delegateToAgent(task, agentName) {
    // TODO: Integrar com Task tool para delegação real
    // Por ora, simular sucesso
    return {
      task,
      agent: agentName,
      result: `Simulação: ${agentName} processou "${task}"`,
      success: true
    };
  }

  _updateSuccessRate(agentName, success) {
    const agent = this.availableAgents[agentName];
    if (!agent) return;

    const currentRate = agent.successRate || 0.5;
    // Exponential moving average
    agent.successRate = currentRate * 0.9 + (success ? 1.0 : 0.0) * 0.1;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
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

    // Debug hooks parsing
    const hooksFromSettings = await parseHooksFromSettings(projectDir);
    console.error(`[DEBUG] Hooks parseados de settings.json: ${Object.keys(hooksFromSettings).length}`);
    console.error(`[DEBUG] Hooks encontrados: ${Object.keys(hooksFromSettings).join(', ')}`);

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
