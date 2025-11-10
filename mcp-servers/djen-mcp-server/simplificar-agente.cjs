const fs = require('fs');

console.log('🔧 Simplificando agente OAB...\n');

let content = fs.readFileSync('E:/projetos/agents/monitoramento-oab/main.ts', 'utf-8');

// 1. CORRIGIR FILTRO OAB - Adicionar ufOab
console.log('✅ Corrigindo filtro OAB (adicionando ufOab)');
content = content.replace(
  /const resultado = await this\.client\.buscarComunicacoes\(\{\s+numeroOab: CONFIG\.oab\.numero,\s+siglaTribunal: tribunal,\s+itensPorPagina: 10000,\s+\}\);/,
  `const resultado = await this.client.buscarComunicacoes({
          numeroOab: CONFIG.oab.numero,
          ufOab: CONFIG.oab.uf,
          siglaTribunal: tribunal,
          itensPorPagina: 10000,
        });`
);

// 2. REMOVER LÓGICA DE CLIENTES - Remover identificarCliente()
console.log('✅ Removendo lógica de identificação de clientes');
content = content.replace(
  /\/\/ Identificar cliente\s+pub\.clienteId = this\.identificarCliente\(pub\) \|\| 'DESCONHECIDO';/,
  `// Cliente será sempre DESCONHECIDO por enquanto
          pub.clienteId = 'OAB_129021_SP';`
);

// 3. SIMPLIFICAR RELATÓRIO - Remover agrupamento por cliente
console.log('✅ Simplificando relatório (sem agrupamento por cliente)');

const novoRelatorio = `  private async gerarRelatorioUnico() {
    console.log('📄 Gerando relatório do dia...');

    const hoje = new Date().toISOString().split('T')[0];
    const hojeFormatado = new Date().toLocaleDateString('pt-BR');
    const arquivo = path.join(CONFIG.outputDir, \`Publicacoes-OAB-129021-\${hoje}.txt\`);

    // Buscar TODAS as publicações de hoje
    const publicacoes = this.db.prepare(\`
      SELECT * FROM publicacoes
      WHERE data_disponibilizacao LIKE ?
      ORDER BY tribunal, numero_processo, data_disponibilizacao
    \`).all(\`\${hoje}%\`) as Publicacao[];

    if (publicacoes.length === 0) {
      console.log('   ℹ️  Nenhuma publicação para gerar relatório\\n');
      return;
    }

    // Gerar conteúdo do relatório
    let conteudo = '═══════════════════════════════════════════════════════════\\n';
    conteudo += '           PUBLICAÇÕES DJEN - OAB 129021/SP\\n';
    conteudo += '═══════════════════════════════════════════════════════════\\n\\n';
    conteudo += \`Data: \${hojeFormatado} (\${hoje})\\n\`;
    conteudo += \`Total de publicações: \${publicacoes.length}\\n\`;
    conteudo += \`Última atualização: \${new Date().toLocaleString('pt-BR')}\\n\\n\`;

    // Listar todas as publicações
    conteudo += '═══════════════════════════════════════════════════════════\\n';
    conteudo += 'PUBLICAÇÕES ENCONTRADAS\\n';
    conteudo += '═══════════════════════════════════════════════════════════\\n\\n';

    // Agrupar por processo
    const porProcesso = new Map<string, Publicacao[]>();
    for (const pub of publicacoes) {
      if (!porProcesso.has(pub.numeroProcesso)) {
        porProcesso.set(pub.numeroProcesso, []);
      }
      porProcesso.get(pub.numeroProcesso)!.push(pub);
    }

    let contador = 1;
    for (const [numeroProcesso, pubsProcesso] of porProcesso.entries()) {
      const primeira = pubsProcesso[0];

      conteudo += \`\${contador}. Processo: \${numeroProcesso}\\n\`;
      conteudo += \`   Tribunal: \${primeira.tribunal}\\n\`;
      conteudo += \`   Classe: \${primeira.classe || 'N/A'}\\n\`;
      conteudo += \`   Órgão: \${primeira.orgaoJulgador || 'N/A'}\\n\\n\`;

      // Listar publicações do processo
      for (const pub of pubsProcesso) {
        const dataPub = new Date(pub.dataDisponibilizacao).toLocaleDateString('pt-BR');
        conteudo += \`   • \${pub.tipo} - \${dataPub}\\n\`;
        conteudo += \`     \${pub.texto}\\n\`;
        conteudo += \`     Link: \${pub.link}\\n\\n\`;
      }

      conteudo += '\\n';
      contador++;
    }

    conteudo += '═══════════════════════════════════════════════════════════\\n';
    conteudo += 'FIM DO RELATÓRIO\\n';
    conteudo += '═══════════════════════════════════════════════════════════\\n';

    // Salvar arquivo (sobrescreve se existir)
    await fs.writeFile(arquivo, conteudo, 'utf-8');
    console.log(\`   ✅ Relatório salvo: \${path.basename(arquivo)}\\n\`);
  }`;

content = content.replace(
  /private async gerarRelatorioUnico\(\)[\s\S]*?console\.log\(`   ✅ Relatório salvo: \$\{path\.basename\(arquivo\)\}\\n`\);\s+\}/,
  novoRelatorio
);

// 4. SIMPLIFICAR STATUS - Remover exibição de clientes
console.log('✅ Simplificando exibição de status');
content = content.replace(
  /if \(this\.status\.clientesEncontrados\.size > 0\)[\s\S]*?console\.log\(\);\s+\}/,
  '// Clientes removidos temporariamente'
);

// 5. REMOVER ATUALIZAÇÃO DE CLIENTES ENCONTRADOS
content = content.replace(
  /\/\/ Clientes encontrados hoje[\s\S]*?this\.status\.clientesEncontrados\.set\(row\.cliente_id, row\.count\);\s+\}/,
  '// Clientes removidos temporariamente'
);

// Salvar
fs.writeFileSync('E:/projetos/agents/monitoramento-oab/main.ts', content, 'utf-8');

console.log('\n✅ Agente simplificado com sucesso!');
console.log('   - Filtro OAB corrigido (ufOab adicionado)');
console.log('   - Lógica de clientes removida');
console.log('   - Relatório simplificado (lista direta)');
console.log('   - Foco em funcionalidade básica\n');
