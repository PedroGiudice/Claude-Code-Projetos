#!/usr/bin/env node
/**
 * Token Count Analyzer - Análise detalhada de uso de tokens
 */

const fs = require('fs');
const path = require('path');

// Aproximação: 1 token ~= 4 caracteres (média para código JS/JSON/Markdown)
const CHARS_PER_TOKEN = 4;

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let stats = {
    totalChars: content.length,
    totalTokens: Math.ceil(content.length / CHARS_PER_TOKEN),
    comments: 0,
    whitespace: 0,
    code: 0,
    strings: 0,
    emojis: 0
  };

  // Análise linha por linha
  for (const line of lines) {
    const trimmed = line.trim();

    // Linhas vazias
    if (trimmed === '') {
      stats.whitespace += line.length;
      continue;
    }

    // Comentários (// ou /* ou # ou **)
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') ||
        trimmed.startsWith('*') || trimmed.startsWith('#')) {
      stats.comments += line.length;
    } else {
      stats.code += line.length;
    }

    // Strings (aproximação: conteúdo entre aspas)
    const stringMatches = line.match(/["'`]([^"'`]*)["'`]/g);
    if (stringMatches) {
      for (const match of stringMatches) {
        stats.strings += match.length;
      }
    }

    // Emojis (aproximação: caracteres unicode > U+1F300)
    const emojiMatches = line.match(/[\u{1F300}-\u{1F9FF}]/gu);
    if (emojiMatches) {
      stats.emojis += emojiMatches.length;
    }
  }

  return stats;
}

function analyzeJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Contar tamanhos de diferentes partes
  let stats = {
    totalChars: content.length,
    totalTokens: Math.ceil(content.length / CHARS_PER_TOKEN),
    metadata: 0, // _comment, _version, etc
    patterns: 0,
    questions: 0,
    components: 0
  };

  // Metadata
  const metadata = ['_comment', '_version', '_usage', '_author', '_updatedAt'];
  for (const key of metadata) {
    if (data[key]) {
      stats.metadata += JSON.stringify(data[key]).length;
    }
  }

  // Patterns
  if (data.patterns) {
    for (const pattern of data.patterns) {
      stats.patterns += JSON.stringify(pattern.intent).length;
      stats.patterns += JSON.stringify(pattern.architecture).length;
      stats.patterns += JSON.stringify(pattern.translation).length;

      if (pattern.components) {
        stats.components += JSON.stringify(pattern.components).length;
      }

      if (pattern.questions) {
        stats.questions += JSON.stringify(pattern.questions).length;
      }
    }
  }

  return stats;
}

function analyzeMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let stats = {
    totalChars: content.length,
    totalTokens: Math.ceil(content.length / CHARS_PER_TOKEN),
    headers: 0,
    codeBlocks: 0,
    text: 0,
    emojis: 0,
    examples: 0
  };

  let inCodeBlock = false;
  let inExample = false;

  for (const line of lines) {
    // Code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      stats.codeBlocks += line.length;
      continue;
    }

    if (inCodeBlock) {
      stats.codeBlocks += line.length;
      continue;
    }

    // Headers
    if (line.startsWith('#')) {
      stats.headers += line.length;
      continue;
    }

    // Examples (aproximação: linhas após "**Exemplo"")
    if (line.includes('Exemplo') || line.includes('Example')) {
      inExample = true;
    }

    if (inExample && (line.startsWith('##') || line === '')) {
      inExample = false;
    }

    if (inExample) {
      stats.examples += line.length;
    }

    // Emojis
    const emojiMatches = line.match(/[\u{1F300}-\u{1F9FF}]/gu);
    if (emojiMatches) {
      stats.emojis += emojiMatches.length;
    }

    // Text
    stats.text += line.length;
  }

  return stats;
}

// Main
const files = [
  {
    path: '.claude/hooks/prompt-enhancer.js',
    type: 'js',
    name: 'Hook Principal'
  },
  {
    path: '.claude/hooks/lib/intent-patterns.json',
    type: 'json',
    name: 'Biblioteca de Padrões'
  },
  {
    path: 'skills/prompt-enhancer/SKILL.md',
    type: 'md',
    name: 'Skill Documentation'
  },
  {
    path: '.claude/statusline/legal-braniac-statusline.js',
    type: 'js',
    name: 'Statusline (seção enhancer)'
  },
  {
    path: '.claude/hooks/PROMPT-ENHANCER-README.md',
    type: 'md',
    name: 'README'
  }
];

console.log('📊 Token Count Analysis - Prompt Enhancer System\n');
console.log('═'.repeat(80));

let totalTokens = 0;

for (const file of files) {
  const filePath = path.join(process.cwd(), file.path);

  console.log(`\n📄 ${file.name}`);
  console.log(`   Path: ${file.path}`);

  let stats;
  if (file.type === 'js') {
    stats = analyzeFile(filePath);
  } else if (file.type === 'json') {
    stats = analyzeJSON(filePath);
  } else if (file.type === 'md') {
    stats = analyzeMarkdown(filePath);
  }

  console.log(`   Total Tokens: ${stats.totalTokens.toLocaleString()}`);
  console.log(`   Total Chars: ${stats.totalChars.toLocaleString()}`);

  if (file.type === 'js') {
    const commentPercent = ((stats.comments / stats.totalChars) * 100).toFixed(1);
    const codePercent = ((stats.code / stats.totalChars) * 100).toFixed(1);
    const whitespacePercent = ((stats.whitespace / stats.totalChars) * 100).toFixed(1);

    console.log(`   Breakdown:`);
    console.log(`     - Comments: ${Math.ceil(stats.comments / CHARS_PER_TOKEN)} tokens (${commentPercent}%)`);
    console.log(`     - Code: ${Math.ceil(stats.code / CHARS_PER_TOKEN)} tokens (${codePercent}%)`);
    console.log(`     - Whitespace: ${Math.ceil(stats.whitespace / CHARS_PER_TOKEN)} tokens (${whitespacePercent}%)`);
    console.log(`     - Emojis: ${stats.emojis} chars`);
  } else if (file.type === 'json') {
    const metadataPercent = ((stats.metadata / stats.totalChars) * 100).toFixed(1);
    const patternsPercent = ((stats.patterns / stats.totalChars) * 100).toFixed(1);
    const questionsPercent = ((stats.questions / stats.totalChars) * 100).toFixed(1);

    console.log(`   Breakdown:`);
    console.log(`     - Metadata: ${Math.ceil(stats.metadata / CHARS_PER_TOKEN)} tokens (${metadataPercent}%)`);
    console.log(`     - Patterns: ${Math.ceil(stats.patterns / CHARS_PER_TOKEN)} tokens (${patternsPercent}%)`);
    console.log(`     - Questions: ${Math.ceil(stats.questions / CHARS_PER_TOKEN)} tokens (${questionsPercent}%)`);
    console.log(`     - Components: ${Math.ceil(stats.components / CHARS_PER_TOKEN)} tokens`);
  } else if (file.type === 'md') {
    const headersPercent = ((stats.headers / stats.totalChars) * 100).toFixed(1);
    const codePercent = ((stats.codeBlocks / stats.totalChars) * 100).toFixed(1);
    const examplesPercent = ((stats.examples / stats.totalChars) * 100).toFixed(1);

    console.log(`   Breakdown:`);
    console.log(`     - Headers: ${Math.ceil(stats.headers / CHARS_PER_TOKEN)} tokens (${headersPercent}%)`);
    console.log(`     - Code blocks: ${Math.ceil(stats.codeBlocks / CHARS_PER_TOKEN)} tokens (${codePercent}%)`);
    console.log(`     - Examples: ${Math.ceil(stats.examples / CHARS_PER_TOKEN)} tokens (${examplesPercent}%)`);
    console.log(`     - Emojis: ${stats.emojis} chars`);
  }

  totalTokens += stats.totalTokens;
}

console.log('\n' + '═'.repeat(80));
console.log(`\n📊 TOTAL SYSTEM TOKENS: ${totalTokens.toLocaleString()}\n`);
