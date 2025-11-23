#!/usr/bin/env node

const old = require('./lib/agent-orchestrator-v2-backup.js');
const newV3 = require('./lib/agent-orchestrator.js');

const testCases = [
  { prompt: 'git status', expected: 'LOW' },
  { prompt: 'mostrar o arquivo main.py', expected: 'LOW' },
  { prompt: 'copiar arquivo de teste', expected: 'LOW' },
  { prompt: 'ajustar indentação', expected: 'MEDIUM' },
  { prompt: 'consertar bug no login', expected: 'MEDIUM' },
  { prompt: 'adicionar validação de email', expected: 'MEDIUM' },
  { prompt: 'criar função de hash', expected: 'MEDIUM' },
  { prompt: 'implementar autenticação JWT', expected: 'MEDIUM' },
  { prompt: 'criar sistema de notificações', expected: 'HIGH' },
  { prompt: 'fix typo em README', expected: 'LOW' },
  { prompt: 'explicar como funciona o React', expected: 'LOW' }
];

async function compare() {
  console.log('\n🔍 COMPARAÇÃO: Sistema Antigo vs v3.0 (Whitelist Invertida)\n');
  console.log('Prompt'.padEnd(40) + ' | Antigo  v3.0  Esperado  Status');
  console.log('='.repeat(80));

  let improvements = 0;
  let correct = 0;

  for (const { prompt, expected } of testCases) {
    const oldResult = await old.orchestrateAgents({ prompt });
    const newResult = await newV3.orchestrateAgents({ prompt });

    const oldComplexity = oldResult ? oldResult.complexity : 'LOW';
    const newComplexity = newResult ? newResult.complexity : 'LOW';

    const isImprovement = (oldComplexity === 'LOW' && newComplexity !== 'LOW' && expected !== 'LOW');
    const isCorrect = (newComplexity === expected);

    if (isImprovement) improvements++;
    if (isCorrect) correct++;

    const status = isCorrect ? '✅' : (isImprovement ? '🔄' : '❌');

    console.log(
      status + ' ' +
      prompt.substring(0, 35).padEnd(38) + ' | ' +
      oldComplexity.padEnd(6) + '  ' +
      newComplexity.padEnd(6) + '  ' +
      expected.padEnd(8) + '  ' +
      (isCorrect ? 'OK' : (isImprovement ? 'MELHOROU' : 'REVISAR'))
    );
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 RESULTADOS:`);
  console.log(`   ✅ Corretos: ${correct}/${testCases.length}`);
  console.log(`   🔄 Melhorias: ${improvements}`);
  console.log(`   Success Rate: ${(correct/testCases.length*100).toFixed(1)}%\n`);
}

compare();
