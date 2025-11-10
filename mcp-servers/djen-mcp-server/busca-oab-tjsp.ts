import { DJENApiClient } from './src/api/client.js';
import { ConfigAPI } from './src/types/index.js';
import fs from 'fs/promises';
import path from 'path';

async function buscarPorOABComTribunal() {
  const dataEspecifica = '2025-10-28';
  const numeroOab = '129021';
  const ufOab = 'SP';
  const tribunal = 'TJSP'; // Filtrar por TJSP

  console.log(`🔍 Buscando publicações da OAB ${numeroOab}/${ufOab}`);
  console.log(`📅 Data: ${dataEspecifica}`);
  console.log(`🏛️  Tribunal: ${tribunal}`);

  const config: ConfigAPI = {
    url: process.env.DJEN_API_URL || 'https://comunicaapi.pje.jus.br',
    maxRequestsPerMinute: 60,
    maxConcurrentRequests: 5,
  };

  const client = new DJENApiClient(config);

  console.log('\n📥 Consultando API DJEN com filtro de tribunal...');
  const resultado = await client.buscarComunicacoes({
    tribunal: tribunal,
    dataInicio: dataEspecifica,
    dataFim: dataEspecifica,
    limit: 10000,
  });

  console.log(`✅ Total de comunicações do ${tribunal} na data: ${resultado.count}`);
  console.log(`✅ Comunicações retornadas: ${resultado.items.length}`);

  // Filtrar por OAB
  const numeroOabNormalizado = numeroOab.replace(/\D/g, '');
  const comunicacoesFiltradas = resultado.items.filter(comunicacao => {
    return comunicacao.destinatarioadvogados?.some(destAdv => {
      const oabMatch = destAdv.advogado.numero_oab === numeroOabNormalizado;
      const ufMatch = destAdv.advogado.uf_oab.toUpperCase() === ufOab.toUpperCase();
      return oabMatch && ufMatch;
    });
  });

  console.log(`\n📊 Publicações encontradas para OAB ${numeroOab}/${ufOab}: ${comunicacoesFiltradas.length}`);

  if (comunicacoesFiltradas.length === 0) {
    console.log('\n❌ Nenhuma publicação encontrada para esta OAB no TJSP.');

    // Mostrar algumas OABs de SP encontradas
    const oabsSP = new Set<string>();
    for (const com of resultado.items) {
      if (com.destinatarioadvogados) {
        for (const destAdv of com.destinatarioadvogados) {
          if (destAdv.advogado.uf_oab === 'SP') {
            oabsSP.add(destAdv.advogado.numero_oab);
          }
        }
      }
    }

    console.log(`\n📊 Total de OABs de SP no TJSP neste dia: ${oabsSP.size}`);
    console.log(`\n🔎 Exemplos de OABs de SP encontradas (primeiras 20):`);
    Array.from(oabsSP).slice(0, 20).forEach(oab => console.log(`   ${oab}/SP`));

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

  const filename = `oab-${numeroOab}-${ufOab}-${dataEspecifica}.json`;
  const filepath = path.join(outputDir, filename);

  const resultado_final = {
    consulta: {
      numeroOab,
      ufOab,
      tribunal,
      dataEspecifica,
      dataConsulta: new Date().toISOString(),
    },
    estatisticas: {
      totalComunicacoesTribunal: resultado.count,
      comunicacoesFiltradas: comunicacoesFiltradas.length,
      totalProcessos: processos.size,
    },
    processos: Array.from(processos.values()),
  };

  await fs.writeFile(filepath, JSON.stringify(resultado_final, null, 2), 'utf-8');

  console.log(`\n💾 Arquivo salvo: ${filepath}`);
  console.log(`\n✅ Consulta concluída!`);
}

buscarPorOABComTribunal().catch(error => {
  console.error('❌ Erro:', error.message);
  console.error(error.stack);
  process.exit(1);
});
