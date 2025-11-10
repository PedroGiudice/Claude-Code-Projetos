const fs = require('fs');

// Ler arquivo
let content = fs.readFileSync('E:/projetos/djen-mcp-server/agents/monitoramento-oab/main.ts', 'utf-8');

// 1. Trocar chamada da função
content = content.replace('await this.gerarRelatoriosMarkdown();', 'await this.gerarRelatorioUnico();');

// 2. Remover condição de novas publicações (sempre gerar)
content = content.replace(
  /\/\/ Gerar relatórios Markdown se houver novas publicações[\s\S]*?if \(novasPublicacoes\.length > 0\) \{[\s\S]*?await this\.gerarRelatorioUnico\(\);[\s\S]*?\}/,
  '// Gerar relatório único do dia (incremental)\n    await this.gerarRelatorioUnico();'
);

// 3. Remover as 3 funções antigas e adicionar a nova
const novaFuncao = fs.readFileSync('E:/projetos/djen-mcp-server/agents/monitoramento-oab/relatorio-functions.txt', 'utf-8');

// Encontrar e remover as funções antigas
content = content.replace(
  /private async gerarRelatoriosMarkdown\(\)[\s\S]*?private exibirStatus\(\)/,
  novaFuncao + '\n\n  private exibirStatus()'
);

// Salvar
fs.writeFileSync('E:/projetos/djen-mcp-server/agents/monitoramento-oab/main.ts', content, 'utf-8');

console.log('✅ Arquivo modificado com sucesso!');
