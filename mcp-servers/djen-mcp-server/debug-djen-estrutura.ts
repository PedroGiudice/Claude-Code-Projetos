#!/usr/bin/env tsx
/**
 * Script de debug para verificar estrutura dos dados DJEN
 */

import { config } from 'dotenv';
import { DJENApiClient } from './src/api/client.js';
import { ConfigAPI } from './src/types/index.js';

config();

async function debugEstrutura() {
  console.log('🔍 Analisando estrutura de dados da API DJEN...\n');

  const djenConfig: ConfigAPI = {
    url: process.env.DJEN_API_URL || 'https://comunicaapi.pje.jus.br',
    maxRequestsPerMinute: 60,
    maxConcurrentRequests: 5,
  };

  const client = new DJENApiClient(djenConfig);

  // Buscar últimas comunicações
  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - 3); // Últimos 3 dias

  const resultado = await client.buscarComunicacoes({
    dataInicio: dataInicio.toISOString().split('T')[0],
    dataFim: dataFim.toISOString().split('T')[0],
    limit: 10,
  });

  console.log(`📊 Total de comunicações: ${resultado.count}`);
  console.log(`📥 Amostras retornadas: ${resultado.items.length}\n`);

  if (resultado.items.length === 0) {
    console.log('❌ Nenhuma comunicação encontrada.');
    return;
  }

  // Analisar primeira comunicação
  const primeira = resultado.items[0];

  console.log('═══════════════ ESTRUTURA DA PRIMEIRA COMUNICAÇÃO ═══════════════\n');
  console.log(JSON.stringify(primeira, null, 2));

  // Estatísticas
  console.log('\n\n═══════════════ ESTATÍSTICAS DOS CAMPOS ═══════════════\n');

  let comAdvogados = 0;
  let comDestinatarios = 0;
  let semAdvogados = 0;

  for (const item of resultado.items) {
    if (item.destinatarioadvogados && item.destinatarioadvogados.length > 0) {
      comAdvogados++;
    } else {
      semAdvogados++;
    }

    if (item.destinatarios && item.destinatarios.length > 0) {
      comDestinatarios++;
    }
  }

  console.log(`✅ Comunicações com advogados: ${comAdvogados} (${Math.round(comAdvogados/resultado.items.length*100)}%)`);
  console.log(`✅ Comunicações com destinatários: ${comDestinatarios} (${Math.round(comDestinatarios/resultado.items.length*100)}%)`);
  console.log(`❌ Comunicações sem advogados: ${semAdvogados} (${Math.round(semAdvogados/resultado.items.length*100)}%)`);

  // Exemplos de advogados
  console.log('\n═══════════════ EXEMPLOS DE ADVOGADOS ENCONTRADOS ═══════════════\n');

  let exemplosEncontrados = 0;
  for (const item of resultado.items) {
    if (item.destinatarioadvogados && item.destinatarioadvogados.length > 0) {
      for (const destAdv of item.destinatarioadvogados.slice(0, 3)) {
        console.log(`📌 OAB: ${destAdv.advogado.numero_oab}/${destAdv.advogado.uf_oab}`);
        console.log(`   Nome: ${destAdv.advogado.nome}`);
        console.log(`   Processo: ${item.numeroprocessocommascara || 'N/A'}\n`);
        exemplosEncontrados++;
        if (exemplosEncontrados >= 5) break;
      }
    }
    if (exemplosEncontrados >= 5) break;
  }

  console.log('\n✅ Debug concluído!\n');
}

debugEstrutura().catch(error => {
  console.error('❌ ERRO:', error.message);
  console.error(error.stack);
  process.exit(1);
});
