---
description: Busca jurisprudencial com RAG híbrido Legal-BERTimbau
---

# Busca Jurisprudencial Inteligente

Execute uma busca jurisprudencial no DJEN com análise RAG automatizada usando Legal-BERTimbau.

**Tema:** {{ARGS}}

## Arquitetura de 2 Agentes

Este comando orquestra dois agentes especializados:
1. **djen-extractor**: Busca API DJEN → salva JSON bruto
2. **djen-rag-analyzer**: Lê JSON → RAG Legal-BERTimbau → relatório

## Passos Obrigatórios

### 1. Parser de Argumentos Posicionais

Formato: `/juris tema [tribunal] [período] [tipo]`

**Exemplos:**
- `/juris responsabilidade-civil`
- `/juris responsabilidade-civil TJSP`
- `/juris responsabilidade-civil TJSP ultimo-ano`
- `/juris responsabilidade-civil TJSP ultimo-ano Acórdão`

**Args:**
- `args[0]` = tema (obrigatório)
- `args[1]` = tribunal (opcional)
- `args[2]` = período (opcional: `ultimo-ano`, `ultimos-6-meses`, `01/01/2024-31/12/2024`)
- `args[3]` = tipo (opcional: Sentença, Acórdão, Despacho, Intimação)

### 2. Criar Script de Busca Simplificado

**Responsabilidade**: Apenas buscar e salvar dados brutos.

```typescript
import { DJENApiClient } from './src/api/client.js';
import fs from 'fs/promises';

// Parser args
const args = process.argv.slice(2);
const tema = args[0];
const tribunal = args[1];
const periodoStr = args[2];
const tipo = args[3];

// Converter período para datas
let dataInicio, dataFim;
if (periodoStr === 'ultimo-ano') {
  dataFim = new Date();
  dataInicio = new Date(dataFim);
  dataInicio.setFullYear(dataInicio.getFullYear() - 1);
} else if (periodoStr === 'ultimos-6-meses') {
  dataFim = new Date();
  dataInicio = new Date(dataFim);
  dataInicio.setMonth(dataInicio.getMonth() - 6);
} else if (periodoStr === 'ultimos-3-meses') {
  dataFim = new Date();
  dataInicio = new Date(dataFim);
  dataInicio.setMonth(dataInicio.getMonth() - 3);
} else if (periodoStr?.includes('/')) {
  // Parse DD/MM/YYYY-DD/MM/YYYY
  const [inicio, fim] = periodoStr.split('-');
  dataInicio = parseDataBR(inicio);
  dataFim = parseDataBR(fim);
}

function parseDataBR(data: string): Date {
  const [dia, mes, ano] = data.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
}

// Buscar publicações
const apiClient = new DJENApiClient();

const params: any = { limit: 10000 };
if (tribunal) params.tribunal = tribunal;
if (dataInicio) params.dataInicio = dataInicio.toISOString().split('T')[0];
if (dataFim) params.dataFim = dataFim.toISOString().split('T')[0];
if (tipo) params.tipo = tipo;

// NOTA: API pode não ter campo "tema" - usar busca por conteúdo ou tags
// Se necessário, fazer busca ampla e filtrar localmente

const resultado = await apiClient.buscarComunicacoes(params);

console.log(`✅ Busca concluída: ${resultado.comunicacoes.length} publicações encontradas`);

// Salvar JSON bruto
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const sanitizedTema = tema.replace(/[^a-z0-9-]/gi, '-');
const nomeArquivo = `juris-${sanitizedTema}-${timestamp}`;
const caminhoJSON = `E:/djen-data/${nomeArquivo}.json`;

await fs.writeFile(
  caminhoJSON,
  JSON.stringify({
    query: { tema, tribunal, periodo: periodoStr, tipo },
    total: resultado.comunicacoes.length,
    timestamp: new Date().toISOString(),
    publicacoes: resultado.comunicacoes,
  }, null, 2)
);

console.log(`📁 JSON salvo: ${caminhoJSON}`);
console.log(`🔍 Query: "${tema}"${tribunal ? ` no ${tribunal}` : ''}${periodoStr ? ` (${periodoStr})` : ''}`);
```

### 3. Executar Busca

```bash
cd E:\projetos\djen-mcp-server
npx tsx buscar-jurisprudencia.ts "{{ARGS}}"
```

### 4. **CRÍTICO**: Invocar Agente RAG Analyzer

**Após salvar JSON**, chamar automaticamente o agente `djen-rag-analyzer`:

```
Task tool com djen-rag-analyzer:
"Analise o arquivo E:/djen-data/juris-[tema]-[timestamp].json com query '[tema completo]'"
```

O agente fará:
- Preprocessamento jurídico
- Embeddings Legal-BERTimbau (seleção automática leve/pesado)
- Ranking híbrido (4 fatores)
- Relatório markdown com top decisões
- Estatísticas (tribunais, termos, temporal)

### 5. Apresentar Resultados

Mostrar ao usuário:
- Total de publicações baixadas
- Caminho do JSON bruto
- Resumo da análise RAG (fornecido pelo agente RAG analyzer)
- Top 5 decisões rankeadas
- Caminho do relatório -ANALISE.md

## Notas Importantes

### RAG Híbrido - 4 Fatores (no agente djen-rag-analyzer)

1. **Similaridade Semântica (40%)**: Legal-BERTimbau embeddings
2. **Boost Termos Jurídicos (30%)**: Peso extra para "indeferido", "provido", "nesse sentido", etc.
3. **Hierarquia de Instância (20%)**: STF/STJ=1.0 > TJ/TRF=0.85 > 1ª instância=0.7
4. **Temporal Decay (10%)**: Publicações recentes têm boost, mínimo 0.5

### Seleção Automática de Modelo

O agente RAG analyzer decide qual modelo usar:
- **Leve** (`felipemaiapolo/legalnlp-bert`): <50 publicações, textos curtos
- **Pesado** (`raquelsilveira/legalbertpt_fp`): >100 publicações, análise profunda

### Threshold de Aviso

Se resultados rankeados > 200:
- Agente RAG analyzer avisa automaticamente
- Oferece opção de limitar top 50/100
- Usuário decide continuar ou refinar

### Formato dos Arquivos

**JSON bruto** (este comando): Publicações completas da API DJEN
**JSON rankeado** (agente RAG): `RankedResult[]` com scores e análise
**Markdown** (agente RAG): Relatório formatado com top decisões e estatísticas
