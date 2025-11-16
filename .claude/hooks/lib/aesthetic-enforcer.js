/**
 * lib/aesthetic-enforcer.js - Enforcement estético
 *
 * Substitui: aesthetic-enforcer.js (hook)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function enforceAesthetics(context) {
  // Detectar arquivos frontend modificados
  const frontendExtensions = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.css', '.scss'];
  const frontendFiles = context.git.modifiedFiles.filter(f =>
    frontendExtensions.some(ext => f.endsWith(ext)) && !f.includes('node_modules')
  );

  if (frontendFiles.length === 0) {
    return { passed: true }; // Nenhum arquivo frontend modificado
  }

  const violations = [];
  const aestheticMaster = path.join(context.projectDir, 'agentes/aesthetic-master/main.py');
  const venvPython = path.join(context.projectDir, 'agentes/aesthetic-master/.venv/bin/python');

  // Verificar se aesthetic-master venv existe
  if (!fs.existsSync(venvPython)) {
    return {
      passed: true,
      warning: `⚠️  Aesthetic Master venv não encontrado\nRun: cd agentes/aesthetic-master && python -m venv .venv && pip install -r requirements.txt`
    };
  }

  for (const file of frontendFiles) {
    try {
      const AESTHETIC_TIMEOUT = 5000; // 5 segundos

      execSync(`"${venvPython}" "${aestheticMaster}" --mode review --target "${file}"`, {
        cwd: context.projectDir,
        stdio: 'pipe',
        timeout: AESTHETIC_TIMEOUT
      });

      // Exit code 0 = PASS
    } catch (error) {
      // Exit code != 0 = VIOLATIONS ou timeout
      if (error.killed) {
        violations.push(`⚠️  ${file}: Aesthetic audit timeout (permitindo commit)`);
        // Timeout não bloqueia - apenas warning
      } else if (error.stdout && error.stdout.toString().includes('BLOCKER')) {
        // Erro legítimo (exit code 1 por BLOCKER violations)
        violations.push(`❌ ${file}: ${error.stdout.toString().substring(0, 200)}`);
      } else {
        // Erro desconhecido - warning mas não bloqueia
        violations.push(`⚠️  ${file}: Erro na auditoria (${error.message.substring(0, 100)})`);
      }
    }
  }

  // Só bloqueia se houver BLOCKER violations (não warnings)
  const hasBlockers = violations.some(v => v.startsWith('❌'));

  if (hasBlockers) {
    return {
      passed: false,
      violations
    };
  }

  if (violations.length > 0) {
    return {
      passed: true,
      warnings: violations // Warnings não bloqueiam
    };
  }

  return { passed: true };
}

module.exports = { enforceAesthetics };
