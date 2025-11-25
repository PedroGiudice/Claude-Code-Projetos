/**
 * lib/agent-orchestrator.js - Orquestração de agentes (v3.2 - Context-Aware)
 *
 * MUDANÇA v3.2: Detecção CONTEXT-AWARE usando:
 * - Keywords no prompt (v3.1)
 * - Arquivos modificados (git status)
 * - Diretório atual de trabalho
 *
 * MUDANÇA v3.1: Detecta keywords para sugerir agentes ESPECÍFICOS
 * - Refatoração → code-refactor-master
 * - Planejamento → planejamento-legal ou plan-reviewer
 * - Documentação → documentation-architect
 * - Debugging → auto-error-resolver
 * - etc.
 *
 * FILOSOFIA: "Right Agent for the Right Task"
 * - Combina prompt keywords + file patterns + project context
 * - Fallback para desenvolvimento apenas quando não há match específico
 */

const { getAgentToolsSummary } = require('./agent-mapping-loader');

// ============================================================================
// MAPEAMENTO: Keywords → Agentes Específicos
// ============================================================================
const AGENT_KEYWORDS = {
  'code-refactor-master': [
    'refactor', 'refatorar', 'refatoração', 'reorganizar', 'reorganize',
    'reestruturar', 'restructure', 'quebrar em', 'break down', 'split',
    'extrair componente', 'extract component', 'modularizar', 'modularize'
  ],
  'planejamento-legal': [
    'planejar', 'plan', 'arquitetura', 'architecture', 'design',
    'projetar', 'estruturar', 'roadmap'
  ],
  'plan-reviewer': [
    'revisar plano', 'review plan', 'validar plano', 'validate plan',
    'aprovar plano', 'approve plan'
  ],
  'documentation-architect': [
    'documentar', 'document', 'documentação', 'documentation',
    'readme', 'wiki', 'api docs'
  ],
  'qualidade-codigo': [
    'code review', 'revisão de código', 'auditoria', 'audit',
    'qualidade', 'quality', 'security review', 'vulnerabilidade'
  ],
  'auto-error-resolver': [
    'erro', 'error', 'bug', 'fix', 'corrigir', 'resolver',
    'typescript error', 'compilation error'
  ],
  'web-research-specialist': [
    'pesquisar', 'research', 'buscar informação', 'search for',
    'investigar', 'investigate'
  ],
  // frontend-error-fixer: Removido da auto-detecção (será explícito)
  'refactor-planner': [
    'planejar refatoração', 'plan refactor', 'refactor plan',
    'estratégia de refatoração', 'refactoring strategy'
  ]
};

// ============================================================================
// v3.2: FILE PATTERN → AGENT MAPPING
// ============================================================================
const FILE_PATTERN_AGENTS = {
  // Test files → qualidade-codigo
  'test': {
    patterns: [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /tests?\//, /_test\.py$/, /test_.*\.py$/],
    agents: ['qualidade-codigo']
  },
  // Documentation → documentation-architect
  'docs': {
    patterns: [/\.md$/, /docs\//, /README/, /CHANGELOG/, /\.rst$/],
    agents: ['documentation-architect']
  },
  // Hooks (JS/Node) → desenvolvimento (hooks são código interno)
  'hooks': {
    patterns: [/\.claude\/hooks\//, /hooks\/.*\.[jt]s$/],
    agents: ['desenvolvimento']
  },
  // Frontend (React/Vue/Angular) → NÃO auto-detectar (será explícito)
  // Removido: tarefas frontend serão explícitas no prompt
  // Python backend → desenvolvimento
  'python': {
    patterns: [/\.py$/, /agentes\/.*\/src\//, /engines?\//, /steps?\//, /core\//],
    agents: ['desenvolvimento']
  },
  // Config files → desenvolvimento
  'config': {
    patterns: [/\.json$/, /\.ya?ml$/, /\.toml$/, /\.ini$/, /\.env/],
    agents: ['desenvolvimento']
  },
  // Styles → desenvolvimento (CSS/SCSS work)
  'styles': {
    patterns: [/\.s?css$/, /\.less$/, /styles?\//],
    agents: ['desenvolvimento']
  }
};

// ============================================================================
// v3.2: PROJECT DIRECTORY → AGENT MAPPING
// ============================================================================
const PROJECT_AGENTS = {
  // Legal text extractor: Python backend, OCR, PDF processing
  'agentes/legal-text-extractor': {
    agents: ['desenvolvimento', 'qualidade-codigo'],
    context: 'Python backend, OCR, PDF processing'
  },
  // OAB watcher: Monitoring, scraping
  'agentes/oab-watcher': {
    agents: ['desenvolvimento', 'qualidade-codigo'],
    context: 'Monitoring, web scraping'
  },
  // Skills: Skill development
  'skills/': {
    agents: ['desenvolvimento', 'documentation-architect'],
    context: 'Claude Code skills development'
  },
  // Hooks: Internal tooling
  '.claude/hooks': {
    agents: ['desenvolvimento'],
    context: 'Claude Code hooks (JS/Node)'
  },
  // Shared utilities
  'shared/': {
    agents: ['desenvolvimento', 'qualidade-codigo'],
    context: 'Shared utilities and models'
  }
};

/**
 * Detecta qual agente específico deve ser sugerido baseado no prompt (keywords)
 * @param {string} prompt - User prompt
 * @returns {string|null} Nome do agente ou null se não encontrar match
 */
function detectSpecificAgent(prompt) {
  const promptLower = prompt.toLowerCase();

  for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
    for (const keyword of keywords) {
      // Word boundary para keywords curtas, substring para longas
      if (keyword.length <= 4) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(prompt)) {
          return agent;
        }
      } else if (promptLower.includes(keyword.toLowerCase())) {
        return agent;
      }
    }
  }

  return null;
}

/**
 * v3.2: Detecta agentes baseado nos arquivos modificados (git status)
 * @param {string[]} modifiedFiles - Lista de arquivos modificados
 * @returns {string[]} Array de agentes sugeridos (sem duplicatas)
 */
function detectAgentsByFiles(modifiedFiles) {
  if (!modifiedFiles || modifiedFiles.length === 0) {
    return [];
  }

  const detectedAgents = new Set();

  for (const file of modifiedFiles) {
    for (const category of Object.values(FILE_PATTERN_AGENTS)) {
      for (const pattern of category.patterns) {
        if (pattern.test(file)) {
          category.agents.forEach(agent => detectedAgents.add(agent));
          break; // Uma vez que encontrou match nesta categoria, passa para próxima
        }
      }
    }
  }

  return [...detectedAgents];
}

/**
 * v3.2: Detecta agentes baseado no diretório de trabalho atual
 * @param {string} projectDir - Diretório do projeto
 * @param {string[]} modifiedFiles - Lista de arquivos modificados
 * @returns {{agents: string[], context: string|null}} Agentes e contexto do projeto
 */
function detectAgentsByProjectDir(projectDir, modifiedFiles) {
  // Primeiro, tentar detectar pelo projectDir absoluto
  for (const [pathPattern, config] of Object.entries(PROJECT_AGENTS)) {
    if (projectDir.includes(pathPattern)) {
      return {
        agents: config.agents,
        context: config.context
      };
    }
  }

  // Segundo, tentar detectar pelos arquivos modificados (qual subprojeto)
  if (modifiedFiles && modifiedFiles.length > 0) {
    for (const [pathPattern, config] of Object.entries(PROJECT_AGENTS)) {
      const hasFileInProject = modifiedFiles.some(file => file.includes(pathPattern));
      if (hasFileInProject) {
        return {
          agents: config.agents,
          context: config.context
        };
      }
    }
  }

  return { agents: [], context: null };
}

/**
 * v3.2: Combina detecções de múltiplas fontes em lista única de agentes
 * @param {string|null} keywordAgent - Agente detectado por keyword
 * @param {string[]} fileAgents - Agentes detectados por arquivos
 * @param {string[]} projectAgents - Agentes detectados por projeto
 * @returns {string[]} Lista combinada de agentes (ordenada por prioridade)
 */
function combineAgentDetections(keywordAgent, fileAgents, projectAgents) {
  // Prioridade: keyword > files > project
  const combined = new Set();

  // 1. Keyword match tem prioridade máxima
  if (keywordAgent) {
    combined.add(keywordAgent);
  }

  // 2. File-based detection (contextual)
  fileAgents.forEach(agent => combined.add(agent));

  // 3. Project-based detection (fallback)
  projectAgents.forEach(agent => combined.add(agent));

  // Agentes de IMPLEMENTAÇÃO (substitutos de desenvolvimento)
  const implementationAgents = ['code-refactor-master', 'refactor-planner', 'auto-error-resolver'];

  // Remover 'desenvolvimento' APENAS se houver agente de implementação específico
  const result = [...combined];
  const hasImplementationAgent = result.some(a => implementationAgents.includes(a));

  if (hasImplementationAgent && result.includes('desenvolvimento')) {
    return result.filter(a => a !== 'desenvolvimento');
  }

  return result;
}

async function orchestrateAgents(context, agentesConfig) {
  const prompt = context.prompt.toLowerCase();

  // ============================================================================
  // WHITELIST DE TAREFAS TRIVIAIS (Não requerem orquestração)
  // ============================================================================
  const TRIVIAL_TASKS = [
    // Git operations simples (consulta)
    'git status', 'git log', 'git diff', 'git show', 'git branch',

    // File operations básicas (copiar/mover/deletar SEM lógica)
    'copiar arquivo', 'copy file', 'colar', 'paste',
    'mover arquivo', 'move file', 'remover arquivo', 'delete file',
    'renomear arquivo', 'rename file',

    // Leitura/visualização pura
    'mostrar', 'show', 'listar', 'list', 'ls', 'ver', 'view',
    'cat ', 'ler arquivo', 'read file', 'abrir', 'open',

    // Informação/consulta (não-ação)
    'onde está', 'where is', 'qual é o', 'what is the',
    'como funciona', 'how does', 'o que faz', 'what does',
    'explicar como', 'explain how',

    // Typos (qualquer contexto)
    'typo', 'erro de digitação', 'spelling error',
    'fix typo', 'corrigir typo', 'corrigir erro de digitação',

    // Comandos de ajuda
    'como usar', 'how to use', 'help', 'ajuda'
  ];

  // ============================================================================
  // KEYWORDS DE ALTA COMPLEXIDADE (Sempre HIGH)
  // ============================================================================
  const HIGH_COMPLEXITY = [
    // Arquitetura & Sistema
    'sistema', 'system', 'arquitetura', 'architecture',
    'design system', 'microservice', 'microsserviço',

    // Múltiplos componentes/arquivos
    'múltiplos arquivos', 'multiple files', 'vários arquivos', 'several files',
    'múltiplos componentes', 'multiple components', 'vários componentes',

    // Novos módulos/serviços
    'novo módulo', 'new module', 'novo serviço', 'new service',
    'criar módulo', 'create module', 'criar serviço', 'create service',

    // Database & Schema
    'migration', 'migração', 'schema', 'database refactor',
    'alter table', 'create table', 'drop table',

    // Breaking changes
    'breaking change', 'mudança drástica', 'refatoração completa',
    'complete refactor', 'reescrever', 'rewrite',

    // Features grandes
    'nova feature grande', 'major feature', 'epic',
    'implementar sistema de', 'implement system for',

    // Integração de múltiplos sistemas
    'integrar com', 'integrate with', 'conectar com', 'connect to',
    'sincronizar com', 'sync with'
  ];

  // ============================================================================
  // DETECÇÃO DE COMPLEXIDADE
  // ============================================================================

  // 1. Check TRIVIAL first (whitelist restrita)
  const isTrivial = TRIVIAL_TASKS.some(task => prompt.includes(task));
  if (isTrivial) {
    return null; // Não requer orquestração
  }

  // 2. Check HIGH complexity (patterns conhecidos)
  const isHigh = HIGH_COMPLEXITY.some(kw => prompt.includes(kw));

  // 3. Padrões regex para HIGH (múltiplos arquivos, etc)
  const multipleFilesPattern = /(\d+|vários|múltiplos|several|multiple).*(arquivo|file|componente|component)/i;
  const newModulePattern = /novo.*(módulo|module|serviço|service)/i;
  const isHighByPattern = multipleFilesPattern.test(prompt) || newModulePattern.test(prompt);

  let complexity = 'MEDIUM'; // DEFAULT: Tudo que não é trivial → orquestra

  if (isHigh || isHighByPattern) {
    complexity = 'HIGH';
  }

  // ============================================================================
  // v3.2: DETECÇÃO CONTEXT-AWARE (keywords + files + project)
  // ============================================================================

  // 1. Keyword-based detection (v3.1 - original)
  const keywordAgent = detectSpecificAgent(context.prompt);

  // 2. File-based detection (v3.2 - NEW)
  const modifiedFiles = context.git?.modifiedFiles || [];
  const fileAgents = detectAgentsByFiles(modifiedFiles);

  // 3. Project-based detection (v3.2 - NEW)
  const projectDir = context.projectDir || '';
  const { agents: projectAgents, context: projectContext } = detectAgentsByProjectDir(projectDir, modifiedFiles);

  // 4. Combine all detections
  const combinedAgents = combineAgentDetections(keywordAgent, fileAgents, projectAgents);

  // Para compatibilidade: primeiro agente é o "específico"
  const specificAgent = combinedAgents.length > 0 ? combinedAgents[0] : null;

  // ============================================================================
  // DECOMPOSIÇÃO BASEADA EM COMPLEXIDADE + AGENTES DETECTADOS
  // ============================================================================
  const subtasks = [];

  if (complexity === 'HIGH') {
    // Tarefas complexas: planejamento + implementação + qualidade + docs
    subtasks.push({
      name: 'Planejamento & Arquitetura',
      agente: 'planejamento-legal'
    });
    subtasks.push({
      name: 'Implementação Core',
      agente: specificAgent || 'desenvolvimento'  // Usa agente específico se detectado
    });
    subtasks.push({
      name: 'Testes & Quality Assurance',
      agente: 'qualidade-codigo'
    });
    subtasks.push({
      name: 'Documentação Técnica',
      agente: 'documentacao'
    });
  } else if (complexity === 'MEDIUM') {
    // v3.2: Usa agentes combinados (context-aware)
    if (combinedAgents.length > 0) {
      // Adiciona tarefa para cada agente detectado
      for (const agent of combinedAgents) {
        subtasks.push({
          name: getAgentTaskName(agent),
          agente: agent
        });
      }
      // Adiciona code review se não estiver presente
      if (!combinedAgents.includes('qualidade-codigo')) {
        subtasks.push({
          name: 'Code Review',
          agente: 'qualidade-codigo'
        });
      }
    } else {
      // Fallback: comportamento original (sem contexto detectado)
      subtasks.push({
        name: 'Implementação',
        agente: 'desenvolvimento'
      });
      subtasks.push({
        name: 'Code Review',
        agente: 'qualidade-codigo'
      });
    }
  }

  return {
    complexity,
    specificAgent,  // Manter para compatibilidade
    combinedAgents, // v3.2: Lista completa de agentes detectados
    detectionSources: {  // v3.2: Debug info
      keyword: keywordAgent,
      files: fileAgents,
      project: projectAgents,
      projectContext
    },
    subtasks,
    plan: formatOrchestrationPlan(subtasks)
  };
}

/**
 * Retorna nome da tarefa baseado no agente
 */
function getAgentTaskName(agent) {
  const taskNames = {
    'code-refactor-master': 'Refatoração de Código',
    'refactor-planner': 'Planejamento de Refatoração',
    'planejamento-legal': 'Planejamento & Arquitetura',
    'plan-reviewer': 'Revisão de Plano',
    'documentation-architect': 'Documentação',
    'qualidade-codigo': 'Auditoria & Code Review',
    'auto-error-resolver': 'Resolução de Erros',
    'web-research-specialist': 'Pesquisa',
    'desenvolvimento': 'Implementação'
  };
  return taskNames[agent] || 'Execução';
}

function formatOrchestrationPlan(subtasks) {
  return subtasks
    .map((st, i) => {
      const toolsSummary = getAgentToolsSummary(st.agente);
      return `${i + 1}. [${st.agente}] ${st.name}\n   Tools: ${toolsSummary}`;
    })
    .join('\n');
}

module.exports = { orchestrateAgents };
