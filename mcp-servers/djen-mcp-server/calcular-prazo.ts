#!/usr/bin/env tsx
/**
 * Script executor para cálculo de prazos processuais
 * Uso: npx tsx calcular-prazo.ts <argumentos>
 */

import { calcularPrazo, calcularMultiplosPrazos, PRAZOS_COMUNS } from './src/utils/prazo-calculator.js';
import fs from 'fs/promises';

interface PublicacaoDJEN {
  dataPublicacao?: string;
  tipo?: string;
}

interface ArquivoDJEN {
  publicacoes?: PublicacaoDJEN[];
  comunicacoes?: PublicacaoDJEN[];
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 CALCULADORA DE PRAZOS PROCESSUAIS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('Uso:');
    console.log('  npx tsx calcular-prazo.ts DD/MM/YYYY <dias|tipo>');
    console.log('  npx tsx calcular-prazo.ts DD/MM/YYYY multiplos');
    console.log('  npx tsx calcular-prazo.ts arquivo:<caminho> <tipo>');
    console.log('');
    console.log('Exemplos:');
    console.log('  npx tsx calcular-prazo.ts 15/01/2025 15');
    console.log('  npx tsx calcular-prazo.ts 15/01/2025 contestacao');
    console.log('  npx tsx calcular-prazo.ts 15/01/2025 multiplos');
    console.log('  npx tsx calcular-prazo.ts arquivo:E:/djen-data/processo.json apelacao');
    console.log('');
    console.log('Tipos de prazo disponíveis:');
    console.log('  - contestacao (15 dias úteis)');
    console.log('  - apelacao (15 dias úteis)');
    console.log('  - agravo_instrumento (15 dias úteis)');
    console.log('  - embargos_declaracao (5 dias úteis)');
    console.log('  - contrarrazoes (15 dias úteis)');
    console.log('  - recurso_inominado (10 dias úteis)');
    console.log('  - manifestacao (5 dias úteis)');
    console.log('');
    process.exit(1);
  }

  let dataBase: Date;
  let prazo: number | string;
  let modo: 'simples' | 'multiplos' | 'arquivo' = 'simples';
  let tribunal: string = 'NACIONAL';

  try {
    // Detectar formato
    if (args[0].startsWith('arquivo:')) {
      // Formato 3: arquivo JSON
      modo = 'arquivo';
      const caminhoArquivo = args[0].replace('arquivo:', '');
      const tipoPrazo = args[1];

      if (!tipoPrazo) {
        throw new Error('Tipo de prazo não especificado para arquivo');
      }

      // Ler JSON
      const jsonContent = await fs.readFile(caminhoArquivo, 'utf-8');
      const data: ArquivoDJEN = JSON.parse(jsonContent);

      // Extrair publicação mais recente
      const publicacoes = data.publicacoes || data.comunicacoes || [];
      if (publicacoes.length === 0) {
        throw new Error('Nenhuma publicação encontrada no arquivo JSON');
      }

      // Ordenar por data (mais recente primeiro)
      publicacoes.sort((a, b) => {
        const dateA = a.dataPublicacao ? new Date(a.dataPublicacao).getTime() : 0;
        const dateB = b.dataPublicacao ? new Date(b.dataPublicacao).getTime() : 0;
        return dateB - dateA;
      });

      const ultimaPublicacao = publicacoes[0];
      if (!ultimaPublicacao.dataPublicacao) {
        throw new Error('Data de publicação não encontrada');
      }

      dataBase = new Date(ultimaPublicacao.dataPublicacao);
      prazo = tipoPrazo;

      console.log('═══════════════════════════════════════════════════════');
      console.log(`📄 Arquivo: ${caminhoArquivo}`);
      console.log(`📅 Última publicação: ${dataBase.toLocaleDateString('pt-BR')}`);
      console.log(`📋 Tipo: ${ultimaPublicacao.tipo || 'N/A'}`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
    } else if (args[1] === 'multiplos') {
      // Formato 4: múltiplos prazos
      modo = 'multiplos';
      dataBase = parseDataBR(args[0]);
    } else {
      // Formato 1 ou 2: data + prazo
      dataBase = parseDataBR(args[0]);
      prazo = args[1];
    }

    // Detectar tribunal (opcional, via --tribunal=TJSP)
    const tribunalArg = args.find(arg => arg.startsWith('--tribunal='));
    if (tribunalArg) {
      tribunal = tribunalArg.replace('--tribunal=', '');
    }

    if (modo === 'multiplos') {
      // Modo múltiplos prazos
      await calcularMultiplosPrazosExibir(dataBase, tribunal);
    } else {
      // Modo simples
      await calcularPrazoSimples(dataBase, prazo!, tribunal);
    }
  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function parseDataBR(data: string): Date {
  const [dia, mes, ano] = data.split('/').map(Number);

  if (!dia || !mes || !ano || dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    throw new Error(`Data inválida: ${data}. Use o formato DD/MM/YYYY`);
  }

  return new Date(ano, mes - 1, dia);
}

async function calcularPrazoSimples(dataBase: Date, prazo: number | string, tribunal: string) {
  // Determinar dias do prazo
  let dias: number;
  let nomePrazo: string;

  if (typeof prazo === 'string' && prazo in PRAZOS_COMUNS) {
    dias = PRAZOS_COMUNS[prazo as keyof typeof PRAZOS_COMUNS];
    nomePrazo = prazo.replace(/_/g, ' ').toUpperCase();
  } else {
    dias = parseInt(prazo as string);
    if (isNaN(dias) || dias <= 0) {
      throw new Error(`Prazo inválido: ${prazo}. Use um número ou tipo válido (contestacao, apelacao, etc.)`);
    }
    nomePrazo = `${dias} dias úteis`;
  }

  // Calcular
  const resultado = calcularPrazo({
    dataInicial: dataBase,
    dias,
    tribunal,
    verificarProrrogacoes: true,
    aplicarRegraQuintaFeira: true,
  });

  // Exibir resultado
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 CÁLCULO DE PRAZO PROCESSUAL');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`📋 Prazo: ${nomePrazo}`);
  if (tribunal !== 'NACIONAL') {
    console.log(`⚖️  Tribunal: ${tribunal}`);
  }
  console.log('');

  for (const linha of resultado.explicacao) {
    console.log(`   ${linha}`);
  }

  console.log('');
  console.log('📈 ESTATÍSTICAS:');
  console.log(`   • Dias úteis: ${resultado.diasUteis}`);
  console.log(`   • Dias corridos: ${resultado.diasCorridos}`);
  console.log(`   • Fins de semana: ${resultado.finsDeSemana}`);
  console.log(`   • Feriados: ${resultado.feriados.length}`);

  if (resultado.diasSuspensos > 0) {
    console.log(`   • Dias suspensos (prorrogações): ${resultado.diasSuspensos}`);
  }

  console.log('');

  if (resultado.feriados.length > 0) {
    console.log('🎉 FERIADOS NO PERÍODO:');
    for (const feriado of resultado.feriados) {
      console.log(`   • ${feriado.data.toLocaleDateString('pt-BR')}: ${feriado.nome}`);
    }
    console.log('');
  }

  if (resultado.alertas.length > 0) {
    console.log('⚠️  ALERTAS:');
    for (const alerta of resultado.alertas) {
      console.log(`   ${alerta}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log(`🗓️  VENCIMENTO: ${resultado.dataFinal.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase()}`);
  console.log('═══════════════════════════════════════════════════════');
}

async function calcularMultiplosPrazosExibir(dataBase: Date, tribunal: string) {
  const prazosParaCalcular = [
    { nome: 'Contestação', dias: PRAZOS_COMUNS.contestacao },
    { nome: 'Apelação', dias: PRAZOS_COMUNS.apelacao },
    { nome: 'Agravo de Instrumento', dias: PRAZOS_COMUNS.agravo_instrumento },
    { nome: 'Embargos de Declaração', dias: PRAZOS_COMUNS.embargos_declaracao },
    { nome: 'Contrarrazões', dias: PRAZOS_COMUNS.contrarrazoes },
    { nome: 'Recurso Inominado (JEC)', dias: PRAZOS_COMUNS.recurso_inominado },
    { nome: 'Manifestação', dias: PRAZOS_COMUNS.manifestacao },
  ];

  const resultados = calcularMultiplosPrazos(dataBase, prazosParaCalcular, {
    tribunal,
    aplicarRegraQuintaFeira: true,
    verificarProrrogacoes: true,
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 PRAZOS PROCESSUAIS A PARTIR DE ${dataBase.toLocaleDateString('pt-BR')}`);
  if (tribunal !== 'NACIONAL') {
    console.log(`⚖️  Tribunal: ${tribunal}`);
  }
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  for (const resultado of resultados) {
    const diaSemana = resultado.dataFinal.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dataCompleta = resultado.dataFinal.toLocaleDateString('pt-BR');

    console.log(`📌 ${resultado.nome} (${resultado.diasUteis} dias úteis)`);
    console.log(`   Vencimento: ${diaSemana}, ${dataCompleta}`);

    if (resultado.diasSuspensos && resultado.diasSuspensos > 0) {
      console.log(`   Dias suspensos: ${resultado.diasSuspensos} (prorrogações)`);
    }

    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('💡 Use "npx tsx calcular-prazo.ts <data> <tipo>" para detalhes');
  console.log('═══════════════════════════════════════════════════════');
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
