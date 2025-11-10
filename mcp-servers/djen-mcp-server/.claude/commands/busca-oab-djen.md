---
description: Busca publicações do DJEN por número de OAB e período
---

# Buscar Publicações por OAB no DJEN

Busca publicações do Diário de Justiça Eletrônico Nacional (DJEN) filtrando por número de OAB de advogado.

**Args:** {{ARGS}}

## Como funciona

A API DJEN retorna publicações que mencionam advogados. Este comando:
1. Busca comunicações no período especificado
2. Filtra por número de OAB nos campos `destinatarioadvogados`
3. Organiza resultados por processo
4. Salva JSON detalhado em `E:/djen-data/`

## Uso

```bash
# Sintaxe básica
/busca-oab-djen <numero-oab> <uf-oab> [dias]

# Exemplos
/busca-oab-djen 129021 SP 14          # Últimas 2 semanas
/busca-oab-djen 129021 SP 7           # Última semana
/busca-oab-djen 129021 SP 30          # Último mês
```

## Parâmetros

- `<numero-oab>`: Número da OAB (sem pontos ou barras)
- `<uf-oab>`: UF da inscrição (ex: SP, RJ, MG)
- `[dias]`: Período em dias (padrão: 14)

## Implementação

```typescript
import { DJENApiClient } from '../src/api/client.js';
import { ConfigAPI } from '../src/types/index.js';
import fs from 'fs/promises';
import path from 'path';

async function buscarPorOAB(numeroOab: string, ufOab: string, dias: number = 14) {
  // Calcular período
  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - dias);

  // Formatar datas (YYYY-MM-DD)
  const dataInicioStr = dataInicio.toISOString().split('T')[0];
  const dataFimStr = dataFim.toISOString().split('T')[0];

  console.log(`🔍 Buscando publicações da OAB ${numeroOab}/${ufOab}`);
  console.log(`📅 Período: ${dataInicioStr} a ${dataFimStr} (${dias} dias)`);

  // Configurar cliente DJEN
  const config: ConfigAPI = {
    url: process.env.DJEN_API_URL || 'https://comunicaapi.pje.jus.br',
    maxRequestsPerMinute: 60,
    maxConcurrentRequests: 5,
  };

  const client = new DJENApiClient(config);

  // Buscar comunicações no período
  console.log('\n📥 Consultando API DJEN...');
  const resultado = await client.buscarComunicacoes({
    dataInicio: dataInicioStr,
    dataFim: dataFimStr,
    limit: 10000, // Máximo da API
  });

  console.log(`✅ Total de comunicações no período: ${resultado.count}`);

  // Filtrar por OAB
  const numeroOabNormalizado = numeroOab.replace(/\D/g, '');
  const comunicacoesFiltradas = resultado.items.filter(comunicacao => {
    return comunicacao.destinatarioadvogados?.some(destAdv => {
      const oabMatch = destAdv.advogado.numero_oab === numeroOabNormalizado;
      const ufMatch = destAdv.advogado.uf_oab.toUpperCase() === ufOab.toUpperCase();
      return oabMatch && ufMatch;
    });
  });

  console.log(`\n📊 Publicações encontradas: ${comunicacoesFiltradas.length}`);

  if (comunicacoesFiltradas.length === 0) {
    console.log('\n❌ Nenhuma publicação encontrada para esta OAB no período.');
    return;
  }

  // Organizar por processo
  const processos = new Map<string, any>();

  for (const comunicacao of comunicacoesFiltradas) {
    const numeroProcesso = comunicacao.numeroprocessocommascara || comunicacao.numero_processo;

    if (!processos.has(numeroProcesso)) {
      processos.set(numeroProcesso, {
        numeroProcesso,
        tribunal: comunicacao.siglaTribunal,
        classe: comunicacao.nomeClasse,
        orgaoJulgador: comunicacao.nomeOrgao,
        publicacoes: [],
      });
    }

    processos.get(numeroProcesso).publicacoes.push({
      data: comunicacao.data_disponibilizacao,
      tipo: comunicacao.tipoComunicacao,
      texto: comunicacao.texto,
      link: comunicacao.link,
      hash: comunicacao.hash,
    });
  }

  // Exibir resumo
  console.log(`\n📁 Total de processos: ${processos.size}`);
  console.log('\n═══════════════ PROCESSOS ENCONTRADOS ═══════════════\n');

  let contador = 1;
  for (const [numero, processo] of processos) {
    console.log(`${contador}. ${numero}`);
    console.log(`   🏛️  ${processo.tribunal} - ${processo.orgaoJulgador}`);
    console.log(`   📋 ${processo.classe}`);
    console.log(`   📝 ${processo.publicacoes.length} publicação(ões)\n`);
    contador++;
  }

  // Salvar resultado
  const outputDir = 'E:/djen-data';
  await fs.mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `oab-${numeroOab}-${ufOab}-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);

  const resultado_final = {
    consulta: {
      numeroOab,
      ufOab,
      periodo: { inicio: dataInicioStr, fim: dataFimStr, dias },
      dataConsulta: new Date().toISOString(),
    },
    estatisticas: {
      totalComunicacoes: resultado.count,
      comunicacoesFiltradas: comunicacoesFiltradas.length,
      totalProcessos: processos.size,
    },
    processos: Array.from(processos.values()),
  };

  await fs.writeFile(filepath, JSON.stringify(resultado_final, null, 2), 'utf-8');

  console.log(`\n💾 Arquivo salvo: ${filepath}`);
  console.log(`\n✅ Consulta concluída!`);
}

// Parse argumentos
const args = '{{ARGS}}'.trim().split(/\s+/);

if (args.length < 2 || args[0] === '{{ARGS}}') {
  console.log('❌ Uso incorreto!');
  console.log('\nUso:');
  console.log('  /busca-oab-djen <numero-oab> <uf-oab> [dias]');
  console.log('\nExemplos:');
  console.log('  /busca-oab-djen 129021 SP 14');
  console.log('  /busca-oab-djen 129021 SP 7');
  process.exit(1);
}

const [numeroOab, ufOab, diasStr] = args;
const dias = diasStr ? parseInt(diasStr) : 14;

buscarPorOAB(numeroOab, ufOab, dias).catch(error => {
  console.error('❌ Erro:', error.message);
  console.error(error.stack);
  process.exit(1);
});
```

## Saída

O comando gera um arquivo JSON com:

```json
{
  "consulta": {
    "numeroOab": "129021",
    "ufOab": "SP",
    "periodo": {
      "inicio": "2025-10-12",
      "fim": "2025-10-26",
      "dias": 14
    }
  },
  "estatisticas": {
    "totalComunicacoes": 15420,
    "comunicacoesFiltradas": 23,
    "totalProcessos": 12
  },
  "processos": [
    {
      "numeroProcesso": "1057607-11.2024.8.26.0002",
      "tribunal": "TJSP",
      "classe": "Apelação",
      "orgaoJulgador": "3ª Câmara de Direito Privado",
      "publicacoes": [
        {
          "data": "2025-10-15T00:00:00",
          "tipo": "Intimação",
          "texto": "...",
          "link": "...",
          "hash": "..."
        }
      ]
    }
  ]
}
```

## Limitações

- A API DJEN retorna no máximo 10.000 comunicações por requisição
- Períodos muito longos podem ter resultados truncados
- Recomendado: consultas de até 30 dias

## Notas

- **SEM autenticação:** API pública do CNJ
- **Rate limit:** 60 requisições/minuto
- Os resultados incluem TODAS as publicações mencionando o advogado (intimações, sentenças, despachos, etc.)
