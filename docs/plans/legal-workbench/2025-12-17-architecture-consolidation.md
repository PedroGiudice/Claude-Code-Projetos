# Plano: Consolidação de Arquitetura - Legal Workbench

**Data:** 2025-12-17
**Status:** Em Execução
**Autor:** Claude (Technical Director)
**Aprovado por:** PGR (Product Design Director)

---

## Contexto

O Legal Workbench possui **duas stacks Docker concorrentes**, violando a regra crítica #0 do CLAUDE.md:

| Stack | Localização | Status |
|-------|-------------|--------|
| **Novo** (Traefik + FastHTML Hub) | `legal-workbench/docker-compose.yml` | Pronto, NÃO ativo |
| **Antigo** (Streamlit + PoC) | `legal-workbench/docker/docker-compose.yml` | Ativo, OBSOLETO |

**Objetivo:** Consolidar para uma única arquitetura (Traefik + FastHTML Hub).

---

## Definition of Done (DoD)

- [ ] Stack novo rodando com todos os serviços healthy
- [ ] Stack antigo deprecado e arquivado
- [ ] Acesso funcional via `http://localhost` no browser
- [ ] Hub FastHTML carregando corretamente
- [ ] Módulo STJ navegável e funcional

---

## Fases de Execução

### Fase 1: PREPARAÇÃO (Paralela)

| # | Tarefa | Comando/Ação | Dependência |
|---|--------|--------------|-------------|
| 1.1 | Backup das credenciais | Copiar `docker/.env` → `.env` na raiz do legal-workbench | - |
| 1.2 | Verificar paths dos Dockerfiles | Validar se `docker-compose.yml` referencia corretamente | - |
| 1.3 | Identificar arquivos para arquivar | Listar: streamlit-hub, fasthtml-stj (PoC), docker-compose antigo | - |

### Fase 2: DESLIGAMENTO DO STACK ANTIGO

| # | Tarefa | Comando/Ação | Dependência |
|---|--------|--------------|-------------|
| 2.1 | Parar containers antigos | `docker compose -f docker/docker-compose.yml down` | 1.1 |
| 2.2 | Verificar containers parados | `docker ps` - nenhum `lw-*` deve aparecer | 2.1 |

### Fase 3: ARQUIVAMENTO (Paralela com 4)

| # | Tarefa | Ação | Dependência |
|---|--------|------|-------------|
| 3.1 | Arquivar docker-compose antigo | `docker/docker-compose.yml` → `_archived/legal-workbench-legacy/` | 2.1 |
| 3.2 | Arquivar streamlit-hub | `docker/services/streamlit-hub/` → `_archived/legal-workbench-legacy/` | 2.1 |
| 3.3 | Arquivar fasthtml-stj PoC | `docker/services/fasthtml-stj/` → `_archived/legal-workbench-legacy/` | 2.1 |
| 3.4 | Documentar arquivamento | Criar README na pasta archived | 3.1-3.3 |

### Fase 4: AJUSTES NO DOCKER-COMPOSE NOVO

| # | Tarefa | Ação | Dependência |
|---|--------|------|-------------|
| 4.1 | Copiar .env para raiz | Credenciais disponíveis para novo compose | 1.1 |
| 4.2 | Verificar build contexts | Ajustar paths se necessário | 1.2 |
| 4.3 | Adicionar Redis ao compose | Stack novo não tem Redis explícito - verificar | 1.2 |
| 4.4 | Validar healthchecks | Confirmar que todos os serviços têm health checks | 4.2 |

### Fase 5: SUBIDA DO STACK NOVO

| # | Tarefa | Comando | Dependência |
|---|--------|---------|-------------|
| 5.1 | Build dos containers | `docker compose build` | 4.* |
| 5.2 | Subir stack | `docker compose up -d` | 5.1 |
| 5.3 | Aguardar health checks | `docker compose ps` - todos healthy | 5.2 |
| 5.4 | Verificar logs | `docker compose logs` - sem erros críticos | 5.3 |

### Fase 6: VALIDAÇÃO

| # | Tarefa | Método | Dependência |
|---|--------|--------|-------------|
| 6.1 | Testar Traefik Dashboard | `curl http://localhost:8080/api/overview` | 5.3 |
| 6.2 | Testar Hub root | `curl http://localhost/` | 5.3 |
| 6.3 | Testar API STJ | `curl http://localhost/api/stj/health` | 5.3 |
| 6.4 | Testar no browser | Abrir `http://localhost` | 6.1-6.3 |
| 6.5 | Navegar módulo STJ | Clicar em STJ no Hub | 6.4 |

### Fase 7: LIMPEZA E COMMIT

| # | Tarefa | Ação | Dependência |
|---|--------|------|-------------|
| 7.1 | Remover volumes órfãos | `docker volume prune` (se necessário) | 6.* |
| 7.2 | Atualizar CLAUDE.md | Refletir nova estrutura | 6.5 |
| 7.3 | Commit das mudanças | Git add, commit, push | 7.2 |

---

## Arquivos a Arquivar

```
_archived/legal-workbench-legacy/
├── README.md                    # Documentação do arquivamento
├── docker-compose.yml           # De docker/docker-compose.yml
└── services/
    ├── streamlit-hub/           # De docker/services/streamlit-hub/
    └── fasthtml-stj/            # De docker/services/fasthtml-stj/
```

---

## Arquivos que Permanecerão em docker/services/

```
legal-workbench/docker/services/
├── stj-api/              # Backend STJ (reutilizado)
├── text-extractor/       # Backend extração (reutilizado)
├── doc-assembler/        # Backend documentos (reutilizado)
└── trello-mcp/           # Backend Trello (reutilizado)
```

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Build context incorreto | Build falha | Verificar paths antes de build |
| Portas em conflito | Containers não sobem | Verificar `docker ps` e `ss -tlnp` |
| Credenciais faltando | APIs não autenticam | Copiar .env com todas as vars |
| Volumes com dados | Perda de dados | Volumes nomeados são preservados |
| Hub não conecta aos backends | 502 errors | Verificar network e service names |

---

## Rollback

Se algo der errado:

```bash
# 1. Parar stack novo
docker compose down

# 2. Restaurar docker-compose antigo do _archived
cp _archived/legal-workbench-legacy/docker-compose.yml docker/

# 3. Subir stack antigo
cd docker && docker compose up -d
```

---

## Resultado Esperado

Após execução completa:

- **Uma única fonte de verdade:** `legal-workbench/docker-compose.yml`
- **Entry point:** `http://localhost` (Traefik → Hub)
- **APIs:** `http://localhost/api/{stj,text,doc,trello}`
- **Dashboard Traefik:** `http://localhost:8080`
- **Stack antigo:** Arquivado em `_archived/legal-workbench-legacy/`

---

*Plano criado em: 2025-12-17 11:50 BRT*
