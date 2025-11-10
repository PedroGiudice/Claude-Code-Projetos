/**
 * Script para buscar publicações da ação COMEX DISTRIBUIDORA vs SALESFORCE no TJSP
 */

import { DJENApiClient } from './src/api/client.js';
import { loadConfig } from './src/utils/config.js';
import * as fs from 'fs';
import * as path from 'path';

async function buscarPublicacoesComexSalesforce() {
  console.log('🔍 Iniciando busca: COMEX DISTRIBUIDORA vs SALESFORCE no TJSP\n');

  const config = loadConfig();

  const apiClient = new DJENApiClient({
    url: config.api.url,
    maxRequestsPerMinute: config.api.maxRequestsPerMinute,
    maxConcurrentRequests: config.api.maxConcurrentRequests,
  });

  try {
    // Busca direta pelo número do processo CORRETO
    const numeroProcesso = '1057607-11.2024.8.26.0002';
    const numeroProcessoLimpo = numeroProcesso.replace(/\D/g, '');

    console.log(`📋 Número do processo: ${numeroProcesso}`);
    console.log(`📅 Distribuição: 08.07.2025`);
    console.log(`⚖️  Tribunal: TJSP (Tribunal de Justiça de São Paulo)`);
    console.log(`\nBuscando TODAS as comunicações do processo...\n`);

    // Busca pelo número do processo
    const resultado = await apiClient.buscarComunicacoes({
      numeroProcesso: numeroProcessoLimpo,
      limit: 10000, // Máximo permitido pela API
    });

    console.log(`✅ Total de comunicações encontradas: ${resultado.count}`);
    console.log(`📥 Comunicações baixadas: ${resultado.items.length}\n`);

    const publicacoesFiltradas = resultado.items;

    if (publicacoesFiltradas.length === 0) {
      console.log('❌ Nenhuma publicação encontrada para este processo.');
      console.log(
        '\n💡 Possíveis motivos:\n' +
          '   - O processo ainda não tem publicações no DJEN\n' +
          '   - O número do processo pode estar incorreto\n' +
          '   - As publicações podem estar em outro sistema\n'
      );
      return;
    }

    // Agrupar por número de processo
    const processos = new Map<string, any[]>();
    publicacoesFiltradas.forEach((pub) => {
      const numProcesso = pub.numeroProcesso || 'SEM_NUMERO';
      if (!processos.has(numProcesso)) {
        processos.set(numProcesso, []);
      }
      processos.get(numProcesso)!.push(pub);
    });

    console.log(`📊 Processos únicos encontrados: ${processos.size}\n`);

    // Exibir resumo
    processos.forEach((pubs, numProcesso) => {
      console.log(`\n📋 Processo: ${numProcesso}`);
      console.log(`   Publicações: ${pubs.length}`);
      if (pubs[0].dataPublicacao) {
        const datas = pubs.map((p) => p.dataPublicacao).sort();
        console.log(`   Período: ${datas[0]} a ${datas[datas.length - 1]}`);
      }
    });

    // Salvar resultados
    const outputDir = 'E:/djen-data';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(
      outputDir,
      `comex-salesforce-${timestamp}.json`
    );

    const resultadoFinal = {
      metadata: {
        dataConsulta: new Date().toISOString(),
        tribunal: 'TJSP',
        numeroProcesso: numeroProcesso,
        partes: 'COMEX DISTRIBUIDORA x SALESFORCE TECNOLOGIA LTDA',
        totalEncontrado: publicacoesFiltradas.length,
        processosUnicos: processos.size,
      },
      processos: Array.from(processos.entries()).map(
        ([numeroProcesso, publicacoes]) => ({
          numeroProcesso,
          totalPublicacoes: publicacoes.length,
          publicacoes: publicacoes.sort(
            (a, b) =>
              new Date(a.dataPublicacao).getTime() -
              new Date(b.dataPublicacao).getTime()
          ),
        })
      ),
    };

    fs.writeFileSync(outputFile, JSON.stringify(resultadoFinal, null, 2));

    console.log(`\n💾 Resultados salvos em:`);
    console.log(`   ${outputFile}\n`);

    // Salvar também um resumo legível
    const resumoFile = path.join(
      outputDir,
      `comex-salesforce-resumo-${timestamp}.txt`
    );
    let resumoTexto = `BUSCA: COMEX DISTRIBUIDORA vs SALESFORCE - TJSP\n`;
    resumoTexto += `Data da consulta: ${new Date().toLocaleString('pt-BR')}\n`;
    resumoTexto += `Processo: ${numeroProcesso}\n`;
    resumoTexto += `\n${'='.repeat(80)}\n\n`;
    resumoTexto += `RESUMO:\n`;
    resumoTexto += `- Total de publicações encontradas: ${publicacoesFiltradas.length}\n`;
    resumoTexto += `- Processos únicos: ${processos.size}\n\n`;

    processos.forEach((pubs, numProcesso) => {
      resumoTexto += `\n${'-'.repeat(80)}\n`;
      resumoTexto += `PROCESSO: ${numProcesso}\n`;
      resumoTexto += `Total de publicações: ${pubs.length}\n\n`;

      pubs.forEach((pub, idx) => {
        resumoTexto += `\n${idx + 1}. Data: ${pub.dataPublicacao}\n`;
        if (pub.tipo) resumoTexto += `   Tipo: ${pub.tipo}\n`;
        if (pub.orgaoJulgador)
          resumoTexto += `   Órgão: ${pub.orgaoJulgador}\n`;
        if (pub.conteudo) {
          const preview =
            pub.conteudo.substring(0, 200) +
            (pub.conteudo.length > 200 ? '...' : '');
          resumoTexto += `   Conteúdo: ${preview}\n`;
        }
      });
    });

    fs.writeFileSync(resumoFile, resumoTexto);
    console.log(`📄 Resumo legível salvo em:`);
    console.log(`   ${resumoFile}\n`);

    console.log('✅ Busca concluída com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro durante a busca:', error);
    throw error;
  }
}

// Executar
buscarPublicacoesComexSalesforce().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
