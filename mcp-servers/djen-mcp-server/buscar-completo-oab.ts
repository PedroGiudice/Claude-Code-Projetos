import axios from 'axios';
import fs from 'fs/promises';

interface Comunicacao {
  id: number;
  numeroprocessocommascara: string;
  siglaTribunal: string;
  nomeClasse: string;
  nomeOrgao: string;
  data_disponibilizacao: string;
  tipoComunicacao: string;
  texto: string;
  link: string;
  hash: string;
}

async function buscarCompletoPorTribunal(
  numeroOab: string,
  tribunal: string,
  dataInicio: string,
  dataFim: string
): Promise<Comunicacao[]> {
  const baseURL = 'https://comunicaapi.pje.jus.br';
  const todasPublicacoes: Comunicacao[] = [];

  // A API não suporta paginação real, então vamos tentar buscar com limite máximo
  const response = await axios.get(`${baseURL}/api/v1/comunicacao`, {
    params: {
      numeroOab: numeroOab,
      siglaTribunal: tribunal,
      dataInicio: dataInicio,
      dataFim: dataFim,
      itensPorPagina: 10000, // Tentar máximo
    },
    timeout: 60000,
  });

  console.log(`   ${tribunal}: ${response.data.count} total, ${response.data.items.length} retornados`);

  todasPublicacoes.push(...response.data.items);

  // Se retornou menos que o count, há mais dados que não conseguimos acessar
  if (response.data.items.length < response.data.count) {
    console.log(`      ⚠️  API limitou em ${response.data.items.length} de ${response.data.count}`);
  }

  // Aguardar para respeitar rate limit (20 req/min = 3s entre requisições)
  await new Promise(resolve => setTimeout(resolve, 4000));

  return todasPublicacoes;
}

async function buscarTodasPublicacoesOAB() {
  const numeroOab = '129021';
  const ufOab = 'SP';
  const dataInicio = '2025-10-28';
  const dataFim = '2025-10-28';

  console.log(`🔍 Buscando TODAS as publicações da OAB ${numeroOab}/${ufOab}`);
  console.log(`📅 Período: ${dataInicio} a ${dataFim}\n`);

  // Lista expandida de tribunais brasileiros
  const tribunais = [
    // Tribunais Superiores
    'STF', 'STJ', 'TST', 'TSE', 'STM',
    // Tribunais Regionais Federais
    'TRF1', 'TRF2', 'TRF3', 'TRF4', 'TRF5', 'TRF6',
    // Tribunais de Justiça Estaduais
    'TJAC', 'TJAL', 'TJAP', 'TJAM', 'TJBA', 'TJCE', 'TJDF', 'TJES', 'TJGO',
    'TJMA', 'TJMT', 'TJMS', 'TJMG', 'TJPA', 'TJPB', 'TJPR', 'TJPE', 'TJPI',
    'TJRJ', 'TJRN', 'TJRS', 'TJRO', 'TJRR', 'TJSC', 'TJSP', 'TJSE', 'TJTO',
    // Tribunais Regionais do Trabalho
    'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9',
    'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17',
    'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24',
    // Tribunais Regionais Eleitorais
    'TREAC', 'TREAL', 'TREAP', 'TREAM', 'TREBA', 'TRECE', 'TREDF', 'TREES',
    'TREGO', 'TREMA', 'TREMT', 'TREMS', 'TREMG', 'TREPA', 'TREPB', 'TREPR',
    'TREPE', 'TREPI', 'TRERJ', 'TRERN', 'TRERS', 'TRERO', 'TRERR', 'TRESC',
    'TRESP', 'TRESE', 'TRETO',
    // Tribunais de Justiça Militar
    'TJMMG', 'TJMRS', 'TJMSP',
  ];

  const todasPublicacoes: Comunicacao[] = [];
  const estatisticas = new Map<string, number>();
  let requisicoes = 0;
  const maxRequisicoes = 18; // Limite seguro (20 por minuto, deixar margem)

  console.log(`📋 Buscando em ${tribunais.length} tribunais...\n`);

  for (const tribunal of tribunais) {
    if (requisicoes >= maxRequisicoes) {
      console.log(`\n⏸️  Atingido limite de ${maxRequisicoes} requisições`);
      console.log('   Aguardando 60 segundos para reset do rate limit...\n');
      await new Promise(resolve => setTimeout(resolve, 62000));
      requisicoes = 0;
    }

    try {
      const publicacoes = await buscarCompletoPorTribunal(
        numeroOab,
        tribunal,
        dataInicio,
        dataFim
      );

      if (publicacoes.length > 0) {
        todasPublicacoes.push(...publicacoes);
        estatisticas.set(tribunal, publicacoes.length);
      }

      requisicoes++;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.log(`   ⚠️  Rate limit atingido! Aguardando 60 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 62000));
        requisicoes = 0;
        // Tentar novamente
        try {
          const publicacoes = await buscarCompletoPorTribunal(
            numeroOab,
            tribunal,
            dataInicio,
            dataFim
          );
          if (publicacoes.length > 0) {
            todasPublicacoes.push(...publicacoes);
            estatisticas.set(tribunal, publicacoes.length);
          }
        } catch (retryError) {
          console.log(`   ❌ Erro ao retentar ${tribunal}: ${(retryError as any).message}`);
        }
      } else if (error.response?.status === 404 || error.response?.status === 400) {
        // Tribunal não existe ou sem dados
      } else {
        console.log(`   ❌ Erro ${tribunal}: ${error.message}`);
      }
    }
  }

  // Organizar por processo
  const processos = new Map<string, any>();

  for (const comunicacao of todasPublicacoes) {
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

  console.log(`\n\n═══════════════ RESULTADO FINAL ═══════════════\n`);
  console.log(`📊 Total de publicações coletadas: ${todasPublicacoes.length}`);
  console.log(`📁 Total de processos únicos: ${processos.size}`);
  console.log(`🏛️  Tribunais com publicações: ${estatisticas.size}`);

  console.log(`\n📊 Distribuição por tribunal (top 10):\n`);
  const topTribunais = Array.from(estatisticas.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  for (const [tribunal, count] of topTribunais) {
    console.log(`   ${tribunal}: ${count} publicação(ões)`);
  }

  // Salvar resultado completo
  const resultado_final = {
    consulta: {
      numeroOab,
      ufOab,
      dataInicio,
      dataFim,
      dataConsulta: new Date().toISOString(),
    },
    estatisticas: {
      totalPublicacoes: todasPublicacoes.length,
      totalProcessos: processos.size,
      totalTribunais: estatisticas.size,
      distribuicaoTribunais: Object.fromEntries(
        Array.from(estatisticas.entries()).sort((a, b) => b[1] - a[1])
      ),
    },
    processos: Array.from(processos.values()).sort((a, b) =>
      b.publicacoes.length - a.publicacoes.length
    ),
  };

  const filepath = `E:/djen-data/oab-${numeroOab}-${ufOab}-${dataInicio}-COMPLETO.json`;
  await fs.writeFile(filepath, JSON.stringify(resultado_final, null, 2), 'utf-8');

  console.log(`\n💾 Arquivo salvo: ${filepath}`);
  console.log(`\n✅ Busca concluída!`);
}

buscarTodasPublicacoesOAB().catch(error => {
  console.error('❌ Erro:', error.message);
  console.error(error.stack);
});
