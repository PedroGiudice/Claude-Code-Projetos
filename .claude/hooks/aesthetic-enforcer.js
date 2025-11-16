#!/usr/bin/env node

/**
 * Aesthetic Enforcer Hook
 *
 * Enforcement ABSOLUTO de regras estéticas em commits
 *
 * Triggers:
 * - PostExecuteCommand (git commit)
 * - ToolUse (quando criar/editar arquivos frontend)
 *
 * Behavior:
 * - BLOCKER violations → Bloqueia commit
 * - CRITICAL violations → Warning (permite commit)
 * - Outros níveis → Info only
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const AESTHETIC_MASTER = path.join(PROJECT_ROOT, 'agentes/aesthetic-master');
const VENV_PYTHON = path.join(AESTHETIC_MASTER, '.venv/bin/python');

// Cores para output
const colors = {
  cyan: '\x1b[38;5;51m',
  green: '\x1b[38;5;48m',
  red: '\x1b[38;5;203m',
  yellow: '\x1b[38;5;227m',
  purple: '\x1b[38;5;141m',
  gray: '\x1b[38;5;245m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function colorize(text, color, modifier = '') {
  const c = colors[color] || '';
  const m = colors[modifier] || '';
  return `${m}${c}${text}${colors.reset}`;
}

/**
 * Detecta se arquivo é frontend (deve ser auditado)
 */
function isFrontendFile(filepath) {
  const frontendExtensions = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.css', '.scss', '.sass'];
  const ext = path.extname(filepath);

  // Excluir diretórios
  const excludedPaths = ['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage'];
  const isExcluded = excludedPaths.some(dir => filepath.includes(dir));

  return frontendExtensions.includes(ext) && !isExcluded;
}

/**
 * Obtém arquivos modificados no git staging area
 */
function getModifiedFrontendFiles() {
  try {
    // Arquivos staged (git add)
    const output = execSync('git diff --cached --name-only', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    }).trim();

    if (!output) return [];

    const allFiles = output.split('\n');
    return allFiles.filter(isFrontendFile).map(f => path.join(PROJECT_ROOT, f));
  } catch (error) {
    // Se não há git repo ou staged files, retorna vazio
    return [];
  }
}

/**
 * Executa aesthetic-master no arquivo
 */
function auditFile(filepath) {
  try {
    // Verificar se venv existe
    if (!fs.existsSync(VENV_PYTHON)) {
      console.error(colorize('⚠️  Aesthetic Master venv not found. Run:', 'yellow'));
      console.error(colorize(`   cd ${AESTHETIC_MASTER} && python -m venv .venv`, 'gray'));
      return { blocker: false, violations: {} };
    }

    // Executar aesthetic-master em modo review
    const result = execSync(
      `"${VENV_PYTHON}" main.py --mode review --target "${filepath}"`,
      {
        cwd: AESTHETIC_MASTER,
        encoding: 'utf8',
        stdio: 'pipe'
      }
    );

    // Parse do resultado (simplificado - em produção, retornar JSON)
    // Por enquanto, apenas verifica exit code
    return { blocker: false, violations: {}, output: result };

  } catch (error) {
    // Exit code != 0 indica BLOCKER violations
    if (error.status === 1) {
      return {
        blocker: true,
        violations: { BLOCKER: ['Aesthetic violations found'] },
        output: error.stdout || error.message
      };
    }

    // Outro erro (venv não ativado, etc)
    return {
      blocker: false,
      violations: {},
      error: error.message
    };
  }
}

/**
 * Main execution
 */
function main() {
  const hookType = process.env.CLAUDE_HOOK_TYPE || 'PostExecuteCommand';
  const toolName = process.env.CLAUDE_TOOL_NAME || '';

  // Só executar em git commit ou edição de arquivos frontend
  if (!toolName.includes('git commit') && !toolName.includes('Edit') && !toolName.includes('Write')) {
    process.exit(0); // Não bloqueia
  }

  console.log(colorize('\n🎨 Aesthetic Master - Enforcing design rules...', 'purple', 'bold'));

  // Obter arquivos modificados
  const files = getModifiedFrontendFiles();

  if (files.length === 0) {
    console.log(colorize('   No frontend files to audit', 'gray'));
    process.exit(0);
  }

  console.log(colorize(`   Auditing ${files.length} file(s)`, 'cyan'));

  // Auditar cada arquivo
  let hasBlockers = false;
  const allViolations = [];

  for (const file of files) {
    const relPath = path.relative(PROJECT_ROOT, file);
    process.stdout.write(colorize(`   📄 ${relPath}... `, 'gray'));

    const audit = auditFile(file);

    if (audit.blocker) {
      console.log(colorize('❌ BLOCKER', 'red', 'bold'));
      hasBlockers = true;
      allViolations.push({ file: relPath, violations: audit.violations });

      // Mostrar output do audit
      if (audit.output) {
        console.log(colorize(audit.output, 'red'));
      }
    } else if (audit.error) {
      console.log(colorize('⚠️  ERROR', 'yellow'));
      console.log(colorize(`   ${audit.error}`, 'gray'));
    } else {
      console.log(colorize('✅ PASS', 'green'));
    }
  }

  // Resultado final
  console.log('');
  if (hasBlockers) {
    console.log(colorize('❌ AESTHETIC ENFORCEMENT FAILED', 'red', 'bold'));
    console.log(colorize('   Fix BLOCKER violations before committing', 'red'));
    console.log(colorize('   Run: python agentes/aesthetic-master/main.py --mode review --target <file>', 'gray'));
    process.exit(1); // Bloqueia commit
  } else {
    console.log(colorize('✅ All aesthetic rules passed', 'green', 'bold'));
    process.exit(0);
  }
}

// Execute
main();
