const Database = require('better-sqlite3');
const path = require('path');

console.log('🧹 Limpando publicações incorretas de hoje...\n');

const dbPath = 'E:/djen-data/oab-monitoring.db';
const db = new Database(dbPath);

// Obter data de hoje
const hoje = new Date().toISOString().split('T')[0];

console.log(`Data de hoje: ${hoje}`);

// Contar publicações de hoje antes da limpeza
const contarAntes = db.prepare(`
  SELECT COUNT(*) as total FROM publicacoes
  WHERE DATE(data_disponibilizacao) = DATE(?)
`).get(hoje);

console.log(`Publicações de hoje ANTES da limpeza: ${contarAntes.total}\n`);

// Deletar TODAS as publicações de hoje (vamos buscar novamente com filtro correto)
const resultado = db.prepare(`
  DELETE FROM publicacoes
  WHERE DATE(data_disponibilizacao) = DATE(?)
`).run(hoje);

console.log(`✅ ${resultado.changes} publicações deletadas\n`);

// Contar publicações de hoje após limpeza
const contarDepois = db.prepare(`
  SELECT COUNT(*) as total FROM publicacoes
  WHERE DATE(data_disponibilizacao) = DATE(?)
`).get(hoje);

console.log(`Publicações de hoje APÓS a limpeza: ${contarDepois.total}`);

db.close();

console.log('\n✅ Limpeza concluída! Agora execute o agente novamente para buscar apenas as publicações corretas.');
