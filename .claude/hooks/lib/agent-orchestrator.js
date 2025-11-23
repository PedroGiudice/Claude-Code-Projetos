/**
 * lib/agent-orchestrator.js - Orquestração de agentes (v3.0 - Whitelist Invertida)
 *
 * FILOSOFIA: "Guilty Until Proven Innocent"
 * - DEFAULT = MEDIUM (sempre orquestra)
 * - LOW = Apenas tarefas ABSOLUTAMENTE triviais (whitelist restrita)
 * - HIGH = Tarefas complexas conhecidas
 *
 * Justificativa: Usuário com pouco conhecimento técnico precisa de safety net
 * robusto para evitar "loose ends" (pontas soltas).
 */

const { getAgentToolsSummary } = require('./agent-mapping-loader');

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
  // DECOMPOSIÇÃO BASEADA EM COMPLEXIDADE
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
      agente: 'desenvolvimento'
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
    // Tarefas médias: implementação + code review
    subtasks.push({
      name: 'Implementação',
      agente: 'desenvolvimento'
    });
    subtasks.push({
      name: 'Code Review',
      agente: 'qualidade-codigo'
    });
  }

  return {
    complexity,
    subtasks,
    plan: formatOrchestrationPlan(subtasks)
  };
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
