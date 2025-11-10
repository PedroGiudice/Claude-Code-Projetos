# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral do Projeto

Este é um servidor MCP (Model Context Protocol) especializado para o contexto jurídico brasileiro. Conecta-se a **múltiplas APIs públicas do CNJ** (DataJud, DJEN/PCP, PJe MNI) para automatizar consultas, construir bibliotecas jurisprudenciais e aplicar RAG (Retrieval-Augmented Generation) para análise processual.

**Objetivo principal:** Permitir que o Claude acesse e analise publicações jurídicas e metadados processuais de forma inteligente, construindo uma base de conhecimento crescente para fundamentação de peças, acompanhamento processual e análises jurimétricas.

**✨ Diferencial:** Cliente unificado que busca automaticamente em múltiplas fontes e elimina duplicatas, maximizando a cobertura de dados.

## Arquitetura do Sistema

### Fluxo de Dados
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  DataJud    │  │  DJEN/PCP   │  │  PJe MNI    │
│  (CNJ)      │  │  (CNJ)      │  │  (Futuro)   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────┬───────┴────────┬───────┘
                │                │
         ┌──────▼────────────────▼──────┐
         │   Unified Client              │
         │  (Deduplicação automática)    │
         └──────────────┬────────────────┘
                        │
              ┌─────────▼──────────┐
              │  Banco SQLite      │
              │  (WAL mode)        │
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────┐
              │   RAG System       │
              │  (Embeddings)      │
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────┐
              │   MCP Server       │
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────┐
              │  Claude Desktop    │
              └────────────────────┘
```

### Componentes Principais

1. **API Clients**

   **a) DataJud Client** (`src/api/datajud-client.ts`) ⭐ **PRIMÁRIO**
   - API Pública do CNJ - **100% confirmada e funcional**
   - URL: https://api-publica.datajud.cnj.jus.br
   - Cobertura: 91 tribunais brasileiros
   - Autenticação: API Key pública (sem cadastro)
   - Rate limiting: max 60 req/min
   - Dados: Metadados processuais (capas + movimentações)

   **b) DJEN/PCP Client** (`src/api/client.ts`) ✅ **CONFIRMADO**
   - API da Plataforma de Comunicações Processuais - **Confirmada e acessível**
   - URL: https://comunicaapi.pje.jus.br
   - Swagger: https://comunicaapi.pje.jus.br/swagger/index.html
   - Tipo: REST API pública (consulta SEM autenticação)
   - Rate limiting: max 60 req/min, 5 concurrent
   - Dados: Publicações do Diário de Justiça Eletrônico Nacional

   **c) Unified Client** (`src/api/unified-client.ts`) ⭐⭐⭐ **RECOMENDADO**
   - **Busca automaticamente em DataJud + DJEN + PJe MNI**
   - Deduplicação inteligente por hash MD5
   - Priorização: DataJud > DJEN > PJe MNI
   - Campo `fontes: []` indica quais APIs responderam
   - **USO:** `getUnifiedClient().buscarPorNumero(numero, tribunal)`

2. **Database** (`src/database/`)
   - SQLite com WAL mode para performance
   - Schema otimizado com índices em: numero_processo, data_publicacao, tribunal, tipo
   - Armazena embeddings como BLOB (Float32Array serializado)
   - Tabelas: publicacoes, embeddings, downloads_historico, processos_monitorados, temas
   - **Crítico:** Integridade referencial habilitada - não deletar publicações sem verificar embeddings

3. **RAG System** (`src/rag/`)
   - Modelo: `Xenova/multilingual-e5-small` (otimizado para português)
   - Embeddings armazenados localmente para evitar reprocessamento
   - Similaridade por cosseno com threshold configurável (padrão: 0.7)
   - Cache de modelo: `./embeddings-cache` (~200MB no primeiro download)
   - **Performance:** Indexação leva ~0.5s por publicação; fazer em lotes

4. **MCP Server** (`src/mcp/server.ts`)
   - 10 ferramentas expostas ao Claude (ver TOOLS em `src/mcp/tools.ts`)
   - Transport: stdio (comunicação via stdin/stdout)
   - Graceful shutdown em SIGINT/SIGTERM

## Comandos de Desenvolvimento

### Build e Execução
```bash
npm install          # Instalar dependências
npm run build        # Build TypeScript → JavaScript
npm run dev          # Modo desenvolvimento (hot reload com tsx)
npm start            # Executar versão compilada
npm test             # Testes (Vitest)
npm run lint         # ESLint
npm run format       # Formatar código com Prettier
```

### Workflow Típico
1. Modificar código em `src/`
2. `npm run build` para compilar
3. Testar manualmente via Claude Desktop
4. Verificar logs em `logs/` (se configurado)

## Ferramentas MCP Disponíveis

### Busca e Download
- `buscar_publicacoes`: Busca com filtros (data, tribunal, processo, tema)
- `buscar_por_processo`: Múltiplos processos simultaneamente
- `download_lote`: Download massivo com paginação automática

### RAG e Análise
- `busca_semantica`: Busca por similaridade vetorial
- `gerar_contexto_rag`: Formata contexto para análise do Claude
- `indexar_publicacoes`: Gera embeddings em lote

### Monitoramento
- `adicionar_processo_monitorado`: Marcar processos para acompanhamento
- `listar_processos_monitorados`: Ver processos ativos
- `historico_processo`: Gerar timeline completo de publicações

### Utilidades
- `estatisticas`: Dashboard de métricas do banco

## Padrões de Código

### TypeScript
- Strict mode habilitado
- ES2022 target
- ESM modules (usar `.js` em imports mesmo para arquivos `.ts`)
- Zod para validação de schemas

### Linting e Formatação
- **ESLint:** `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser`
- **Prettier:** Configurado em `prettier.config.js`
- Regras customizadas em `.eslintrc.json`:
  - `no-unused-vars`: warn (permite `_` prefix para ignorar)
  - `no-explicit-any`: warn (evitar quando possível)
  - `no-console`: off (logs são ok)
- **Comando:** `npm run format` antes de commits importantes

### Logging
```typescript
import { logger } from '../utils/logger.js';
logger.info('Mensagem informativa', { meta: 'dados' });
logger.error('Erro ocorreu', error);
```
Níveis: debug, info, warn, error (configurável via `LOG_LEVEL`)

### Error Handling
- Sempre capturar erros em handlers MCP
- Retornar `{ isError: true }` ao invés de throw em handlers
- Logging detalhado para debugging

### Database Queries
- Usar prepared statements (já implementado)
- Transações para inserções em lote
- Sempre fechar conexão em shutdown

## Estrutura de Dados Crítica

### Publicacao
```typescript
{
  id: string;                    // UUID único
  numeroProcesso?: string;       // Formato CNJ
  dataPublicacao: string;        // ISO 8601
  tribunal: string;              // Sigla (ex: TJSP, STF)
  orgaoJulgador?: string;
  tipo: string;                  // Ex: "Intimação", "Sentença"
  conteudo: string;              // Texto completo
  metadados?: Record<...>;       // JSON flexível
}
```

### Embedding Storage
- Float32Array → Buffer para SQLite BLOB
- Recuperar: `Buffer → Float32Array → Array`
- Dimensão típica: 384 (modelo multilingual-e5-small)

## Configuração e Deploy

### Variáveis de Ambiente Essenciais
```env
DJEN_API_URL          # URL base da API
DJEN_USERNAME         # Credenciais CNJ
DJEN_PASSWORD
DATABASE_PATH         # Caminho do banco (suporta AUTO_DETECT_DRIVE)
EXTERNAL_DRIVE_VOLUME # Nome do volume do HD externo (padrão: HD_PEDRO)
EMBEDDINGS_MODEL      # Padrão: Xenova/multilingual-e5-small
LOG_LEVEL             # debug | info | warn | error
```

### Sistema de Detecção Automática de Drives

**Problema resolvido:** HD externo com letras diferentes em múltiplas máquinas.

O sistema detecta automaticamente o HD pelo nome do volume (Windows):

**Configuração recomendada no `.env`:**
```env
DATABASE_PATH=AUTO_DETECT_DRIVE/djen-data/djen.db
EXTERNAL_DRIVE_VOLUME=HD_PEDRO
```

**Como funciona:**
1. Sistema detecta `AUTO_DETECT_DRIVE` no caminho
2. Executa `wmic` para encontrar drive com volume `HD_PEDRO`
3. Substitui automaticamente pela letra correta (E:, D:, etc.)
4. Se HD não encontrado, usa fallback local (`./data/djen.db`)

**Implementação:**
- Utilitário: `src/utils/drive-detector.ts`
- Funções principais:
  - `detectDriveByVolume(volumeName)`: Localiza drive pelo nome
  - `resolveDatabasePath(configPath, volumeName)`: Resolve caminho final
  - `createDriveMarker(driveLetter)`: Cria marcador no HD

**Logs de detecção:**
```
[INFO] Drive HD_PEDRO detectado em E:
[INFO] Caminho do banco resolvido: E:/djen-data/djen.db
```

**Ver documentação completa:** `SETUP_MULTIPLAS_MAQUINAS.md`

### Variáveis de Ambiente Adicionais

**Downloads:**
```env
DOWNLOAD_BATCH_SIZE=1000        # Tamanho do lote para downloads massivos
AUTO_DOWNLOAD_ENABLED=false     # Habilitar downloads agendados
AUTO_DOWNLOAD_SCHEDULE=0 0 * * * # Cron: diariamente à meia-noite
```

**Rate Limiting:**
```env
MAX_REQUESTS_PER_MINUTE=60      # Limite de requisições/minuto
MAX_CONCURRENT_REQUESTS=5       # Requisições simultâneas
```

**RAG/Embeddings:**
```env
SIMILARITY_THRESHOLD=0.7        # Threshold de similaridade (0-1)
EMBEDDINGS_CACHE_PATH=./embeddings-cache
```

**MCP Server:**
```env
MCP_SERVER_NAME=djen-mcp        # Nome do servidor
MCP_SERVER_VERSION=0.1.0        # Versão
```

### Integração com Claude Desktop
Adicionar em `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "djen": {
      "command": "node",
      "args": ["caminho/completo/dist/index.js"],
      "env": {
        "DJEN_API_URL": "https://comunicaapi.pje.jus.br",
        "DJEN_USERNAME": "usuario",
        "DJEN_PASSWORD": "senha",
        "DATABASE_PATH": "AUTO_DETECT_DRIVE/djen-data/djen.db",
        "EXTERNAL_DRIVE_VOLUME": "HD_PEDRO"
      }
    }
  }
}
```

**IMPORTANTE:**
- Caminho deve ser absoluto, não relativo
- Use `AUTO_DETECT_DRIVE` para detecção automática do HD externo
- Ver `SETUP_MULTIPLAS_MAQUINAS.md` para configuração detalhada

## Próximos Passos Planejados

### Fase 1 - Validação da API (ATUAL)
- [ ] Confirmar endpoints exatos da API DJEN
- [ ] Testar autenticação real
- [ ] Validar schema de resposta das publicações
- [ ] Ajustar tipos TypeScript conforme API real

### Fase 2 - Otimizações
- [ ] Cache de resultados frequentes
- [ ] Compressão de embeddings
- [ ] Download incremental (apenas novos)
- [ ] Scheduler para downloads automáticos

### Fase 3 - Features Avançadas
- [ ] Classificação automática por temas
- [ ] Extração de entidades (partes, advogados)
- [ ] Análise jurimetrica (estatísticas decisórias)
- [ ] Dashboard web para visualização

## Notas Importantes

### Performance
- SQLite WAL mode é crítico para concorrência
- Embeddings: primeira execução é lenta (download do modelo)
- Rate limiting pode atrasar downloads em lote - é esperado

### Segurança
- Credenciais NUNCA no código fonte
- `.env` no `.gitignore`
- Token JWT renovado automaticamente
- Validação de inputs com Zod

### Manutenção
- Backup periódico do banco SQLite
- Monitorar tamanho de `embeddings-cache/`
- Logs devem ser rotacionados (não implementado ainda)

### Limitações Conhecidas
- API DJEN pode ter endpoints diferentes dos assumidos
- Modelo de embeddings local (sem GPU) pode ser lento
- Sem sistema de filas persistentes (perda em crash)
- Sem deduplicação automática de publicações

## Troubleshooting Comum

### "Erro de autenticação"
- Verificar credenciais DJEN no `.env`
- Token pode ter expirado - reconectar

### "Embedding model não encontrado"
- Primeira execução baixa ~200MB
- Verificar conexão com internet e espaço em disco

### "Database locked"
- SQLite WAL mode deve estar habilitado
- Verificar se há processos duplicados

### "Publicações não sendo indexadas"
- Executar `indexar_publicacoes` explicitamente
- Verificar logs para erros de embedding

## Contexto Jurídico

Este projeto é voltado para **advocacia brasileira** e **jurimetria**. Terminologia importante:

- **DJEN**: Diário de Justiça Eletrônico Nacional (substituiu DJEs locais)
- **Publicação**: Qualquer ato processual publicado oficialmente
- **Processo CNJ**: Formato NNNNNNN-DD.AAAA.J.TR.OOOO
- **Jurimetria**: Análise estatística de decisões judiciais
- **RAG para fundamentação**: Buscar precedentes similares para embasar teses

### Tribunais Brasileiros (Siglas Comuns)
- STF: Supremo Tribunal Federal
- STJ: Superior Tribunal de Justiça
- TST: Tribunal Superior do Trabalho
- TJSP, TJRJ, TJMG: Tribunais de Justiça estaduais
- TRF1-5: Tribunais Regionais Federais
- TRT1-24: Tribunais Regionais do Trabalho

## Recursos Externos

- **API DJEN Docs:** https://app.swaggerhub.com/apis-docs/cnj/pcp/1.0.0 (requer login)
- **Portal CNJ:** https://www.cnj.jus.br/programas-e-acoes/processo-judicial-eletronico-pje/comunicacoes-processuais/
- **GitJus (conector PJE):** https://git.cnj.jus.br/git-jus/conector-pje-pcp
- **Suporte CNJ:** sistemasnacionais@cnj.jus.br | (61) 2326-5353
- addo to memory