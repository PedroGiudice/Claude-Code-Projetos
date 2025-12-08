# Pipeline Unification Design

**Data:** 2025-12-08
**Status:** Aprovado para implementação
**Objetivo:** Unificar pipeline de extração com foco em redução de tokens mantendo qualidade de contexto

---

## Contexto

### Problema
O `legal-workbench` possui dois pipelines paralelos:
1. **LegalTextExtractor (main.py)** - Pipeline simplificado em uso
2. **PipelineOrchestrator** - Pipeline completo com 8 módulos sofisticados não utilizados

### Módulos Dormentes Identificados
| Módulo | Linhas | Função | Impacto Esperado |
|--------|--------|--------|------------------|
| AdvancedCleaner | 280 | 16 regras de limpeza | ~25% redução |
| CleaningRules | 286 | 25 patterns regex | Base para AdvancedCleaner |
| TextNormalizer | 89 | Whitespace cleanup | ~5-10% redução |
| ImageCleaner | 527 | Pré-processamento OCR | +30% precisão OCR |
| DocumentSegmenter | 630 | Segmentação semântica | Estrutura de seções |
| CleanerEngine | 277 | Detecção adaptativa | Melhor accuracy |
| SectionAnalyzer | 497 | Classificação Claude | Metadados ricos |
| BoundaryDetector | 100+ | Limites de documentos | Multi-doc support |

### Decisões de Design
- **Estratégia:** Substituição gradual (Opção A)
- **Priorização:** Limpeza primeiro (máximo ROI)
- **Meta:** 30-40% redução de tokens com qualidade preservada

---

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    Streamlit UI (workbench)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              LegalTextExtractor (main.py)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Fase 1: TextExtractor (pdfplumber)                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Fase 2: CleanerEngine (detecção sistema)      [NEW] │    │
│  │         └── JudicialSystemDetector                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Fase 3: AdvancedCleaner                       [NEW] │    │
│  │         └── CleaningRules (25 patterns)             │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Fase 4: TextNormalizer                        [NEW] │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Fase 5: DocumentCleaner (existente, melhorado)      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ExtractionResult
                (com stats de redução por fase)
```

---

## Plano de Implementação

### Sprint 1: Integração de Limpeza Avançada

**Objetivo:** Integrar AdvancedCleaner + CleaningRules no pipeline existente

**Tarefas:**

1. **Criar baseline de métricas**
   - Processar 3-5 PDFs de teste
   - Registrar: tamanho original, tamanho final, tokens estimados
   - Salvar resultados em `tests/baseline_metrics.json`

2. **Integrar AdvancedCleaner em main.py**
   - Adicionar import de `src.core.intelligence.cleaner_advanced`
   - Inserir após extração, antes do DocumentCleaner atual
   - Manter DocumentCleaner como fallback/complemento

3. **Adicionar logging de estatísticas por fase**
   - Chars removidos por cada cleaner
   - Padrões matched por categoria
   - Tempo de execução por fase

4. **Medir redução**
   - Reprocessar mesmos PDFs do baseline
   - Comparar métricas
   - Validar qualidade do texto (amostragem manual)

5. **Atualizar UI com métricas detalhadas**
   - Mostrar redução por fase no Streamlit
   - Gráfico de breakdown de limpeza

### Sprint 2: Engine Adaptativo (se Sprint 1 bem-sucedido)

**Objetivo:** Integrar CleanerEngine para detecção adaptativa de sistema

**Tarefas:**
1. Substituir detecção simples por CleanerEngine
2. Aplicar regras específicas por sistema (PJE, ESAJ, EPROC, etc.)
3. Medir melhoria na precisão de detecção

### Sprint 3: Normalização e Polimento

**Objetivo:** TextNormalizer + ajustes finais

**Tarefas:**
1. Integrar TextNormalizer como fase final
2. Configurar níveis de agressividade
3. Documentar pipeline completo

---

## Métricas de Sucesso

| Métrica | Baseline | Meta Sprint 1 | Meta Final |
|---------|----------|---------------|------------|
| Redução de chars | ~20% | ~35% | ~45% |
| Tokens estimados | 20M | 14M | 11M |
| Tempo processamento | baseline | +10% max | +20% max |
| Qualidade texto | baseline | >= baseline | >= baseline |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Limpeza agressiva remove conteúdo útil | Média | Alto | Validação manual + modo conservador |
| Performance degradada | Baixa | Médio | Profiling + cache de regex compilados |
| Incompatibilidade de interfaces | Baixa | Médio | Testes de integração antes de merge |

---

## Comando Inicial para Próxima Sessão

```
Implementar Sprint 1 do plano de unificação de pipeline (docs/plans/2025-12-08-pipeline-unification-design.md):

1. Criar baseline de métricas com 3-5 PDFs de teste
2. Integrar AdvancedCleaner + CleaningRules em main.py
3. Adicionar logging de estatísticas por fase
4. Medir e comparar redução vs baseline
5. Atualizar UI com métricas detalhadas

Contexto:
- Estratégia: Substituição gradual
- Foco: Redução de tokens mantendo qualidade
- Arquivos principais:
  - legal-workbench/ferramentas/legal-text-extractor/main.py
  - src/core/intelligence/cleaner_advanced.py
  - src/core/intelligence/cleaning_rules.py

Usar sub-agents para implementação paralela quando possível.
Meta: 35% redução de caracteres vs baseline atual.
```

---

**Aprovado por:** Technical Director
**Data:** 2025-12-08
