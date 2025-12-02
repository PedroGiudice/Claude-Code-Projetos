/**
 * lib/validations.js - Todas as validações consolidadas
 *
 * Substitui:
 * - venv-check.js
 * - git-status-watcher.js
 * - data-layer-validator.js
 * - dependency-drift-checker.js
 * - corporate-detector.js
 */

const fs = require('fs').promises;
const path = require('path');

// ============================================================================
// VALIDATION 1: VENV CHECK
// ============================================================================

function validateVenv(context) {
  if (!context.env.venvActive) {
    return {
      name: 'venv',
      passed: false,
      level: 'WARNING',
      message: '⚠️  RULE_006: venv não ativo! Ative com: source .venv/bin/activate'
    };
  }

  return { name: 'venv', passed: true };
}

// ============================================================================
// VALIDATION 2: GIT STATUS
// ============================================================================

function validateGitStatus(context, thresholds) {
  if (!context.git.lastCommitAge) {
    return { name: 'git-status', passed: true }; // Não é repo Git
  }

  const hoursSinceCommit = context.git.lastCommitAge / 1000 / 60 / 60;

  if (context.git.lastCommitAge > thresholds.gitCommitAge) {
    return {
      name: 'git-status',
      passed: false,
      level: 'INFO',
      message: `ℹ️  Último commit há ${hoursSinceCommit.toFixed(1)}h - Considere: git add . && git commit`
    };
  }

  return { name: 'git-status', passed: true };
}

// ============================================================================
// VALIDATION 3: DATA LAYER SEPARATION
// ============================================================================

async function validateDataLayer(context) {
  const cwd = context.projectDir;
  const isWindows = context.env.platform === 'win32';
  const isLinux = context.env.platform === 'linux';

  // RULE 1: Código não em drive externo (Windows)
  if (isWindows && /^[D-Z]:[\\\/]/i.test(cwd)) {
    return {
      name: 'data-layer',
      passed: false,
      level: 'BLOCKER',
      message:
        '🚨 VIOLAÇÃO RULE_001: Código em drive externo!\n' +
        `Localização: ${cwd}\n` +
        '⚠️  DESASTRE IMINENTE - Ver DISASTER_HISTORY.md\n' +
        'Ação: Mova para C:\\claude-work\\repos\\ IMEDIATAMENTE'
    };
  }

  // RULE 1b: Código não em /mnt (WSL2 acessando Windows drives)
  if (isLinux && /^\/mnt\/[d-z]\//i.test(cwd)) {
    return {
      name: 'data-layer',
      passed: false,
      level: 'BLOCKER',
      message:
        '🚨 VIOLAÇÃO RULE_001: Código em drive Windows via WSL!\n' +
        `Localização: ${cwd}\n` +
        '⚠️  DESASTRE IMINENTE - Performance terrível\n' +
        'Ação: Mova para ~/claude-work/repos/ IMEDIATAMENTE'
    };
  }

  // RULE 2: .venv em .gitignore
  const gitignorePath = path.join(cwd, '.gitignore');
  try {
    const gitignore = await fs.readFile(gitignorePath, 'utf8');
    if (!gitignore.includes('.venv') && !gitignore.includes('venv/')) {
      return {
        name: 'data-layer',
        passed: false,
        level: 'WARNING',
        message: '⚠️  VIOLAÇÃO RULE_002: .venv não está em .gitignore!'
      };
    }
  } catch {
    // .gitignore não existe - OK se não for repo Git
  }

  return { name: 'data-layer', passed: true };
}

// ============================================================================
// VALIDATION 4: DEPENDENCY DRIFT
// ============================================================================

async function validateDependencyDrift(context, thresholds) {
  const reqPath = path.join(context.projectDir, 'requirements.txt');

  try {
    const stat = await fs.stat(reqPath);
    const ageMs = Date.now() - stat.mtimeMs;

    if (ageMs > thresholds.dependencyDrift) {
      const days = Math.floor(ageMs / 1000 / 60 / 60 / 24);
      return {
        name: 'dependency-drift',
        passed: false,
        level: 'INFO',
        message: `ℹ️  requirements.txt há ${days} dias sem atualização - Atualize: pip freeze > requirements.txt`
      };
    }
  } catch {
    // requirements.txt não existe - OK
  }

  return { name: 'dependency-drift', passed: true };
}

// ============================================================================
// VALIDATION 5: CORPORATE ENVIRONMENT
// ============================================================================

function validateCorporateEnv(context) {
  if (context.env.platform !== 'win32') {
    return { name: 'corporate', passed: true }; // Só Windows
  }

  const username = process.env.USERNAME || '';
  const domain = process.env.USERDOMAIN || '';
  const hostname = process.env.COMPUTERNAME || '';

  let corporateScore = 0;
  const indicators = [];

  // Heurística 1: Username corporativo
  if (/^[A-Z]{2,4}$/.test(username)) {
    corporateScore += 3;
    indicators.push(`Username: ${username} (formato corporativo)`);
  }

  // Heurística 2: Domínio AD
  if (domain && domain !== hostname && domain !== 'WORKGROUP') {
    corporateScore += 3;
    indicators.push(`Domínio AD: ${domain}`);
  }

  if (corporateScore >= 3) {
    return {
      name: 'corporate',
      passed: true, // Não é erro, só info
      level: 'INFO',
      message:
        '🏢 Ambiente corporativo detectado\n' +
        indicators.join('\n') + '\n' +
        '⚠️  File locking pode falhar (EPERM)'
    };
  }

  return { name: 'corporate', passed: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

async function runValidations(context, validationConfig) {
  const results = [];
  const enabled = validationConfig?.enabled || [];

  if (enabled.includes('venv')) {
    results.push(validateVenv(context));
  }

  if (enabled.includes('git-status')) {
    results.push(validateGitStatus(context, validationConfig?.thresholds || {}));
  }

  if (enabled.includes('data-layer')) {
    results.push(await validateDataLayer(context));
  }

  if (enabled.includes('deps')) {
    results.push(await validateDependencyDrift(context, validationConfig?.thresholds || {}));
  }

  if (enabled.includes('corporate')) {
    results.push(validateCorporateEnv(context));
  }

  return results;
}

module.exports = { runValidations };
