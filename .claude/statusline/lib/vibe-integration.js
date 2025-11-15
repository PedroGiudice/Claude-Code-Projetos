// vibe-integration.js - Integração com VibbinLoggin (vibe-log-cli)
//
// Chama vibe-log statusline para obter métricas de qualidade

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cache de resultados (1 segundo)
let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000;  // 1s

// Verificar se vibe-log está disponível
function isAvailable() {
  try {
    execSync('which vibe-log', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Obter dados do statusline (com cache)
function getStatuslineData() {
  const now = Date.now();

  // Retornar cache se ainda válido
  if (cache && (now - cacheTimestamp) < CACHE_TTL) {
    return cache;
  }

  if (!isAvailable()) {
    cache = null;
    return null;
  }

  try {
    const output = execSync('vibe-log statusline --json 2>/dev/null', {
      timeout: 200,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']  // Silenciar stderr
    });

    cache = JSON.parse(output);
    cacheTimestamp = now;
    return cache;
  } catch (err) {
    // Timeout ou erro - degrade gracefully
    cache = null;
    return null;
  }
}

// Obter número de prompts analisados hoje
function getPromptsToday() {
  const data = getStatuslineData();
  return data?.prompts_today || 0;
}

// Obter score médio de qualidade
function getAvgScore() {
  const data = getStatuslineData();
  if (data?.avg_quality_score !== undefined) {
    return data.avg_quality_score.toFixed(1);
  }
  return 'N/A';
}

// Obter sugestões ativas
function getActiveSuggestions() {
  const data = getStatuslineData();
  return data?.active_suggestions || [];
}

// Obter contagem de sugestões
function getSuggestionsCount() {
  return getActiveSuggestions().length;
}

// Formatar linha de status
function getFormattedStatus() {
  if (!isAvailable()) {
    return null;
  }

  const prompts = getPromptsToday();
  const score = getAvgScore();

  if (prompts === 0) {
    return 'no data';
  }

  return `${prompts} prompts │ Quality: ${score}/10`;
}

module.exports = {
  isAvailable,
  getStatuslineData,
  getPromptsToday,
  getAvgScore,
  getActiveSuggestions,
  getSuggestionsCount,
  getFormattedStatus
};
