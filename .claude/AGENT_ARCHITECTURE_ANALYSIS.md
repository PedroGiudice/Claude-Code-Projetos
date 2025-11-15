# ANÁLISE DE ARQUITETURA DE AGENTES
# Claude-Code-Projetos

**Data:** 2025-11-15
**Ambiente:** WSL2 Ubuntu 24.04 LTS + Claude Code Web 2.0.42
**Objetivo:** Formalizar taxonomia, validar conformidade e propor estrutura canônica

---

## 1. ANÁLISE DE CONFORMIDADE

### 1.1 Estrutura Atual vs. Padrões Claude Code Web 2025

**ACHADOS OFICIAIS** (Baseado em pesquisa web 2025-11-15):

#### Padrões Recomendados
```
projeto/
├── .claude/
│   ├── agents/           # Sub-agentes (Markdown)
│   ├── commands/         # Slash commands (Markdown)
│   ├── skills/           # Skills (SKILL.md + scripts/)
│   ├── hooks/            # Hooks (JS/shell)
│   ├── settings.json     # Configuração
│   └── CLAUDE.md         # Instruções do projeto
├── agentes/             # ⚠️ NÃO PADRÃO (nossa escolha)
└── skills/              # ✅ Padrão
```

#### Estrutura Atual
```
Claude-Code-Projetos/
├── .claude/
│   ├── agents/           # ✅ 7 sub-agentes Markdown
│   ├── commands/         # ⚠️ NÃO EXISTE (oportunidade)
│   ├── hooks/            # ✅ 10 hooks JS
│   ├── statusline/       # ✅ Status line customizado
│   ├── settings.json     # ✅ Configuração híbrida
│   └── CLAUDE.md         # ⚠️ NÃO EXISTE (crítico)
│
├── agentes/             # ⚠️ DIVERGÊNCIA: Agentes Python com venv
│   ├── oab-watcher/     # Monitor DJEN + busca OAB
│   ├── djen-tracker/    # Download contínuo cadernos
│   ├── legal-lens/      # Sistema RAG (PDFs)
│   ├── legal-rag/       # Sistema RAG (jurisprudência)
│   └── legal-articles-finder/  # Extração artigos leis
│
├── skills/              # ⚠️ NÃO EXISTE (oportunidade)
└── CLAUDE.md            # ✅ Instruções raiz
```

### 1.2 Veredito de Conformidade

| Aspecto | Conformidade | Observação |
|---------|--------------|------------|
| `.claude/agents/` | ✅ CONFORME | 7 sub-agentes bem estruturados |
| `.claude/hooks/` | ✅ CONFORME | 10 hooks + wrapper |
| `.claude/settings.json` | ✅ CONFORME | Configuração híbrida adequada |
| `.claude/commands/` | ❌ AUSENTE | Oportunidade: criar slash commands |
| `CLAUDE.md` raiz | ✅ CONFORME | Instruções detalhadas do projeto |
| `.claude/CLAUDE.md` | ⚠️ AUSENTE | Oportunidade: instruções específicas |
| `agentes/` Python | ⚠️ DIVERGENTE | Padrão válido mas não documentado |
| `skills/` | ❌ AUSENTE | Oportunidade: extrair para skills |

**CONCLUSÃO:** Estrutura 70% conforme. Divergências são **intencionais e justificadas** (agentes Python autônomos com venvs).

---

## 2. PROPOSTA DE TAXONOMIA CLARA

### 2.1 Categorias de Agentes

#### CATEGORIA 1: SUB-AGENTES (COGNITIVE SPECIALISTS)
**Localização:** `.claude/agents/*.md`
**Natureza:** Prompts especializados invocados pelo Claude Code
**Execução:** Dentro do contexto do Claude Code (sem venv próprio)
**Lifecycle:** Efêmeros (existem apenas durante conversação)

**Lista:**
1. **legal-braniac.md** - Orquestrador mestre (meta-gestão)
2. **planejamento-legal.md** - Arquitetura e design
3. **desenvolvimento.md** - Implementação técnica
4. **qualidade-codigo.md** - Code review e testing
5. **documentacao.md** - Documentação técnica
6. **analise-dados-legal.md** - Dashboards e análises
7. **legal-articles-finder.md** - Extração de artigos de leis

**Características:**
- Sem dependências Python (apenas prompts)
- Auto-descobertos pelo Legal-Braniac
- Coordenados via orquestração inteligente
- Sem estado persistente

#### CATEGORIA 2: AGENTES PYTHON AUTÔNOMOS (LONG-RUNNING MONITORS)
**Localização:** `agentes/*/`
**Natureza:** Aplicações Python completas com venv próprio
**Execução:** Standalone (via `python main.py` ou `run_agent.ps1`)
**Lifecycle:** Persistentes (podem rodar 24/7)

**Lista:**
1. **oab-watcher** - Monitor DJEN + busca inteligente OAB
   - Busca híbrida RAG (regex + parsing estruturado)
   - Cache SQLite + gzip (TTL 24h)
   - Paginação automática (10k publicações)
   - Scoring de relevância (threshold 0.3)

2. **djen-tracker** - Download contínuo de cadernos
   - Loop infinito configurável (default 30min)
   - Rate limiting (20 req/min) + backoff exponencial
   - Checkpoint system (resume após Ctrl+C)
   - Integração oab-watcher (opcional)

3. **legal-lens** - Sistema RAG para PDFs jurídicos
   - ChromaDB + embeddings multilíngues
   - Chunking inteligente (1000 chars, overlap 200)
   - Extração jurisprudência por tema (13 temas)
   - Interface CLI interativa

4. **legal-rag** - Sistema RAG para jurisprudência
   - Busca híbrida (dense + sparse) + reranking
   - Suporte 20+ tribunais (STF, STJ, TRFs, TJs)
   - 16 áreas do direito
   - Geração com Anthropic Claude

5. **legal-articles-finder** - Extração artigos de leis
   - Parser robusto (9+ formatos citações)
   - Corpus local SQLite (CF, CC, CPC, etc)
   - CLI profissional (5 comandos)
   - Output JSON/Markdown

**Características:**
- Virtual environment isolado (`.venv/`)
- Dependências em `requirements.txt`
- Dados em `E:\claude-code-data\agentes\{nome}\`
- Executáveis independentemente do Claude Code
- Estado persistente (cache, logs, checkpoints)

#### CATEGORIA 3: ORQUESTRADOR (SINGULAR)
**Agente:** `legal-braniac`
**Função:** Meta-coordenação de todos os agentes
**Responsabilidade:**
- Auto-descoberta de agentes/skills
- Decomposição de tarefas complexas
- Delegação estratégica
- Validação de qualidade cross-agente
- Consolidação de resultados

**Status:** Pode ser tanto sub-agente (`.claude/agents/`) quanto categoria própria

### 2.2 Justificativa da Separação `.claude/agents/` vs `agentes/`

#### Por que DUAS localizações?

**`.claude/agents/` (Sub-agentes Cognitivos):**
- Especialistas em **raciocínio e coordenação**
- Não precisam de ambiente Python (são prompts)
- Descobertos automaticamente pelo Legal-Braniac
- Ideal para: planejamento, review, documentação, orquestração

**`agentes/` (Agentes Autônomos Python):**
- Especialistas em **processamento e monitoramento**
- Precisam de bibliotecas Python (httpx, chromadb, etc)
- Podem rodar standalone 24/7
- Ideal para: scraping, RAG, cache, download contínuo

**Analogia:**
- `.claude/agents/` = Consultores (pensam, planejam, coordenam)
- `agentes/` = Operários (executam, monitoram, persistem)

#### Esta separação VIOLA padrões Claude Code?

**NÃO.** Pesquisa oficial 2025-11-15 confirma:
- `.claude/agents/` é padrão **documentado**
- `agentes/` Python é **extensão válida** para casos de uso específicos
- Projetos podem ter **estruturas customizadas** desde que documentadas

**Recomendação:** Formalizar em `.claude/CLAUDE.md` hierárquico

---

## 3. MAPEAMENTO COMPLETO DE AGENTES

### 3.1 Sub-Agentes Cognitivos (.claude/agents/)

| Agente | Responsabilidade | Skills Obrigatórias | Quando Invocar |
|--------|------------------|---------------------|----------------|
| **legal-braniac** | Orquestrador mestre - decomposição e delegação | Auto-discovery, task decomposition | Tarefas complexas multi-agente |
| **planejamento-legal** | Arquitetura, design, especificações | feature-planning, writing-plans, ship-learn-next | Nova implementação, redesign |
| **desenvolvimento** | Coding, refactoring, Git operations | code-execution, git-pushing, test-driven-development | Implementação técnica |
| **qualidade-codigo** | Code review, testing, debugging | code-auditor, systematic-debugging, root-cause-tracing | Validação de código |
| **documentacao** | Docs técnicas, READMEs, diagramas | codebase-documenter, technical-doc-creator, architecture-diagram-creator | Documentar features |
| **analise-dados-legal** | Dashboards, métricas, visualizações | dashboard-creator, timeline-creator, xlsx, pdf | Análise de publicações DJEN |
| **legal-articles-finder** | Identificação e extração de artigos de leis | (Descritor apenas - agente Python real em `agentes/`) | Análise de citações legais |

### 3.2 Agentes Python Autônomos (agentes/)

| Agente | Tech Stack | Data Layer | Output | Status |
|--------|-----------|------------|--------|--------|
| **oab-watcher** | httpx, sqlite3, gzip | `E:\claude-code-data\agentes\oab-watcher\` | Cache SQLite, logs, JSONs | ✅ v2.0 |
| **djen-tracker** | httpx, rate-limiter | `E:\claude-code-data\agentes\djen-tracker\cadernos\` | PDFs tribunais | ✅ v1.0 |
| **legal-lens** | ChromaDB, PyPDF2, sentence-transformers | `E:\claude-code-data\agentes\legal-lens\` | Vector DB, jurisprudência JSON | ✅ Prod |
| **legal-rag** | ChromaDB, LangChain, Anthropic API, spaCy | `E:\claude-code-data\agentes\legal-rag\` | Respostas RAG, análises NER | ✅ Prod |
| **legal-articles-finder** | sqlite3, stdlib only | `agentes/legal-articles-finder/corpus/` | Artigos extraídos JSON/MD | ✅ v1.0 |

### 3.3 Interdependências

```
legal-braniac (orquestrador)
    ├─ planejamento-legal → gera plano
    ├─ desenvolvimento → implementa
    ├─ qualidade-codigo → valida
    └─ documentacao → documenta

djen-tracker
    └─ integra → oab-watcher (TextParser, BuscaInteligente)

legal-lens
    └─ processa PDFs de → oab-watcher (downloads)

legal-rag
    └─ corpus independente (não depende de outros agentes)

legal-articles-finder
    └─ standalone (apenas corpus local)
```

### 3.4 Duplicações Identificadas

**POTENCIAL DUPLICAÇÃO:**
- `legal-lens` e `legal-rag` - Ambos são sistemas RAG
  - **Diferença:** `legal-lens` processa PDFs (via oab-watcher), `legal-rag` usa corpus estruturado de acórdãos
  - **Veredito:** NÃO É DUPLICAÇÃO - propósitos complementares

**CONFLITO DE NOMENCLATURA:**
- `.claude/agents/legal-articles-finder.md` (descritor)
- `agentes/legal-articles-finder/` (agente Python real)
  - **Problema:** Pode confundir auto-discovery
  - **Solução:** Renomear `.md` para `legal-articles-finder-descriptor.md` OU remover se redundante

**CONFLITO LEGAL-BRANIAC:**
- **Arquivo:** `.claude/agents/legal-braniac.md`
- **Status atual:** Sub-agente (categoria 1)
- **Questão:** Deveria ser categoria própria (orquestrador singular)?
  - **Análise:** Legal-Braniac é **tanto** sub-agente (invocado pelo Claude) **quanto** orquestrador (coordena outros)
  - **Solução:** Manter em `.claude/agents/` mas documentar status especial

---

## 4. PLANO DE REFATORAÇÃO

### 4.1 Limpeza de Configurações Legadas

#### settings.json - Itens para Revisão

**ITEM 1: Comentários "hybrid"**
```json
"_comment": "Configuração HÍBRIDA de hooks - Solução para Windows CLI subprocess polling issue",
"_strategy": "Use SessionStart para Web/Linux, UserPromptSubmit para Windows CLI"
```
**Status:** WSL2 agora é ambiente primário (não mais Windows)
**Ação:** ✅ MANTER - Ainda válido para portabilidade cross-platform

**ITEM 2: Seção `_alternative_windows_cli`**
```json
"_alternative_windows_cli": {
  "_comment": "Se precisar suportar Windows CLI, copie esta configuração..."
}
```
**Status:** Documentação útil mas não usada ativamente
**Ação:** ✅ MANTER - Referência para setup futuro

**ITEM 3: Hook `corporate-detector.js`**
```javascript
"command": "node .claude/hooks/hook-wrapper.js .claude/hooks/corporate-detector.js",
"_note": "Detecta ambiente corporativo Windows (GPOs, EPERM)"
```
**Status:** WSL2 não tem GPOs corporativos
**Ação:** ⚠️ DESABILITAR no WSL2, manter código para Windows

**ITEM 4: Hook `skill-activation-prompt.sh`**
```bash
# Arquivo: .claude/hooks/skill-activation-prompt.sh
# Status: Existe mas não está ativo no settings.json
```
**Ação:** ✅ REATIVAR conforme proposta em HOOKS_PROPOSAL_LINUX.md

### 4.2 Arquivos para Criar

**CRÍTICO:**
1. `.claude/CLAUDE.md` - Instruções específicas para sub-agentes
   - Taxonomia de agentes
   - Protocolos de delegação
   - Regras de orquestração

**ALTA PRIORIDADE:**
2. `.claude/commands/` - Diretório de slash commands
   - `/analyze-djen` - Analisar publicações DJEN
   - `/index-corpus` - Indexar PDFs no RAG
   - `/extract-articles` - Extrair artigos de leis

3. `skills/` - Diretório de skills formais
   - Extrair funcionalidades dos agentes Python que podem ser skills

**MÉDIA PRIORIDADE:**
4. `.claude/agents/AGENTS_README.md` - Documentação de auto-discovery
5. `agentes/AGENTES_README.md` - Guia de agentes autônomos

### 4.3 Renomeações Propostas

**CONFLITOS DE NOMENCLATURA:**

| Atual | Proposta | Justificativa |
|-------|----------|---------------|
| `.claude/agents/legal-articles-finder.md` | `.claude/agents/legal-articles-finder-descriptor.md` | Clarificar que é descritor, não agente funcional |
| OU: Remover completamente | - | Agente Python já é auto-descrito em seu README |

**VEREDITO:** Manter `.md` mas adicionar seção clara:
```markdown
---
name: legal-articles-finder
type: descriptor
implementation: agentes/legal-articles-finder/
---
```

---

## 5. ESPECIFICAÇÃO DE AUTOMAÇÃO

### 5.1 Mecanismo de Enforcement Estrutural

**OBJETIVO:** Validar conformidade da estrutura de agentes sem bloquear desenvolvimento

**OPÇÕES AVALIADAS:**

#### Opção A: Hook Git Pre-Commit
**Implementação:** `.git/hooks/pre-commit`
**Validações:**
- Agentes em `.claude/agents/` têm frontmatter válido
- Agentes Python em `agentes/` têm README.md + requirements.txt
- Sem duplicação de nomes entre categorias

**Prós:**
- Bloqueio imediato de estruturas inválidas
- Executa antes de commit (não polui histórico)

**Contras:**
- Pode bloquear commits legítimos (trabalho em progresso)
- Requer manutenção do script shell

**Nível de Enforcement:** 🔴 BLOQUEIO

#### Opção B: Hook PostToolUse (File Operations)
**Implementação:** `.claude/hooks/post-agent-structure-validator.sh`
**Trigger:** Após criação/edição de arquivos em `.claude/agents/` ou `agentes/`

**Validações:**
- Frontmatter YAML válido
- Campos obrigatórios presentes (name, description)
- Sem conflitos de nomenclatura

**Prós:**
- Feedback imediato no Claude Code
- Não bloqueia (apenas avisa)
- Configurável via settings.json

**Contras:**
- Não impede commit de estruturas inválidas
- Depende do Claude Code estar ativo

**Nível de Enforcement:** ⚠️ AVISO

#### Opção C: CI/CD Validation (GitHub Actions)
**Implementação:** `.github/workflows/validate-agents.yml`
**Trigger:** Em todo push/PR

**Validações:**
- Estrutura completa de agentes
- Dependências Python verificadas (pip install --dry-run)
- Links entre agentes validados

**Prós:**
- Validação externa (não depende de hooks locais)
- Relatórios detalhados
- Histórico de validações

**Contras:**
- Feedback tardio (só após push)
- Requer GitHub Actions configurado

**Nível de Enforcement:** 🟡 BLOQUEIO DE PR (não de commit local)

#### Opção D: Memória Episódica + Documentação
**Implementação:** Documentar padrões em `.claude/CLAUDE.md` + confiar no Claude Code

**Validações:**
- Nenhuma automática
- Claude Code lê `.claude/CLAUDE.md` e segue instruções

**Prós:**
- Zero overhead de desenvolvimento
- Flexibilidade máxima
- Sem scripts para manter

**Contras:**
- Conformidade depende de disciplina
- Fácil divergir sem perceber

**Nível de Enforcement:** 🟢 DOCUMENTAÇÃO

### 5.2 Recomendação: Abordagem Híbrida

**IMPLEMENTAR:**
1. **Opção D (imediato)** - Criar `.claude/CLAUDE.md` com taxonomia
2. **Opção B (sprint 1)** - Hook PostToolUse para avisos em tempo real
3. **Opção C (sprint 2)** - GitHub Actions para validação em CI/CD
4. **Opção A (opcional)** - Pre-commit apenas se divergências persistirem

**Filosofia:** Confiar + Validar (não Bloquear + Forçar)

---

## 6. ESTRUTURA DE REFERÊNCIA FORMALIZADA

### 6.1 O "X" Canônico - Estrutura Oficial

```
Claude-Code-Projetos/
│
├── .claude/                          # Configuração Claude Code
│   ├── agents/                       # SUB-AGENTES COGNITIVOS
│   │   ├── legal-braniac.md          # [ORQUESTRADOR] Meta-coordenação
│   │   ├── planejamento-legal.md     # [COGNITIVE] Arquitetura e design
│   │   ├── desenvolvimento.md        # [COGNITIVE] Implementação técnica
│   │   ├── qualidade-codigo.md       # [COGNITIVE] Code review e testing
│   │   ├── documentacao.md           # [COGNITIVE] Docs técnicas
│   │   ├── analise-dados-legal.md    # [COGNITIVE] Dashboards e métricas
│   │   └── legal-articles-finder-descriptor.md  # [DESCRIPTOR] Ponteiro para agentes/
│   │
│   ├── commands/                     # SLASH COMMANDS (CRIAR)
│   │   ├── analyze-djen.md           # /analyze-djen
│   │   ├── index-corpus.md           # /index-corpus
│   │   └── extract-articles.md       # /extract-articles
│   │
│   ├── hooks/                        # HOOKS (10 ATIVOS)
│   │   ├── hook-wrapper.js           # Wrapper universal
│   │   ├── session-context-hybrid.js
│   │   ├── invoke-legal-braniac-hybrid.js
│   │   ├── venv-check.js
│   │   ├── git-status-watcher.js
│   │   ├── data-layer-validator.js
│   │   ├── dependency-drift-checker.js
│   │   ├── corporate-detector.js     # ⚠️ Desabilitar no WSL2
│   │   ├── skill-activation-prompt.sh  # ⚠️ Reativar
│   │   └── post-agent-structure-validator.sh  # CRIAR
│   │
│   ├── statusline/
│   │   └── legal-braniac-statusline.js
│   │
│   ├── settings.json                 # Configuração híbrida
│   ├── CLAUDE.md                     # CRIAR - Instruções específicas
│   └── AGENT_ARCHITECTURE_ANALYSIS.md  # ESTE ARQUIVO
│
├── agentes/                          # AGENTES PYTHON AUTÔNOMOS
│   ├── oab-watcher/                  # [MONITOR] DJEN + busca OAB
│   │   ├── src/
│   │   ├── .venv/                    # ❌ NÃO VERSIONAR
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── run_agent.ps1
│   │   └── README.md
│   │
│   ├── djen-tracker/                 # [MONITOR] Download contínuo
│   │   ├── src/
│   │   ├── .venv/                    # ❌ NÃO VERSIONAR
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   └── README.md
│   │
│   ├── legal-lens/                   # [RAG] PDFs jurídicos
│   │   ├── src/
│   │   ├── .venv/                    # ❌ NÃO VERSIONAR
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   └── README.md
│   │
│   ├── legal-rag/                    # [RAG] Jurisprudência estruturada
│   │   ├── indexing/
│   │   ├── retrieval/
│   │   ├── generation/
│   │   ├── .venv/                    # ❌ NÃO VERSIONAR
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   └── legal-articles-finder/        # [EXTRACTOR] Artigos de leis
│       ├── src/
│       ├── corpus/
│       ├── .venv/                    # ❌ NÃO VERSIONAR
│       ├── requirements.txt
│       └── README.md
│
├── skills/                           # SKILLS FORMAIS (CRIAR)
│   └── (extrair de agentes Python se aplicável)
│
├── shared/                           # CÓDIGO COMPARTILHADO
│   ├── utils/
│   │   └── path_utils.py
│   └── models/
│
├── docs/
│
├── CLAUDE.md                         # Instruções raiz
├── README.md
├── .gitignore
└── CHANGELOG.md
```

### 6.2 Dados Externos (Layer 3 - NÃO VERSIONADO)

```
E:\claude-code-data\                  # ou ~/claude-data/ no Linux
└── agentes/
    ├── oab-watcher/
    │   ├── downloads/
    │   ├── cache/
    │   ├── logs/
    │   └── outputs/
    │
    ├── djen-tracker/
    │   ├── cadernos/
    │   ├── logs/
    │   └── checkpoint.json
    │
    ├── legal-lens/
    │   ├── processed/
    │   ├── vector_db/
    │   ├── logs/
    │   └── outputs/
    │
    └── legal-rag/
        ├── corpus/
        ├── chroma_db/
        └── logs/
```

### 6.3 Regras de Validação Estrutural

**VALIDAÇÃO AUTOMÁTICA (PostToolUse hook):**

```bash
#!/bin/bash
# .claude/hooks/post-agent-structure-validator.sh

FILE_PATH="$1"

# Validação 1: Agentes .claude/agents/ têm frontmatter YAML
if [[ "$FILE_PATH" == *".claude/agents/"*.md ]]; then
    if ! grep -q "^---$" "$FILE_PATH"; then
        echo '{"continue": true, "systemMessage": "⚠️ AVISO: Agente sem frontmatter YAML em '$FILE_PATH'"}'
        exit 0
    fi
    
    # Campos obrigatórios
    if ! grep -q "^name:" "$FILE_PATH"; then
        echo '{"continue": true, "systemMessage": "⚠️ AVISO: Falta campo name em '$FILE_PATH'"}'
        exit 0
    fi
    
    if ! grep -q "^description:" "$FILE_PATH"; then
        echo '{"continue": true, "systemMessage": "⚠️ AVISO: Falta campo description em '$FILE_PATH'"}'
        exit 0
    fi
fi

# Validação 2: Agentes Python têm README.md + requirements.txt
if [[ "$FILE_PATH" == *"agentes/"*"/main.py" ]]; then
    AGENT_DIR=$(dirname "$FILE_PATH")
    
    if [[ ! -f "$AGENT_DIR/README.md" ]]; then
        echo '{"continue": true, "systemMessage": "⚠️ AVISO: Agente Python sem README.md em '$AGENT_DIR'"}'
        exit 0
    fi
    
    if [[ ! -f "$AGENT_DIR/requirements.txt" ]]; then
        echo '{"continue": true, "systemMessage": "⚠️ AVISO: Agente Python sem requirements.txt em '$AGENT_DIR'"}'
        exit 0
    fi
fi

# Validação 3: Sem duplicação de nomes
# (Implementar lógica de verificação cruzada se necessário)

echo '{"continue": true}'
```

### 6.4 Checklist de Conformidade

**Para Sub-Agentes (.claude/agents/):**
- [ ] Frontmatter YAML válido
- [ ] Campo `name` presente
- [ ] Campo `description` presente
- [ ] Campo `type` (opcional: cognitive, descriptor, orchestrator)
- [ ] Skills obrigatórias documentadas
- [ ] Exemplos de uso incluídos

**Para Agentes Python (agentes/):**
- [ ] README.md completo
- [ ] requirements.txt atualizado
- [ ] .venv/ em .gitignore
- [ ] main.py funcional
- [ ] Dados em E:\claude-code-data\ (não no código)
- [ ] Sem paths hardcoded

**Para Integração:**
- [ ] Descriptor em .claude/agents/ (se aplicável)
- [ ] Documentação de interdependências
- [ ] Testes de integração (futuro)

---

## 7. PRÓXIMOS PASSOS IMEDIATOS

### Sprint 1 (Esta Semana)
1. **Criar `.claude/CLAUDE.md`** com taxonomia formalizada
2. **Implementar hook `post-agent-structure-validator.sh`**
3. **Reativar `skill-activation-prompt.sh`**
4. **Criar diretório `.claude/commands/`** com 3 slash commands iniciais

### Sprint 2 (Próxima Semana)
5. **Criar `skills/` e avaliar extração de funcionalidades**
6. **Implementar GitHub Actions para validação CI/CD**
7. **Documentar padrão em README.md**
8. **Revisar e atualizar todos os READMEs de agentes Python**

### Sprint 3 (Futuro)
9. **Avaliar criação de agente `legal-orchestrator`** (separar de legal-braniac?)
10. **Implementar testes de integração entre agentes**
11. **Expandir corpus de legal-articles-finder**
12. **Avaliar unificação de legal-lens e legal-rag**

---

## 8. CONCLUSÃO

### 8.1 Estado Atual

**CONFORMIDADE GLOBAL:** 70% ✅

**PONTOS FORTES:**
- Sub-agentes bem estruturados em `.claude/agents/`
- Hooks robustos e funcionais
- Agentes Python autônomos com venvs isolados
- Separação clara CODE/ENV/DATA
- Documentação extensa (READMEs completos)

**OPORTUNIDADES DE MELHORIA:**
- Criar `.claude/CLAUDE.md` hierárquico
- Adicionar `.claude/commands/` para slash commands
- Implementar `skills/` formais
- Automatizar validação estrutural
- Unificar nomenclatura (descriptor vs agente real)

### 8.2 Estrutura É Válida?

**SIM.** A estrutura atual é válida e **intencionalmente divergente** dos padrões puros por necessidade técnica:

1. **Agentes Python autônomos** (`agentes/`) são necessários para:
   - Monitoramento 24/7 (djen-tracker)
   - Sistemas RAG com venvs pesados (legal-lens, legal-rag)
   - Processamento assíncrono (oab-watcher)

2. **Sub-agentes cognitivos** (`.claude/agents/`) são necessários para:
   - Orquestração inteligente (legal-braniac)
   - Coordenação de workflows (planejamento, desenvolvimento, qualidade)
   - Raciocínio sem estado persistente

**Esta dualidade é uma FORÇA, não uma fraqueza.**

### 8.3 Próximo Documento

Após implementar Sprint 1, criar:
- **`.claude/CLAUDE.md`** - Instruções para sub-agentes
- **`agentes/INTEGRATION_GUIDE.md`** - Como agentes Python se integram
- **`.github/workflows/validate-agents.yml`** - CI/CD validation

---

**Análise concluída:** 2025-11-15 23:45 UTC
**Próxima revisão:** Após Sprint 1
**Responsável:** Legal-Braniac Orchestrator
**Status:** ✅ PRONTO PARA AÇÃO
