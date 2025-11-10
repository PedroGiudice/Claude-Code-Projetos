import { DJENApiClient } from './src/api/client.js';
import { ConfigAPI } from './src/types/index.js';
import fs from 'fs/promises';
import path from 'path';

async function buscarPorOAB(numeroOab: string, ufOab: string, dataEspecifica: string) {
  // Usar a data específica como início e fim
  const dataInicioStr = dataEspecifica;
  const dataFimStr = dataEspecifica;

  console.log(`🔍 Buscando publicações da OAB ${numeroOab}/${ufOab}`);
  console.log(`📅 Data específica: ${dataEspecifica}`);

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

  console.log(`✅ Total de comunicações na data: ${resultado.count}`);

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
    console.log('\n❌ Nenhuma publicação encontrada para esta OAB na data especificada.');
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
  const filename = `oab-${numeroOab}-${ufOab}-${dataEspecifica}.json`;
  const filepath = path.join(outputDir, filename);

  const resultado_final = {
    consulta: {
      numeroOab,
      ufOab,
      dataEspecifica: dataEspecifica,
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

// Executar busca
const numeroOab = '129021';
const ufOab = 'SP';
const dataEspecifica = '2025-10-29';

buscarPorOAB(numeroOab, ufOab, dataEspecifica).catch(error => {
  console.error('❌ Erro:', error.message);
  console.error(error.stack);
  process.exit(1);
});
