# Legal Workbench Legacy Stack - ARCHIVED

**Data de Arquivamento:** 2025-12-17
**Motivo:** Consolidação de arquitetura (regra #0 do CLAUDE.md)

---

## Conteúdo Arquivado

### docker-compose.yml
Stack Docker antigo que rodava:
- Streamlit Hub (porta 8501)
- FastHTML STJ PoC (porta 5001)
- Backends via portas diretas (sem Traefik)

### services/streamlit-hub/
Frontend Streamlit original - substituído por FastHTML Hub modular.

### services/fasthtml-stj/
Proof of Concept do módulo STJ em FastHTML - funcionalidade incorporada ao Hub principal.

---

## Substituído Por

**Nova arquitetura:** `legal-workbench/docker-compose.yml`
- Traefik v3.0 como reverse proxy (porta 80)
- FastHTML Hub modular com plugin system (porta 5001 via Traefik)
- APIs roteadas via `/api/{stj,text,doc,trello}`
- Dashboard Traefik (porta 8080)

---

## Rollback (Se Necessário)

```bash
# 1. Parar stack novo
cd legal-workbench && docker compose down

# 2. Restaurar docker-compose antigo
cp _archived/legal-workbench-legacy/docker-compose.yml legal-workbench/docker/

# 3. Restaurar serviços
cp -r _archived/legal-workbench-legacy/services/* legal-workbench/docker/services/

# 4. Subir stack antigo
cd legal-workbench/docker && docker compose up -d
```

---

*Arquivado por consolidação de arquitetura*
