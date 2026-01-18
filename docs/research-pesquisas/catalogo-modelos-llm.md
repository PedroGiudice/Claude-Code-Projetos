# Catálogo de Modelos LLM Open-Source (Janeiro 2026)

## Sumário Executivo

Este catálogo cobre modelos que você pode baixar gratuitamente do HuggingFace e rodar localmente. Com A100 (40GB ou 80GB), você tem acesso a praticamente todos.

---

## 1. LLMs de Propósito Geral

### Tier S — Frontier (Competem com GPT-4/Claude)

| Modelo | Parâmetros | VRAM (FP16) | VRAM (Q4) | Contexto | Licença | Observações |
|--------|------------|-------------|-----------|----------|---------|-------------|
| **DeepSeek-V3** | 671B (37B ativos) | ~140GB | ~70GB | 128K | DeepSeek License | MoE. Melhor open-source atual. Requer multi-GPU. |
| **DeepSeek-R1** | 671B MoE | ~140GB | ~70GB | 128K | MIT | Reasoning model. Chain-of-thought nativo. |
| **Llama 4 Scout** | 109B (17B ativos) | ~50GB | ~28GB | 10M | Llama 4 License | MoE. Contexto absurdo. Novo (Jan 2026). |
| **Llama 4 Maverick** | 400B (17B ativos) | ~180GB | ~90GB | 1M | Llama 4 License | MoE. Flagship da Meta. |
| **Qwen 3** | 235B MoE | ~120GB | ~60GB | 128K | Apache 2.0 | Alibaba. Excelente em código e chinês. |

### Tier A — Production-Ready (70B-72B class)

| Modelo | Parâmetros | VRAM (FP16) | VRAM (Q4) | Contexto | Licença | Observações |
|--------|------------|-------------|-----------|----------|---------|-------------|
| **Llama 3.3 70B** | 70B | 140GB | 35-40GB | 128K | Llama 3.3 License | Melhor Llama denso. Roda em A100 80GB (Q4). |
| **Qwen 2.5 72B** | 72B | 144GB | 36-42GB | 128K | Apache 2.0 | Excelente em código e math. |
| **DeepSeek-V2.5** | 236B (21B ativos) | ~50GB | ~28GB | 128K | DeepSeek License | MoE. Cabe em A100 40GB! |
| **Mistral Large 2** | 123B | 246GB | ~62GB | 128K | Mistral Research | Muito capaz, mas pesado. |

### Tier B — Sweet Spot (27B-35B class)

| Modelo | Parâmetros | VRAM (FP16) | VRAM (Q4) | Contexto | Licença | Observações |
|--------|------------|-------------|-----------|----------|---------|-------------|
| **Qwen 2.5 32B** | 32B | 64GB | 18-22GB | 128K | Apache 2.0 | **Melhor custo-benefício.** |
| **Gemma 2 27B** | 27B | 54GB | 15-18GB | 8K | Gemma License | Google. Muito eficiente. |
| **DeepSeek-R1-Distill 32B** | 32B | 64GB | 18-22GB | 128K | MIT | Reasoning destilado. Excelente. |
| **QwQ 32B** | 32B | 64GB | 18-22GB | 32K | Apache 2.0 | Reasoning model da Alibaba. |
| **Yi-1.5 34B** | 34B | 68GB | 19-23GB | 200K | Apache 2.0 | 01.AI. Contexto longo. |

### Tier C — Eficiente (7B-14B class)

| Modelo | Parâmetros | VRAM (FP16) | VRAM (Q4) | Contexto | Licença | Observações |
|--------|------------|-------------|-----------|----------|---------|-------------|
| **Llama 3.1 8B** | 8B | 16GB | 4-6GB | 128K | Llama License | Baseline sólido. |
| **Qwen 2.5 14B** | 14B | 28GB | 8-10GB | 128K | Apache 2.0 | Muito capaz para o tamanho. |
| **Qwen 3 8B** | 8B | 16GB | 4-6GB | 32K | Apache 2.0 | Novo. Híbrido thinking/non-thinking. |
| **Gemma 2 9B** | 9B | 18GB | 5-7GB | 8K | Gemma License | Compacto e eficiente. |
| **Mistral 7B v0.3** | 7B | 14GB | 4-5GB | 32K | Apache 2.0 | Clássico. Muito testado. |
| **Phi-4** | 14B | 28GB | 8-10GB | 16K | MIT | Microsoft. Treinado em dados sintéticos. |
| **DeepSeek-R1-Distill 14B** | 14B | 28GB | 8-10GB | 128K | MIT | Reasoning compacto. |

### Tier D — Edge/Mobile (1B-3B class)

| Modelo | Parâmetros | VRAM (FP16) | VRAM (Q4) | Contexto | Licença | Observações |
|--------|------------|-------------|-----------|----------|---------|-------------|
| **Llama 3.2 3B** | 3B | 6GB | 2GB | 128K | Llama License | Para dispositivos móveis. |
| **Qwen 2.5 3B** | 3B | 6GB | 2GB | 32K | Apache 2.0 | Surpreendentemente capaz. |
| **Gemma 2 2B** | 2B | 4GB | 1.5GB | 8K | Gemma License | Mínimo viável. |
| **Phi-3.5 Mini** | 3.8B | 7.6GB | 2.5GB | 128K | MIT | Microsoft. Bom para mobile. |

---

## 2. Modelos de Código

| Modelo | Parâmetros | VRAM (Q4) | Contexto | Linguagens | Licença | Observações |
|--------|------------|-----------|----------|------------|---------|-------------|
| **DeepSeek-Coder-V2** | 236B MoE | ~28GB | 128K | 300+ | DeepSeek License | **Melhor para código.** |
| **Qwen 2.5 Coder 32B** | 32B | 18-22GB | 128K | 90+ | Apache 2.0 | Excelente. Compete com GPT-4. |
| **CodeLlama 70B** | 70B | 35-40GB | 100K | 20+ | Llama License | Meta. Muito testado. |
| **StarCoder2 15B** | 15B | 8-10GB | 16K | 600+ | BigCode OpenRAIL | Treinado em The Stack v2. |
| **DeepSeek-Coder 33B** | 33B | 18-22GB | 16K | 87+ | DeepSeek License | Bom custo-benefício. |
| **CodeGemma 7B** | 7B | 4-5GB | 8K | 500+ | Gemma License | Google. Compacto. |
| **Codestral 22B** | 22B | 12-15GB | 32K | 80+ | MNPL | Mistral. Não-comercial. |

---

## 3. Modelos de Embedding (para RAG)

### Tier S — Top Performance

| Modelo | Parâmetros | VRAM | Dimensões | Contexto | Licença | MTEB Score |
|--------|------------|------|-----------|----------|---------|------------|
| **NV-Embed-v2** | 7B | 14GB | 4096 | 32K | NVIDIA License | 69.3 |
| **E5-Mistral-7B** | 7B | 14GB | 4096 | 4K | MIT | 66.6 |
| **GritLM-7B** | 7B | 14GB | 4096 | 4K | Apache 2.0 | 66.0 |

### Tier A — Production Sweet Spot

| Modelo | Parâmetros | VRAM | Dimensões | Contexto | Licença | MTEB Score |
|--------|------------|------|-----------|----------|---------|------------|
| **BGE-M3** | 568M | 1.2GB | 1024 | 8K | MIT | 63.0 |
| **Jina Embeddings v3** | 570M | 1.2GB | 1024 | 8K | Apache 2.0 | 62.5 |
| **E5-Large-v2** | 335M | 0.7GB | 1024 | 512 | MIT | 61.5 |
| **Nomic Embed v1.5** | 137M | 0.3GB | 768 | 8K | Apache 2.0 | 62.3 |

### Tier B — Leves e Rápidos

| Modelo | Parâmetros | VRAM | Dimensões | Contexto | Licença | MTEB Score |
|--------|------------|------|-----------|----------|---------|------------|
| **BGE-Base-v1.5** | 109M | 0.25GB | 768 | 512 | MIT | 59.3 |
| **E5-Small-v2** | 33M | 0.1GB | 384 | 512 | MIT | 57.8 |
| **all-MiniLM-L6-v2** | 22M | 0.05GB | 384 | 256 | Apache 2.0 | 56.3 |

### Multilíngue (inclui Português)

| Modelo | Parâmetros | VRAM | Idiomas | Licença | Observações |
|--------|------------|------|---------|---------|-------------|
| **BGE-M3** | 568M | 1.2GB | 100+ | MIT | **Recomendado para PT-BR.** |
| **multilingual-e5-large** | 560M | 1.2GB | 100+ | MIT | Bom para cross-lingual. |
| **paraphrase-multilingual-mpnet** | 278M | 0.6GB | 50+ | Apache 2.0 | Mais leve. |

---

## 4. Modelos Multimodais (Visão + Texto)

| Modelo | Parâmetros | VRAM (Q4) | Modalidades | Contexto | Licença | Observações |
|--------|------------|-----------|-------------|----------|---------|-------------|
| **Llama 3.2 Vision 90B** | 90B | ~45GB | Texto + Imagem | 128K | Llama License | Flagship multimodal Meta. |
| **Llama 3.2 Vision 11B** | 11B | 6-8GB | Texto + Imagem | 128K | Llama License | Compacto. Bom para OCR. |
| **Qwen2-VL 72B** | 72B | 36-42GB | Texto + Imagem + Vídeo | 32K | Apache 2.0 | Melhor open VLM. |
| **Qwen2-VL 7B** | 7B | 4-6GB | Texto + Imagem + Vídeo | 32K | Apache 2.0 | Surpreendente para o tamanho. |
| **InternVL2 76B** | 76B | 38-44GB | Texto + Imagem | 32K | Apache 2.0 | Shanghai AI Lab. |
| **LLaVA-OneVision 72B** | 72B | 36-42GB | Texto + Imagem | 32K | Apache 2.0 | Excelente em OCR. |
| **Pixtral 12B** | 12B | 7-9GB | Texto + Imagem | 128K | Apache 2.0 | Mistral. Muito capaz. |
| **MiniCPM-V 2.6** | 8B | 4-6GB | Texto + Imagem | 32K | Apache 2.0 | Leve e eficiente. |

---

## 5. Modelos de Reasoning (CoT/o1-style)

| Modelo | Parâmetros | VRAM (Q4) | Contexto | Licença | Observações |
|--------|------------|-----------|----------|---------|-------------|
| **DeepSeek-R1** | 671B MoE | ~70GB | 128K | MIT | **Melhor reasoning open-source.** |
| **DeepSeek-R1-Distill-Qwen-32B** | 32B | 18-22GB | 128K | MIT | Destilado. Excelente. |
| **DeepSeek-R1-Distill-Llama-70B** | 70B | 35-40GB | 128K | MIT | Maior destilado disponível. |
| **DeepSeek-R1-Distill-Qwen-14B** | 14B | 8-10GB | 128K | MIT | Compacto com reasoning. |
| **QwQ-32B-Preview** | 32B | 18-22GB | 32K | Apache 2.0 | Alibaba. Experimental. |
| **Qwen 3 (Thinking Mode)** | 8B-235B | Varia | 32K+ | Apache 2.0 | Híbrido thinking/non-thinking. |

---

## 6. Tabela de VRAM por Quantização

Fórmula aproximada: `VRAM (GB) = (Parâmetros em B × Bits) / 8 × 1.2`

| Modelo | FP16 | INT8 | Q4_K_M | Q3_K_M |
|--------|------|------|--------|--------|
| 7B | 14GB | 7GB | 4-5GB | 3-4GB |
| 8B | 16GB | 8GB | 5-6GB | 4-5GB |
| 13B | 26GB | 13GB | 8-9GB | 6-7GB |
| 14B | 28GB | 14GB | 8-10GB | 7-8GB |
| 32B | 64GB | 32GB | 18-22GB | 14-17GB |
| 34B | 68GB | 34GB | 19-23GB | 15-18GB |
| 70B | 140GB | 70GB | 35-42GB | 28-35GB |
| 72B | 144GB | 72GB | 36-44GB | 29-36GB |

**Observação:** MoE models usam menos VRAM efetiva porque só parte dos parâmetros está ativa por token, mas ainda precisam carregar todos os pesos.

---

## 7. O Que Roda na Sua A100?

### A100 40GB

| Categoria | Modelos Recomendados |
|-----------|---------------------|
| **Reasoning** | DeepSeek-R1-Distill-32B (Q4), QwQ-32B (Q4) |
| **General** | Qwen 2.5 32B (Q4), DeepSeek-V2.5 (FP16 - MoE!) |
| **Code** | Qwen 2.5 Coder 32B (Q4), DeepSeek-Coder-V2 (FP16) |
| **70B class** | Llama 3.3 70B (Q3), Qwen 2.5 72B (Q3) — apertado |

### A100 80GB

| Categoria | Modelos Recomendados |
|-----------|---------------------|
| **Reasoning** | DeepSeek-R1-Distill-70B (Q4), DeepSeek-R1-Distill-32B (FP16) |
| **General** | Llama 3.3 70B (Q4-Q8), Qwen 2.5 72B (Q4-Q8) |
| **Code** | Qwen 2.5 Coder 32B (FP16), CodeLlama 70B (Q4) |
| **Frontier** | DeepSeek-V3 (Q3, apertado), Llama 4 Scout (Q4) |

---

## 8. Licenças — Resumo

| Licença | Uso Comercial | Fine-tuning | Redistribuição | Modelos |
|---------|---------------|-------------|----------------|---------|
| **Apache 2.0** | ✅ Sim | ✅ Sim | ✅ Sim | Qwen, Mistral 7B |
| **MIT** | ✅ Sim | ✅ Sim | ✅ Sim | DeepSeek-R1, Phi |
| **Llama License** | ⚠️ Condicional | ✅ Sim | ⚠️ Limitado | Llama 3.x, 4 |
| **Gemma License** | ⚠️ Condicional | ✅ Sim | ⚠️ Limitado | Gemma 2 |
| **DeepSeek License** | ✅ Sim | ✅ Sim | ✅ Sim | DeepSeek-V2/V3 |
| **MNPL (Mistral)** | ❌ Não | ✅ Sim | ❌ Não | Codestral |

**Llama License:** Requer uso com menos de 700M usuários mensais. Acima disso, precisa de licença especial da Meta.

---

## 9. Runtimes Recomendados

| Runtime | Melhor Para | Prós | Contras |
|---------|-------------|------|---------|
| **vLLM** | Produção, alta throughput | PagedAttention, batching eficiente | Setup mais complexo |
| **Ollama** | Dev local, simplicidade | Um comando para tudo | Menos controle |
| **llama.cpp** | CPU/GPU híbrido, quantização | GGUF, muito otimizado | Só inference |
| **TGI** | Produção (HuggingFace) | Integração HF, bem testado | Mais pesado |
| **SGLang** | Agents, structured output | Rápido para batch | Mais novo |

---

## 10. Recomendações Por Caso de Uso

### Para RAG Jurídico (seu caso)

1. **LLM Principal:** Qwen 2.5 32B ou DeepSeek-R1-Distill-32B
   - Reasoning forte para análise de jurisprudência
   - Cabe confortavelmente na A100

2. **Embeddings:** BGE-M3
   - Multilíngue (PT-BR nativo)
   - Híbrido dense+sparse para busca jurídica
   - Roda em qualquer GPU (568M params)

3. **OCR de documentos:** Qwen2-VL 7B ou MiniCPM-V 2.6
   - Para extrair texto de PDFs escaneados

### Para Coding Agent

1. **Principal:** Qwen 2.5 Coder 32B
2. **Alternativa leve:** DeepSeek-Coder 33B

### Para Chat/Assistente Geral

1. **Qualidade máxima:** DeepSeek-V2.5 (cabe em A100 40GB!)
2. **Balanceado:** Qwen 2.5 32B
3. **Rápido:** Llama 3.1 8B ou Qwen 3 8B

---

## 11. Onde Baixar

```bash
# Via HuggingFace CLI
huggingface-cli download Qwen/Qwen2.5-32B-Instruct

# Via Ollama (já quantizado)
ollama pull qwen2.5:32b

# Via git (modelos grandes)
git lfs install
git clone https://huggingface.co/deepseek-ai/DeepSeek-V2.5
```

**Links principais:**
- HuggingFace: https://huggingface.co/models
- Ollama Library: https://ollama.com/library
- GGUF Quantizados: https://huggingface.co/TheBloke (ou bartowski para mais recentes)

---

## 12. Glossário Rápido

| Termo | Significado |
|-------|-------------|
| **MoE** | Mixture of Experts. Só parte do modelo ativa por token. Mais eficiente. |
| **Q4_K_M** | Quantização 4-bit com k-quants medium. Melhor custo-benefício. |
| **GGUF** | Formato de modelo para llama.cpp. Suporta quantização. |
| **KV Cache** | Memória para contexto. Cresce com tokens. |
| **Context Length** | Máximo de tokens que o modelo processa de uma vez. |
| **MTEB** | Benchmark padrão para embeddings. |
| **Instruct** | Versão fine-tuned para seguir instruções (vs. base). |

---

*Última atualização: Janeiro 2026*
*Para uso com A100 40GB/80GB*
