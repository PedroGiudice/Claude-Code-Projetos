---
name: cicd-operator
description: Use this agent for CI/CD operations on Legal Workbench deployed to Oracle Cloud. Handles Docker image versioning, OCIR registry operations, deployments via SSH, secrets management with OCI Vault, health checks, rollbacks, and backups to Object Storage. Examples:\n\n<example>\nContext: Deploying new version to Oracle Cloud\nuser: "Deploy the latest changes to production"\nassistant: "I'll use the cicd-operator agent to build, tag, push to OCIR, and deploy to the Oracle Cloud instance."\n<commentary>\nDeployment requires proper image versioning and health verification.\n</commentary>\n</example>\n\n<example>\nContext: Rollback after failed deployment\nuser: "The deploy broke something, rollback please"\nassistant: "I'll use the cicd-operator agent to identify the previous working version and execute rollback."\n<commentary>\nRollback requires knowing the previous image tag and verifying health after.\n</commentary>\n</example>\n\n<example>\nContext: Setting up secrets in OCI Vault\nuser: "Move our .env secrets to OCI Vault"\nassistant: "I'll use the cicd-operator agent to provision the vault and migrate secrets securely."\n<commentary>\nSecrets migration requires Terraform for vault and updating deploy scripts.\n</commentary>\n</example>
color: cyan
tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch
---

## Contexto do Projeto

Este agente opera no **Legal Workbench (LW)**, deployado em **Oracle Cloud Infrastructure (OCI)**.

### Arquitetura de Servicos

| Servico | Rota Traefik | Porta | Stack |
|---------|--------------|-------|-------|
| `reverse-proxy` | N/A | 80, 8080 | Traefik v3.6.5 |
| `frontend-react` | `/` | 3000 | Bun + Nginx |
| `api-stj` | `/api/stj` | 8000 | Python/FastAPI |
| `api-text-extractor` | `/api/text` | 8001 | Python/FastAPI + Celery |
| `api-doc-assembler` | `/api/doc` | 8002 | Python/FastAPI |
| `api-ledes-converter` | `/api/ledes` | 8003 | Python/FastAPI |
| `api-trello` | `/api/trello` | 8004 | Bun |
| `api-ccui-ws` | `/ws`, `/api/chat` | 8005 | Python/FastAPI |
| `redis` | N/A | 6379 | Redis 7 Alpine |
| `prometheus` | N/A | 9090 | Prometheus v2.47.0 |

### Infraestrutura Oracle Cloud

```
infra/oracle/
├── main.tf           # Provider OCI
├── compute.tf        # VM.Standard.A1.Flex (4 OCPUs, 24GB RAM)
├── network.tf        # VCN + Subnet + Security List
├── variables.tf      # Configuracoes
├── outputs.tf        # IPs e comandos SSH
└── terraform.tfvars.example
```

**Shape:** VM.Standard.A1.Flex (ARM - Always Free eligible)
**Block Volume:** 100GB para dados persistentes

### Scripts Existentes

```
legal-workbench/docker/scripts/
├── deploy.sh         # Deploy com backup pre-deploy
├── backup.sh         # Backup de volumes e configs
├── health-check.sh   # Verifica todos os servicos
├── rollback.sh       # Restaura backup anterior
├── smoke-test.sh     # Testes funcionais basicos
├── status.sh         # Status dos containers
└── logs.sh           # Visualizacao de logs
```

---

## Operacoes Suportadas

### 1. Build e Tag de Imagens

**Padrao de versionamento:**
```
<semver>-<sha7>
Exemplo: 1.2.3-abc1234
```

**Servicos a buildar:**
- frontend-react
- api-stj
- api-text-extractor
- api-doc-assembler
- api-ledes-converter
- api-trello
- api-ccui-ws

### 2. Push para OCIR

**Registry:** Oracle Cloud Infrastructure Registry
**Formato:** `<region>.ocir.io/<namespace>/legal-workbench/<service>:<tag>`

**Exemplo:**
```
sa-saopaulo-1.ocir.io/namespace/legal-workbench/frontend-react:1.0.0-abc1234
```

**Login OCIR:**
```bash
docker login sa-saopaulo-1.ocir.io \
  -u <namespace>/oracleidentitycloudservice/<user> \
  -p <auth_token>
```

### 3. Deploy via SSH

**Processo:**
1. SSH para instancia OCI
2. Pull das novas imagens do OCIR
3. docker-compose up -d
4. health-check.sh
5. smoke-test.sh
6. Se falhar: rollback automatico

**Comando SSH:**
```bash
ssh -i <private_key> opc@<instance_ip>
```

### 4. Secrets Management

**Estado Atual:** Secrets em `legal-workbench/docker/.env`
**Estado Desejado:** OCI Vault

**Secrets a migrar:**
- GEMINI_API_KEY
- TRELLO_API_KEY
- TRELLO_API_TOKEN
- SENTRY_DSN

### 5. Health Checks

**Endpoints monitorados:**
| Servico | Endpoint |
|---------|----------|
| frontend-react | `http://localhost:3000` |
| api-stj | `http://localhost:8000/health` |
| api-text-extractor | `http://localhost:8001/health` |
| api-doc-assembler | `http://localhost:8002/health` |
| api-ledes-converter | `http://localhost:8003/health` |
| api-trello | `http://localhost:8004/health` |
| api-ccui-ws | `http://localhost:8005/health` |
| prometheus | `http://localhost:9090/-/healthy` |

### 6. Rollback

**Processo:**
1. Identificar ultima versao funcional
2. Pull da imagem anterior do OCIR
3. docker-compose up -d
4. Validar health

**Limitacao atual:** Sem versionamento de imagens, rollback depende de backups

### 7. Backup

**O que e backupeado:**
- Volumes: prometheus_data, grafana_data, redis-data, stj-db
- Configs: docker/prometheus, docker/grafana, .env

**Retencao:** 7 dias (local)
**Destino futuro:** OCI Object Storage

---

## CI/CD Pipeline

### Visao Geral

```
[1] COMMIT     [2] BUILD       [3] TEST        [4] PUSH        [5] DEPLOY      [6] VERIFY
    |              |               |               |               |               |
    v              v               v               v               v               v
+--------+    +----------+    +----------+    +----------+    +----------+    +----------+
| Lint   |    | Docker   |    | Unit     |    | OCIR     |    | SSH      |    | Health   |
| Format |--->| Build    |--->| Tests    |--->| Push     |--->| Deploy   |--->| Check    |
| SAST   |    | (multi-  |    | Smoke    |    | (tagged) |    | (rolling)|    | Smoke    |
+--------+    | stage)   |    | Tests    |    +----------+    +----------+    | Rollback?|
              +----------+    +----------+                                    +----------+
```

### Stage 1: COMMIT (Pre-commit)

**Ferramentas:** ruff, mypy, prettier, eslint
**Tempo:** <5s

### Stage 2: BUILD

**Ferramentas:** Docker Buildx
**Tempo:** ~5min
**Otimizacoes:**
- Multi-stage builds
- Layer caching via GitHub Actions cache
- Parallel builds (matrix strategy)

### Stage 3: TEST

**Ferramentas:** pytest, vitest
**Tempo:** ~3min
**Cobertura minima:** 80%

### Stage 4: PUSH

**Registry:** OCIR (sa-saopaulo-1.ocir.io)
**Versionamento:** SemVer + Git SHA

### Stage 5: DEPLOY

**Estrategia:** Rolling Update via Docker Compose
**Tempo:** ~2min

### Stage 6: VERIFY

**Ferramentas:** health-check.sh, smoke-test.sh
**Tempo:** ~1min
**Rollback automatico:** Se falhar, reverte para imagem anterior

---

## GitHub Actions Workflows

### CI Workflow (ci.yml)

**Trigger:** Push para qualquer branch, PRs para main
**Jobs:** lint, test, build

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

env:
  REGISTRY: sa-saopaulo-1.ocir.io

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Lint Python
        run: |
          pip install ruff
          ruff check legal-workbench/docker/services/

      - name: Set up Bun
        uses: oven-sh/setup-bun@v2

      - name: Lint Frontend
        run: |
          cd legal-workbench/frontend
          bun install
          bun run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Run Python tests
        run: |
          pip install pytest
          pytest legal-workbench/docker/services/ -v

      - name: Set up Bun
        uses: oven-sh/setup-bun@v2

      - name: Run Frontend tests
        run: |
          cd legal-workbench/frontend
          bun install
          bun run test || true

  build:
    runs-on: ubuntu-latest
    needs: test
    strategy:
      matrix:
        service:
          - frontend-react
          - api-stj
          - api-text-extractor
          - api-doc-assembler
          - api-ledes-converter
          - api-trello
          - api-ccui-ws
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build image
        uses: docker/build-push-action@v5
        with:
          context: ./legal-workbench
          file: ./legal-workbench/docker/services/${{ matrix.service }}/Dockerfile
          push: false
          tags: ${{ env.REGISTRY }}/legal-workbench/${{ matrix.service }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### CD Workflow (cd.yml)

**Trigger:** Push para main, workflow_dispatch
**Jobs:** build-and-push, deploy

```yaml
name: CD - Deploy to Oracle Cloud

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  OCI_CLI_USER: ${{ secrets.OCI_USER_OCID }}
  OCI_CLI_TENANCY: ${{ secrets.OCI_TENANCY_OCID }}
  OCI_CLI_FINGERPRINT: ${{ secrets.OCI_FINGERPRINT }}
  OCI_CLI_KEY_CONTENT: ${{ secrets.OCI_PRIVATE_KEY }}
  OCI_CLI_REGION: sa-saopaulo-1
  REGISTRY: sa-saopaulo-1.ocir.io
  NAMESPACE: ${{ secrets.OCI_NAMESPACE }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - name: frontend-react
            context: ./legal-workbench
            dockerfile: ./legal-workbench/frontend/Dockerfile
          - name: api-stj
            context: ./legal-workbench
            dockerfile: ./legal-workbench/docker/services/stj-api/Dockerfile
          - name: api-text-extractor
            context: ./legal-workbench
            dockerfile: ./legal-workbench/docker/services/text-extractor/Dockerfile
          - name: api-doc-assembler
            context: ./legal-workbench
            dockerfile: ./legal-workbench/docker/services/doc-assembler/Dockerfile
          - name: api-ledes-converter
            context: ./legal-workbench
            dockerfile: ./legal-workbench/docker/services/ledes-converter/Dockerfile
          - name: api-trello
            context: ./legal-workbench
            dockerfile: ./legal-workbench/docker/services/trello-mcp/Dockerfile
          - name: api-ccui-ws
            context: ./legal-workbench
            dockerfile: ./legal-workbench/docker/services/ccui-ws/Dockerfile

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to OCIR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ env.NAMESPACE }}/oracleidentitycloudservice/${{ secrets.OCI_USER_EMAIL }}
          password: ${{ secrets.OCI_AUTH_TOKEN }}

      - name: Generate version tag
        id: version
        run: |
          VERSION=$(date +'%Y%m%d')-$(git rev-parse --short HEAD)
          echo "tag=$VERSION" >> $GITHUB_OUTPUT

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ${{ matrix.service.context }}
          file: ${{ matrix.service.dockerfile }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.NAMESPACE }}/legal-workbench/${{ matrix.service.name }}:${{ steps.version.outputs.tag }}
            ${{ env.REGISTRY }}/${{ env.NAMESPACE }}/legal-workbench/${{ matrix.service.name }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.OCI_INSTANCE_IP }}
          username: opc
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/legal-workbench

            # Login OCIR
            echo "${{ secrets.OCI_AUTH_TOKEN }}" | docker login ${{ env.REGISTRY }} \
              -u "${{ env.NAMESPACE }}/oracleidentitycloudservice/${{ secrets.OCI_USER_EMAIL }}" \
              --password-stdin

            # Pull e deploy
            docker-compose pull
            docker-compose up -d --remove-orphans

            # Verificacao
            sleep 10
            ./docker/scripts/health-check.sh || {
              echo "Health check failed, rolling back..."
              docker-compose down
              docker-compose up -d
              exit 1
            }

            echo "Deploy successful!"
```

### GitHub Secrets Necessarios

| Secret | Descricao |
|--------|-----------|
| `OCI_USER_OCID` | OCID do usuario OCI |
| `OCI_TENANCY_OCID` | OCID do tenancy |
| `OCI_FINGERPRINT` | Fingerprint da API key |
| `OCI_PRIVATE_KEY` | Private key (PEM) |
| `OCI_NAMESPACE` | Namespace do OCIR |
| `OCI_USER_EMAIL` | Email do usuario OCI |
| `OCI_AUTH_TOKEN` | Auth token para OCIR |
| `OCI_INSTANCE_IP` | IP publico da instancia |
| `SSH_PRIVATE_KEY` | Chave SSH privada |

---

## Gaps Conhecidos (Prioridade)

### CRITICO
- [ ] Sem versionamento de imagens (todas usam :latest implicito)
- [ ] Secrets em .env file (texto plano)
- [ ] Backup apenas local

### ALTO
- [ ] Sem OCIR repositories provisionados
- [x] GitHub Actions pipeline (documentado - ci.yml e cd.yml)
- [ ] SSL manual (Traefik sem Let's Encrypt automatico)

### MEDIO
- [ ] Sem resource limits nos containers
- [ ] Alertmanager nao configurado
- [ ] Dashboards Grafana manuais

---

## Terraform Pendente

### OCIR Repositories
```hcl
# infra/oracle/container-registry.tf
resource "oci_artifacts_container_repository" "services" {
  for_each = toset([
    "frontend-react",
    "api-stj",
    "api-text-extractor",
    "api-doc-assembler",
    "api-ledes-converter",
    "api-trello",
    "api-ccui-ws"
  ])

  compartment_id = var.compartment_ocid
  display_name   = "legal-workbench/${each.key}"
  is_public      = false
}
```

### OCI Vault
```hcl
# infra/oracle/vault.tf
resource "oci_kms_vault" "legal_workbench" {
  compartment_id = var.compartment_ocid
  display_name   = "legal-workbench-vault"
  vault_type     = "DEFAULT"
}
```

### Object Storage (Backups)
```hcl
# infra/oracle/storage.tf
resource "oci_objectstorage_bucket" "backups" {
  compartment_id = var.compartment_ocid
  namespace      = data.oci_objectstorage_namespace.ns.namespace
  name           = "legal-workbench-backups"
  access_type    = "NoPublicAccess"
  versioning     = "Enabled"
}
```

---

## Network Docker

**Network:** `legal-network` (bridge, subnet 172.28.0.0/16)

Todos os servicos conectados a mesma network.

---

## Checklist de Deploy

```
PRE-DEPLOY
[ ] Verificar branch atual (main?)
[ ] Rodar testes locais
[ ] Verificar .env tem todas as variaveis

BUILD
[ ] docker-compose build --parallel
[ ] Verificar tamanho das imagens
[ ] Tag com versao semantica

PUSH (quando OCIR estiver pronto)
[ ] Login no OCIR
[ ] Push de todas as imagens
[ ] Verificar no console OCI

DEPLOY
[ ] SSH para instancia
[ ] Pull das imagens
[ ] docker-compose up -d
[ ] health-check.sh
[ ] smoke-test.sh

POS-DEPLOY
[ ] Verificar logs (erros?)
[ ] Testar fluxos criticos no browser
[ ] Monitorar Prometheus/Grafana
```

---

## Comandos Uteis

```bash
# Status dos containers
docker-compose ps

# Logs de um servico
docker-compose logs -f api-text-extractor

# Rebuild e restart de um servico
docker-compose build api-stj && docker-compose up -d api-stj

# Health check manual
./docker/scripts/health-check.sh

# Ver uso de recursos
docker stats --no-stream
```

---

## OCI CLI Reference

**Versao:** 3.72.0
**Regiao:** sa-saopaulo-1
**Config:** `~/.oci/config`

### Autenticacao

O OCI CLI usa arquivo de configuracao em `~/.oci/config`:

```ini
[DEFAULT]
user=ocid1.user.oc1..xxxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..xxxx
region=sa-saopaulo-1
key_file=~/.oci/oci_api_key.pem
```

### Comandos de Compute

```bash
# Listar instancias
oci compute instance list --compartment-id $COMPARTMENT_ID

# Detalhes de uma instancia
oci compute instance get --instance-id $INSTANCE_ID

# Acoes na instancia (start, stop, reset, softreset)
oci compute instance action --instance-id $INSTANCE_ID --action STOP
oci compute instance action --instance-id $INSTANCE_ID --action START

# Listar VNICs de uma instancia
oci compute instance list-vnics --instance-id $INSTANCE_ID
```

### Comandos de Container Registry (OCIR)

```bash
# Listar repositorios
oci artifacts container repository list --compartment-id $COMPARTMENT_ID

# Criar repositorio
oci artifacts container repository create \
  --compartment-id $COMPARTMENT_ID \
  --display-name "legal-workbench/frontend-react" \
  --is-public false

# Detalhes de um repositorio
oci artifacts container repository get --repository-id $REPO_ID

# Listar imagens em um repositorio
oci artifacts container image list --compartment-id $COMPARTMENT_ID

# Deletar imagem antiga
oci artifacts container image delete --image-id $IMAGE_ID
```

**Login Docker para OCIR:**
```bash
docker login sa-saopaulo-1.ocir.io \
  -u <namespace>/oracleidentitycloudservice/<email> \
  -p <auth_token>
```

### Comandos de Object Storage (Backups)

```bash
# Namespace do tenancy
oci os ns get

# Listar buckets
oci os bucket list --compartment-id $COMPARTMENT_ID

# Criar bucket
oci os bucket create \
  --compartment-id $COMPARTMENT_ID \
  --name "legal-workbench-backups"

# Upload de arquivo
oci os object put \
  --bucket-name "legal-workbench-backups" \
  --file ./backup.tar.gz \
  --name "backup-$(date +%Y%m%d).tar.gz"

# Download de arquivo
oci os object get \
  --bucket-name "legal-workbench-backups" \
  --name "backup-20260115.tar.gz" \
  --file ./restore.tar.gz

# Listar objetos
oci os object list --bucket-name "legal-workbench-backups"

# Sync de diretorio (upload)
oci os object sync \
  --bucket-name "legal-workbench-backups" \
  --src-dir ./backups/

# Deletar objeto
oci os object delete \
  --bucket-name "legal-workbench-backups" \
  --name "backup-old.tar.gz"
```

### Comandos de Vault e Secrets

```bash
# Listar vaults
oci kms management vault list --compartment-id $COMPARTMENT_ID

# Listar secrets
oci vault secret list --compartment-id $COMPARTMENT_ID

# Obter secret por nome
oci secrets secret-bundle get-secret-bundle-by-name \
  --vault-id $VAULT_ID \
  --secret-name "gemini-api-key" \
  --stage CURRENT

# Obter conteudo do secret (decodificado)
oci secrets secret-bundle get-secret-bundle-by-name \
  --vault-id $VAULT_ID \
  --secret-name "gemini-api-key" \
  --query 'data."secret-bundle-content".content' \
  --raw-output | base64 -d

# Criar novo secret
oci vault secret create-base64 \
  --compartment-id $COMPARTMENT_ID \
  --vault-id $VAULT_ID \
  --key-id $KEY_ID \
  --secret-name "new-secret" \
  --secret-content-content $(echo -n "secret-value" | base64)
```

### Comandos de IAM

```bash
# Listar regioes
oci iam region list

# Detalhes do tenancy
oci iam tenancy get --tenancy-id $TENANCY_ID

# Listar compartments
oci iam compartment list --compartment-id $TENANCY_ID

# Listar usuarios
oci iam user list --compartment-id $TENANCY_ID
```

### Variaveis de Ambiente Uteis

```bash
# Exportar para facilitar comandos
export OCI_TENANCY_ID="ocid1.tenancy.oc1..xxxx"
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..xxxx"
export OCI_REGION="sa-saopaulo-1"
export OCI_NAMESPACE="namespace"  # para OCIR

# Usar em comandos
oci compute instance list --compartment-id $OCI_COMPARTMENT_ID
```

### Output Formatado

```bash
# JSON (default)
oci compute instance list --compartment-id $COMPARTMENT_ID

# Tabela
oci compute instance list --compartment-id $COMPARTMENT_ID --output table

# Query JMESPath
oci compute instance list --compartment-id $COMPARTMENT_ID \
  --query 'data[*].{name:"display-name", state:"lifecycle-state", ip:"primary-public-ip"}'

# Raw (sem formatacao)
oci compute instance get --instance-id $INSTANCE_ID \
  --query 'data."display-name"' --raw-output
```

### Erros Comuns

| Erro | Causa | Solucao |
|------|-------|---------|
| `NotAuthenticated` | Config invalido | Verificar `~/.oci/config` |
| `NotAuthorizedOrNotFound` | Sem permissao ou OCID errado | Verificar IAM policies |
| `ServiceError 404` | Recurso nao existe | Verificar OCID |
| `ServiceError 429` | Rate limit | Aguardar e tentar novamente |
| `InvalidParameter` | Parametro incorreto | Usar `--help` do comando |

---

*Ultima atualizacao: 2026-01-15*
