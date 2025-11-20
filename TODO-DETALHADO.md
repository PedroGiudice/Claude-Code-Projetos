# ✅ TODO LIST DETALHADO - DESENVOLVIMENTO PRIORITÁRIO

**Data**: 2025-11-20
**Baseado em**: ROADMAP-DESENVOLVIMENTO.md + AUDITORIA-CLAUDE.md
**Status**: Pronto para execução

---

## COMO USAR ESTE TODO LIST

Cada tarefa tem:
- **[ ]** = Não iniciada
- **[→]** = Em progresso
- **[✓]** = Completa
- **Estimativa** em horas/dias
- **Dependências** (o que precisa estar pronto antes)
- **Entregável** concreto

---

## SPRINT 1 - FOUNDATION (2 SEMANAS)

**Objetivo**: Stack de extração de PDF production-ready
**Prioridade**: P0 - CRÍTICO

---

### PROJETO 1: pdf-extractor-cli (Fase 2 - OCR)

**Localização**: `legal-extraction/pdf-extractor-cli/`
**Status Atual**: ✅ Fase 1 MVP completo
**Próximo**: Integração PaddleOCR

#### Tarefa 1.1 - Setup PaddleOCR
- [ ] Pesquisar instalação PaddleOCR (Windows + Linux)
- [ ] Adicionar paddleocr a requirements.txt
- [ ] Criar módulo `src/pdf_extractor/ocr/paddle.py`
- [ ] Testar instalação em venv local
- **Estimativa**: 4 horas
- **Dependências**: Nenhuma
- **Entregável**: `paddle.py` com wrapper funcional

#### Tarefa 1.2 - Detecção de PDFs Escaneados
- [ ] Implementar `is_scanned()` em `src/pdf_extractor/core/detector.py`
- [ ] Lógica: Verificar se páginas têm <50 caracteres de texto
- [ ] Adicionar flag `--force-ocr` no CLI
- [ ] Testar com PDF escaneado real
- **Estimativa**: 3 horas
- **Dependências**: Tarefa 1.1
- **Entregável**: Detecção automática funcionando

#### Tarefa 1.3 - Processamento Paralelo de Páginas
- [ ] Implementar `parallel_ocr()` com multiprocessing
- [ ] Adicionar barra de progresso (rich.progress)
- [ ] Configurar max_workers baseado em CPU cores
- [ ] Testar com PDF de 20+ páginas
- **Estimativa**: 6 horas
- **Dependências**: Tarefa 1.2
- **Entregável**: OCR paralelo funcional

#### Tarefa 1.4 - Integração no Pipeline
- [ ] Modificar `cli/main.py` para detectar e processar PDFs escaneados
- [ ] Adicionar opção `--ocr-lang` (por, eng)
- [ ] Merge de texto OCR com texto estrutural (hybrid mode)
- [ ] Testar pipeline completo
- **Estimativa**: 4 horas
- **Dependências**: Tarefa 1.3
- **Entregável**: CLI com OCR integrado

#### Tarefa 1.5 - Testes End-to-End (7 Sistemas)
- [ ] **Teste PJE**: Processo TRT com código verificação
  - Verificar: Remoção de código, timestamps, URLs
  - Métrica: Redução 15-20%, confiança >85%
- [ ] **Teste ESAJ**: Processo TJSP com selo lateral
  - Verificar: Remoção de selo, QR codes
  - Métrica: Redução 20-25%, confiança >90%
- [ ] **Teste STF**: Documento com marca d'água CPF
  - Verificar: Remoção de CPF, alertas, PKCS7
  - Métrica: Redução 25-30%, confiança >95%
- [ ] **Teste STJ**: Documento com múltiplas assinaturas
  - Verificar: Remoção de códigos, URLs, timestamps
  - Métrica: Redução 25-30%, confiança >95%
- [ ] **Teste EPROC**: Documento TRF4 com .p7s
  - Verificar: Detecção correta, limpeza mínima
  - Métrica: Redução 10-15%, confiança >85%
- [ ] **Teste PROJUDI**: Documento variação regional
  - Verificar: Detecção genérica, limpeza PAdES
  - Métrica: Redução 15-20%, confiança >70%
- [ ] **Teste PDF Escaneado**: 200 DPI
  - Verificar: OCR confidence >85%
  - Métrica: CER <0.5%, WER <2.5%
- [ ] Criar `TEST_RESULTS.md` com todas as métricas
- **Estimativa**: 16 horas (2 dias)
- **Dependências**: Tarefa 1.4
- **Entregável**: TEST_RESULTS.md com 7 testes validados

#### Tarefa 1.6 - Módulo Python Importável
- [ ] Criar `src/pdf_extractor/api.py` com interface programática
- [ ] Funções: `extract_text()`, `detect_system()`, `clean_text()`
- [ ] Documentar API no README.md
- [ ] Testar importação: `from pdf_extractor import extract_text`
- **Estimativa**: 3 horas
- **Dependências**: Tarefa 1.5
- **Entregável**: API programática funcional

**TOTAL PROJETO 1**: 36 horas (5 dias úteis)

---

### PROJETO 2: legal-text-extractor (Fase 2 M4)

**Localização**: `agentes/legal-text-extractor/`
**Status Atual**: ✅ Milestone 3 completo (Self-Improvement)
**Próximo**: End-to-End Testing

#### Tarefa 2.1 - Preparar Documentos de Teste
- [ ] Baixar 4 PDFs reais: PJE, ESAJ, STF, STJ
- [ ] Criar ground truth manual (seções esperadas)
- [ ] Salvar em `test-documents/` com metadados
- **Estimativa**: 4 horas
- **Dependências**: Nenhuma
- **Entregável**: 4 PDFs anotados em test-documents/

#### Tarefa 2.2 - Implementar Testes E2E
- [ ] Criar `tests/test_e2e_section_extraction.py`
- [ ] Testar extração de seções para cada sistema
- [ ] Calcular precision/recall/F1 vs ground truth
- [ ] Fuzzy matching para comparar seções (fuzzywuzzy)
- **Estimativa**: 6 horas
- **Dependências**: Tarefa 2.1
- **Entregável**: Testes E2E passando com F1 >85%

#### Tarefa 2.3 - Validação de Learning System
- [ ] Processar 10 documentos de cada sistema
- [ ] Verificar se patterns são extraídos corretamente
- [ ] Validar few-shot auto-seleção
- [ ] Verificar métricas de performance trends
- **Estimativa**: 4 horas
- **Dependências**: Tarefa 2.2
- **Entregável**: Relatório de learning com gráficos

#### Tarefa 2.4 - Expandir Agent Definition
- [ ] Editar `.claude/agents/legal-text-extractor.md`
- [ ] Expandir de ~100 para ~250 linhas
- [ ] Detalhar: SDK integration, learning system, self-improvement
- [ ] Adicionar exemplos de uso e capabilities
- [ ] Documentar integração com pdf-extractor-cli (planejada)
- **Estimativa**: 2 horas
- **Dependências**: Nenhuma (paralelo)
- **Entregável**: Agent definition completa (250+ linhas)

#### Tarefa 2.5 - Integração com pdf-extractor-cli (Planejamento)
- [ ] Criar documento de design: `docs/INTEGRATION_PDF_CLI.md`
- [ ] Definir API: legal-text-extractor usa pdf-extractor-cli como engine
- [ ] Planejar: pdf-extractor-cli extrai texto → legal-text-extractor analisa semântica
- [ ] Estimar esforço de implementação
- **Estimativa**: 3 horas
- **Dependências**: Projeto 1 concluído
- **Entregável**: Design doc com API definida

**TOTAL PROJETO 2**: 19 horas (2.5 dias úteis)

---

### PROJETO 3: verbose-correct-doodle (Testes)

**Localização**: `legal-extraction/verbose-correct-doodle/`
**Status Atual**: ✅ v4.1.3 Production
**Próximo**: Bateria de testes obrigatórios

#### Tarefa 3.1 - Setup de Testes
- [ ] Criar diretório `test-results/`
- [ ] Preparar 8 PDFs de teste (mesmos do Projeto 1)
- [ ] Criar template de relatório de teste
- **Estimativa**: 2 horas
- **Dependências**: Nenhuma
- **Entregável**: Ambiente de testes pronto

#### Tarefa 3.2 - Executar Bateria de Testes (README linhas 224-296)
- [ ] **Teste 1 PJE**: Verificar remoção código, redução 15-20%
- [ ] **Teste 2 ESAJ**: Verificar remoção selo, redução 20-25%
- [ ] **Teste 3 STF**: Verificar remoção CPF, redução 25-30%
- [ ] **Teste 4 STJ**: Verificar remoção assinaturas, redução 25-30%
- [ ] **Teste 5 EPROC**: Verificar detecção .p7s, redução 10-15%
- [ ] **Teste 6 PROJUDI**: Verificar genérico, redução 15-20%
- [ ] **Teste 7 OCR**: Verificar confidence >85%
- [ ] **Teste 8 Blacklist**: Verificar remoção 100%
- [ ] Capturar screenshots de cada teste
- [ ] Registrar métricas em planilha
- **Estimativa**: 12 horas (1.5 dias)
- **Dependências**: Tarefa 3.1
- **Entregável**: 8 testes executados com screenshots

#### Tarefa 3.3 - Documentar Resultados
- [ ] Criar `TEST_RESULTS.md` com tabela de métricas
- [ ] Adicionar screenshots de cada teste
- [ ] Comparar com targets (CER <0.5%, WER <2.5%)
- [ ] Listar issues encontrados
- **Estimativa**: 4 horas
- **Dependências**: Tarefa 3.2
- **Entregável**: TEST_RESULTS.md completo

#### Tarefa 3.4 - Fix de Issues
- [ ] Corrigir padrões regex conforme issues encontrados
- [ ] Re-testar casos que falharam
- [ ] Atualizar módulos afetados
- **Estimativa**: 8 horas (1 dia)
- **Dependências**: Tarefa 3.3
- **Entregável**: Todos os 8 testes passando

**TOTAL PROJETO 3**: 26 horas (3 dias úteis)

---

### PROJETO 4: Auditoria .claude/ (Fixes)

**Localização**: `.claude/`
**Status Atual**: 93/100 (Excelente)
**Próximo**: Resolver issues identificados

#### Tarefa 4.1 - Expandir legal-text-extractor.md
- [ ] Já incluída em Projeto 2, Tarefa 2.4
- **Estimativa**: 0 horas (já contabilizada)
- **Entregável**: Agent definition completa

#### Tarefa 4.2 - Completar Skills Placeholders
- [ ] Identificar 4º placeholder (além de deep-parser, ocr-pro, sign-recognition)
- [ ] **Opção A**: Completar SKILL.md para cada uma (4x3h = 12h)
- [ ] **Opção B**: Remover diretórios vazios (1h)
- [ ] **Decisão**: Avaliar utilidade de cada skill
- **Estimativa**: 1-12 horas (dependendo da decisão)
- **Dependências**: Nenhuma
- **Entregável**: 40/40 skills funcionais OU 36/36 (removidas as 4)

#### Tarefa 4.3 - Decidir Statusline Permanentemente
- [ ] Avaliar resultados teste vibe-log Gordon Co-pilot
- [ ] Se bem-sucedido: remover statusline-deprecated-backup/
- [ ] Se inconclusivo: reativar professional-statusline.js v4.0
- [ ] Atualizar settings.json com decisão final
- **Estimativa**: 1 hora
- **Dependências**: Teste vibe-log (fora do escopo)
- **Entregável**: settings.json com decisão permanente

**TOTAL PROJETO 4**: 2-13 horas (0.5-2 dias úteis)

---

## SPRINT 1 - RESUMO EXECUTIVO

| Projeto | Dias Úteis | Prioridade | Status Inicial |
|---------|-----------|------------|----------------|
| pdf-extractor-cli (Fase 2) | 5 dias | P0 | MVP completo |
| legal-text-extractor (M4) | 2.5 dias | P0 | M3 completo |
| verbose-correct-doodle (Testes) | 3 dias | P0 | v4.1.3 prod |
| Auditoria .claude/ (Fixes) | 0.5-2 dias | P0 | 93/100 |

**TOTAL SPRINT 1**: 11-12.5 dias úteis (2-2.5 semanas)

**Entregáveis ao Final do Sprint 1**:
- ✅ pdf-extractor-cli v2.0 com OCR production-ready
- ✅ legal-text-extractor Fase 2 completo + agent definition robusta
- ✅ verbose-correct-doodle v4.1.3 validado com 8 testes
- ✅ .claude/ em 95/100+ (issues P0 resolvidos)

---

## SPRINT 2 - INTELLIGENCE (4 SEMANAS)

**Objetivo**: Sistema de busca semântica + monitoramento automático
**Prioridade**: P1 - ALTA

---

### PROJETO 5: legal-articles-finder (v2.0)

**Localização**: `agentes/legal-articles-finder/`
**Estimativa**: 1 semana (5 dias úteis)

#### Tarefas
- [ ] Expansão de corpus (CF, CC, CPC novo, Lei 14.133/2021)
- [ ] Atualizar corpus com alterações legislativas recentes
- [ ] Testes de parser (citações complexas, cruzadas)
- [ ] Integração com legal-rag (pipeline automático)
- [ ] Documentação de API

**Entregável**: legal-articles-finder v2.0 com corpus expandido

---

### PROJETO 6: legal-rag (MVP)

**Localização**: `agentes/legal-rag/`
**Estimativa**: 2 semanas (10 dias úteis)

#### Tarefas
- [ ] **Indexing**: Vector store (FAISS), embeddings (sentence-transformers), chunking semântico
- [ ] **Retrieval**: Hybrid search (dense + BM25), re-ranking (cross-encoder)
- [ ] **Generation**: Prompt engineering legal, citation preservation, fact-checking
- [ ] **Testes E2E**: Queries reais, métricas precision@k, recall@k, NDCG
- [ ] Documentação completa

**Entregável**: legal-rag MVP funcional

---

### PROJETO 7: djen-tracker (v1.0)

**Localização**: `agentes/djen-tracker/`
**Estimativa**: 1.5 semanas (7 dias úteis)

#### Tarefas
- [ ] Scraping de fontes DJEN (CNJ, tribunais)
- [ ] Integração com pdf-extractor-cli
- [ ] Sistema de alertas (email, webhook, Telegram)
- [ ] Testes com dados reais (mock de DJEN)
- [ ] Documentação de setup

**Entregável**: djen-tracker v1.0 funcional

---

**TOTAL SPRINT 2**: 22 dias úteis (4.5 semanas)

---

## SPRINT 3 - INTEGRATION (6 SEMANAS)

**Objetivo**: Sistema integrado de automação legal
**Prioridade**: P2 - MÉDIA

---

### PROJETO 8: legal-lens (Análise Semântica)
- **Estimativa**: 2 semanas
- **Tarefas**: Classificação de publicações, extração de entidades, integração RAG

### PROJETO 9: oab-watcher (v1.0)
- **Estimativa**: 2 semanas (reusar código djen-tracker)
- **Tarefas**: Scraping OAB, detecção publicações, alertas

### PROJETO 10: MCP Server (djen-mcp-server)
- **Estimativa**: 1 semana
- **Tarefas**: Expor djen-tracker via MCP, integração Claude Desktop

### PROJETO 11: Skills Placeholders Resolvidos
- **Estimativa**: 3 dias
- **Tarefas**: Completar ou remover deep-parser, ocr-pro, sign-recognition

**TOTAL SPRINT 3**: 5.5 semanas

---

## BACKLOG (SEM SPRINT DEFINIDO)

### aesthetic-master
- **Prioridade**: P3 - BAIXA
- **Estimativa**: TBD
- **Tarefas**: Definir escopo, documentar propósito

### Refatoração legal-braniac-loader.js
- **Prioridade**: P4 - LONGO PRAZO
- **Estimativa**: 2 semanas
- **Tarefas**: Split em módulos (virtual-agents.js, legal-domain.js, decision-engine.js)

### Auditoria de Docs Outdated
- **Prioridade**: P4 - LONGO PRAZO
- **Estimativa**: 1 semana
- **Tarefas**: Verificar datas, arquivar ou atualizar

---

## COMO EXECUTAR

### Para Sprint 1 (IMEDIATO):
```bash
# 1. Criar branch de desenvolvimento
git checkout -b feature/sprint-1-foundation

# 2. Começar pelo Projeto 1 (pdf-extractor-cli)
cd legal-extraction/pdf-extractor-cli
source .venv/bin/activate
# Executar Tarefa 1.1 → 1.6

# 3. Após cada projeto concluído, commit
git add .
git commit -m "feat: completa Projeto 1 - pdf-extractor-cli Fase 2"

# 4. Ao final do Sprint 1, merge e push
git checkout claude/repo-analysis-roadmap-01EnWZpZrC95EtWP18uxYbQT
git merge feature/sprint-1-foundation
git push
```

### Para Sprints 2-3:
- Criar branch feature/ para cada sprint
- Executar projetos sequencialmente respeitando dependências
- Review de código ao final de cada projeto
- Merge e deploy ao final de cada sprint

---

## MÉTRICAS DE PROGRESSO

### Sprint 1
- [ ] Projeto 1: 0/6 tarefas completas (0%)
- [ ] Projeto 2: 0/5 tarefas completas (0%)
- [ ] Projeto 3: 0/4 tarefas completas (0%)
- [ ] Projeto 4: 0/3 tarefas completas (0%)
- **TOTAL**: 0/18 tarefas (0%)

### Sprint 2
- [ ] Projeto 5: 0/5 tarefas (0%)
- [ ] Projeto 6: 0/4 tarefas (0%)
- [ ] Projeto 7: 0/4 tarefas (0%)
- **TOTAL**: 0/13 tarefas (0%)

### Sprint 3
- [ ] Projeto 8: 0/3 tarefas (0%)
- [ ] Projeto 9: 0/3 tarefas (0%)
- [ ] Projeto 10: 0/2 tarefas (0%)
- [ ] Projeto 11: 0/1 tarefa (0%)
- **TOTAL**: 0/9 tarefas (0%)

---

**Criado em**: 2025-11-20
**Última atualização**: 2025-11-20
**Próxima revisão**: Após Sprint 1 (2-2.5 semanas)
