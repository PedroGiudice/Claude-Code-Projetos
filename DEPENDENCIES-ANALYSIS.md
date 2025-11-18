# Análise Completa de Dependências - Hooks & Skills

**Data**: 2025-11-17
**Ambiente**: WSL2 Ubuntu 24.04 LTS
**Node.js**: v24.11.1
**Python**: 3.12.3

---

## RESUMO EXECUTIVO

### Status Geral
- **Hooks**: 10 arquivos JavaScript + 4 shell scripts
- **Skills**: 38 diretórios (35 com SKILL.md funcional)
- **Agentes**: 6 agentes com venvs criados
- **Dependências Node.js**: Apenas built-in (sem npm packages externos além de vibe-log-cli)
- **Dependências Python**: Variam por skill/agente
- **Dependências de Sistema**: NENHUMA instalada (tesseract, poppler ausentes)

### Ações Necessárias
1. ⚠️ **CRÍTICO**: Instalar dependências de sistema (tesseract-ocr, poppler-utils)
2. ✅ **OPCIONAL**: Criar package.json em .claude/hooks (apenas para documentação)
3. ✅ **OPCIONAL**: Instalar playwright browsers (se webapp-testing for usado)

---

## PARTE 1: HOOKS (.claude/hooks/)

### Hooks JavaScript (10 arquivos)

#### 1. analyze-tokens.js
- **Usa**: fs, path (built-in Node.js)
- **Dependências externas**: NENHUMA
- **Status**: ✅ Funcional sem instalação

#### 2. prompt-enhancer.js
- **Usa**: fs.promises, path (built-in)
- **Arquivos de dados**:
  - `.claude/hooks/lib/intent-patterns.json`
  - `.claude/statusline/prompt-quality.json`
  - `.claude/hooks/lib/user-vocabulary.json`
  - `.claude/hooks/lib/pattern-confidence.json`
- **Dependências externas**: NENHUMA
- **Status**: ✅ Funcional sem instalação

#### 3. vibe-analyze-prompt.js
- **Usa**: child_process.spawn, path, fs (built-in)
- **Dependências externas**:
  - **vibe-log-cli** (via npx) - ✅ **INSTALADO** (v0.8.1)
- **Status**: ✅ Funcional (usa npx para vibe-log-cli)
- **Nota**: Requer API key Anthropic em ~/.vibe-log/config.json

#### 4. legal-braniac-loader.js
- **Usa**: fs.promises, path, crypto.randomUUID (built-in)
- **Função**: Auto-discovery de agentes/skills, gerenciamento de sessão
- **Dependências externas**: NENHUMA
- **Status**: ✅ Funcional sem instalação

#### 5. context-collector.js
- **Usa**: fs.promises, path, child_process.execSync (built-in)
- **Módulos locais**:
  - `./lib/validations.js`
  - `./lib/skill-detector.js`
  - `./lib/agent-orchestrator.js`
  - `./lib/aesthetic-enforcer.js`
- **Dependências externas**: NENHUMA
- **Status**: ✅ Funcional sem instalação

#### 6. hook-wrapper.js
- **Usa**: fs, path, child_process (built-in)
- **Função**: Wrapper para executar hooks com timeout e error handling
- **Dependências externas**: NENHUMA
- **Status**: ✅ Funcional sem instalação

#### Bibliotecas em lib/ (4 arquivos)
- **aesthetic-enforcer.js**: fs, path (built-in)
- **agent-orchestrator.js**: fs, path (built-in)
- **skill-detector.js**: fs, path (built-in)
- **validations.js**: fs, path, child_process (built-in)

#### JSON de configuração (4 arquivos)
- intent-patterns.json (15KB)
- pattern-confidence.json (923 bytes)
- user-vocabulary.json (4.3KB)
- legal-braniac-session.json (8.6KB)

### Hooks Shell (4 arquivos)

#### 1. venv-activate-global.sh
- **Função**: Ativa venv global do projeto
- **Dependências**: Python3, venv module

#### 2. venv-auto-activate.sh
- **Função**: Detecta e ativa venv automaticamente
- **Dependências**: Python3, venv module

#### 3. test-learning.sh
- **Função**: Testa sistema de aprendizado de prompts
- **Dependências**: Bash, curl (para testar API)

#### 4. test-prompt-enhancer.sh
- **Função**: Testa prompt-enhancer.js
- **Dependências**: Node.js, jq (JSON processor)

### Conclusão Hooks
**TODAS as dependências são built-in do Node.js ou shell padrão.**

❌ **NÃO é necessário** criar package.json com dependências
✅ **OPCIONAL**: Criar package.json apenas para scripts de desenvolvimento (eslint, prettier, etc)

---

## PARTE 2: SKILLS (skills/)

### Skills Funcionais com SKILL.md (35 skills)

#### Skills Python que requerem bibliotecas

##### 1. skills/pdf/
- **Scripts**: 8 arquivos Python
- **Bibliotecas necessárias**:
  - `pypdf` - Manipulação de PDFs
  - `pdfplumber` - Extração de texto/tabelas
  - `pdf2image` - Conversão PDF → imagem
  - `PIL` (Pillow) - Manipulação de imagens
- **Dependências de sistema**:
  - ⚠️ **poppler-utils** (pdfinfo, pdftotext) - NÃO INSTALADO
- **Venv**: ❌ NÃO CRIADO (skill não tem venv próprio)
- **Status**: ⚠️ Requer instalação de poppler-utils

##### 2. skills/webapp-testing/
- **Scripts**: 4 arquivos Python (1 script + 3 examples)
- **Bibliotecas necessárias**:
  - `playwright` - Browser automation
- **Dependências de sistema**:
  - ⚠️ **Playwright browsers** (chromium/firefox/webkit) - NÃO INSTALADO
- **Venv**: ❌ NÃO CRIADO
- **Status**: ⚠️ Requer `playwright install chromium`

##### 3. skills/docx/
- **Scripts**: 3 arquivos Python + ooxml submodule
- **Bibliotecas necessárias**:
  - `defusedxml` - XML parsing seguro
  - `python-docx` (implícito)
- **Venv**: ❌ NÃO CRIADO
- **Status**: ⚠️ Requer instalação de bibliotecas

##### 4. skills/pptx/
- **Descrição**: Manipulação de PowerPoint
- **Bibliotecas necessárias**:
  - `python-pptx`
- **Venv**: ❌ NÃO CRIADO
- **Status**: ⚠️ Requer instalação

##### 5. skills/xlsx/
- **Descrição**: Manipulação de Excel
- **Bibliotecas necessárias**:
  - `openpyxl` ou `xlsxwriter`
- **Venv**: ❌ NÃO CRIADO
- **Status**: ⚠️ Requer instalação

#### Skills que NÃO requerem instalação (30 skills)

Estes skills são puramente instrucionais (SKILL.md apenas):
- architecture-diagram-creator
- artifacts-builder
- code-auditor
- code-execution
- code-refactor
- code-transfer
- codebase-documenter
- conversation-analyzer
- dashboard-creator
- deep-parser
- executing-plans
- feature-planning
- file-operations
- flowchart-creator
- frontend-design
- git-pushing
- ocr-pro (apenas README placeholder)
- project-bootstrapper
- prompt-enhancer
- review-implementing
- root-cause-tracing
- ship-learn-next
- sign-recognition (placeholder)
- skill-creator
- systematic-debugging
- technical-doc-creator
- test-driven-development
- test-fixing
- timeline-creator
- verification-before-completion
- writing-plans

#### Skills sem SKILL.md (3 placeholders)
- article-extractor
- ocr-pro
- sign-recognition

---

## PARTE 3: AGENTES (agentes/)

### Status dos Venvs

Todos os 6 agentes possuem venv criado ✅:

1. **aesthetic-master**
   - Venv: ✅ Criado
   - Dependências: colormath, beautifulsoup4

2. **djen-tracker**
   - Venv: ✅ Criado
   - Dependências: requests, beautifulsoup4, selenium, tenacity, tqdm

3. **legal-articles-finder**
   - Venv: ✅ Criado
   - Dependências: Nenhuma (usa apenas biblioteca padrão)

4. **legal-lens**
   - Venv: ✅ Criado
   - Dependências: requests, python-dateutil, pydantic

5. **legal-rag**
   - Venv: ✅ Criado
   - Dependências: llama-index, spacy, PyMuPDF, transformers, torch

6. **oab-watcher**
   - Venv: ✅ Criado
   - Dependências: requests, python-dateutil, tqdm, tenacity, pydantic

### Validação de Instalação

```bash
# Verificar se venvs possuem dependências instaladas
for agent in agentes/*/; do
  echo "=== ${agent%/} ==="
  source "$agent/.venv/bin/activate"
  pip list | wc -l
  deactivate
done
```

---

## PARTE 4: DEPENDÊNCIAS DE SISTEMA

### APT Packages Necessários

#### 1. Tesseract OCR (para skills/ocr-pro - se implementado)
```bash
sudo apt-get install -y \
  tesseract-ocr \
  tesseract-ocr-por \
  tesseract-ocr-eng
```

**Status**: ❌ NÃO INSTALADO
**Impacto**: Skills de OCR não funcionarão
**Prioridade**: BAIXA (skill ocr-pro é placeholder)

#### 2. Poppler Utils (para skills/pdf/)
```bash
sudo apt-get install -y poppler-utils
```

**Comandos fornecidos**:
- pdfinfo - Extrai metadados
- pdftotext - Extrai texto
- pdftoppm - Converte PDF → imagem
- pdfunite - Mescla PDFs
- pdfseparate - Separa páginas

**Status**: ❌ NÃO INSTALADO
**Impacto**: pdf2image não funcionará (conversão PDF → imagem)
**Prioridade**: MÉDIA (skill pdf/ é funcional, mas scripts específicos falharão)

#### 3. Playwright Browsers (para skills/webapp-testing/)
```bash
# Criar venv para skill
cd skills/webapp-testing
python3 -m venv .venv
source .venv/bin/activate

# Instalar playwright
pip install playwright

# Baixar browsers (chromium recomendado)
playwright install chromium

# Opcional: firefox, webkit
playwright install firefox webkit
```

**Status**: ❌ NÃO INSTALADO
**Impacto**: webapp-testing não funcionará
**Prioridade**: ALTA (se webapp-testing for usado frequentemente)

### Bibliotecas Python de Sistema

#### pdf2image (depende de poppler)
```bash
# Instalar poppler ANTES de pip install pdf2image
sudo apt-get install -y poppler-utils

# Depois instalar no venv do skill
cd skills/pdf
python3 -m venv .venv
source .venv/bin/activate
pip install pdf2image pypdf pdfplumber Pillow
```

#### defusedxml (para skills/docx)
```bash
cd skills/docx
python3 -m venv .venv
source .venv/bin/activate
pip install defusedxml python-docx
```

---

## PARTE 5: AÇÕES EXECUTADAS

### ✅ Análise Completa
- [x] Verificado todos os hooks JavaScript
- [x] Verificado todos os skills customizados
- [x] Verificado status de venvs em agentes
- [x] Identificado dependências de sistema ausentes

### ⚠️ Dependências Node.js
- **DECISÃO**: NÃO criar package.json em .claude/hooks/
- **Motivo**: Todas as dependências são built-in (fs, path, child_process, crypto)
- **Exceção**: vibe-log-cli (instalado globalmente via npx)

### ❌ Dependências de Sistema (requer sudo)
- [ ] poppler-utils (para pdf skill)
- [ ] tesseract-ocr (para ocr-pro skill - se implementado)
- [ ] playwright browsers (para webapp-testing skill)

### ❌ Venvs em Skills (não criados)
Skills Python que precisam de venv:
- [ ] skills/pdf/.venv
- [ ] skills/webapp-testing/.venv
- [ ] skills/docx/.venv
- [ ] skills/pptx/.venv
- [ ] skills/xlsx/.venv

---

## PARTE 6: PRÓXIMOS PASSOS

### Prioridade ALTA
1. **Instalar poppler-utils** (usado por skills/pdf/)
```bash
sudo apt-get update
sudo apt-get install -y poppler-utils
```

2. **Criar venv em skills/pdf/** (se for usado frequentemente)
```bash
cd skills/pdf
python3 -m venv .venv
source .venv/bin/activate
pip install pypdf pdfplumber pdf2image Pillow
```

### Prioridade MÉDIA
3. **Configurar webapp-testing** (se necessário)
```bash
cd skills/webapp-testing
python3 -m venv .venv
source .venv/bin/activate
pip install playwright
playwright install chromium
```

### Prioridade BAIXA
4. **Instalar tesseract-ocr** (apenas se ocr-pro for implementado)
```bash
sudo apt-get install -y tesseract-ocr tesseract-ocr-por
```

5. **Criar venvs em outros skills** (docx, pptx, xlsx)
```bash
cd skills/docx
python3 -m venv .venv
source .venv/bin/activate
pip install defusedxml python-docx
```

---

## PARTE 7: COMANDOS SUDO NECESSÁRIOS

### Instalação Completa (todas as dependências)
```bash
# 1. Poppler (PDF processing)
sudo apt-get update
sudo apt-get install -y poppler-utils

# 2. Tesseract (OCR)
sudo apt-get install -y \
  tesseract-ocr \
  tesseract-ocr-por \
  tesseract-ocr-eng

# 3. Bibliotecas de desenvolvimento (se necessário compilar pacotes Python)
sudo apt-get install -y \
  build-essential \
  python3-dev \
  libxml2-dev \
  libxslt-dev

# 4. Outros utilitários
sudo apt-get install -y \
  jq \
  curl \
  wget
```

### Instalação Mínima (apenas críticas)
```bash
sudo apt-get update
sudo apt-get install -y poppler-utils
```

---

## PARTE 8: VALIDAÇÃO PÓS-INSTALAÇÃO

### Verificar poppler-utils
```bash
which pdfinfo && echo "✅ poppler instalado" || echo "❌ poppler ausente"
pdfinfo --version
```

### Verificar tesseract
```bash
which tesseract && echo "✅ tesseract instalado" || echo "❌ tesseract ausente"
tesseract --version
tesseract --list-langs
```

### Verificar playwright browsers
```bash
cd skills/webapp-testing
source .venv/bin/activate
playwright --version
ls ~/.cache/ms-playwright/chromium-* && echo "✅ Chromium instalado" || echo "❌ Chromium ausente"
```

### Verificar venvs dos agentes
```bash
for agent in agentes/*/; do
  echo "=== ${agent%/} ==="
  source "$agent/.venv/bin/activate" 2>/dev/null && {
    python --version
    pip list | head -5
    deactivate
  } || echo "❌ Venv não ativado"
done
```

---

## PARTE 9: ESTIMATIVA DE DISK USAGE

### Dependências de Sistema
- poppler-utils: ~5 MB
- tesseract-ocr + langs: ~15 MB
- build-essential: ~200 MB (se necessário)

### Playwright Browsers
- chromium: ~300 MB
- firefox: ~80 MB
- webkit: ~60 MB

### Venvs de Skills (estimativa)
- skills/pdf/.venv: ~50 MB (pypdf, pdfplumber, Pillow)
- skills/webapp-testing/.venv: ~400 MB (playwright + chromium)
- skills/docx/.venv: ~30 MB (defusedxml, python-docx)

**Total estimado**: ~1.2 GB (instalação completa)

---

## CONCLUSÃO

### Status Atual
- **Hooks**: ✅ Todos funcionais sem dependências externas
- **Agentes**: ✅ Todos com venvs criados e dependências instaladas
- **Skills**: ⚠️ 5 skills Python precisam de venvs + dependências de sistema

### Dependências Críticas Ausentes
1. poppler-utils (para pdf skill)
2. playwright browsers (para webapp-testing skill)

### Recomendação
**Executar instalação mínima agora**:
```bash
sudo apt-get update && sudo apt-get install -y poppler-utils
```

**Postergar** instalação de tesseract e playwright até que sejam necessários.

---

**Gerado por**: Legal-Braniac (Orquestrador Mestre)
**Data**: 2025-11-17
**Ambiente**: WSL2 Ubuntu 24.04 LTS
