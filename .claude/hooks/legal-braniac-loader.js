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
      // Exclude documentation files (same filter as agent-auto-discovery.js)
      if (!file.endsWith('.md')) continue;
      if (file === 'README.md') continue;
      if (file === 'legal-braniac.md') continue;
      if (file.match(/^[A-Z_]+.*\.md$/)) continue; // ALL_CAPS or UPPER_CASE docs

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
   * P1.4: Criar agente virtual com Quality Gating
   */
  createVirtualAgent(taskDescription, requiredCapabilities) {
    // P1.4: Validar inputs
    const validationErrors = this._validateInputs(taskDescription, requiredCapabilities);
    if (validationErrors.length > 0) {
      console.error(`[WARN] Virtual agent creation warnings: ${validationErrors.join(', ')}`);

      // Tentar melhorar capabilities automaticamente
      if (requiredCapabilities.length === 0 || requiredCapabilities[0] === 'general-purpose') {
        requiredCapabilities = this._inferCapabilitiesFromTask(taskDescription);
        console.error(`[INFO] Auto-inferred capabilities: ${requiredCapabilities.join(', ')}`);
      }
    }

    const agentId = `virtual-${Date.now()}-${this._hash(taskDescription)}`;
    const agentName = this._inferAgentName(taskDescription, requiredCapabilities);

    // P1.4: Validar spec gerada
    const definition = this._generateAgentDefinition(agentName, taskDescription, requiredCapabilities);
    const specQuality = this._assessSpecQuality(agentName, definition, requiredCapabilities);

    const virtualAgent = {
      id: agentId,
      name: agentName,
      capabilities: requiredCapabilities,
      createdAt: Date.now(),
      sessionScoped: true,
      invocationCount: 0,
      successCount: 0,
      successRate: 0,
      definition,
      qualityScore: specQuality.score,
      qualityIssues: specQuality.issues
    };

    this.virtualAgents.set(agentId, virtualAgent);

    console.error(
      `[DEBUG] Virtual agent created: ${agentName} (${agentId.substring(0, 12)}...) ` +
      `Quality: ${specQuality.score}/100${specQuality.issues.length > 0 ? ` (${specQuality.issues.length} issues)` : ''}`
    );

    return virtualAgent;
  }

  /**
   * P1.4: Validar inputs de criação
   */
  _validateInputs(taskDescription, capabilities) {
    const errors = [];

    if (!taskDescription || taskDescription.length < 10) {
      errors.push('Task description too short');
    }

    if (!capabilities || capabilities.length === 0) {
      errors.push('No capabilities provided');
    }

    if (capabilities && capabilities.length === 1 && capabilities[0] === 'general-purpose') {
      errors.push('Generic capability only');
    }

    return errors;
  }

  /**
   * P1.4: Inferir capabilities de task (fallback)
   */
  _inferCapabilitiesFromTask(taskDescription) {
    // Re-usar extractCapabilities global
    return extractCapabilities(taskDescription);
  }

  /**
   * P1.4: Avaliar qualidade da spec gerada
   */
  _assessSpecQuality(name, definition, capabilities) {
    let score = 100;
    const issues = [];

    // Validar nome
    if (name.length < 5) {
      score -= 20;
      issues.push('Nome muito curto');
    }

    if (name === 'general-agent' || name.endsWith('-agent-agent')) {
      score -= 15;
      issues.push('Nome genérico demais');
    }

    // Validar definição
    if (definition.length < 200) {
      score -= 25;
      issues.push('Definição muito curta');
    }

    if (!definition.includes('## Capabilities')) {
      score -= 20;
      issues.push('Seção Capabilities ausente');
    }

    // Validar capabilities
    if (capabilities.length === 0) {
      score -= 30;
      issues.push('Nenhuma capability definida');
    }

    if (capabilities.length === 1 && capabilities[0] === 'general-purpose') {
      score -= 15;
      issues.push('Apenas capability genérica');
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }

  /**
   * P1.5: Registrar invocação com critérios rigorosos de promoção
   */
  recordInvocation(agentId, success = true) {
    const agent = this.virtualAgents.get(agentId);
    if (!agent) return;

    agent.invocationCount++;
    if (success) agent.successCount++;
    agent.successRate = agent.successCount / agent.invocationCount;

    // P1.5: Rastrear invocações ao longo do tempo
    if (!agent.invocationHistory) {
      agent.invocationHistory = [];
    }
    agent.invocationHistory.push({
      timestamp: Date.now(),
      success
    });

    console.error(
      `[DEBUG] Virtual agent ${agent.name}: ${agent.invocationCount} invocações, ` +
      `${Math.round(agent.successRate * 100)}% sucesso`
    );

    // P1.5: Critérios RIGOROSOS de auto-promoção
    const promotionEligible = this._checkPromotionEligibility(agent);

    if (promotionEligible.eligible) {
      console.error(`[INFO] Virtual agent ${agent.name} elegível para promoção: ${promotionEligible.reason}`);
      this.promoteToRealAgent(agentId);
    } else if (agent.invocationCount >= 3) {
      // Log de progresso para promoção
      console.error(`[DEBUG] Progresso promoção ${agent.name}: ${promotionEligible.reason}`);
    }
  }

  /**
   * P1.5: Verificar elegibilidade rigorosa para promoção
   */
  _checkPromotionEligibility(agent) {
    const MIN_INVOCATIONS = 5;       // Aumentado de 2
    const MIN_SUCCESS_RATE = 0.85;   // Aumentado de 0.70
    const MIN_QUALITY_SCORE = 70;    // Novo critério

    // Critério 1: Mínimo de invocações
    if (agent.invocationCount < MIN_INVOCATIONS) {
      return {
        eligible: false,
        reason: `Apenas ${agent.invocationCount}/${MIN_INVOCATIONS} invocações`
      };
    }

    // Critério 2: Success rate alto
    if (agent.successRate < MIN_SUCCESS_RATE) {
      return {
        eligible: false,
        reason: `Success rate ${Math.round(agent.successRate * 100)}% < ${Math.round(MIN_SUCCESS_RATE * 100)}%`
      };
    }

    // Critério 3: Quality score da spec
    if (agent.qualityScore && agent.qualityScore < MIN_QUALITY_SCORE) {
      return {
        eligible: false,
        reason: `Quality score ${agent.qualityScore} < ${MIN_QUALITY_SCORE}`
      };
    }

    // Critério 4: Consistência temporal (últimas 3 invocações devem ter >70% success)
    if (agent.invocationHistory && agent.invocationHistory.length >= 3) {
      const recent3 = agent.invocationHistory.slice(-3);
      const recent3Success = recent3.filter(h => h.success).length / recent3.length;

      if (recent3Success < 0.7) {
        return {
          eligible: false,
          reason: `Últimas 3 invocações: ${Math.round(recent3Success * 100)}% < 70%`
        };
      }
    }

    // Critério 5: Não ter sido criado há menos de 1 hora (evitar promoção prematura)
    const age = Date.now() - agent.createdAt;
    const MIN_AGE = 60 * 60 * 1000; // 1 hora
    if (age < MIN_AGE) {
      return {
        eligible: false,
        reason: `Criado há ${Math.round(age / 60000)}min < 60min`
      };
    }

    return {
      eligible: true,
      reason: `${agent.invocationCount} invocações, ${Math.round(agent.successRate * 100)}% success, quality ${agent.qualityScore || 'N/A'}`
    };
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
   * Inferir nome do agente baseado na task (P0.4: GENÉRICO)
   */
  _inferAgentName(taskDescription, capabilities) {
    const lower = taskDescription.toLowerCase();

    // P0.4: Pattern matching genérico baseado em verbos + domínios
    const patterns = [
      { verbs: ['estratégia', 'estrategia', 'planejar', 'plan'], suffix: 'strategy-planner' },
      { verbs: ['monitorar', 'acompanhar', 'watch', 'monitor'], suffix: 'monitor' },
      { verbs: ['analisar', 'analyze', 'analyse', 'review'], suffix: 'analyst' },
      { verbs: ['implementar', 'desenvolver', 'create', 'implement'], suffix: 'developer' },
      { verbs: ['documentar', 'document', 'write docs'], suffix: 'documenter' },
      { verbs: ['testar', 'test', 'qa', 'quality'], suffix: 'tester' }
    ];

    // Tentar match com padrões genéricos
    for (const pattern of patterns) {
      if (pattern.verbs.some(v => lower.includes(v))) {
        // Extrair domínio (primeira capability ou palavra-chave)
        const domain = this._extractDomain(lower, capabilities);
        return `${domain}-${pattern.suffix}`;
      }
    }

    // Fallback: usar primeira capability
    const firstCap = capabilities[0] || 'general';
    return `${firstCap.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-agent`;
  }

  /**
   * P0.4: Extrair domínio da tarefa (GENÉRICO)
   */
  _extractDomain(text, capabilities) {
    // Tentar extrair de capabilities primeiro
    if (capabilities && capabilities.length > 0) {
      const firstCap = capabilities[0].split('-')[0]; // e.g., "legal-analysis" → "legal"
      if (firstCap && firstCap.length > 3) return firstCap;
    }

    // Heurística: primeira palavra substantiva > 4 chars
    const words = text.split(/\s+/);
    const actionWords = ['create', 'analyze', 'implement', 'review', 'test', 'develop',
                         'criar', 'analisar', 'implementar', 'revisar', 'testar', 'desenvolver'];

    for (const word of words) {
      if (word.length > 4 && !actionWords.includes(word.toLowerCase())) {
        return word.replace(/[^a-z0-9]/gi, '').toLowerCase();
      }
    }

    return 'general';
  }

  /**
   * Gerar definição do agente (formato .md) - P0.4: GENÉRICO
   */
  _generateAgentDefinition(name, taskDescription, capabilities) {
    const timestamp = new Date().toISOString();
    const domain = this._extractDomain(taskDescription.toLowerCase(), capabilities);

    return `---
name: ${name}
description: Auto-generated agent for ${domain} tasks
created: ${timestamp}
type: virtual-promoted
---

# ${name}

**Tipo**: Agente Virtual Promovido
**Domínio**: ${domain}
**Criado**: ${timestamp}
**Origem**: Auto-gerado pelo Legal-Braniac v2.0

## Descrição

Agente criado automaticamente para atender à task:

> ${taskDescription}

Este agente foi promovido após demonstrar 2+ invocações bem-sucedidas (>70% success rate).

## Capabilities

${capabilities.map(cap => `- **${cap}**: Capacidade inferida da task original`).join('\n')}

## Especialização

${this._generateSpecializationText(domain, capabilities)}

## Tools/Skills Recomendadas

${this._recommendSkills(capabilities).map(skill => `- \`${skill}\`: ${this._getSkillDescription(skill)}`).join('\n')}

## Uso

Este agente deve ser invocado para tasks similares a:

- ${taskDescription}
- Tarefas relacionadas a: ${capabilities.join(', ')}

## Critérios de Invocação

O Legal-Braniac invocará este agente quando detectar:

${capabilities.map(cap => `- Keywords: ${this._getCapabilityKeywords(cap).join(', ')}`).join('\n')}

## Histórico

- **Criado**: Como virtual agent (session-scoped)
- **Promovido**: Após validação em uso real
- **Auto-gerado**: Template genérico v2.0

---

**Nota**: Este arquivo foi gerado automaticamente pelo Legal-Braniac.
Revise e ajuste conforme necessário para refinar a especialização.
`;
  }

  /**
   * P0.4: Gerar texto de especialização genérico
   */
  _generateSpecializationText(domain, capabilities) {
    return `Este agente é especializado em tarefas de **${domain}**, focando em:

${capabilities.map((cap, i) => `${i + 1}. **${cap}**: Aplicação prática desta capacidade no contexto de ${domain}`).join('\n')}

O agente foi treinado (via auto-geração) para lidar com tarefas que requerem estas capabilities específicas.`;
  }

  /**
   * P0.4: Obter descrição genérica de skill
   */
  _getSkillDescription(skillName) {
    const descriptions = {
      'strategy-planner': 'Planejamento estratégico e arquitetura de soluções',
      'decision-tree-builder': 'Construção de árvores de decisão',
      'petition-drafter': 'Redação de petições e documentos formais',
      'legal-docx-formatter': 'Formatação de documentos legais',
      'legal-lens': 'Análise profunda de textos',
      'legal-articles-finder': 'Busca e extração de referências',
      'monitor-notify': 'Monitoramento e notificações'
    };

    return descriptions[skillName] || 'Ferramenta auxiliar para esta capability';
  }

  /**
   * P0.4: Obter keywords para uma capability
   */
  _getCapabilityKeywords(capability) {
    const keywordMap = {
      'strategic-planning': ['estratégia', 'strategy', 'planejar', 'plan'],
      'risk-assessment': ['risco', 'risk', 'avaliar', 'assess'],
      'document-drafting': ['documento', 'document', 'redigir', 'draft'],
      'legal-writing': ['legal', 'jurídico', 'peça', 'petição'],
      'legal-analysis': ['análise', 'analysis', 'analisar', 'analyze'],
      'case-research': ['pesquisa', 'research', 'caso', 'case'],
      'process-monitoring': ['monitorar', 'monitor', 'acompanhar', 'watch'],
      'alert-system': ['alerta', 'alert', 'notificar', 'notify'],
      'argumentation': ['argumento', 'argument', 'tese', 'thesis'],
      'thesis-construction': ['construir tese', 'build thesis', 'argumentar'],
      'general-purpose': ['geral', 'general', 'genérico', 'generic']
    };

    return keywordMap[capability] || [capability.replace(/-/g, ' ')];
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
   * P0.6: Salvar estado de virtual agents (File-Based Persistence)
   */
  async saveState() {
    try {
      const state = {
        version: '2.0',
        virtualAgents: Array.from(this.virtualAgents.values()),
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000, // 24h
        session: process.env.CLAUDE_SESSION_ID || 'unknown',
        metadata: {
          totalAgents: this.virtualAgents.size,
          promotionCandidates: this._getPromotionCandidates().length
        }
      };

      // Criar diretório se não existir
      await fs.mkdir(this.sessionDir, { recursive: true });

      const statePath = path.join(this.sessionDir, 'virtual-agents-state.json');
      await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');

      console.error(`[DEBUG] Estado salvo: ${this.virtualAgents.size} virtual agents`);
    } catch (error) {
      console.error(`[ERROR] Falha ao salvar estado: ${error.message}`);
    }
  }

  /**
   * P0.6: Carregar estado de sessão anterior (se recente)
   */
  async loadState() {
    const statePath = path.join(this.sessionDir, 'virtual-agents-state.json');

    try {
      const content = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(content);

      // Validar versão
      if (!state.version || state.version !== '2.0') {
        console.error('[WARN] Estado de versão incompatível - ignorando');
        return;
      }

      // Verificar TTL
      const age = Date.now() - state.timestamp;
      if (age > state.ttl) {
        console.error(`[DEBUG] Estado expirado (${Math.round(age / 3600000)}h > 24h) - ignorando`);
        await this._archiveState(statePath);
        return;
      }

      // Restaurar virtual agents
      state.virtualAgents.forEach(agent => {
        this.virtualAgents.set(agent.id, agent);
      });

      console.error(`[DEBUG] Estado restaurado: ${state.virtualAgents.length} virtual agents (${Math.round(age / 60000)}min atrás)`);

      // Checar candidatos a promoção
      const candidates = this._getPromotionCandidates();
      if (candidates.length > 0) {
        console.error(`[INFO] ${candidates.length} virtual agent(s) elegível(is) para promoção`);
      }

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`[WARN] Erro ao carregar estado: ${error.message}`);
      }
      // Sem estado anterior - ok
    }
  }

  /**
   * P0.6: Arquivar estado expirado
   */
  async _archiveState(statePath) {
    try {
      const archivePath = statePath.replace('.json', `-archived-${Date.now()}.json`);
      await fs.rename(statePath, archivePath);
      console.error(`[DEBUG] Estado expirado arquivado: ${path.basename(archivePath)}`);
    } catch {
      // Falha ao arquivar - não crítico
    }
  }

  /**
   * P0.6: Obter candidatos a promoção
   */
  _getPromotionCandidates() {
    const candidates = [];

    for (const [id, agent] of this.virtualAgents.entries()) {
      if (agent.invocationCount >= 2 && agent.successRate >= 0.7) {
        candidates.push({ id, agent });
      }
    }

    return candidates;
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
 * P0.5: Extrair capabilities necessárias do task (NLU-based GENÉRICO)
 */
function extractCapabilities(task) {
  const keywords = {
    // Planejamento e Estratégia
    'estratégia': ['strategic-planning', 'risk-assessment'],
    'estrategia': ['strategic-planning', 'risk-assessment'],
    'planejar': ['strategic-planning'],
    'plan': ['strategic-planning'],
    'arquitetura': ['architectural-design', 'system-planning'],
    'architecture': ['architectural-design', 'system-planning'],

    // Desenvolvimento
    'implementar': ['implementation', 'coding'],
    'implement': ['implementation', 'coding'],
    'desenvolver': ['development', 'coding'],
    'develop': ['development', 'coding'],
    'código': ['coding', 'programming'],
    'code': ['coding', 'programming'],
    'refatorar': ['refactoring', 'code-improvement'],
    'refactor': ['refactoring', 'code-improvement'],

    // Análise
    'analisar': ['analysis', 'investigation'],
    'analyze': ['analysis', 'investigation'],
    'análise': ['analysis', 'investigation'],
    'analysis': ['analysis', 'investigation'],
    'revisar': ['review', 'audit'],
    'review': ['review', 'audit'],

    // Testes e QA
    'testar': ['testing', 'quality-assurance'],
    'test': ['testing', 'quality-assurance'],
    'qa': ['quality-assurance', 'testing'],
    'quality': ['quality-assurance'],

    // Documentação
    'documentar': ['documentation', 'technical-writing'],
    'document': ['documentation', 'technical-writing'],
    'docs': ['documentation'],
    'readme': ['documentation', 'user-guide'],

    // Monitoramento
    'monitorar': ['monitoring', 'tracking'],
    'monitor': ['monitoring', 'tracking'],
    'acompanhar': ['tracking', 'monitoring'],
    'watch': ['monitoring'],

    // Domínio Legal (mantido para backward compatibility)
    'peça': ['document-drafting', 'legal-writing'],
    'petição': ['document-drafting', 'legal-writing'],
    'peticao': ['document-drafting', 'legal-writing'],
    'argumento': ['argumentation', 'thesis-construction'],
    'tese': ['argumentation', 'thesis-construction'],
    'jurídico': ['legal-analysis'],
    'juridico': ['legal-analysis']
  };

  const capabilities = new Set();
  const lowerTask = task.toLowerCase();

  // Primeira passada: match exato de keywords
  for (const [term, caps] of Object.entries(keywords)) {
    if (lowerTask.includes(term)) {
      caps.forEach(cap => capabilities.add(cap));
    }
  }

  // Segunda passada: inferência baseada em verbos (se nenhuma capability encontrada)
  if (capabilities.size === 0) {
    const actionVerbs = {
      create: 'creation',
      build: 'building',
      setup: 'configuration',
      configure: 'configuration',
      deploy: 'deployment',
      integrate: 'integration',
      optimize: 'optimization'
    };

    for (const [verb, capability] of Object.entries(actionVerbs)) {
      if (lowerTask.includes(verb)) {
        capabilities.add(capability);
      }
    }
  }

  return capabilities.size > 0 ? Array.from(capabilities) : ['general-purpose'];
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
   * P1.1: Analisar complexidade multi-dimensional da task (com confidence)
   */
  static analyzeComplexity(task, availableAgents, availableSkills) {
    const dimensions = {
      technical: this._assessTechnicalComplexity(task),
      legal: this._assessLegalComplexity(task),
      temporal: this._assessTimeConstraints(task),
      interdependency: this._assessInterdependency(task)
    };

    // P1.1: Calcular confidence baseado em variância das dimensões
    const confidence = this._calculateConfidenceFromDimensions(dimensions);

    return {
      ...dimensions,
      confidence,
      complexity: (dimensions.technical + dimensions.legal + dimensions.interdependency) / 3
    };
  }

  /**
   * P1.1: Fazer decisão adaptativa com confidence scoring
   */
  static makeDecision(task, complexity, availableAgents) {
    const confidence = complexity.confidence || this._calculateConfidence(complexity, availableAgents);

    // P1.1: Baixa confiança → perguntar ao usuário
    if (confidence < 0.5) {
      return {
        action: 'ASK_USER',
        reason: `Ambiguidade alta (confidence: ${(confidence * 100).toFixed(0)}%) - necessário clarificação`,
        confidence,
        complexity: complexity.complexity || 50
      };
    }

    // Tarefa simples → legal-braniac orquestra diretamente
    if (complexity.complexity < 30) {
      return {
        action: 'ORCHESTRATE',
        reason: 'Tarefa simples, orquestração direta',
        confidence,
        complexity: complexity.complexity
      };
    }

    // Nenhum agente disponível → criar virtual
    if (Object.keys(availableAgents).length === 0) {
      return {
        action: 'CREATE_VIRTUAL',
        reason: 'Nenhum agente disponível',
        confidence,
        complexity: complexity.complexity
      };
    }

    // Caso normal → delegar para agentes
    return {
      action: 'DELEGATE',
      reason: 'Delegação a agentes especializados',
      confidence,
      complexity: complexity.complexity,
      agents: this._selectTopAgents(task, availableAgents)
    };
  }

  /**
   * P1.1: Calcular confidence baseado em variância de dimensões
   */
  static _calculateConfidenceFromDimensions(dimensions) {
    const values = [dimensions.technical, dimensions.legal, dimensions.interdependency];
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    // Baixa variância = alta confiança (dimensões consistentes)
    // Variância máxima = 100² = 10000 (dimensões em extremos opostos)
    // Normalizar: confidence = 1 - (variance / 10000)
    const rawConfidence = Math.max(0, 1 - (variance / 10000));

    // Boost confidence se temporal indica urgência (decisão clara)
    const temporalBoost = dimensions.temporal > 60 ? 0.1 : 0;

    return Math.min(1, rawConfidence + temporalBoost);
  }

  /**
   * P0.1: Avaliar complexidade técnica (GENÉRICO)
   */
  static _assessTechnicalComplexity(task) {
    let score = 0;
    const lower = task.toLowerCase();

    // Termos técnicos - infraestrutura (peso 8)
    const infraTerms = ['api', 'database', 'docker', 'kubernetes', 'microservice', 'pipeline', 'cache', 'distributed'];
    score += infraTerms.filter(t => lower.includes(t)).length * 15;

    // Termos técnicos - linguagens/frameworks (peso 5)
    const techStack = ['python', 'node', 'react', 'django', 'flask', 'typescript', 'java', 'c++'];
    score += techStack.filter(t => lower.includes(t)).length * 10;

    // Termos técnicos - padrões/arquitetura (peso 10)
    const patterns = ['rag', 'embedding', 'neural', 'machine learning', 'ai', 'pattern', 'design pattern'];
    score += patterns.filter(t => lower.includes(t)).length * 20;

    // Complexidade de implementação (palavras-chave)
    const complexActions = ['implementar sistema', 'criar arquitetura', 'desenvolver plataforma'];
    if (complexActions.some(a => lower.includes(a))) score += 30;

    return Math.min(score, 100);
  }

  /**
   * P0.1: Avaliar complexidade de domínio (GENÉRICO - substitui legal complexity)
   */
  static _assessLegalComplexity(task) {
    // Renomeado internamente mas mantido nome para backward compatibility
    return this._assessDomainComplexity(task);
  }

  /**
   * P0.1: Avaliar complexidade de domínio (NOVO - GENÉRICO)
   */
  static _assessDomainComplexity(task) {
    let score = 0;
    const lower = task.toLowerCase();

    // Domínio Legal (peso 8)
    const legalComplex = ['estratégia', 'estrategia', 'recurso', 'apelação', 'apelacao', 'tese', 'argumento'];
    score += legalComplex.filter(t => lower.includes(t)).length * 25;

    const legalSimple = ['buscar', 'consultar', 'listar', 'publicação', 'publicacao'];
    score += legalSimple.filter(t => lower.includes(t)).length * 10;

    // Domínio de Dados (peso 7)
    const dataTerms = ['análise de dados', 'data analysis', 'analytics', 'visualization', 'dashboard'];
    score += dataTerms.filter(t => lower.includes(t)).length * 20;

    // Domínio de Negócio (peso 6)
    const businessTerms = ['processo de negócio', 'business process', 'workflow', 'automation'];
    score += businessTerms.filter(t => lower.includes(t)).length * 15;

    // Domínio Acadêmico/Pesquisa (peso 7)
    const researchTerms = ['pesquisa', 'research', 'estudo', 'investigação', 'investigation'];
    score += researchTerms.filter(t => lower.includes(t)).length * 18;

    return Math.min(score, 100);
  }

  /**
   * P0.1: Avaliar restrições temporais (GENÉRICO)
   */
  static _assessTimeConstraints(task) {
    const lower = task.toLowerCase();

    // Urgência alta (score 80)
    if (lower.includes('urgente') || lower.includes('imediato') || lower.includes('asap') || lower.includes('agora')) {
      return 80;
    }

    // Deadline específico (score 60)
    if (lower.includes('prazo') || lower.includes('deadline') || lower.includes('até')) {
      return 60;
    }

    // Flexível (score 20)
    if (lower.includes('quando possível') || lower.includes('quando tiver tempo') || lower.includes('eventualmente')) {
      return 20;
    }

    // Normal (score 40)
    return 40;
  }

  /**
   * P0.1: Avaliar interdependência entre tarefas (GENÉRICO)
   */
  static _assessInterdependency(task) {
    const lower = task.toLowerCase();

    // Indicadores de sequência (peso alto)
    const sequenceIndicators = ['e depois', 'em seguida', 'então', 'após', 'depois de', 'before', 'after', 'then'];
    const hasSequence = sequenceIndicators.some(ind => lower.includes(ind));
    if (hasSequence) return 70;

    // Múltiplas ações conectadas (peso médio)
    const steps = task.split(/\be\b|,|;/);
    if (steps.length > 3) return 60;
    if (steps.length > 2) return 40;

    // Tarefa simples (baixa interdependência)
    return 20;
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
 * OrchestrationEngine - Dependency graph, decomposição e execução paralela
 */
class OrchestrationEngine {
  /**
   * P0.3: Decompor task em subtarefas (GENÉRICO)
   */
  static decomposeTask(task) {
    const lower = task.toLowerCase();
    const subtasks = [];

    // Estratégia 1: Detectar "e" conectando ações paralelas
    const parts = task.split(/\s+e\s+/i);
    if (parts.length > 1) {
      // Verificar se são realmente ações independentes
      const actionVerbs = ['criar', 'implementar', 'analisar', 'testar', 'documentar', 'revisar',
                          'create', 'implement', 'analyze', 'test', 'document', 'review'];

      const hasMultipleActions = parts.filter(p =>
        actionVerbs.some(verb => p.toLowerCase().includes(verb))
      ).length > 1;

      if (hasMultipleActions) {
        return parts.map((p, i) => ({
          id: `task-${i}`,
          description: p.trim(),
          parallel: true,
          dependencies: []
        }));
      }
    }

    // Estratégia 2: Detectar sequência temporal
    const sequenceKeywords = ['então', 'depois', 'em seguida', 'after', 'then'];
    const hasSequence = sequenceKeywords.some(kw => lower.includes(kw));

    if (hasSequence) {
      // Dividir por marcadores de sequência
      let remaining = task;
      let taskId = 0;

      for (const keyword of sequenceKeywords) {
        const regex = new RegExp(`\\s*${keyword}\\s*`, 'i');
        const split = remaining.split(regex);

        if (split.length > 1) {
          for (let i = 0; i < split.length; i++) {
            if (split[i].trim()) {
              subtasks.push({
                id: `task-${taskId}`,
                description: split[i].trim(),
                parallel: false,
                dependencies: i > 0 ? [`task-${taskId - 1}`] : [],
                order: taskId
              });
              taskId++;
            }
          }
          break;
        }
      }

      if (subtasks.length > 0) return subtasks;
    }

    // Estratégia 3: Detectar pontos e vírgulas (lista de tarefas)
    const listParts = task.split(/[;,]\s*/);
    if (listParts.length > 2) {
      // Verificar se são tarefas distintas
      const distinctTasks = listParts.filter(p => {
        const words = p.split(/\s+/);
        return words.length > 2; // Evitar fragmentos muito pequenos
      });

      if (distinctTasks.length > 1) {
        return distinctTasks.map((p, i) => ({
          id: `task-${i}`,
          description: p.trim(),
          parallel: true, // Assume paralelo por padrão
          dependencies: []
        }));
      }
    }

    // Estratégia 4: Tarefa complexa baseada em complexidade
    const complexity = DecisionEngine.analyzeComplexity(task, {}, {});
    const avgComplexity = (complexity.technical + complexity.legal + complexity.interdependency) / 3;

    if (avgComplexity > 60) {
      // Decompor em fases padrão de desenvolvimento
      return [
        { id: 'task-0', description: `Planejar: ${task}`, parallel: false, dependencies: [] },
        { id: 'task-1', description: `Implementar: ${task}`, parallel: false, dependencies: ['task-0'] },
        { id: 'task-2', description: `Validar: ${task}`, parallel: false, dependencies: ['task-1'] }
      ];
    }

    // Fallback: Tarefa simples (não decompor)
    return [{
      id: 'task-0',
      description: task,
      parallel: false,
      dependencies: []
    }];
  }

  /**
   * Criar grafo de dependências de tasks
   */
  static buildDependencyGraph(tasks) {
    return new TaskGraph(tasks);
  }

  /**
   * P1.2: Executar tasks em paralelo com métricas de performance
   */
  static async executeParallel(taskGraph, delegationEngine, virtualAgentFactory = null) {
    const results = {};
    const batches = taskGraph.getParallelBatches();
    const startTime = Date.now();

    console.error(`[DEBUG] Executando ${batches.length} batches de tasks`);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const batchStartTime = Date.now();

      console.error(`[DEBUG] Batch ${batchIdx + 1}/${batches.length} com ${batch.length} tasks paralelas`);

      // P1.2: Executar batch em paralelo com virtualAgentFactory
      const promises = batch.map(task =>
        delegationEngine.execute(task.description || task, 3, virtualAgentFactory)
          .then(result => ({
            task,
            result,
            success: true,
            duration: Date.now() - batchStartTime
          }))
          .catch(err => ({
            task,
            error: err.message,
            success: false,
            duration: Date.now() - batchStartTime
          }))
      );

      const batchResults = await Promise.all(promises);
      const batchDuration = Date.now() - batchStartTime;

      // Consolidar resultados
      for (const result of batchResults) {
        results[result.task.id] = result;
      }

      // P1.2: Métricas de batch
      const successCount = batchResults.filter(r => r.success).length;
      console.error(
        `[DEBUG] Batch ${batchIdx + 1} completo: ${successCount}/${batch.length} success, ` +
        `${batchDuration}ms total, ${Math.round(batchDuration / batch.length)}ms avg`
      );
    }

    const totalDuration = Date.now() - startTime;
    const totalTasks = Object.keys(results).length;
    const successTasks = Object.values(results).filter(r => r.success).length;

    console.error(
      `[INFO] Execução paralela completa: ${successTasks}/${totalTasks} tasks success, ` +
      `${totalDuration}ms total (${Math.round(totalDuration / totalTasks)}ms/task avg)`
    );

    return {
      results,
      metrics: {
        totalTasks,
        successTasks,
        failureTasks: totalTasks - successTasks,
        totalDuration,
        avgDurationPerTask: Math.round(totalDuration / totalTasks),
        batches: batches.length
      }
    };
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
   * P0.5: Selecionar agentes com Hybrid Matching Algorithm
   */
  selectAgents(task) {
    const candidates = this._filterCandidates(task);

    if (candidates.length === 0) {
      return { match: false, reason: 'Nenhum agente candidato (gap detectado)' };
    }

    // P0.5: Hybrid Ranking - performance (40%) + capability match (30%) + load (20%) + keyword match (10%)
    const ranked = candidates.map(agentName => {
      const agent = this.availableAgents[agentName];
      const load = this.agentLoadMap.get(agentName) || 0;
      const historicalSuccess = agent.successRate || 0.5;
      const capabilityMatch = this._calculateCapabilityMatch(agent, task);
      const keywordMatch = this._calculateKeywordMatch(agent, task);

      const score =
        historicalSuccess * 0.4 +        // Performance histórica
        capabilityMatch * 0.3 +          // Match de capabilities
        (1 - load / this.maxConcurrentPerAgent) * 0.2 +  // Load balancing
        keywordMatch * 0.1;              // Keywords adicionais

      return { agentName, agent, score, details: { historicalSuccess, capabilityMatch, load, keywordMatch } };
    }).sort((a, b) => b.score - a.score);

    // P0.5: Threshold de 40 pontos - abaixo disso, considera gap
    if (ranked[0].score < 0.4) {
      return {
        match: false,
        reason: `Score insuficiente (${(ranked[0].score * 100).toFixed(0)}% < 40%) - gap detectado`,
        bestCandidate: ranked[0]
      };
    }

    return {
      match: true,
      agents: ranked.slice(0, 3), // Top 3
      topAgent: ranked[0]
    };
  }

  /**
   * P0.5: Filtrar candidatos com threshold mínimo
   */
  _filterCandidates(task) {
    const requiredCaps = extractCapabilities(task);

    return Object.keys(this.availableAgents).filter(agentName => {
      const agent = this.availableAgents[agentName];

      // Match por capabilities OU por keywords (hybrid approach)
      const capMatch = requiredCaps.some(cap =>
        agent.especialidade.toLowerCase().includes(cap.toLowerCase())
      );

      const keywordMatch = this._hasKeywordOverlap(agent.especialidade, task);

      return capMatch || keywordMatch;
    });
  }

  /**
   * P0.5: Calcular match de capabilities (0-1)
   */
  _calculateCapabilityMatch(agent, task) {
    const requiredCaps = extractCapabilities(task);
    const specialtyLower = agent.especialidade.toLowerCase();

    const matchedCaps = requiredCaps.filter(cap =>
      specialtyLower.includes(cap.toLowerCase())
    );

    return matchedCaps.length / Math.max(requiredCaps.length, 1);
  }

  /**
   * P0.5: Calcular match de keywords (0-1)
   */
  _calculateKeywordMatch(agent, task) {
    const taskLower = task.toLowerCase();
    const specialtyLower = agent.especialidade.toLowerCase();

    // Extrair keywords significativas (> 3 chars, excluindo stop words)
    const stopWords = ['the', 'and', 'for', 'with', 'que', 'para', 'com', 'uma', 'um'];
    const keywords = taskLower.split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.includes(w));

    const matches = keywords.filter(kw => specialtyLower.includes(kw));

    return matches.length / Math.max(keywords.length, 1);
  }

  /**
   * P0.5: Verificar se há overlap de keywords (threshold 20%)
   */
  _hasKeywordOverlap(specialty, task) {
    const taskLower = task.toLowerCase();
    const specialtyLower = specialty.toLowerCase();

    const taskWords = taskLower.split(/\s+/).filter(w => w.length > 3);
    const specialtyWords = specialtyLower.split(/\s+/).filter(w => w.length > 3);

    const overlap = taskWords.filter(tw => specialtyWords.includes(tw));

    return overlap.length / Math.max(taskWords.length, 1) >= 0.2;
  }

  /**
   * Executar task com retry exponencial
   * P0.2: Integrado com VirtualAgentFactory para gap detection
   */
  async execute(task, maxRetries = 3, virtualAgentFactory = null) {
    const selection = this.selectAgents(task);

    let agent = selection.match ? selection.topAgent.agentName : null;
    let isVirtualAgent = false;

    // P0.2: GAP DETECTION - Se nenhum agente disponível, criar virtual
    if (!selection.match && virtualAgentFactory) {
      console.error(`[DEBUG] Gap detectado para task: "${task}"`);
      const requiredCaps = extractCapabilities(task);
      const virtualAgent = virtualAgentFactory.createVirtualAgent(task, requiredCaps);

      // Adicionar virtual agent ao availableAgents temporariamente
      this.availableAgents[virtualAgent.name] = {
        especialidade: `[VIRTUAL] ${requiredCaps.join(', ')}`,
        successRate: 0.5,
        virtualId: virtualAgent.id
      };

      agent = virtualAgent.name;
      isVirtualAgent = true;

      console.error(`[DEBUG] Virtual agent criado: ${virtualAgent.name}`);
    } else if (!selection.match) {
      throw new Error(`Nenhum agente disponível para: ${task}`);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Incrementar load
        this.agentLoadMap.set(agent, (this.agentLoadMap.get(agent) || 0) + 1);

        console.error(`[DEBUG] Delegando "${task}" para ${agent} (tentativa ${attempt}/${maxRetries})${isVirtualAgent ? ' [VIRTUAL]' : ''}`);

        const result = await this._delegateToAgent(task, agent);

        // Decrementar load
        this.agentLoadMap.set(agent, Math.max(0, (this.agentLoadMap.get(agent) || 1) - 1));

        // Atualizar success rate
        this._updateSuccessRate(agent, true);

        // P0.2: Registrar invocação em virtual agent
        if (isVirtualAgent && virtualAgentFactory) {
          const virtualId = this.availableAgents[agent].virtualId;
          virtualAgentFactory.recordInvocation(virtualId, true);
          await virtualAgentFactory.saveState();
        }

        return result;
      } catch (error) {
        console.error(`[ERROR] Tentativa ${attempt} falhou: ${error.message}`);

        // Decrementar load
        this.agentLoadMap.set(agent, Math.max(0, (this.agentLoadMap.get(agent) || 1) - 1));

        if (attempt === maxRetries) {
          // Atualizar failure rate
          this._updateSuccessRate(agent, false);

          // P0.2: Registrar falha em virtual agent
          if (isVirtualAgent && virtualAgentFactory) {
            const virtualId = this.availableAgents[agent].virtualId;
            virtualAgentFactory.recordInvocation(virtualId, false);
            await virtualAgentFactory.saveState();
          }

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
