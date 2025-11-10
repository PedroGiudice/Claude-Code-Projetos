import { DJENApiClient } from './src/api/client.js';
import { ConfigAPI } from './src/types/index.js';
import fs from 'fs/promises';

async function debugOABSearch() {
  const dataEspecifica = '2025-10-28';

  console.log(`🔍 DEBUG - Buscando publicações em ${dataEspecifica}`);

  const config: ConfigAPI = {
    url: process.env.DJEN_API_URL || 'https://comunicaapi.pje.jus.br',
    maxRequestsPerMinute: 60,
    maxConcurrentRequests: 5,
  };

  const client = new DJENApiClient(config);

  console.log('\n📥 Consultando API DJEN...');
  const resultado = await client.buscarComunicacoes({
    dataInicio: dataEspecifica,
    dataFim: dataEspecifica,
    limit: 100, // Apenas 100 para debug
  });

  console.log(`\n✅ Total de comunicações: ${resultado.count}`);
  console.log(`✅ Comunicações retornadas: ${resultado.items.length}`);

  // Analisar estrutura de advogados
  console.log('\n📊 ANÁLISE DE ADVOGADOS NAS PRIMEIRAS 100 COMUNICAÇÕES:\n');

  let comAdvogados = 0;
  let semAdvogados = 0;
  const advogadosEncontrados = new Map<string, Set<string>>();

  for (const com of resultado.items) {
    if (com.destinatarioadvogados && com.destinatarioadvogados.length > 0) {
      comAdvogados++;

      for (const destAdv of com.destinatarioadvogados) {
        const oab = destAdv.advogado.numero_oab;
        const uf = destAdv.advogado.uf_oab;
        const chave = `${oab}/${uf}`;

        if (!advogadosEncontrados.has(chave)) {
          advogadosEncontrados.set(chave, new Set());
        }
        advogadosEncontrados.get(chave)!.add(com.numeroprocessocommascara);
      }
    } else {
      semAdvogados++;
    }
  }

  console.log(`Com advogados: ${comAdvogados}`);
  console.log(`Sem advogados: ${semAdvogados}`);
  console.log(`\nTotal de OABs únicas encontradas: ${advogadosEncontrados.size}`);

  // Verificar se OAB 129021/SP está presente
  const oabProcurada = '129021';
  const ufProcurada = 'SP';
  const chaveProcurada = `${oabProcurada}/${ufProcurada}`;

  console.log(`\n🔎 Procurando OAB ${chaveProcurada}...`);

  if (advogadosEncontrados.has(chaveProcurada)) {
    const processos = advogadosEncontrados.get(chaveProcurada)!;
    console.log(`\n✅ ENCONTRADA! Processos: ${Array.from(processos).join(', ')}`);
  } else {
    console.log(`\n❌ NÃO ENCONTRADA nas primeiras 100 comunicações`);

    // Mostrar algumas OABs de exemplo
    console.log(`\n📋 Exemplos de OABs encontradas (primeiras 10):`);
    let count = 0;
    for (const [oab, processos] of advogadosEncontrados.entries()) {
      if (count >= 10) break;
      console.log(`   ${oab} - ${processos.size} processo(s)`);
      count++;
    }
  }

  // Salvar amostra completa para análise
  const amostra = resultado.items.slice(0, 5).map(com => ({
    numeroProcesso: com.numeroprocessocommascara,
    tribunal: com.siglaTribunal,
    data: com.data_disponibilizacao,
    tipo: com.tipoComunicacao,
    destinatarioadvogados: com.destinatarioadvogados?.map(da => ({
      id: da.id,
      advogado: {
        nome: da.advogado.nome,
        numero_oab: da.advogado.numero_oab,
        uf_oab: da.advogado.uf_oab,
      }
    })),
  }));

  await fs.writeFile(
    'E:/djen-data/debug-amostra.json',
    JSON.stringify(amostra, null, 2),
    'utf-8'
  );

  console.log(`\n💾 Amostra salva em: E:/djen-data/debug-amostra.json`);

  // Agora buscar TODAS as comunicações do dia para encontrar a OAB
  console.log(`\n\n🔄 Buscando TODAS as comunicações do dia ${dataEspecifica}...`);

  const resultadoCompleto = await client.buscarComunicacoes({
    dataInicio: dataEspecifica,
    dataFim: dataEspecifica,
    limit: 10000,
  });

  console.log(`✅ Total: ${resultadoCompleto.count} comunicações`);

  const numeroOabNormalizado = oabProcurada.replace(/\D/g, '');
  const comunicacoesFiltradas = resultadoCompleto.items.filter(comunicacao => {
    return comunicacao.destinatarioadvogados?.some(destAdv => {
      const oabMatch = destAdv.advogado.numero_oab === numeroOabNormalizado;
      const ufMatch = destAdv.advogado.uf_oab.toUpperCase() === ufProcurada.toUpperCase();
      return oabMatch && ufMatch;
    });
  });

  console.log(`\n📊 Publicações encontradas para OAB ${oabProcurada}/${ufProcurada}: ${comunicacoesFiltradas.length}`);

  if (comunicacoesFiltradas.length > 0) {
    console.log(`\n✅ PROCESSOS ENCONTRADOS:\n`);
    const processos = new Set(comunicacoesFiltradas.map(c => c.numeroprocessocommascara));
    processos.forEach((p, i) => {
      console.log(`${i + 1}. ${p}`);
    });

    // Salvar resultado completo
    await fs.writeFile(
      'E:/djen-data/debug-resultado-completo.json',
      JSON.stringify(comunicacoesFiltradas, null, 2),
      'utf-8'
    );
    console.log(`\n💾 Resultado completo salvo em: E:/djen-data/debug-resultado-completo.json`);
  } else {
    console.log(`\n❌ Nenhuma publicação encontrada mesmo buscando todas as ${resultadoCompleto.count} comunicações`);

    // Análise de todas as OABs do dia
    const todasOABs = new Set<string>();
    for (const com of resultadoCompleto.items) {
      if (com.destinatarioadvogados) {
        for (const destAdv of com.destinatarioadvogados) {
          todasOABs.add(`${destAdv.advogado.numero_oab}/${destAdv.advogado.uf_oab}`);
        }
      }
    }

    console.log(`\n📊 Total de OABs únicas no dia: ${todasOABs.size}`);

    // Procurar OABs parecidas com 129021
    const oabsParecidas = Array.from(todasOABs).filter(oab => oab.includes('129021') || oab.includes('SP'));
    console.log(`\n🔎 OABs de SP encontradas no dia (primeiras 20):`);
    const oabsSP = Array.from(todasOABs).filter(oab => oab.endsWith('/SP')).slice(0, 20);
    oabsSP.forEach(oab => console.log(`   ${oab}`));
  }
}

debugOABSearch().catch(error => {
  console.error('❌ Erro:', error.message);
  console.error(error.stack);
  process.exit(1);
});
