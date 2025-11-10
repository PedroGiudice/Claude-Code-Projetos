---
description: Compila jurisprudência de cadernos DJEN por tribunal e data
---

# Compilar Jurisprudência via Cadernos DJEN

Baixa e compila a **jurisprudência completa** (todas as publicações) de um tribunal em uma data específica usando a API de Cadernos.

## Por que usar Cadernos?

A API de cadernos retorna **TODAS** as publicações de um dia, sem limitações de paginação. Perfeito para:
- ✅ Compilar jurisprudência completa
- ✅ Capturar 2ª instância e câmaras
- ✅ Evitar perder publicações por limite de 100 itens
- ✅ Análise jurimetria (estatísticas judiciais)

## Uso

```bash
# Sintaxe básica
/cadernos-jurisprudencia <tribunal> [data] [meio]

# Exemplos
/cadernos-jurisprudencia TJSP                    # TJSP hoje, meio Digital
/cadernos-jurisprudencia TJSP 2025-10-29        # TJSP em data específica
/cadernos-jurisprudencia TJSP 2025-10-29 D      # Digital (padrão)
/cadernos-jurisprudencia TJSP 2025-10-29 E      # Eletrônico
/cadernos-jurisprudencia TRT3                   # TRT3 hoje
/cadernos-jurisprudencia STJ 2025-10-15 D       # STJ em data específica
```

## Parâmetros

| Parâmetro | Tipo | Obrigatório? | Descrição |
|-----------|------|-------------|-----------|
| `tribunal` | string | **Sim** | Sigla do tribunal (TJSP, TRT3, STJ, etc) |
| `data` | YYYY-MM-DD | Não | Data do caderno (padrão: hoje) |
| `meio` | D ou E | Não | **D** = Digital (padrão)<br/>**E** = Eletrônico |

## O que o comando faz

1. **Busca metadados do caderno**
   - Total de publicações
   - Número de páginas
   - Tamanho do arquivo
   - Hash para auditoria

2. **Download do PDF**
   - Salva em `E:/djen-data/cadernos/`
   - Pode ser 100+ MB para tribunal grande

3. **Extração de texto** (futuro)
   - OCR do PDF
   - Busca por OAB específicas
   - Indexação em SQLite

4. **Gera relatório**
   - Metadados completos
   - Caminho do arquivo baixado
   - Próximos passos

## Exemplo de Saída

```
═══════════════════════════════════════════════════════════
  CADERNO DJEN - TJSP - 2025-10-29
═══════════════════════════════════════════════════════════

📚 METADADOS DO CADERNO

Tribunal:          Tribunal de Justiça do Estado de São Paulo
Sigla:             TJSP
Data:              2025-10-29
Meio:              Digital
Status:            Processado
Versão:            1

📊 ESTATÍSTICAS

Total de publicações:     219.993
Número de páginas:        220
Tamanho do arquivo:       118.022.107 bytes (112 MB)
Hash do caderno:          c40025ad1e03647eb003c35d51b34bf42...

📥 DOWNLOAD

Status:                   ✅ Sucesso
Arquivo salvo em:         E:/djen-data/cadernos/caderno-TJSP-2025-10-29-D.pdf
URL original:             https://comunicaapi.pje.jus.br/api/v1/caderno/TJSP/2025-10-29/D/download

📋 PRÓXIMOS PASSOS

1. Processar PDF para extrair texto (usar pdftotext ou similar)
2. Procurar por OABs específicas no texto extraído
3. Indexar publicações em banco de dados
4. Gerar estatísticas jurimetrais (decisões por classe, taxa de apelação, etc)

═══════════════════════════════════════════════════════════
```

## Implementação

```typescript
import { DJENApiClient } from '../src/api/client.js';
import { ConfigAPI } from '../src/types/index.js';
import fs from 'fs/promises';
import path from 'path';

async function compilarCadernoJurisprudencia(
  tribunal: string,
  data?: string,
  meio: 'D' | 'E' = 'D'
) {
  // Configurar cliente
  const config: ConfigAPI = {
    url: process.env.DJEN_API_URL || 'https://comunicaapi.pje.jus.br',
    maxRequestsPerMinute: 20,
    maxConcurrentRequests: 5,
  };

  const client = new DJENApiClient(config);

  // Data padrão: hoje
  const dataConsulta = data || new Date().toISOString().split('T')[0];

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  CADERNO DJEN - ${tribunal.toUpperCase()} - ${dataConsulta}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Buscar metadados
    console.log('🔍 Buscando metadados do caderno...\n');

    const metadados = await client.buscarCadernoMetadados(
      tribunal.toUpperCase(),
      dataConsulta,
      meio
    );

    // Exibir metadados
    console.log('📚 METADADOS DO CADERNO\n');
    console.log(`Tribunal:          ${metadados.tribunal}`);
    console.log(`Sigla:             ${metadados.sigla_tribunal}`);
    console.log(`Data:              ${metadados.data}`);
    console.log(`Meio:              ${metadados.meio === 'D' ? 'Digital' : 'Eletrônico'}`);
    console.log(`Status:            ${metadados.status}`);
    console.log(`Versão:            ${metadados.versao}`);

    console.log('\n📊 ESTATÍSTICAS\n');
    console.log(`Total de publicações:     ${metadados.total_comunicacoes.toLocaleString('pt-BR')}`);
    console.log(`Número de páginas:        ${metadados.numero_paginas}`);
    console.log(`Tamanho do arquivo:       ${metadados.tamanho_bytes} bytes (${(parseInt(metadados.tamanho_bytes) / (1024 * 1024)).toFixed(1)} MB)`);
    console.log(`Hash do caderno:          ${metadados.hash}`);

    // 2. Download se tiver URL
    if (!metadados.url) {
      console.log('\n❌ Caderno sem comunicações para esta data/tribunal.');
      return;
    }

    console.log('\n📥 DOWNLOAD\n');
    console.log('Status:                   ✅ Iniciando...\n');

    // Criar diretório
    const caminhoBase = 'E:/djen-data/cadernos';
    await fs.mkdir(caminhoBase, { recursive: true });

    const nomeArquivo = `caderno-${tribunal.toUpperCase()}-${dataConsulta}-${meio}.pdf`;
    const caminhoCompleto = path.join(caminhoBase, nomeArquivo);

    // Baixar PDF
    const pdfBuffer = await client.baixarCadernoPDF(metadados.url);

    // Salvar arquivo
    await fs.writeFile(caminhoCompleto, pdfBuffer);

    console.log(`Status:                   ✅ Sucesso`);
    console.log(`Arquivo salvo em:         ${caminhoCompleto}`);
    console.log(`URL original:             ${metadados.url}`);

    // 3. Próximos passos
    console.log('\n📋 PRÓXIMOS PASSOS\n');
    console.log('1. Processar PDF para extrair texto (usar pdftotext ou similar)');
    console.log('2. Procurar por OABs específicas no texto extraído');
    console.log('3. Indexar publicações em banco de dados');
    console.log('4. Gerar estatísticas jurimetrais\n');

    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Parse argumentos
const args = '{{ARGS}}'.trim().split(/\s+/);

if (args.length === 0 || args[0] === '{{ARGS}}') {
  console.log('❌ Uso incorreto!\n');
  console.log('Uso:');
  console.log('  /cadernos-jurisprudencia <tribunal> [data] [meio]\n');
  console.log('Exemplos:');
  console.log('  /cadernos-jurisprudencia TJSP');
  console.log('  /cadernos-jurisprudencia TJSP 2025-10-29 D');
  console.log('  /cadernos-jurisprudencia TRT3 2025-10-29 E\n');
  process.exit(1);
}

const tribunal = args[0];
const data = args[1];
const meio = (args[2] || 'D') as 'D' | 'E';

compilarCadernoJurisprudencia(tribunal, data, meio);
```

## Dados Reais Capturados

Para referência, aqui estão os dados REAIS do TJSP em 29/10/2025:

```
TJSP - 2025-10-29 - Meio Digital:
  Total de publicações: 219.993
  Número de páginas: 220
  Tamanho: 118.022.107 bytes (112 MB)
  Hash: c40025ad1e03647eb003c35d51b34bf42da0f842b3a25b6b88570492c8d4e195

TJSP - 2025-10-29 - Meio Eletrônico:
  Total de publicações: 1.583
  Número de páginas: 2
  Tamanho: 1.458.163 bytes (1.4 MB)
  Hash: e0e610060ec13cbacb0caf96ef489bff03fd6d80708d36933cc8afaf1c49ea2a
```

## Limitações

⚠️ **Importante:**
- Arquivos podem ser muito grandes (100+ MB)
- Requer espaço em disco adequado
- Extração de PDF pode ter erros de OCR
- Rate limit: 60 req/min, 5 concorrentes
- Alguns cadernos podem estar vazios

## Diferença: Cadernos vs Busca por OAB

| Aspecto | Busca por OAB | Cadernos |
|---------|---------------|----------|
| **Cobertura** | Primeiros 100 itens | TODAS as publicações |
| **Paginação** | Não suporta | Completo em 1 arquivo |
| **Instâncias** | Pode perder | Inclui tudo |
| **Tamanho** | Pequeno (JSON) | Grande (PDF) |
| **Processamento** | Rápido | Requer OCR |
| **Caso de uso** | Consultas específicas | Compilação jurisprudência |
