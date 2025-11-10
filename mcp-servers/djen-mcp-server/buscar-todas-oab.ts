import axios from 'axios';
import fs from 'fs/promises';

async function buscarTodasPublicacoesOAB() {
  const baseURL = 'https://comunicaapi.pje.jus.br';
  const numeroOab = '129021';
  const ufOab = 'SP';
  const dataEspecifica = '2025-10-28';

  console.log(`🔍 Buscando TODAS as publicações da OAB ${numeroOab}/${ufOab}`);
  console.log(`📅 Data: ${dataEspecifica}\n`);

  // Teste 1: Tentar com itensPorPagina alto
  console.log('1️⃣ Testando com itensPorPagina=10000:');
  try {
    const response1 = await axios.get(`${baseURL}/api/v1/comunicacao`, {
      params: {
        numeroOab: numeroOab,
        dataInicio: dataEspecifica,
        dataFim: dataEspecifica,
        itensPorPagina: 10000,
      },
      timeout: 60000,
    });

    console.log(`   Count: ${response1.data.count}`);
    console.log(`   Items retornados: ${response1.data.items.length}\n`);

    if (response1.data.items.length >= response1.data.count) {
      console.log('   ✅ Conseguimos todos os resultados de uma vez!\n');

      // Organizar por processo
      const processos = new Map<string, any>();

      for (const comunicacao of response1.data.items) {
        const numeroProcesso = comunicacao.numeroprocessocommascara;

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

      console.log(`📁 Total de processos: ${processos.size}`);
      console.log('\n═══════════════ RESUMO POR TRIBUNAL ═══════════════\n');

      const tribunais = new Map<string, number>();
      for (const processo of processos.values()) {
        const count = tribunais.get(processo.tribunal) || 0;
        tribunais.set(processo.tribunal, count + 1);
      }

      for (const [tribunal, count] of Array.from(tribunais.entries()).sort((a, b) => b[1] - a[1])) {
        console.log(`   ${tribunal}: ${count} processo(s)`);
      }

      // Salvar resultado completo
      const resultado_final = {
        consulta: {
          numeroOab,
          ufOab,
          dataEspecifica,
          dataConsulta: new Date().toISOString(),
        },
        estatisticas: {
          totalPublicacoes: response1.data.count,
          totalProcessos: processos.size,
          distribuicaoTribunais: Object.fromEntries(tribunais),
        },
        processos: Array.from(processos.values()),
      };

      const filepath = `E:/djen-data/oab-${numeroOab}-${ufOab}-${dataEspecifica}-COMPLETO.json`;
      await fs.writeFile(filepath, JSON.stringify(resultado_final, null, 2), 'utf-8');

      console.log(`\n💾 Arquivo completo salvo: ${filepath}`);
      console.log(`\n✅ Consulta concluída! ${response1.data.count} publicações em ${processos.size} processos`);
    } else {
      console.log('   ⚠️  Retornou apenas parcial. Tentando abordagem alternativa...\n');
      await buscarComMultiplasRequisicoes(numeroOab, dataEspecifica);
    }
  } catch (error: any) {
    console.log(`   ❌ ERRO: ${error.message}`);
    if (error.response?.status === 429) {
      console.log('   Rate limit atingido! Aguardando 60 segundos...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
}

async function buscarComMultiplasRequisicoes(numeroOab: string, dataEspecifica: string) {
  console.log('2️⃣ Buscando com múltiplas requisições por tribunal...\n');

  const baseURL = 'https://comunicaapi.pje.jus.br';
  const tribunais = ['TJSP', 'TJMG', 'TJRJ', 'TRT3', 'TRF4', 'TRF3', 'TRF1', 'TST', 'STJ', 'STF'];

  const todasPublicacoes: any[] = [];

  for (const tribunal of tribunais) {
    try {
      console.log(`   Buscando ${tribunal}...`);

      const response = await axios.get(`${baseURL}/api/v1/comunicacao`, {
        params: {
          numeroOab: numeroOab,
          siglaTribunal: tribunal,
          dataInicio: dataEspecifica,
          dataFim: dataEspecifica,
          itensPorPagina: 10000,
        },
        timeout: 30000,
      });

      console.log(`      ${response.data.count} publicação(ões)`);
      todasPublicacoes.push(...response.data.items);

      // Aguardar um pouco entre requisições para respeitar rate limit
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.log(`      Erro: ${error.message}`);
    }
  }

  console.log(`\n   ✅ Total coletado: ${todasPublicacoes.length} publicações`);
}

buscarTodasPublicacoesOAB().catch(error => {
  console.error('❌ Erro:', error.message);
});
