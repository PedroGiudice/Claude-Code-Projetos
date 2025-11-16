# Prompt Enhancer Skill

**Versão**: 0.1.0
**Tipo**: Meta-skill (análise de intenção + clarificação técnica)
**Invocação**: Manual via `++` no início do prompt ou chamada explícita da skill

---

## Missão

Transformar prompts vagos/ambíguos em especificações técnicas claras através de:
1. Análise de intenção do usuário
2. Identificação de padrões arquiteturais
3. Proposta de componentes técnicos
4. Perguntas de clarificação (máx 3)
5. Execução com contexto enriquecido

---

## Quando Usar

✅ **Use esta skill quando:**
- Usuário prefixar prompt com `++` (force enhance)
- Prompt é vago mas detecta-se intenção técnica
- Multiple padrões arquiteturais aplicáveis (precisa escolher)
- Usuário pedir "planeje isso" ou "organize essa tarefa"

❌ **Não use quando:**
- Prompt já é tecnicamente claro (quality > 70)
- Usuário prefixar com `*`, `/`, `#` (bypass)
- Tarefa é trivial (ex: "ler arquivo X")

---

## Workflow de 5 Fases

### Fase 1: Análise de Intenção

**Objetivo**: Entender o que o usuário quer fazer (em alto nível)

**Ações**:
1. Ler o prompt original do usuário
2. Extrair verbos de ação (baixar, monitorar, processar, integrar, etc)
3. Identificar domínio (dados, APIs, frontend, backend, testing, etc)
4. Detectar escala/complexidade (único item vs massa, tempo real vs batch)

**Output**:
```markdown
🔍 Intenção detectada:
- Ação principal: [verbo + objeto]
- Domínio: [área técnica]
- Escala: [unitário/batch/real-time]
- Complexidade estimada: [baixa/média/alta]
```

**Exemplo**:
```
Prompt: "baixar todos os PDFs do site X e extrair dados"

Output:
🔍 Intenção detectada:
- Ação principal: Coletar dados em massa + Extração
- Domínio: Web scraping + Data extraction
- Escala: Batch (múltiplos arquivos)
- Complexidade estimada: Média-Alta
```

---

### Fase 2: Identificação de Padrões Arquiteturais

**Objetivo**: Mapear intenção → padrões conhecidos

**Ações**:
1. Consultar biblioteca de padrões (`intent-patterns.json`)
2. Aplicar regex matching contra prompt
3. Ranquear padrões por relevância (múltiplos matches possíveis)
4. Identificar padrões conflitantes (ex: scraping + API client)

**Output**:
```markdown
🏗️ Padrões arquiteturais aplicáveis:

[1] MASS_DATA_COLLECTION (90% match)
    Componentes: api-client, rate-limiter, parser, storage

[2] ETL_PIPELINE (70% match)
    Componentes: extractor, transformer, loader, validator

[3] BATCH_PROCESSOR (60% match)
    Componentes: job-queue, worker-pool, progress-tracker
```

**Decisão**:
- Se 1 padrão: Seguir para Fase 3
- Se 2+ padrões: Perguntar ao usuário qual abordagem prefere
- Se 0 padrões: Pedir mais contexto ou seguir como prompt genérico

---

### Fase 3: Proposta de Componentes Técnicos

**Objetivo**: Detalhar arquitetura técnica necessária

**Ações**:
1. Pegar componentes do padrão escolhido
2. Adicionar detalhes técnicos (bibliotecas sugeridas, tecnologias)
3. Identificar dependências entre componentes
4. Estimar esforço (simples/médio/complexo)

**Output**:
```markdown
⚙️ Componentes técnicos necessários:

1. **API Client** (biblioteca: requests/axios)
   - HTTP client com retry logic
   - Error handling (4xx, 5xx)
   - Timeout configuration

2. **Rate Limiter** (biblioteca: ratelimit/bottleneck)
   - Respeitar quotas da API
   - Exponential backoff em caso de 429

3. **Data Parser** (biblioteca: BeautifulSoup/Cheerio)
   - Extração de dados estruturados
   - Validação de schema

4. **Storage Layer** (tecnologia: SQLite/PostgreSQL/files)
   - Persistência escalável
   - Indexação para busca

Dependências:
  1 → 2 (rate limiter envolve client)
  2 → 3 (parser processa response)
  3 → 4 (dados validados são salvos)

Esforço estimado: Médio (~2-4 horas)
```

---

### Fase 4: Perguntas de Clarificação (Máx 3)

**Objetivo**: Resolver ambiguidades antes de implementar

**Ações**:
1. Identificar variáveis de decisão (formato de output, volume, periodicidade)
2. Priorizar perguntas por impacto na arquitetura
3. Fazer no máximo 3 perguntas (evitar questionário longo)
4. Oferecer opções (não perguntas abertas)

**Output**:
```markdown
❓ Perguntas de clarificação (escolha opções):

[Q1] Volume de dados esperado:
  a) Dezenas de PDFs (~10-100)
  b) Centenas de PDFs (~100-1000)
  c) Milhares de PDFs (1000+)

[Q2] Formato de saída preferido:
  a) JSON (estrutura flexível)
  b) CSV (tabular, Excel-friendly)
  c) Banco de dados SQLite

[Q3] Execução:
  a) On-demand (rodar manualmente)
  b) Agendado (diário/semanal)
  c) Contínuo (monitorar site em tempo real)
```

**Regras**:
- Se usuário já especificou algo, não perguntar novamente
- Se decisão não impacta arquitetura core, usar default razoável
- Perguntas devem ter 2-4 opções (não abertas)

---

### Fase 5: Execução com Contexto Enriquecido

**Objetivo**: Implementar com todas as informações coletadas

**Ações**:
1. Consolidar informações das fases anteriores
2. Criar prompt enriquecido para delegação/execução
3. Invocar agente apropriado (desenvolvimento, planejamento-legal, etc)
4. Monitorar execução e validar resultado

**Output**:
```markdown
🚀 Iniciando implementação com contexto enriquecido:

Contexto consolidado:
- Padrão: MASS_DATA_COLLECTION
- Volume: ~500 PDFs (médio)
- Output: JSON estruturado
- Execução: On-demand

Delegando para: [agente desenvolvimento]
Skills necessárias: [code-execution, test-driven-development]

[Execução em andamento...]
```

**Prompt enriquecido (enviado ao agente)**:
```
Implementar sistema de coleta em massa de PDFs com as seguintes especificações:

ARQUITETURA: MASS_DATA_COLLECTION pattern

COMPONENTES:
1. HTTP Client (requests) com retry logic (max 3 tentativas)
2. Rate Limiter (respeitando 10 req/s)
3. PDF Parser (PyPDF2 ou pdfplumber)
4. Storage em JSON (estrutura: {url, filename, extracted_data, timestamp})

REQUISITOS:
- Volume esperado: ~500 PDFs
- Error handling robusto (log falhas, continuar execução)
- Progress tracking (exibir % completo)
- Output: JSON Lines (.jsonl) para processamento incremental

QUALITY GATES:
- ✅ Testes unitários para parser
- ✅ Validação de schema de output
- ✅ Logging de erros em arquivo separado
- ✅ Documentação de uso (README)

[Componentes detalhados da Fase 3 anexados aqui]
```

---

## Métricas de Sucesso

A skill é considerada bem-sucedida se:

1. **Redução de iterações**: Usuário não precisa re-explicar intenção
2. **Clareza técnica**: Implementação reflete exatamente o que foi pedido
3. **Tempo economizado**: < 5 min de clarificação vs múltiplas idas-e-vindas
4. **Qualidade de output**: Código gerado inclui componentes arquiteturais corretos

---

## Exemplos de Uso

### Exemplo 1: Prompt Vago → Enhancement Completo

**Input do usuário**:
```
++ baixar dados do site X
```

**Fase 1 (Análise)**:
```
🔍 Intenção detectada:
- Ação: Coleta de dados
- Domínio: Web scraping
- Escala: Indefinida (precisa clarificar)
- Complexidade: Média
```

**Fase 2 (Padrões)**:
```
🏗️ Padrão principal: MASS_DATA_COLLECTION (80% match)
```

**Fase 3 (Componentes)**:
```
⚙️ Componentes sugeridos:
1. HTTP client (requests)
2. HTML parser (BeautifulSoup)
3. Rate limiter
4. Storage layer
```

**Fase 4 (Perguntas)**:
```
❓ Clarificações:
[Q1] Tipo de dados no site X?
  a) Tabelas HTML
  b) Links para PDFs
  c) JSON via API

[Q2] Volume estimado?
  a) <100 itens
  b) 100-1000 itens
  c) >1000 itens

[Q3] Periodicidade?
  a) Execução única
  b) Diária
  c) Contínua
```

**Usuário responde**: `b, b, a`

**Fase 5 (Execução)**:
```
🚀 Implementando scraper de PDFs:
- 100-1000 arquivos
- Execução única
- Storage em JSON

[Delegando para desenvolvimento...]
```

---

### Exemplo 2: Prompt Técnico Claro → Bypass

**Input do usuário**:
```
Implementar cache Redis com TTL de 1 hora para endpoint /api/products usando biblioteca ioredis
```

**Skill detecta**:
- Quality score: 95/100
- Padrão: CACHING_LAYER (match)
- Decisão: **Bypass enhancement** (já está claro)

**Output**:
```
✅ Prompt tecnicamente claro (quality: 95/100)
Enhancement não necessário - delegando diretamente para desenvolvimento.
```

---

## Configuração

A skill depende de:

1. **Biblioteca de padrões**: `.claude/hooks/lib/intent-patterns.json`
2. **Hook de enhancement**: `.claude/hooks/prompt-enhancer.js`
3. **Tracking de qualidade**: `.claude/statusline/prompt-quality.json`

Para desabilitar temporariamente:
- Prefixar prompt com `*`, `/`, ou `#`
- Editar `prompt-quality.json`: `"enabled": false`

---

## Roadmap

**v0.1** (MVP):
- ✅ 12 padrões arquiteturais genéricos
- ✅ Workflow de 5 fases
- ✅ Perguntas de clarificação (max 3)
- ✅ Quality scoring

**v0.2** (Melhorias):
- [ ] Learning de padrões customizados (usuário pode adicionar)
- [ ] Historical matching (reusar decisões de prompts similares)
- [ ] Multi-language support (padrões em PT + EN)
- [ ] Confidence scoring (quão certo está do match)

**v1.0** (Production-ready):
- [ ] 50+ padrões arquiteturais
- [ ] Embeddings-based matching (semantic similarity)
- [ ] Auto-learning de novos padrões
- [ ] Integration com IDE (VSCode extension)

---

## Troubleshooting

**Problema**: Enhancement sempre bypassed mesmo com `++`

**Solução**: Verificar se `prompt-quality.json` tem `"enabled": true`

---

**Problema**: Padrões não detectados (sempre 0 matches)

**Solução**: Validar regexes em `intent-patterns.json` (usar regex101.com para testar)

---

**Problema**: Performance lenta (>500ms overhead)

**Solução**: Reduzir número de padrões ou usar caching de regex compilados

---

**Última atualização**: 2025-11-16
**Autor**: Legal-Braniac Orchestrator
**Licença**: MIT (projeto Claude-Code-Projetos)
