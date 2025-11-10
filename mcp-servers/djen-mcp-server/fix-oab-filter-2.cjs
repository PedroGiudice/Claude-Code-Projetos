const fs = require('fs');

console.log('🔧 Adicionando filtro de verificação de OAB no agente...\n');

let content = fs.readFileSync('E:/projetos/agents/monitoramento-oab/main.ts', 'utf-8');

// Adicionar função auxiliar para verificar se a publicação pertence à OAB
const funcaoVerificar = `
  /**
   * Verifica se a publicação pertence realmente à OAB configurada
   */
  private verificarOABNaPublicacao(item: any): boolean {
    const { numero, uf } = CONFIG.oab;

    // Verificar no array destinatarioadvogados
    if (item.destinatarioadvogados && Array.isArray(item.destinatarioadvogados)) {
      return item.destinatarioadvogados.some((dest: any) => {
        const advogado = dest.advogado;
        return advogado &&
               advogado.numero_oab === numero &&
               advogado.uf_oab === uf;
      });
    }

    return false;
  }
`;

// Inserir a função antes do método executarBusca (linha ~212)
content = content.replace(
  /(\s+private async executarBusca\(\))/,
  funcaoVerificar + '\n$1'
);

console.log('✅ Função verificarOABNaPublicacao adicionada');

// Adicionar filtro adicional após filtrar por data
const linhaAntesDo = `        console.log(\`      \${publicacoesHoje.length} de hoje\`);`;
const filtroAdicional = `        console.log(\`      \${publicacoesHoje.length} de hoje\`);

        // FILTRO ADICIONAL: Verificar se a OAB está realmente na publicação
        const publicacoesDaOAB = publicacoesHoje.filter(item =>
          this.verificarOABNaPublicacao(item)
        );

        console.log(\`      \${publicacoesDaOAB.length} da OAB \${CONFIG.oab.numero}/\${CONFIG.oab.uf}\`);`;

content = content.replace(linhaAntesDo, filtroAdicional);

console.log('✅ Filtro adicional aplicado após filtro de data');

// Alterar o loop para usar publicacoesDaOAB ao invés de publicacoesHoje
content = content.replace(
  /for \(const item of publicacoesHoje\)/,
  'for (const item of publicacoesDaOAB)'
);

console.log('✅ Loop alterado para usar apenas publicações da OAB');

// Salvar arquivo
fs.writeFileSync('E:/projetos/agents/monitoramento-oab/main.ts', content, 'utf-8');

console.log('\n✅ Correções aplicadas com sucesso!');
console.log('\nAgora execute: cd E:/projetos/djen-mcp-server && npm run build');
