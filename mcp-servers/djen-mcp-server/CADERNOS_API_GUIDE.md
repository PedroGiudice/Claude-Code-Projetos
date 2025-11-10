# 📚 Guia Completo: API de Cadernos DJEN

## O que é um Caderno?

Um **caderno** é uma publicação consolidada de todas as comunicações de um tribunal para um dia específico. É diferente de buscar comunicações individuais - é um **compilado em PDF** de TODAS as publicações daquele dia.

## Endpoint Disponível

```
GET /api/v1/caderno/{sigla_tribunal}/{data}/{meio}
```

### Parâmetros

| Parâmetro | Tipo | Valores | Descrição |
|-----------|------|---------|-----------|
| `sigla_tribunal` | string | Ex: TJSP, TRT3, STJ | Sigla do tribunal |
| `data` | string | YYYY-MM-DD | Data das publicações |
| `meio` | enum | 'E' ou 'D' | **E** = Eletrônico<br/>**D** = Digital (padrão) |

### Resposta (DJENCadernoMetadata)

```typescript
{
  tribunal: string;              // Nome completo (ex: "Tribunal de Justiça do Estado de São Paulo")
  sigla_tribunal: string;        // Sigla (ex: "TJSP")
  meio: 'E' | 'D';             // Meio utilizado
  status: string;               // Status do caderno
  versao: number;               // Versão do caderno
  data: string;                 // Data (YYYY-MM-DD)
  total_comunicacoes: number;   // **NÚMERO TOTAL DE PUBLICAÇÕES NO CADERNO**
  numero_paginas: number;       // Número de páginas do PDF
  tamanho_bytes: string;        // Tamanho do arquivo PDF (pode estar vazio)
  hash: string;                 // Hash único do caderno
  url: string;                  // **URL para download do PDF (vazio se sem comunicações)**
}
```

## Diferença Crítica: Cadernos vs Busca por OAB

### ❌ Busca por OAB (`buscarComunicacoes`)
- Retorna **no máximo 100 itens por requisição**
- Não faz paginação automática
- Filtra por OAB específica
- **Pode perder publicações** em páginas posteriores
- Limitado aos primeiros 100 resultados

### ✅ Cadernos (`buscarCadernoMetadados`)
- Retorna **TODAS as publicações de um dia em um PDF**
- Sem limitação de quantidade
- Inclui 2ª instância, câmaras, tudo
- **Garante cobertura completa**
- Pode processar via OCR/extração de PDF

## Por que Encontramos a Publicação de 2ª Instância no TJMG?

Quando testamos com `numeroOab: '129021'` no TJMG, retornou:
```
5003282-45.2021.8.13.0338 - TJMG - 11ª CÂMARA CÍVEL
```

Isso significa: **A publicação estava NO CADERNO do TJMG**, mas não foi retornada pelo filtro de OAB da API de comunicações.

## Estratégia para Encontrar a Publicação Faltante do TJSP

### 1. **Primeiro: Buscar metadados do caderno do TJSP de hoje**

```typescript
const metadados = await client.buscarCadernoMetadados('TJSP', '2025-10-29', 'D');

console.log(`Total de publicações no caderno: ${metadados.total_comunicacoes}`);
console.log(`Número de páginas: ${metadados.numero_paginas}`);
console.log(`URL para download: ${metadados.url}`);
```

Esperado:
- `total_comunicacoes` será > 3 (provavelmente > 100)
- `url` será um PDF que pode ser baixado

### 2. **Depois: Baixar e processar o PDF**

```typescript
const pdfBuffer = await client.baixarCadernoPDF(metadados.url);
// Salvar ou processar o PDF
```

### 3. **Finalmente: Extrair texto do PDF e procurar OAB**

Usar biblioteca como `pdf-parse` ou `pdfjs-dist` para:
- Extrair todo o texto do PDF
- Procurar por "129021", "129.021", "OAB 129021", "0AB SP 129021", etc
- Encontrar o processo faltante da 2ª instância

## Implementação em TypeScript

```typescript
import { DJENApiClient } from './dist/api/client.js';
import { ConfigAPI } from './dist/types/index.js';

async function encontrarPublicacaoNo2aInstancia() {
  const apiConfig: ConfigAPI = {
    url: 'https://comunicaapi.pje.jus.br',
    maxRequestsPerMinute: 20,
    maxConcurrentRequests: 5,
  };

  const client = new DJENApiClient(apiConfig);

  try {
    // 1. Buscar metadados do caderno
    console.log('📖 Buscando caderno do TJSP...');
    const metadados = await client.buscarCadernoMetadados('TJSP', '2025-10-29', 'D');

    console.log(`✅ Caderno encontrado!`);
    console.log(`   Total de publicações: ${metadados.total_comunicacoes}`);
    console.log(`   Número de páginas: ${metadados.numero_paginas}`);
    console.log(`   Tamanho: ${metadados.tamanho_bytes} bytes`);

    if (!metadados.url) {
      console.log('❌ Nenhuma publicação no caderno');
      return;
    }

    // 2. Baixar PDF
    console.log(`\n📥 Baixando PDF...`);
    const pdfBuffer = await client.baixarCadernoPDF(metadados.url);
    console.log(`✅ PDF baixado: ${pdfBuffer.length} bytes`);

    // 3. Salvar para análise manual ou OCR
    const fs = require('fs').promises;
    await fs.writeFile(
      `E:/djen-data/caderno-TJSP-2025-10-29.pdf`,
      pdfBuffer
    );
    console.log(`✅ PDF salvo para análise`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

encontrarPublicacaoNo2aInstancia();
```

## Próximos Passos

### Para amanhã (PowerShell 24/7):

1. **Executar busca de cadernos** para todos os tribunais importantes
2. **Baixar PDFs dos cadernos** que tiverem mais publicações que a busca por OAB retornou
3. **Extrair e indexar** o texto dos PDFs
4. **Procurar por variações de OAB** no texto extraído

### Vantagens dessa abordagem:

✅ Captura **100% das publicações**
✅ Funciona com **instâncias diferentes**
✅ Não é limitado por filtros de API
✅ Garante **nenhuma publicação perdida**

## Limitações conhecidas

- Cadernos podem ser PDFs grandes (múltiplas páginas)
- Extração de OCR pode ter erros
- Processamento de PDF adiciona complexidade
- Mas **resolve completamente** o problema das publicações faltantes!

---

## Resumo: Por que encontramos no TJMG mas não no TJSP?

1. **API de comunicações** (buscarComunicacoes) tem limite de 100 itens
2. **Busca por OAB** retorna apenas os primeiros 100 resultados
3. A publicação faltante do TJSP pode estar:
   - Na **página 2 ou posterior** da busca (além dos 100 primeiros)
   - Com **formatação de OAB diferente** que a API não reconhece
   - Em **câmara específica** que não foi buscada

4. **Solução: Cadernos**
   - Retorna TUDO em um PDF
   - Sem limitação de quantidade
   - Sem filtros que excluem resultados
   - Funciona para qualquer instância

