const fs = require('fs');

console.log('🔧 Corrigindo filtro OAB no cliente DJEN...\n');

// 1. Adicionar campos numeroOab e ufOab ao tipo FiltrosComunicacao
console.log('✅ Atualizando tipo FiltrosComunicacao');
let types = fs.readFileSync('src/types/djen-api.ts', 'utf-8');

types = types.replace(
  /export interface FiltrosComunicacao \{\s+tribunal\?: string;[^}]+limit\?: number;[^}]+\}/,
  `export interface FiltrosComunicacao {
  tribunal?: string; // Sigla do tribunal (TJSP, STJ, etc)
  dataInicio?: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD
  numeroProcesso?: string; // Sem máscara (só dígitos)
  numeroOab?: string; // Número de inscrição OAB (ex: '129021')
  ufOab?: string; // UF da OAB (ex: 'SP')
  limit?: number; // Máximo: 10000
}`
);

fs.writeFileSync('src/types/djen-api.ts', types, 'utf-8');

// 2. Adicionar parâmetros numeroOab e ufOab na requisição HTTP
console.log('✅ Atualizando cliente DJEN para incluir numeroOab e ufOab');
let client = fs.readFileSync('src/api/client.ts', 'utf-8');

client = client.replace(
  /if \(filtros\.limit\) params\.append\('limit', filtros\.limit\.toString\(\)\);/,
  `if (filtros.numeroOab) params.append('numeroOab', filtros.numeroOab);
        if (filtros.ufOab) params.append('ufOab', filtros.ufOab);
        if (filtros.limit) params.append('limit', filtros.limit.toString());`
);

fs.writeFileSync('src/api/client.ts', client, 'utf-8');

console.log('\n✅ Correções aplicadas com sucesso!');
console.log('   - Tipo FiltrosComunicacao atualizado');
console.log('   - Cliente DJEN agora envia numeroOab e ufOab na query string');
console.log('\n🔨 Execute "npm run build" para recompilar\n');
