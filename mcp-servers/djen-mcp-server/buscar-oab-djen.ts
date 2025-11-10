#!/usr/bin/env tsx
/**
 * Script para buscar publicações do DJEN por número de OAB
 *
 * Uso:
 *   npx tsx buscar-oab-djen.ts <numero-oab> <uf-oab> [dias]
 *
 * Exemplos:
 *   npx tsx buscar-oab-djen.ts 129021 SP 14
 *   npx tsx buscar-oab-djen.ts 129021 SP 7
 */

import { config } from 'dotenv';
import { DJENApiClient } from './src/api/client.js';
import { ConfigAPI } from './src/types/index.js';
import fs from 'fs/promises';
import path from 'path';

// Carregar .env
config();

async function buscarPorOAB(numeroOab: string, ufOab: string, dias: number = 14) {
  // Calcular período
  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - dias);

  // Formatar datas (YYYY-MM-DD)
  const dataInicioStr = dataInicio.toISOString().split('T')[0];
  const dataFimStr = dataFim.toISOString().split('T')[0];

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         BUSCA POR OAB NO DJEN (API Pública)           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`🔍 Buscando publicações da OAB ${numeroOab}/${ufOab}`);
  console.log(`📅 Período: ${dataInicioStr} a ${dataFimStr} (${dias} dias)\n`);

  // Configurar cliente DJEN
  const djenConfig: ConfigAPI = {
    url: process.env.DJEN_API_URL || 'https://comunicaapi.pje.jus.br',
    maxRequestsPerMinute: 60,
    maxConcurrentRequests: 5,
  };

  const client = new DJENApiClient(djenConfig);

  // Buscar comunicações no período
  console.log('📥 Consultando API DJEN...');
  const startTime = Date.now();

  // Buscar primeiro no TJSP (tribunal mais provável para SP)
  console.log('🏛️  Consultando TJSP...');
  const resultadoTJSP = await client.buscarComunicacoes({
    tribunal: 'TJSP',
    dataInicio: dataInicioStr,
    dataFim: dataFimStr,
    limit: 10000,
  });

  console.log(`   ✅ ${resultadoTJSP.count} comunicações do TJSP`);

  // Buscar também em outros tribunais relevantes
  console.log('🏛️  Consultando outros tribunais...');
  const resultadoOutros = await client.buscarComunicacoes({
    dataInicio: dataInicioStr,
    dataFim: dataFimStr,
    limit: 10000,
  });

  console.log(`   ✅ ${resultadoOutros.count} comunicações gerais`);

  // Combinar resultados (sem duplicatas)
  const comunicacoesMap = new Map();
  for (const item of [...resultadoTJSP.items, ...resultadoOutros.items]) {
    comunicacoesMap.set(item.id, item);
  }

  const resultado = {
    count: resultadoTJSP.count + resultadoOutros.count,
    items: Array.from(comunicacoesMap.values()),
  };

  const elapsed = Date.now() - startTime;
  console.log(`✅ Consulta concluída em ${elapsed}ms`);
  console.log(`📊 Total de comunicações no período: ${resultado.count}\n`);

  // Filtrar por OAB
  console.log('🔎 Filtrando por número de OAB...');
  const numeroOabNormalizado = numeroOab.replace(/\D/g, '');

  const comunicacoesFiltradas = resultado.items.filter(comunicacao => {
    return comunicacao.destinatarioadvogados?.some(destAdv => {
      const oabMatch = destAdv.advogado.numero_oab === numeroOabNormalizado;
      const ufMatch = destAdv.advogado.uf_oab.toUpperCase() === ufOab.toUpperCase();
      return oabMatch && ufMatch;
    });
  });

  console.log(`\n✅ Publicações encontradas: ${comunicacoesFiltradas.length}`);

  if (comunicacoesFiltradas.length === 0) {
    console.log('\n❌ Nenhuma publicação encontrada para esta OAB no período.');
    console.log('\nPossíveis motivos:');
    console.log('  - Não houve publicações mencionando este advogado');
    console.log('  - O número da OAB ou UF está incorreto');
    console.log('  - Período muito restrito (tente aumentar os dias)');
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
      dataFormatada: comunicacao.datadisponibilizacao,
      tipo: comunicacao.tipoComunicacao,
      texto: comunicacao.texto,
      link: comunicacao.link,
      hash: comunicacao.hash,
      destinatarios: comunicacao.destinatarios.map(d => d.nome),
      advogados: comunicacao.destinatarioadvogados.map(da => ({
        nome: da.advogado.nome,
        oab: `${da.advogado.numero_oab}/${da.advogado.uf_oab}`,
      })),
    });
  }

  // Exibir resumo
  console.log(`\n📁 Total de processos: ${processos.size}`);
  console.log('\n═══════════════ PROCESSOS ENCONTRADOS ═══════════════\n');

  let contador = 1;
  for (const [numero, processo] of processos) {
    console.log(`${contador}. ${numero}`);
    console.log(`   🏛️  ${processo.tribunal} - ${processo.orgaoJulgador}`);
    console.log(`   📋 ${processo.classe || 'N/A'}`);
    console.log(`   📝 ${processo.publicacoes.length} publicação(ões)`);

    // Mostrar datas das publicações
    const datas = processo.publicacoes.map((p: any) => p.dataFormatada).join(', ');
    console.log(`   📅 ${datas}\n`);

    contador++;
  }

  // Salvar resultado
  const outputDir = 'E:/djen-data';
  await fs.mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `oab-${numeroOab}-${ufOab}-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);

  const resultadoFinal = {
    consulta: {
      numeroOab,
      ufOab,
      periodo: { inicio: dataInicioStr, fim: dataFimStr, dias },
      dataConsulta: new Date().toISOString(),
    },
    estatisticas: {
      totalComunicacoesNoPeriodo: resultado.count,
      comunicacoesFiltradas: comunicacoesFiltradas.length,
      totalProcessos: processos.size,
    },
    processos: Array.from(processos.values()),
  };

  await fs.writeFile(filepath, JSON.stringify(resultadoFinal, null, 2), 'utf-8');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`💾 Arquivo salvo: ${filepath}`);
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('✅ Consulta concluída com sucesso!\n');
}

// Parse argumentos
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('❌ Uso incorreto!\n');
  console.log('Uso:');
  console.log('  npx tsx buscar-oab-djen.ts <numero-oab> <uf-oab> [dias]\n');
  console.log('Exemplos:');
  console.log('  npx tsx buscar-oab-djen.ts 129021 SP 14');
  console.log('  npx tsx buscar-oab-djen.ts 129021 SP 7');
  console.log('  npx tsx buscar-oab-djen.ts 129021 SP 30\n');
  process.exit(1);
}

const [numeroOab, ufOab, diasStr] = args;
const dias = diasStr ? parseInt(diasStr) : 14;

if (isNaN(dias) || dias <= 0) {
  console.log('❌ Número de dias inválido!');
  process.exit(1);
}

buscarPorOAB(numeroOab, ufOab, dias).catch(error => {
  console.error('\n❌ ERRO:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
