// Script para executar o agente OAB com as dependências corretas
const { spawn } = require('child_process');
const path = require('path');

const agentPath = path.resolve(__dirname, '../agents/monitoramento-oab/main.ts');

console.log(`🚀 Iniciando Agente de Monitoramento OAB...`);
console.log(`   Agente: ${agentPath}\n`);

const proc = spawn('npx', ['tsx', agentPath], {
  cwd: __dirname, // Executa do diretório djen-mcp-server (onde estão as deps)
  stdio: 'inherit',
  shell: true
});

proc.on('error', (err) => {
  console.error('❌ Erro ao iniciar agente:', err);
  process.exit(1);
});

proc.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Agente encerrado com código ${code}`);
  }
  process.exit(code || 0);
});
