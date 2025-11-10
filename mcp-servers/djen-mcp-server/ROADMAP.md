# 🗺️ Roadmap - DJEN MCP Server

Este roadmap consolida os TODOs sugeridos pelo Claude anterior e adapta para a arquitetura atual (TypeScript + SQLite + RAG local).

---

## ✅ Fase 0: Estrutura Base (CONCLUÍDO)

- [x] Estrutura modular TypeScript
- [x] Cliente API DJEN com rate limiting
- [x] Banco SQLite com schema otimizado
- [x] Sistema RAG com embeddings locais
- [x] Servidor MCP com 10 ferramentas
- [x] Documentação completa (CLAUDE.md, README, etc.)

---

## 🔥 Fase 1: Validação e Testes (PRIORIDADE ALTA)

### 1.1 Validação da API Real
- [ ] **Obter credenciais CNJ** e acessar API DJEN
- [ ] **Validar endpoints reais** (ajustar `src/api/client.ts`)
- [ ] **Confirmar limite de 10.000** publicações por requisição
- [ ] **Testar autenticação JWT** e tempo de expiração real
- [ ] **Documentar rate limits reais** (requisições por minuto/dia)

### 1.2 Testes Automatizados
- [ ] **Mock de API DJEN**: criar testes com respostas simuladas
  - Usar Vitest + MSW (Mock Service Worker)
  - Simular: 200 OK, 401 Unauthorized, 429 Rate Limit, 500 Server Error
  - Arquivo: `src/api/__tests__/client.test.ts`

- [ ] **Testes de banco de dados**
  - Testar inserções, buscas, deduplicação
  - SQLite em memória para testes rápidos
  - Arquivo: `src/database/__tests__/index.test.ts`

- [ ] **Testes de RAG**
  - Mock de embeddings para velocidade
  - Verificar cálculo de similaridade
  - Arquivo: `src/rag/__tests__/embeddings.test.ts`

### 1.3 Validações de Entrada
- [ ] **Regex de número de processo CNJ**
  ```typescript
  // NNNNNNN-DD.AAAA.J.TR.OOOO
  const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/;
  ```

- [ ] **Validação de siglas de tribunal**
  - Cache de tribunais válidos (consultar `/comunicacao/tribunal`)
  - Validar antes de fazer requisições

- [ ] **Validação de datas**
  - ISO 8601 obrigatório
  - Intervalo máximo (ex: 90 dias por requisição)

### 1.4 Robustez de Retry e Rate Limiting
- [ ] **Backoff exponencial com jitter**
  ```typescript
  // Atual: sleep fixo de 60s
  // Melhorar para: delay = base * (2^attempt) + random(0, jitter)
  ```

- [ ] **Respeitar header `X-Retry-After`** (se API retornar)

- [ ] **Circuit breaker**: pausar requisições após N falhas consecutivas

---

## 🛠️ Fase 2: Otimizações e Features

### 2.1 Janelamento Adaptativo
- [ ] **Implementar janelamento inteligente**
  - Detectar quando `count` se aproxima de 10.000
  - Dividir automaticamente: mês → semana → dia → hora
  - Arquivo: `src/api/windowing.ts`

- [ ] **Estimativa de volume**: consultar API para estimar antes do download

### 2.2 Deduplicação
- [ ] **Hash de conteúdo**: adicionar campo `content_hash` na tabela
  ```sql
  ALTER TABLE publicacoes ADD COLUMN content_hash TEXT;
  CREATE UNIQUE INDEX idx_content_hash ON publicacoes(content_hash);
  ```

- [ ] **Verificar duplicatas antes de inserir**
  - Hash SHA-256 de `conteudo + data + numeroProcesso`

- [ ] **Comando de limpeza**: remover duplicatas antigas

### 2.3 Busca Local Avançada
- [ ] **Implementar busca full-text no SQLite**
  ```sql
  CREATE VIRTUAL TABLE publicacoes_fts USING fts5(
    conteudo, tribunal, tipo, content=publicacoes
  );
  ```

- [ ] **Nova ferramenta MCP: `busca_texto_completo`**
  - Busca por palavras-chave (sem RAG)
  - Mais rápido que busca semântica
  - Útil para termos específicos

- [ ] **Boost de relevância**
  - Priorizar: Acórdãos > Sentenças > Intimações
  - Tribunais superiores (STF, STJ) > Regionais
  - Publicações mais recentes

### 2.4 Normalização e Qualidade de Dados
- [ ] **Pipeline de normalização**
  - Remover acentos opcionalmente
  - Limpar HTML/XML se presente
  - Extrair metadados estruturados (partes, advogados, etc.)
  - Arquivo: `src/utils/normalizer.ts`

- [ ] **Tokenização PT-BR otimizada**
  - Stopwords em português
  - Stemming (ex: usar `natural` ou `compromise`)

---

## 📊 Fase 3: Observabilidade e Métricas

### 3.1 Métricas
- [ ] **Contador de eventos**
  - Total de 429 (rate limit) por dia
  - Latência média por janela
  - Erros 4xx/5xx por endpoint
  - Publicações baixadas/indexadas por hora

- [ ] **Nova ferramenta MCP: `metricas_sistema`**
  - Retorna métricas em tempo real
  - Histórico de downloads
  - Performance do RAG

### 3.2 Logs Estruturados
- [ ] **Adicionar trace_id** a cada requisição
  ```typescript
  import { randomUUID } from 'crypto';
  const traceId = randomUUID();
  logger.info('Busca iniciada', { traceId, filtros });
  ```

- [ ] **Sanitização de logs**: não logar senhas/tokens

- [ ] **Rotação de logs**: implementar com `winston` ou `pino`

### 3.3 Dashboard (Opcional)
- [ ] **Endpoint HTTP local** para métricas
  - Express.js simples em porta separada
  - `/metrics` retorna JSON com estatísticas
  - `/health` para health checks

---

## 🏗️ Fase 4: Qualidade de Código e DevOps

### 4.1 Pre-commit Hooks
- [ ] **Configurar Husky**
  ```bash
  npm install -D husky lint-staged
  npx husky install
  ```

- [ ] **Hooks**:
  - Pre-commit: `npm run lint` e `npm run format`
  - Pre-push: `npm test`

### 4.2 CI/CD
- [ ] **GitHub Actions workflow básico**
  ```yaml
  # .github/workflows/test.yml
  - Build TypeScript
  - Executar testes
  - Lint
  ```

- [ ] **Workflow manual "heavy"**
  - Testes de integração com API real (credenciais secrets)
  - Smoke test completo

### 4.3 Refatorações
- [ ] **Extrair rate limiter**: `src/api/ratelimiter.ts`
- [ ] **Extrair retry logic**: `src/api/retry.ts`
- [ ] **Tool router**: organizar handlers em `src/mcp/handlers/`

---

## 🚀 Fase 5: Features Avançadas (Futuro)

### 5.1 Agendamento Automático
- [ ] **Cron jobs** para downloads periódicos
  - Usar `node-cron`
  - Configurável: diário, semanal, mensal

- [ ] **Nova ferramenta: `agendar_download`**
  - Configurar downloads recorrentes
  - Ex: "todo dia às 6h, baixar TJSP do dia anterior"

### 5.2 Classificação Automática
- [ ] **Temas predefinidos**: criar tabela de temas comuns
  - Direito Civil, Consumidor, Trabalhista, etc.

- [ ] **Classificador ML simples**
  - Usar embeddings para classificar automaticamente
  - Salvar em `publicacoes_temas`

### 5.3 Extração de Entidades
- [ ] **NER (Named Entity Recognition)**
  - Extrair: partes, advogados, juízes, valores
  - Usar modelo transformers leve

- [ ] **Estruturação de dados**
  - Tabelas: `partes`, `advogados`, `valores_monetarios`

### 5.4 Análise Jurimetrica
- [ ] **Estatísticas decisórias**
  - Taxa de procedência por tipo de ação
  - Tempo médio de tramitação
  - Valores médios de indenização

- [ ] **Dashboard de insights**
  - Gráficos e tendências
  - Exportar relatórios

### 5.5 Export/Import
- [ ] **Exportar base**: dump SQL ou JSON
- [ ] **Importar de backup**: restore completo
- [ ] **Sincronização**: entre máquinas (via arquivo ou API)

---

## 🔒 Fase 6: Segurança e Hardening (Produção)

### 6.1 Segurança de Credenciais
- [ ] **Vault para secrets**: usar HashiCorp Vault ou similar
- [ ] **Criptografia de .env**: encrypt local com senha mestre

### 6.2 Rate Limiting Interno
- [ ] **Limitar uso por usuário/IP**
  - Evitar abuso que cause bloqueio no CNJ
  - Configurável: X req/min por usuário

### 6.3 Auditoria
- [ ] **Log de todas as buscas**: quem, quando, quais filtros
- [ ] **LGPD compliance**: anonimizar dados sensíveis se necessário

---

## 📦 Fase 7: Distribuição

### 7.1 Empacotamento
- [ ] **NPM package**: publicar como `@seu-usuario/djen-mcp`
- [ ] **Docker image**: containerizar aplicação
  ```dockerfile
  FROM node:20-alpine
  # ...
  ```

### 7.2 Instalador
- [ ] **Script de instalação**: `install.sh` ou `install.ps1`
  - Detecta OS
  - Instala dependências
  - Configura Claude Desktop automaticamente

### 7.3 Updates
- [ ] **Auto-update**: verificar novas versões
- [ ] **Changelog**: manter atualizado

---

## 🎯 Prioridades Imediatas (Próximas 2 Semanas)

1. ✅ **Validar API real** (depende de credenciais CNJ)
2. ⚡ **Implementar testes básicos** (mock da API)
3. ⚡ **Adicionar validações CNJ** (regex processo, tribunais)
4. ⚡ **Melhorar retry** (backoff exponencial + jitter)
5. ⚡ **Deduplicação de publicações** (hash de conteúdo)

---

## 📝 Notas de Implementação

### Diferenças vs. Proposta Original (Claude Anterior)

**Original:** Python + FastAPI + OpenSearch + Postgres
**Atual:** TypeScript/Node.js + MCP + SQLite + Embeddings locais

**Vantagens da abordagem atual:**
- ✅ Mais simples (menos componentes)
- ✅ 100% local (sem dependências externas)
- ✅ Integração direta com Claude Desktop
- ✅ TypeScript type-safe

**Trade-offs:**
- ⚠️ SQLite menos escalável que Postgres (mas suficiente para milhões de registros)
- ⚠️ Embeddings locais mais lentos que OpenSearch (mas sem custo de infra)
- ⚠️ Sem interface web (mas pode adicionar depois)

### Itens do TODO Original Não Aplicáveis

- ❌ **OpenSearch Security**: não usando OpenSearch
- ❌ **Gateway/API REST**: MCP é protocolo direto
- ❌ **Postgres migrations**: usando SQLite (schema simples)

### Itens Adaptados

- ✅ **Janelamento**: adaptar para limite de 1000 (não 10k como mencionado)
- ✅ **Rate limiting**: já implementado (PQueue)
- ✅ **Typing estrito**: TypeScript strict mode
- ✅ **RAG/Busca**: via embeddings locais (não OpenSearch)

---

## 🤝 Contribuições

Se você ou outros advogados quiserem contribuir:
1. Criar issues para cada feature
2. PRs pequenos e focados
3. Seguir padrões de código (ESLint + Prettier)
4. Adicionar testes para novas features

---

**Última atualização:** 2025-10-25
**Versão atual:** 0.1.0
