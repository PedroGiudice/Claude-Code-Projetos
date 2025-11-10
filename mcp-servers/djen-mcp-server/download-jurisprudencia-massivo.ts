#!/usr/bin/env tsx
/**
 * Script para download massivo de 25-50 mil publicações de processos de segunda instância
 *
 * Foco: Apelações, Embargos, Agravos (análise jurisprudencial)
 * Salva com nomenclatura distintiva por tribunal, classe e período
 *
 * Uso:
 *   npx tsx download-jurisprudencia-massivo.ts [opções]
 *
 * Opções:
 *   --tribunal <sigla>    Tribunal específico (padrão: todos os principais)
 *   --limite <número>     Número máximo de processos (padrão: 25000)
 *   --meses <número>      Período em meses (padrão: 6)
 *   --classe <tipo>       Classe específica: apelacao, agravo, embargos, todas (padrão: todas)
 */

import { config } from 'dotenv';
import { getUnifiedClient } from './src/api/unified-client.js';
import type { TribunalDataJud } from './src/api/datajud-types.js';
import fs from 'fs/promises';
import path from 'path';

// ===== CONFIGURAÇÃO =====

interface ConfigDownload {
  tribunais: TribunalDataJud[];
  classes: string[];
  mesesRetroativos: number;
  limitePorTribunal: number;
  limiteTotal: number;
  outputDir: string;
}

const TRIBUNAIS_PRINCIPAIS: TribunalDataJud[] = [
  'tjsp', // TJSP - maior volume
  'tjrj', // TJRJ
  'tjmg', // TJMG
  'tjrs', // TJRS
  'tjpr', // TJPR
  'stj',  // STJ - uniformização
];

const CLASSES_SEGUNDA_INSTANCIA = [
  'Apelação',
  'Apelação Cível',
  'Agravo de Instrumento',
  'Embargos de Declaração',
  'Agravo Interno',
];

// ===== FUNÇÕES AUXILIARES =====

function calcularPeriodo(meses: number): { inicio: string; fim: string } {
  const fim = new Date();
  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - meses);

  return {
    inicio: inicio.toISOString().split('T')[0],
    fim: fim.toISOString().split('T')[0],
  };
}

function normalizarNomeArquivo(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function salvarLote(
  tribunal: string,
  classe: string,
  processos: any[],
  periodo: { inicio: string; fim: string },
  outputDir: string
): Promise<string> {
  const timestamp = new Date().toISOString().split('T')[0];
  const classeNorm = normalizarNomeArquivo(classe);
  const filename = `${tribunal}-${classeNorm}-${periodo.inicio}_${periodo.fim}-${timestamp}-${processos.length}proc.json`;
  const filepath = path.join(outputDir, filename);

  const dados = {
    metadados: {
      tribunal: tribunal.toUpperCase(),
      classe,
      periodo,
      totalProcessos: processos.length,
      dataDownload: new Date().toISOString(),
      fonte: 'Unified Client (DataJud + DJEN)',
    },
    processos,
  };

  await fs.writeFile(filepath, JSON.stringify(dados, null, 2), 'utf-8');
  return filepath;
}

// ===== DOWNLOAD PRINCIPAL =====

async function downloadMassivo(config: ConfigDownload) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║    DOWNLOAD MASSIVO DE JURISPRUDÊNCIA (2ª INSTÂNCIA)  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const periodo = calcularPeriodo(config.mesesRetroativos);
  console.log(`📅 Período: ${periodo.inicio} a ${periodo.fim} (${config.mesesRetroativos} meses)`);
  console.log(`🏛️  Tribunais: ${config.tribunais.map(t => t.toUpperCase()).join(', ')}`);
  console.log(`⚖️  Classes: ${config.classes.join(', ')}`);
  console.log(`📊 Limite total: ${config.limiteTotal.toLocaleString('pt-BR')} processos`);
  console.log(`📁 Diretório: ${config.outputDir}\n`);

  // Criar diretório de saída
  await fs.mkdir(config.outputDir, { recursive: true });

  // Inicializar cliente unificado
  const client = getUnifiedClient(
    process.env.DJEN_API_URL,
    {
      url: process.env.DJEN_API_URL || 'https://comunicaapi.pje.jus.br',
      maxRequestsPerMinute: 60,
      maxConcurrentRequests: 5,
    }
  );

  const startTime = Date.now();
  let totalProcessos = 0;
  const arquivosSalvos: string[] = [];

  // Iterar por tribunais
  for (const tribunal of config.tribunais) {
    if (totalProcessos >= config.limiteTotal) {
      console.log(`\n✅ Limite total atingido (${config.limiteTotal}). Parando...`);
      break;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏛️  TRIBUNAL: ${tribunal.toUpperCase()}`);
    console.log('='.repeat(60));

    // Iterar por classes
    for (const classe of config.classes) {
      if (totalProcessos >= config.limiteTotal) break;

      const limiteRestante = Math.min(
        config.limitePorTribunal,
        config.limiteTotal - totalProcessos
      );

      console.log(`\n⚖️  Classe: ${classe} (limite: ${limiteRestante})`);

      try {
        console.log('   📥 Consultando APIs (DataJud + DJEN)...');

        // Buscar com cliente unificado
        const resultado = await client.buscarComFiltros(tribunal, {
          classe,
          dataAjuizamento: periodo,
        });

        const processosEncontrados = resultado.processos.slice(0, limiteRestante);
        const qtd = processosEncontrados.length;

        if (qtd === 0) {
          console.log('   ⚠️  Nenhum processo encontrado');
          continue;
        }

        console.log(`   ✅ ${qtd} processos encontrados`);
        console.log(`   📊 Fontes: DataJud(${resultado.estatisticas.datajud.encontrados}), DJEN(${resultado.estatisticas.djen.encontrados})`);
        console.log(`   🔀 Duplicatas removidas: ${resultado.estatisticas.duplicatasRemovidas}`);

        // Salvar arquivo
        const filepath = await salvarLote(
          tribunal,
          classe,
          processosEncontrados,
          periodo,
          config.outputDir
        );

        const sizeMB = (await fs.stat(filepath)).size / (1024 * 1024);
        console.log(`   💾 Salvo: ${path.basename(filepath)} (${sizeMB.toFixed(2)} MB)`);

        arquivosSalvos.push(filepath);
        totalProcessos += qtd;

        console.log(`   📈 Progresso total: ${totalProcessos}/${config.limiteTotal}`);

      } catch (error: any) {
        console.error(`   ❌ Erro: ${error.message}`);
      }

      // Delay para respeitar rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const tempoTotal = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                  ✅ DOWNLOAD CONCLUÍDO                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`📊 ESTATÍSTICAS FINAIS:\n`);
  console.log(`   🏛️  Tribunais consultados: ${config.tribunais.length}`);
  console.log(`   ⚖️  Classes consultadas: ${config.classes.length}`);
  console.log(`   📝 Total de processos: ${totalProcessos.toLocaleString('pt-BR')}`);
  console.log(`   📁 Arquivos gerados: ${arquivosSalvos.length}`);
  console.log(`   ⏱️  Tempo total: ${tempoTotal} minutos`);
  console.log(`   📂 Diretório: ${config.outputDir}\n`);

  console.log('📄 ARQUIVOS SALVOS:\n');
  for (const arquivo of arquivosSalvos) {
    const stats = await fs.stat(arquivo);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   • ${path.basename(arquivo)} (${sizeMB} MB)`);
  }

  console.log('\n💡 PRÓXIMOS PASSOS:\n');
  console.log('   1. Use o agente djen-rag-analyzer para análise jurisprudencial');
  console.log('   2. Use /organizar-cliente para agrupar por cliente');
  console.log('   3. Aplique filtros semânticos para temas específicos\n');

  return {
    totalProcessos,
    arquivosSalvos,
    tempoMinutos: parseFloat(tempoTotal),
  };
}

// ===== PARSE DE ARGUMENTOS =====

function parseArgs() {
  const args = process.argv.slice(2);

  const config: ConfigDownload = {
    tribunais: TRIBUNAIS_PRINCIPAIS,
    classes: CLASSES_SEGUNDA_INSTANCIA,
    mesesRetroativos: 6,
    limitePorTribunal: 5000,
    limiteTotal: 25000,
    outputDir: 'E:/djen-data/jurisprudencia-massiva',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--tribunal':
        config.tribunais = [args[++i] as TribunalDataJud];
        break;
      case '--limite':
        config.limiteTotal = parseInt(args[++i]);
        config.limitePorTribunal = Math.ceil(config.limiteTotal / config.tribunais.length);
        break;
      case '--meses':
        config.mesesRetroativos = parseInt(args[++i]);
        break;
      case '--classe':
        const classeArg = args[++i].toLowerCase();
        if (classeArg === 'apelacao') config.classes = ['Apelação', 'Apelação Cível'];
        else if (classeArg === 'agravo') config.classes = ['Agravo de Instrumento', 'Agravo Interno'];
        else if (classeArg === 'embargos') config.classes = ['Embargos de Declaração'];
        else if (classeArg !== 'todas') {
          console.error(`❌ Classe inválida: ${classeArg}`);
          process.exit(1);
        }
        break;
      case '--help':
        console.log(`
Uso: npx tsx download-jurisprudencia-massivo.ts [opções]

Opções:
  --tribunal <sigla>    Tribunal específico (padrão: tjsp, tjrj, tjmg, tjrs, tjpr, stj)
  --limite <número>     Número máximo de processos (padrão: 25000)
  --meses <número>      Período em meses (padrão: 6)
  --classe <tipo>       apelacao, agravo, embargos, todas (padrão: todas)
  --help               Exibe esta mensagem

Exemplos:
  # Download padrão (25k processos, 6 meses, todos tribunais)
  npx tsx download-jurisprudencia-massivo.ts

  # TJSP apenas, 50k processos, último ano
  npx tsx download-jurisprudencia-massivo.ts --tribunal tjsp --limite 50000 --meses 12

  # Apenas apelações de todos tribunais
  npx tsx download-jurisprudencia-massivo.ts --classe apelacao
        `);
        process.exit(0);
    }
  }

  return config;
}

// ===== EXECUÇÃO =====

// Carregar .env
config();

const downloadConfig = parseArgs();

downloadMassivo(downloadConfig).catch(error => {
  console.error('\n❌ ERRO FATAL:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
