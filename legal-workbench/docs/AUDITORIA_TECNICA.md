# AUDITORIA TECNICA - Legal Workbench

**Data:** 2026-01-17
**Versao:** 1.0.0
**Autor:** Auditoria Automatizada

---

## Sumario Executivo

O Legal Workbench e uma plataforma de automacao juridica brasileira composta por:
- **1 Frontend** React SPA (Vite + TypeScript)
- **6 Backend Services** FastAPI/Python
- **1 Reverse Proxy** Traefik
- **Infraestrutura** Redis, Prometheus, Grafana

### Maturidade por Modulo

| Modulo | Status | Criticidade |
|--------|--------|-------------|
| Frontend | Producao | Baixa |
| STJ API | Producao | Media |
| Text Extractor | **Bug Critico** | Alta |
| Doc Assembler | Producao | Baixa |
| Trello MCP | Producao | Baixa |
| LEDES Converter | Producao | Baixa |

---

## 1. FRONTEND - React SPA

### 1.1 Identificacao

| Atributo | Valor |
|----------|-------|
| **Nome** | frontend-react |
| **Caminho** | `legal-workbench/frontend/` |
| **Stack** | React 19, Vite 6, TypeScript, Zustand, Tailwind CSS |
| **Porta Docker** | 3000 |
| **Rota Traefik** | `/` (priority=1, catch-all) |

### 1.2 Arquitetura

```
frontend/
├── src/
│   ├── pages/           # 4 paginas principais
│   │   ├── HubHome.tsx
│   │   ├── TrelloModule.tsx
│   │   ├── DocAssembler.tsx
│   │   └── STJ.tsx
│   ├── components/      # Componentes reutilizaveis
│   ├── store/           # Zustand state management
│   ├── services/        # API clients
│   └── routes.tsx       # React Router config
├── Dockerfile           # Multi-stage build
└── vite.config.ts       # Vite configuration
```

### 1.3 Endpoints Expostos

| Rota Frontend | Backend | Descricao |
|---------------|---------|-----------|
| `/` | - | Hub Home |
| `/stj` | `/api/stj` | Pesquisa de jurisprudencia |
| `/doc-assembler` | `/api/doc` | Montador de documentos |
| `/trello` | `/api/trello` | Integracao Trello |

### 1.4 Dependencias Principais

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.1.1",
  "zustand": "^5.0.3",
  "axios": "^1.7.9",
  "@tanstack/react-query": "^5.64.2",
  "tailwindcss": "^4.0.0",
  "vite": "^6.0.7"
}
```

### 1.5 Estado Atual

- **Funcional:** Todas as 4 paginas carregam corretamente
- **Integracao:** Conectado aos backends via Traefik proxy
- **Build:** Multi-stage Docker (bun install + nginx serve)
- **Autenticacao:** Basic Auth via Traefik middleware

### 1.6 Tech Debt / Problemas

| ID | Severidade | Descricao |
|----|------------|-----------|
| FE-01 | Baixa | Sem testes unitarios (componentes nao testados) |
| FE-02 | Media | React 19 ainda em RC (pode ter breaking changes) |
| FE-03 | Baixa | Vite 6 recente (hot reload ocasionalmente falha) |
| FE-04 | Media | Tailwind v4 (alpha) pode ter bugs |

---

## 2. STJ API - Servico de Jurisprudencia

### 2.1 Identificacao

| Atributo | Valor |
|----------|-------|
| **Nome** | api-stj |
| **Caminho Docker** | `docker/services/stj-api/` |
| **Caminho Fonte** | `ferramentas/stj-dados-abertos/` |
| **Stack** | Python 3.11, FastAPI, DuckDB, Celery |
| **Porta Docker** | 8000 |
| **Rota Traefik** | `/api/stj` |

### 2.2 Arquitetura

```
stj-api/
├── api/
│   ├── main.py          # FastAPI app
│   ├── models.py        # Pydantic schemas
│   ├── dependencies.py  # DI providers
│   └── scheduler.py     # Background tasks
├── Dockerfile
└── README.md

ferramentas/stj-dados-abertos/
├── src/
│   ├── database.py      # DuckDB + FTS
│   ├── collector.py     # CKAN API client
│   └── processor.py     # Data transformation
└── config.py
```

### 2.3 Endpoints Expostos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api/v1/search` | Busca FTS com BM25 |
| GET | `/api/v1/acordaos/{id}` | Acordao por ID |
| GET | `/api/v1/stats` | Estatisticas do banco |
| POST | `/api/v1/sync` | Trigger sincronizacao |

### 2.4 Fluxo de Dados

```
Portal STJ (CKAN API)
    |
    v
Collector (httpx) --> Processor --> DuckDB
    |                                  |
    v                                  v
Scheduler (APScheduler)           FTS Index (BM25)
                                       |
                                       v
                                 FastAPI (busca)
```

### 2.5 Configuracoes

```yaml
# Environment Variables
DB_PATH: /data/stj/db/stj.duckdb      # Block Volume
ACORDAOS_PATH: /data/stj/acordaos      # PDFs
LOG_LEVEL: INFO
SENTRY_DSN: ${SENTRY_DSN:-}

# DuckDB Config
memory_limit: 2GB
threads: 4
wal_autocheckpoint: 256MB
```

### 2.6 FTS Configuration (Gold Standard)

```sql
PRAGMA create_fts_index(
    'acordaos', 'id', 'ementa', 'texto_integral',
    stemmer = 'portuguese',
    stopwords = 'stopwords_juridico',
    strip_accents = 1,
    lower = 1,
    overwrite = 1
)
```

**Stopwords Juridicas:** 28 palavras (de, a, o, portanto, destarte, outrossim, etc.)

### 2.7 Estado Atual

- **Funcional:** FTS com BM25 funcionando
- **Performance:** ~50ms para queries simples
- **Volume:** Preparado para 50GB+ de dados
- **Sync:** Scheduler integrado com CKAN API

### 2.8 Tech Debt / Problemas

| ID | Severidade | Descricao |
|----|------------|-----------|
| STJ-01 | Baixa | FTS index rebuild manual apos batch insert |
| STJ-02 | Media | Sem cache Redis para queries frequentes |
| STJ-03 | Baixa | Partial indexes nao suportados pelo DuckDB |

---

## 3. TEXT EXTRACTOR - Servico de Extracao PDF [FOCO ESPECIAL]

### 3.1 Identificacao

| Atributo | Valor |
|----------|-------|
| **Nome** | api-text-extractor |
| **Caminho Docker** | `docker/services/text-extractor/` |
| **Caminho Fonte** | `ferramentas/legal-text-extractor/` |
| **Stack** | Python 3.11, FastAPI, Celery, Marker, pdfplumber |
| **Porta Docker** | 8001 |
| **Rota Traefik** | `/api/text` |

### 3.2 Arquitetura

```
text-extractor/
├── api/
│   ├── main.py          # FastAPI + job management
│   └── models.py        # Request/Response schemas
├── celery_worker.py     # Background PDF processor
├── Dockerfile
└── PLAN.md

ferramentas/legal-text-extractor/
├── main.py              # LegalTextExtractor class
└── src/
    ├── engines/
    │   ├── base.py      # ExtractionEngine interface
    │   └── marker_engine.py  # Marker implementation
    ├── core/
    │   └── cleaner.py   # DocumentCleaner
    └── exporters/       # text/markdown/json
```

### 3.3 Pipeline de Extracao

```
PDF Upload
    |
    v
FastAPI (queue job) --> Redis --> Celery Worker
                                       |
                                       v
                              MarkerEngine.extract()
                                       |
                                       v
                              DocumentCleaner.clean()
                                       |
                                       v
                              Result --> SQLite (jobs.db)
```

### 3.4 Endpoints Expostos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/health` | Health check |
| POST | `/api/v1/extract` | Queue extraction job |
| GET | `/api/v1/jobs/{id}` | Get job status/result |
| GET | `/api/v1/jobs/{id}/download` | Download result |

### 3.5 Configuracoes

```yaml
# Environment Variables
GEMINI_API_KEY: ${GEMINI_API_KEY}
CELERY_BROKER_URL: redis://redis:6379/0
CELERY_RESULT_BACKEND: redis://redis:6379/0
MARKER_CACHE_DIR: /app/cache
MAX_CONCURRENT_JOBS: 2
JOB_TIMEOUT_SECONDS: 600

# Marker Config
output_format: markdown
paginate_output: true
disable_image_extraction: true    # CRITICO: Evita 80MB de base64
drop_repeated_text: true
keep_pageheader_in_output: false
keep_pagefooter_in_output: false
```

### 3.6 Marker Engine - Detalhes Tecnicos

**Requisitos de Memoria:**
- Modelo base: ~8GB RAM
- OCR por pagina: ~2GB adicional
- Recomendado: 10GB+ RAM

**Modos de Operacao:**
1. **Texto Nativo:** Usa `pdftext` (rapido, sem OCR)
2. **OCR Automatico:** Surya OCR quando pagina e escaneada
3. **Force OCR:** Forca OCR em todas as paginas

### 3.7 BUG CRITICO: Trava em 10%

#### Sintoma
Extracao com Marker trava indefinidamente em `progress=10%`.

#### Analise do Codigo

```python
# celery_worker.py:256
update_job_db(job_id, progress=10.0)

# Aqui o fluxo chama:
if engine == "marker":
    full_text, pages_processed, metadata = extract_with_marker(pdf_path, options)
```

O `extract_with_marker()` chama:
```python
# celery_worker.py:94-97
converter = PdfConverter(artifact_dict=artifact_dict)
rendered = converter(pdf_path)  # <-- AQUI TRAVA
```

#### Causa Raiz Provavel

| Hipotese | Probabilidade | Evidencia |
|----------|---------------|-----------|
| **H1: OOM em modelo Marker** | Alta | Marker requer 10GB+ RAM, container pode ter limite menor |
| **H2: Deadlock no converter** | Media | `--pool=solo` no Celery pode causar bloqueio |
| **H3: PDF corrompido/complexo** | Media | Alguns PDFs juridicos tem estrutura anomala |
| **H4: Timeout silencioso** | Baixa | `soft_time_limit=570s` deveria gerar excecao |

#### Pontos de Investigacao

1. **Verificar logs do container:**
   ```bash
   docker logs -f api-text-extractor
   docker logs -f <celery-worker-container>
   ```

2. **Verificar memoria:**
   ```bash
   docker stats api-text-extractor
   ```

3. **Verificar Celery pool:**
   - Atual: `--pool=solo` (single process)
   - Problema: Marker pode bloquear todo o worker

4. **Verificar timeout:**
   - `task_time_limit=600s`
   - `soft_time_limit=570s`
   - Se nao houver excecao, Celery pode estar morto

### 3.8 Solucoes Propostas

#### Curto Prazo (Workaround)

```python
# celery_worker.py - Adicionar timeout explicito
import signal

def timeout_handler(signum, frame):
    raise TimeoutError("Marker extraction timeout")

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(300)  # 5 minutos max

try:
    rendered = converter(pdf_path)
finally:
    signal.alarm(0)
```

#### Medio Prazo (Arquitetural)

1. **Aumentar RAM do container:**
   ```yaml
   api-text-extractor:
     deploy:
       resources:
         limits:
           memory: 12G
   ```

2. **Usar pool `prefork` em vez de `solo`:**
   ```python
   celery_app.worker_main([
       "worker",
       "--pool=prefork",
       "--concurrency=1"
   ])
   ```

3. **Adicionar progress callback:**
   ```python
   # Se Marker suportar callback
   def progress_callback(page, total):
       update_job_db(job_id, progress=10 + (page/total)*60)

   rendered = converter(pdf_path, progress_callback=progress_callback)
   ```

#### Longo Prazo (Fallback Robusto)

```python
# Implementar fallback automatico para pdfplumber
try:
    result = extract_with_marker(pdf_path, options)
except (TimeoutError, MemoryError) as e:
    logger.warning(f"Marker failed, falling back to pdfplumber: {e}")
    result = extract_with_pdfplumber(pdf_path, options)
```

### 3.9 Tech Debt / Problemas

| ID | Severidade | Descricao |
|----|------------|-----------|
| **TE-01** | **CRITICA** | Trava em 10% com Marker (ver 3.7) |
| TE-02 | Alta | Sem mecanismo de fallback para pdfplumber |
| TE-03 | Alta | Sem progress granular durante extracao |
| TE-04 | Media | Celery pool=solo pode bloquear |
| TE-05 | Media | Sem limite de tamanho de arquivo no upload |
| TE-06 | Baixa | Singleton Marker nao thread-safe |

---

## 4. DOC ASSEMBLER - Montador de Documentos

### 4.1 Identificacao

| Atributo | Valor |
|----------|-------|
| **Nome** | api-doc-assembler |
| **Caminho Docker** | `docker/services/doc-assembler/` |
| **Caminho Fonte** | `ferramentas/legal-doc-assembler/` |
| **Stack** | Python 3.11, FastAPI, python-docx, jinja2 |
| **Porta Docker** | 8002 |
| **Rota Traefik** | `/api/doc` |

### 4.2 Arquitetura

```
doc-assembler/
├── api/
│   ├── main.py           # FastAPI app
│   ├── models.py         # Pydantic schemas
│   ├── builder_routes.py # Template builder endpoints
│   └── builder_models.py # Builder schemas
├── Dockerfile
└── README.md

ferramentas/legal-doc-assembler/
├── src/
│   ├── engine.py         # DocumentEngine core
│   ├── template_manager.py
│   ├── template_builder.py
│   ├── docx_parser.py
│   └── normalizers.py    # Brazilian legal formats
└── tests/
```

### 4.3 Endpoints Expostos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api/v1/templates` | List templates |
| GET | `/api/v1/templates/{id}` | Template details + variables |
| POST | `/api/v1/validate` | Validate data against template |
| POST | `/api/v1/preview` | Preview rendered text |
| POST | `/api/v1/assemble` | Generate DOCX document |
| POST | `/api/v1/builder/*` | Template builder endpoints |

### 4.4 Fluxo de Dados

```
Template DOCX ({{ variaveis }})
         |
         v
    DocumentEngine
         |
    +----+----+
    |         |
    v         v
validate()  render()
    |         |
    v         v
 Missing    DOCX Output
 Fields     + download URL
```

### 4.5 Normalizadores Brasileiros

```python
# normalizers.py
- cpf_normalizer      # 000.000.000-00
- cnpj_normalizer     # 00.000.000/0000-00
- oab_normalizer      # OAB/XX 000.000
- currency_normalizer # R$ 1.234,56
- date_normalizer     # 01 de janeiro de 2026
- process_normalizer  # 0000000-00.0000.0.00.0000
```

### 4.6 Estado Atual

- **Funcional:** Templates, validacao, preview, render
- **Templates:** Volume Docker em `/app/templates`
- **Output:** Volume Docker em `/app/outputs`
- **Builder:** UI para criar templates via API

### 4.7 Tech Debt / Problemas

| ID | Severidade | Descricao |
|----|------------|-----------|
| DA-01 | Baixa | Templates hardcoded no volume |
| DA-02 | Baixa | Sem versionamento de templates |
| DA-03 | Media | Output files nao sao limpos automaticamente |

---

## 5. TRELLO MCP - Integracao Trello

### 5.1 Identificacao

| Atributo | Valor |
|----------|-------|
| **Nome** | api-trello |
| **Caminho Docker** | `docker/services/trello-mcp/` |
| **Caminho Fonte** | `ferramentas/trello-mcp/` |
| **Stack** | Python 3.11, FastAPI, aiohttp, slowapi |
| **Porta Docker** | 8004 |
| **Rota Traefik** | `/api/trello` |

### 5.2 Arquitetura

```
trello-mcp/
├── api/
│   ├── main.py       # FastAPI app + all endpoints
│   └── schemas.py    # API request/response schemas
├── trello_src/       # Copied from ferramentas/
│   ├── models.py     # Trello domain models
│   └── trello_client.py  # Async Trello API client
└── Dockerfile
```

### 5.3 Endpoints Expostos

| Categoria | Endpoints |
|-----------|-----------|
| **Boards** | `GET /api/v1/boards`, `GET /api/v1/boards/{id}` |
| **Cards** | CRUD completo + move, archive, batch |
| **Checklists** | CRUD + check items |
| **Attachments** | GET, POST, DELETE |
| **Comments** | CRUD |
| **Custom Fields** | PUT (update value) |
| **Search** | Advanced search com operadores Trello |
| **MCP** | `GET /api/v1/mcp/tools/list`, `POST /api/v1/mcp/tools/call` |

### 5.4 Rate Limiting

```python
# 100 requests/minute por IP
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
```

### 5.5 Configuracoes

```yaml
TRELLO_API_KEY: ${TRELLO_API_KEY}
TRELLO_API_TOKEN: ${TRELLO_API_TOKEN}
```

### 5.6 Estado Atual

- **Funcional:** Todas operacoes CRUD
- **Rate Limit:** Local (100/min) + Trello API (100/10s)
- **Retry Logic:** Implementado no client
- **MCP Bridge:** Endpoints para integracao com Claude

### 5.7 Tech Debt / Problemas

| ID | Severidade | Descricao |
|----|------------|-----------|
| TR-01 | Baixa | Rate limit em memoria (deveria usar Redis) |
| TR-02 | Baixa | Credenciais sanitizadas mas nao encriptadas |

---

## 6. LEDES CONVERTER - Conversor de Faturas

### 6.1 Identificacao

| Atributo | Valor |
|----------|-------|
| **Nome** | api-ledes-converter |
| **Caminho Docker** | `docker/services/ledes-converter/` |
| **Stack** | Python 3.11, FastAPI, python-docx, python-magic |
| **Porta Docker** | 8003 |
| **Rota Traefik** | `/api/ledes` |

### 6.2 Arquitetura

```
ledes-converter/
├── api/
│   ├── main.py      # FastAPI + conversion logic
│   └── models.py    # LEDES schemas
├── Dockerfile
└── COMPLIANCE_AUDIT.md
```

### 6.3 Endpoints Expostos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/health` | Health check |
| POST | `/convert/docx-to-ledes` | Converte DOCX para LEDES 1998B |

### 6.4 LEDES 1998B Compliance

```
- Linha 1: LEDES1998B[]
- Linha 2: 24 campos header (ALL CAPS, pipe-delimited)
- Linhas 3+: Dados com 24 campos cada
- Encoding: ASCII only
- Currency: max 14 digits + 2 decimals
- Date: YYYYMMDD
```

### 6.5 Seguranca

```python
# Validacoes implementadas
- MIME type via magic bytes
- ZIP header check (PK)
- File size limit: 10MB
- Rate limit: 10 req/min
- Input sanitization
- Temp file cleanup
```

### 6.6 Estado Atual

- **Funcional:** Conversao DOCX para LEDES
- **Configuravel:** JSON config para law_firm, client, matter
- **Compliance:** LEDES 1998B spec compliant

### 6.7 Tech Debt / Problemas

| ID | Severidade | Descricao |
|----|------------|-----------|
| LE-01 | Baixa | Rate limit em memoria |
| LE-02 | Baixa | Parsing de invoice depende de formato especifico |

---

## 7. INFRAESTRUTURA

### 7.1 Docker Compose

```yaml
services:
  reverse-proxy:     # Traefik v3.6.5
  frontend-react:    # React SPA
  api-stj:           # STJ Service
  api-text-extractor: # Text Extractor
  api-doc-assembler: # Doc Assembler
  api-trello:        # Trello MCP
  api-ledes-converter: # LEDES
  redis:             # Redis 7 Alpine
  prometheus:        # Metrics
  grafana:           # Dashboards
```

### 7.2 Volumes

| Volume | Uso |
|--------|-----|
| `shared-data` | Arquivos compartilhados |
| `templates` | Templates de documentos |
| `text-extractor-cache` | Cache do Marker |
| `redis-data` | Persistencia Redis |
| `prometheus-data` | Metricas |
| `grafana-data` | Dashboards |
| `/data/stj` (bind) | Block Volume para STJ |

### 7.3 Rede

```
legal-network (bridge)
    |
    +-- reverse-proxy (traefik:80)
    +-- frontend-react (:3000)
    +-- api-stj (:8000)
    +-- api-text-extractor (:8001)
    +-- api-doc-assembler (:8002)
    +-- api-ledes-converter (:8003)
    +-- api-trello (:8004)
    +-- redis (:6379)
    +-- prometheus (:9090)
    +-- grafana (:3001)
```

### 7.4 Autenticacao

```
# Basic Auth via Traefik
Users: PGR, MCBS, ABP
Middleware: auth.basicauth
```

---

## 8. SHARED MODULES

### 8.1 Sentry Config

```python
# shared/sentry_config.py
- init_sentry(service_name)
- capture_exception()
- capture_message()
- set_user()
- add_breadcrumb()

# Filtros
- Ignora 4xx errors
- Ignora connection errors
- Ignora health checks em traces
```

### 8.2 Logging Config

```python
# shared/logging_config.py
- setup_logging(service_name) -> JSONFormatter
- get_logger(name)
- request_id_var (ContextVar)

# Output Format
{
  "timestamp": "2026-01-17T...",
  "level": "INFO",
  "service": "stj-api",
  "request_id": "abc-123",
  "message": "...",
  "module": "...",
  "extra": {...}
}
```

### 8.3 Middleware

```python
# shared/middleware.py
- RequestIDMiddleware: Adiciona X-Request-ID
```

---

## 9. RESUMO DE RISCOS

### 9.1 Riscos Criticos

| ID | Servico | Risco | Mitigacao |
|----|---------|-------|-----------|
| **TE-01** | Text Extractor | Trava em 10% | Ver secao 3.8 |

### 9.2 Riscos Altos

| ID | Servico | Risco | Mitigacao |
|----|---------|-------|-----------|
| TE-02 | Text Extractor | Sem fallback para pdfplumber | Implementar try/catch |
| TE-03 | Text Extractor | Sem progress granular | Adicionar callback |
| TE-04 | Text Extractor | Celery pool=solo | Mudar para prefork |

### 9.3 Riscos Medios

| ID | Servico | Risco | Mitigacao |
|----|---------|-------|-----------|
| FE-02 | Frontend | React 19 RC | Monitorar breaking changes |
| FE-04 | Frontend | Tailwind v4 alpha | Considerar rollback para v3 |
| STJ-02 | STJ API | Sem cache Redis | Implementar cache |
| DA-03 | Doc Assembler | Output nao limpo | Implementar cleanup job |

---

## 10. PROXIMOS PASSOS RECOMENDADOS

### Prioridade 1: Fix Text Extractor

1. Investigar logs e memoria do container
2. Implementar timeout explicito no Marker
3. Adicionar fallback para pdfplumber
4. Aumentar RAM do container para 12GB

### Prioridade 2: Estabilizar Frontend

1. Considerar downgrade para React 18 estavel
2. Downgrade Tailwind para v3 estavel
3. Adicionar testes unitarios basicos

### Prioridade 3: Melhorias de Infraestrutura

1. Implementar Redis cache para STJ queries
2. Adicionar job de cleanup para outputs
3. Migrar rate limits para Redis

---

*Fim do Relatorio de Auditoria Tecnica*
