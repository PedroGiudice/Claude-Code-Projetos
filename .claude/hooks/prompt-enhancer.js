#!/usr/bin/env node
/**
 * prompt-enhancer.js - Intelligent prompt enhancement system
 *
 * Detects user intent patterns and translates to technical/architectural context.
 * Reduces clarification iterations by enriching prompts with relevant technical details.
 *
 * Features:
 * - Intent pattern matching (regex-based)
 * - Prompt quality scoring (0-100)
 * - Bypass detection (*, /, #, ++)
 * - Graceful degradation (if pattern library fails, pass original prompt)
 * - Low overhead (<200ms for clear prompts)
 *
 * Usage: node .claude/hooks/hook-wrapper.js .claude/hooks/prompt-enhancer.js
 *
 * Input (stdin): Claude Code JSON with userPrompt
 * Output (stdout): Enhanced JSON with enriched systemMessage
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  BYPASS_PREFIXES: ['*', '/', '#', '++'],
  FORCE_ENHANCE_PREFIX: '++',
  MIN_QUALITY_FOR_ENHANCEMENT: 30,
  MAX_ENHANCEMENT_OVERHEAD_MS: 200,
  PATTERNS_FILE: '.claude/hooks/lib/intent-patterns.json',
  QUALITY_FILE: '.claude/statusline/prompt-quality.json'
};

/**
 * Main entry point
 */
async function main() {
  const startTime = Date.now();

  try {
    // Read Claude Code JSON from stdin
    const input = await readStdin();
    const claudeData = JSON.parse(input);

    // Extract user prompt
    const userPrompt = claudeData.userPrompt || '';

    if (!userPrompt || userPrompt.trim().length === 0) {
      // No prompt to enhance - pass through
      outputJSON({ continue: true, systemMessage: '' });
      return;
    }

    // Check for bypass
    const bypassResult = checkBypass(userPrompt);
    const forceEnhance = userPrompt.trim().startsWith(CONFIG.FORCE_ENHANCE_PREFIX);

    if (bypassResult.bypass && !forceEnhance) {
      // User explicitly bypassed enhancement
      await trackPrompt(userPrompt, 0, false, 'bypassed');
      outputJSON({ continue: true, systemMessage: '' });
      return;
    }

    // Calculate prompt quality
    const quality = calculateQuality(userPrompt);

    // Load intent patterns
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const patterns = await loadPatterns(projectDir);

    if (!patterns || patterns.length === 0) {
      // Pattern library not available - graceful degradation
      await trackPrompt(userPrompt, quality, false, 'no-patterns');
      outputJSON({ continue: true, systemMessage: '' });
      return;
    }

    // Match against patterns
    const matches = matchPatterns(userPrompt, patterns);

    if (matches.length === 0 && quality >= CONFIG.MIN_QUALITY_FOR_ENHANCEMENT && !forceEnhance) {
      // Prompt is clear enough, no enhancement needed
      await trackPrompt(userPrompt, quality, false, 'clear-prompt');
      outputJSON({ continue: true, systemMessage: '' });
      return;
    }

    // Enhance prompt
    const enhancement = generateEnhancement(matches, quality, forceEnhance);

    // Track metrics
    const elapsed = Date.now() - startTime;
    await trackPrompt(userPrompt, quality, true, 'enhanced', { matches, elapsed });

    // Output enhanced context
    outputJSON({
      continue: true,
      systemMessage: enhancement
    });

  } catch (error) {
    // Graceful fallback - don't break Claude Code
    console.error(`⚠️ prompt-enhancer error: ${error.message}`);
    outputJSON({ continue: true, systemMessage: '' });
  }
}

/**
 * Check if user wants to bypass enhancement
 */
function checkBypass(prompt) {
  const trimmed = prompt.trim();

  for (const prefix of CONFIG.BYPASS_PREFIXES) {
    if (trimmed.startsWith(prefix)) {
      return { bypass: true, prefix };
    }
  }

  return { bypass: false, prefix: null };
}

/**
 * Calculate prompt quality score (0-100)
 *
 * Factors:
 * - Length (too short = vague, too long = detailed)
 * - Technical terms (presence of domain-specific keywords)
 * - Specificity (concrete nouns, numbers, formats)
 * - Structure (punctuation, capitalization)
 */
function calculateQuality(prompt) {
  let score = 0;

  // Length score (0-30 points)
  const length = prompt.trim().length;
  if (length < 20) {
    score += length; // Very short = very low score
  } else if (length < 50) {
    score += 20;
  } else if (length < 150) {
    score += 30; // Sweet spot
  } else if (length < 300) {
    score += 25;
  } else {
    score += 20; // Too verbose
  }

  // Technical terms score (0-30 points)
  const technicalTerms = [
    'api', 'endpoint', 'database', 'schema', 'model', 'backend', 'frontend',
    'auth', 'cache', 'queue', 'worker', 'webhook', 'scraping', 'parser',
    'validator', 'transformer', 'pipeline', 'dashboard', 'chart', 'report',
    'test', 'unit', 'integration', 'e2e', 'monitoring', 'logging', 'metrics'
  ];

  const lowerPrompt = prompt.toLowerCase();
  const termCount = technicalTerms.filter(term => lowerPrompt.includes(term)).length;
  score += Math.min(termCount * 5, 30);

  // Specificity score (0-20 points)
  const specificityPatterns = [
    /\d+/g,                           // Numbers (volume, quantities)
    /\b(json|csv|xml|pdf|html)\b/gi, // Formats
    /\b(react|vue|python|node|django|flask)\b/gi, // Technologies
  ];

  let specificityCount = 0;
  for (const pattern of specificityPatterns) {
    const matches = prompt.match(pattern);
    if (matches) specificityCount += matches.length;
  }
  score += Math.min(specificityCount * 4, 20);

  // Structure score (0-20 points)
  const hasCapitalization = /[A-Z]/.test(prompt);
  const hasPunctuation = /[.!?,;:]/.test(prompt);
  const hasQuestionMark = /\?/.test(prompt);

  if (hasCapitalization) score += 5;
  if (hasPunctuation) score += 10;
  if (hasQuestionMark) score += 5;

  return Math.min(score, 100);
}

/**
 * Load intent patterns from library
 */
async function loadPatterns(projectDir) {
  try {
    const patternsPath = path.join(projectDir, CONFIG.PATTERNS_FILE);
    const content = await fs.readFile(patternsPath, 'utf8');
    const data = JSON.parse(content);
    return data.patterns || [];
  } catch (error) {
    console.error(`⚠️ Failed to load patterns: ${error.message}`);
    return [];
  }
}

/**
 * Match user prompt against intent patterns
 */
function matchPatterns(prompt, patterns) {
  const matches = [];
  const lowerPrompt = prompt.toLowerCase();

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern.intent, 'i');
      if (regex.test(lowerPrompt)) {
        matches.push({
          id: pattern.id,
          architecture: pattern.architecture,
          components: pattern.components,
          translation: pattern.translation,
          questions: pattern.questions || []
        });
      }
    } catch (error) {
      // Invalid regex - skip this pattern
      console.error(`⚠️ Invalid pattern regex: ${pattern.id}`);
    }
  }

  return matches;
}

/**
 * Generate enhancement text
 */
function generateEnhancement(matches, quality, forceEnhance) {
  if (matches.length === 0) {
    if (forceEnhance) {
      return `📝 Prompt Enhancer: Nenhum padrão arquitetural detectado.\n\nSugestão: Descreva o objetivo técnico (ex: "integrar com API", "processar dados em lote", "criar dashboard").\n\nQualidade do prompt: ${quality}/100`;
    }
    return '';
  }

  // Build enhancement message
  let enhancement = '📝 Prompt Enhancer: Padrões arquiteturais detectados:\n\n';

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    enhancement += `[${i + 1}] ${match.architecture}\n`;
    enhancement += `${match.translation}\n`;

    if (match.components && match.components.length > 0) {
      enhancement += `\nComponentes sugeridos:\n`;
      for (const component of match.components) {
        enhancement += `  • ${component}\n`;
      }
    }

    if (match.questions && match.questions.length > 0 && forceEnhance) {
      enhancement += `\nPerguntas de clarificação:\n`;
      for (const question of match.questions) {
        enhancement += `  ❓ ${question}\n`;
      }
    }

    if (i < matches.length - 1) {
      enhancement += '\n---\n\n';
    }
  }

  enhancement += `\nQualidade do prompt: ${quality}/100`;

  if (forceEnhance) {
    enhancement += '\n\n(Enhancement forçado com ++)';
  }

  return enhancement;
}

/**
 * Track prompt metrics
 */
async function trackPrompt(prompt, quality, enhanced, reason, metadata = {}) {
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const qualityPath = path.join(projectDir, CONFIG.QUALITY_FILE);

    // Create directory if needed
    await fs.mkdir(path.dirname(qualityPath), { recursive: true });

    // Load existing data
    let data = {
      enabled: true,
      stats: {
        totalPrompts: 0,
        enhancedPrompts: 0,
        averageQuality: 0,
        lastRun: 0
      },
      history: []
    };

    try {
      const content = await fs.readFile(qualityPath, 'utf8');
      data = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    // Update stats
    data.stats.totalPrompts++;
    if (enhanced) data.stats.enhancedPrompts++;

    // Update average quality (running average)
    const totalQuality = (data.stats.averageQuality * (data.stats.totalPrompts - 1)) + quality;
    data.stats.averageQuality = Math.round(totalQuality / data.stats.totalPrompts);
    data.stats.lastRun = Date.now();

    // Add to history (keep last 50)
    data.history.push({
      timestamp: Date.now(),
      quality,
      enhanced,
      reason,
      promptLength: prompt.length,
      ...metadata
    });

    if (data.history.length > 50) {
      data.history = data.history.slice(-50);
    }

    // Save
    await fs.writeFile(qualityPath, JSON.stringify(data, null, 2), 'utf8');

  } catch (error) {
    // Don't fail if can't track
    console.error(`⚠️ Failed to track prompt: ${error.message}`);
  }
}

/**
 * Read stdin
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', reject);
  });
}

/**
 * Output JSON to stdout
 */
function outputJSON(obj) {
  console.log(JSON.stringify(obj));
}

// Execute
main();
