/**
 * Script de teste rápido da API DJEN
 * Execute: node test-api.js
 */

const https = require('https');

function testarAPI(endpoint, descricao) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Testando: ${descricao}`);
    console.log(`📍 ${endpoint}\n`);

    https.get(endpoint, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Resposta recebida:');

          if (json.status) console.log(`   Status: ${json.status}`);
          if (json.count !== undefined) console.log(`   Total: ${json.count}`);
          if (json.items) console.log(`   Items retornados: ${json.items.length}`);
          if (json.sigla_tribunal) console.log(`   Tribunal: ${json.sigla_tribunal}`);
          if (json.total_comunicacoes !== undefined) console.log(`   Comunicações: ${json.total_comunicacoes}`);

          // Mostrar primeiro item se houver
          if (json.items && json.items[0]) {
            const item = json.items[0];
            console.log('\n   📄 Primeira comunicação:');
            console.log(`      Processo: ${item.numeroprocessocommascara || item.numero_processo}`);
            console.log(`      Tribunal: ${item.siglaTribunal}`);
            console.log(`      Tipo: ${item.tipoComunicacao}`);
            console.log(`      Órgão: ${item.nomeOrgao}`);
            if (item.destinatarios && item.destinatarios[0]) {
              console.log(`      Parte: ${item.destinatarios[0].nome}`);
            }
          }

          // Mostrar tribunais
          if (Array.isArray(json) && json[0] && json[0].instituicoes) {
            console.log(`   Total de UFs: ${json.length}`);
            const sp = json.find(uf => uf.uf === 'SP');
            if (sp) {
              console.log(`\n   🏛️ São Paulo tem ${sp.instituicoes.length} instituições:`);
              sp.instituicoes.slice(0, 3).forEach(inst => {
                console.log(`      - ${inst.sigla}: ${inst.nome}`);
              });
            }
          }

          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (err) => {
      console.error('❌ Erro:', err.message);
      reject(err);
    });
  });
}

async function executarTestes() {
  console.log('🚀 Iniciando testes da API DJEN');
  console.log('=' .repeat(60));

  try {
    // Teste 1: Listar tribunais
    await testarAPI(
      'https://comunicaapi.pje.jus.br/api/v1/comunicacao/tribunal',
      'Listar todos os tribunais'
    );

    // Teste 2: Buscar comunicações do TJSP
    await testarAPI(
      'https://comunicaapi.pje.jus.br/api/v1/comunicacao?tribunal=TJSP&dataInicio=2025-10-24&dataFim=2025-10-24&limit=2',
      'Buscar 2 comunicações do TJSP de hoje'
    );

    // Teste 3: Metadados do caderno
    await testarAPI(
      'https://comunicaapi.pje.jus.br/api/v1/caderno/TJSP/2025-10-24/D',
      'Metadados do caderno TJSP de hoje'
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ Todos os testes concluídos com sucesso!');
    console.log('\n📝 A API DJEN está funcionando perfeitamente.');
    console.log('🎯 Você pode prosseguir com a instalação do servidor MCP.');

  } catch (error) {
    console.error('\n❌ Erro nos testes:', error.message);
    process.exit(1);
  }
}

executarTestes();
