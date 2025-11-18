#!/usr/bin/env node
/**
 * Unified Statusline v1.0 - Gordon Co-pilot + Legal-Braniac + Powerline
 *
 * Combines:
 * - vibe-log Gordon Co-pilot: Real-time prompt analysis with tough love coaching
 * - Legal-Braniac: Agent/skill orchestration tracking
 * - Powerline Visual: Professional design with arrows + ANSI 256 colors
 * - Performance: <200ms target with aggressive caching
 *
 * Layout (adaptive to terminal width):
 * ┌──────────────────┐┌──────────────┐┌──────────┐┌────────────────┐
 * │ 🎯 Gordon 85/100 ││ Braniac ● 7ag││ ⏱ 2h34m ││ 7a 34s 6h │ ● │
 * └──────────────────┘└──────────────┘└──────────┘└────────────────┘
 *
 * Features:
 * - Score-based color coding (81-100=green, 61-80=cyan, 41-60=yellow, 0-40=red)
 * - Contextual emoji from Gordon analysis
 * - Loading state ("🔄 Gordon analyzing...")
 * - Staleness check (>5min = fallback)
 * - Session ID matching between Gordon and Legal-Braniac
 * - Responsive layouts (minimal, compact, comfortable, wide)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CACHE SYSTEM - 10.9x speedup (3.4s → 0.3s)
// ============================================================================

const CACHE_DIR = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'statusline-cache.json');

const CACHE_TTL = {
  'vibe-log': 30,      // Gordon analysis changes slowly
  'git-status': 5,     // Git changes with commits
  'braniac': 2,        // Session data quasi-static
  'session': 1,        // Timestamp needs to be fresh
};

function getCachedData(key, fetchFn) {
  try {
    let cache = {};
    if (fs.existsSync(CACHE_FILE)) {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }

    const entry = cache[key];
    const ttl = CACHE_TTL[key] || 5;
    const now = Date.now();

    if (entry && entry.timestamp && (now - entry.timestamp) < (ttl * 1000)) {
      return entry.data; // Cache HIT
    }

    const freshData = fetchFn();
    cache[key] = { data: freshData, timestamp: now };

    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
    } catch (e) { /* ignore write errors */ }

    return freshData;
  } catch (error) {
    return fetchFn();
  }
}

// ============================================================================
// POWERLINE VISUAL SYSTEM
// ============================================================================

const powerline = {
  // Background colors (ANSI 256) - Harmonious palette
  bg: {
    gordon: '\x1b[48;5;24m',      // Deep blue
    braniac: '\x1b[48;5;54m',     // Rich purple
    session: '\x1b[48;5;30m',     // Ocean teal
    stats: '\x1b[48;5;236m',      // Charcoal gray
    critical: '\x1b[48;5;124m',   // Dark red (warnings/poor scores)
  },

  // Foreground colors
  fg: {
    white: '\x1b[38;5;255m',      // Pure white
    yellow: '\x1b[38;5;226m',     // Bright yellow
    green: '\x1b[38;5;42m',       // Vibrant green
    cyan: '\x1b[38;5;51m',        // Bright cyan
    orange: '\x1b[38;5;208m',     // Orange
    purple: '\x1b[38;5;141m',     // Soft purple
    red: '\x1b[38;5;196m',        // Bright red
    dim: '\x1b[38;5;240m',        // Dim gray
  },

  // Separators
  arrow: '▶',  // Powerline arrow (works without Nerd Font)

  // Control
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

/**
 * Create Powerline segment
 * @param {string} content - Text content
 * @param {string} bgColor - Background color
 * @param {string} fgColor - Foreground color
 * @param {string|null} nextBgColor - Next segment's bg (for arrow)
 */
function segment(content, bgColor, fgColor, nextBgColor = null) {
  // Main segment
  const main = `${bgColor}${fgColor} ${content} ${powerline.reset}`;

  // Arrow separator
  let arrow = '';
  if (nextBgColor) {
    // Arrow: current bg as fg, next bg as bg
    const arrowFg = bgColor.replace('48', '38');
    arrow = `${nextBgColor}${arrowFg}${powerline.arrow}${powerline.reset}`;
  } else {
    // Last segment: arrow with no bg
    const arrowFg = bgColor.replace('48', '38');
    arrow = `${arrowFg}${powerline.arrow}${powerline.reset}`;
  }

  return main + arrow;
}

/**
 * Strip ANSI codes for length calculation
 */
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// ============================================================================
// SESSION ID MATCHING (CRITICAL)
// ============================================================================

/**
 * Get current session ID from Claude Code environment
 * Priority order:
 * 1. CLAUDE_SESSION_ID env var
 * 2. legal-braniac-session.json
 * 3. null (fallback)
 */
function getCurrentSessionId() {
  // Try environment variable first (most reliable)
  if (process.env.CLAUDE_SESSION_ID) {
    return process.env.CLAUDE_SESSION_ID;
  }

  // Try reading from legal-braniac session file
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const sessionFile = path.join(projectDir, '.claude', 'hooks', 'legal-braniac-session.json');

    if (fs.existsSync(sessionFile)) {
      const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      return data.sessionId || null;
    }
  } catch (e) { /* ignore */ }

  return null;
}

// ============================================================================
// DATA READERS
// ============================================================================

/**
 * Get Gordon Co-pilot analysis from vibe-log
 * Returns: {score, quality, suggestion, emoji, isLoading, isStale} or null
 */
function getGordonAnalysis() {
  try {
    const sessionId = getCurrentSessionId();
    if (!sessionId) return null;

    const analysisFile = path.join(
      process.env.HOME || process.env.USERPROFILE,
      '.vibe-log',
      'analyzed-prompts',
      `${sessionId}.json`
    );

    if (!fs.existsSync(analysisFile)) {
      // File doesn't exist yet - analysis in progress
      return { isLoading: true };
    }

    const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

    // Check staleness (>5 minutes = stale)
    const timestamp = new Date(analysis.timestamp);
    const age = Date.now() - timestamp.getTime();
    const isStale = age > 5 * 60 * 1000;
    const isLoading = age < 10 * 1000; // <10s = loading animation

    return {
      score: analysis.score,
      quality: analysis.quality,
      suggestion: analysis.suggestion || '',
      emoji: analysis.contextualEmoji || '🎯',
      isLoading: isLoading,
      isStale: isStale,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Get Gordon display data with caching
 */
function getGordon() {
  return getCachedData('vibe-log', () => {
    const analysis = getGordonAnalysis();

    if (!analysis) {
      // No analysis available
      return {
        display: 'Gordon ready',
        score: null,
        emoji: '🎯',
        bg: powerline.bg.gordon,
        fg: powerline.fg.white,
      };
    }

    if (analysis.isLoading) {
      // Analysis in progress
      return {
        display: 'Gordon analyzing...',
        score: null,
        emoji: '🔄',
        bg: powerline.bg.gordon,
        fg: powerline.fg.cyan,
      };
    }

    if (analysis.isStale) {
      // Stale analysis - fallback
      return {
        display: 'Gordon ready',
        score: null,
        emoji: '🎯',
        bg: powerline.bg.gordon,
        fg: powerline.fg.white,
      };
    }

    // Valid analysis available
    const score = analysis.score;
    const emoji = analysis.emoji;
    const suggestion = analysis.suggestion;

    // Score-based color coding
    let fg, bg;
    if (score >= 81) {
      // Excellent (81-100)
      fg = powerline.fg.green;
      bg = powerline.bg.gordon;
    } else if (score >= 61) {
      // Good (61-80)
      fg = powerline.fg.cyan;
      bg = powerline.bg.gordon;
    } else if (score >= 41) {
      // Fair (41-60)
      fg = powerline.fg.yellow;
      bg = powerline.bg.gordon;
    } else {
      // Poor (0-40)
      fg = powerline.fg.white;
      bg = powerline.bg.critical;
    }

    return {
      display: `${score}/100`,
      suggestion: suggestion,
      score: score,
      emoji: emoji,
      bg: bg,
      fg: fg,
    };
  });
}

/**
 * Get Legal-Braniac data
 */
function getBraniacData() {
  return getCachedData('braniac', () => {
    try {
      const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
      const sessionFile = path.join(projectDir, '.claude', 'hooks', 'legal-braniac-session.json');

      if (!fs.existsSync(sessionFile)) return null;

      const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

      return {
        sessionId: data.sessionId,
        sessionStart: data.sessionStart,
        agentCount: data.agents?.available?.length || 0,
        skillCount: data.skills?.available?.length || 0,
        hookCount: Object.keys(data.hooks || {}).length || 0,
      };
    } catch (e) {
      return null;
    }
  });
}

/**
 * Get session duration
 */
function getSessionDuration() {
  const braniac = getBraniacData();
  if (!braniac || !braniac.sessionStart) return '0m';

  const durationMin = Math.floor((Date.now() - braniac.sessionStart) / 60000);

  if (durationMin < 60) {
    return `${durationMin}m`;
  } else {
    const h = Math.floor(durationMin / 60);
    const m = durationMin % 60;
    return `${h}h${m}m`;
  }
}

/**
 * Get git status (cached)
 */
function getGitStatus() {
  return getCachedData('git-status', () => {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
        timeout: 1000,
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      const status = execSync('git status --porcelain', {
        encoding: 'utf8',
        timeout: 1000,
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      // Truncate long branch names
      let b = branch;
      if (b.length > 25) {
        b = b.substring(0, 22) + '...';
      }

      return status.length > 0 ? `${b}*` : b;
    } catch (error) {
      return '?';
    }
  });
}

/**
 * Get virtual environment status
 */
function getVenvStatus() {
  return process.env.VIRTUAL_ENV ? '●' : '○';
}

// ============================================================================
// LAYOUT MODES (responsive to terminal width)
// ============================================================================

/**
 * Minimal mode: Ultra-compact for narrow terminals
 * Target: <80 cols
 * Example: 2h34m│7a 34s│●│main*
 */
function layoutMinimal() {
  const session = getSessionDuration();
  const braniac = getBraniacData();
  const git = getGitStatus();
  const venv = getVenvStatus();

  const seg1 = segment(
    session,
    powerline.bg.session,
    powerline.fg.cyan,
    powerline.bg.stats
  );

  const statsText = braniac
    ? `${braniac.agentCount}a ${braniac.skillCount}s│${venv}│${git}`
    : `${venv}│${git}`;

  const seg2 = segment(
    statsText,
    powerline.bg.stats,
    powerline.fg.white,
    null
  );

  return seg1 + seg2;
}

/**
 * Compact mode: Single line, essential info
 * Target: 80-120 cols
 * Example: 🎯 Gordon: 85/100│Braniac ● 7ag│⏱ 2h34m│7a 34s 6h│venv ●│git main*
 */
function layoutCompact() {
  const gordon = getGordon();
  const braniac = getBraniacData();
  const session = getSessionDuration();
  const git = getGitStatus();
  const venv = getVenvStatus();

  const seg1 = segment(
    `${gordon.emoji} Gordon: ${gordon.display}`,
    gordon.bg,
    gordon.fg,
    powerline.bg.braniac
  );

  const braniacText = braniac && braniac.agentCount > 0
    ? `Braniac ● ${braniac.agentCount}ag`
    : 'Braniac ○';

  const seg2 = segment(
    braniacText,
    powerline.bg.braniac,
    powerline.fg.yellow,
    powerline.bg.session
  );

  const seg3 = segment(
    `⏱ ${session}`,
    powerline.bg.session,
    powerline.fg.cyan,
    powerline.bg.stats
  );

  const statsText = braniac
    ? `${braniac.agentCount}a ${braniac.skillCount}s ${braniac.hookCount}h│venv ${venv}│git ${git}`
    : `venv ${venv}│git ${git}`;

  const seg4 = segment(
    statsText,
    powerline.bg.stats,
    powerline.fg.white,
    null
  );

  return seg1 + seg2 + seg3 + seg4;
}

/**
 * Comfortable mode: Single line, more details
 * Target: 120-160 cols
 * Example: 🎯 Gordon: 85/100 - Clear prompt│Braniac ● 7ag│⏱ Session 2h34m│7 agents│34 skills│6 hooks│venv ●│git main*
 */
function layoutComfortable() {
  const gordon = getGordon();
  const braniac = getBraniacData();
  const session = getSessionDuration();
  const git = getGitStatus();
  const venv = getVenvStatus();

  // Gordon with suggestion (truncated)
  let gordonText = `${gordon.emoji} Gordon: ${gordon.display}`;
  if (gordon.suggestion) {
    let suggestion = gordon.suggestion;
    if (suggestion.length > 40) {
      suggestion = suggestion.substring(0, 37) + '...';
    }
    gordonText += ` - ${suggestion}`;
  }

  const seg1 = segment(
    gordonText,
    gordon.bg,
    gordon.fg,
    powerline.bg.braniac
  );

  const braniacText = braniac && braniac.agentCount > 0
    ? `Braniac ● ${braniac.agentCount}ag`
    : 'Braniac ○';

  const seg2 = segment(
    braniacText,
    powerline.bg.braniac,
    powerline.fg.yellow,
    powerline.bg.session
  );

  const seg3 = segment(
    `⏱ Session ${session}`,
    powerline.bg.session,
    powerline.fg.cyan,
    powerline.bg.stats
  );

  const statsText = braniac
    ? `${braniac.agentCount} agents│${braniac.skillCount} skills│${braniac.hookCount} hooks│venv ${venv}│git ${git}`
    : `venv ${venv}│git ${git}`;

  const seg4 = segment(
    statsText,
    powerline.bg.stats,
    powerline.fg.white,
    null
  );

  return seg1 + seg2 + seg3 + seg4;
}

/**
 * Wide mode: Maximum detail
 * Target: >160 cols
 * Example: 🎯 Gordon: 85/100 - Clear and focused prompt structure│Braniac ● 7ag│⏱ Session 2h34m│7 agents│34 skills│6 hooks│venv ●│git main*
 */
function layoutWide() {
  const gordon = getGordon();
  const braniac = getBraniacData();
  const session = getSessionDuration();
  const git = getGitStatus();
  const venv = getVenvStatus();

  // Gordon with full suggestion (truncated at 60 chars)
  let gordonText = `${gordon.emoji} Gordon: ${gordon.display}`;
  if (gordon.suggestion) {
    let suggestion = gordon.suggestion;
    if (suggestion.length > 60) {
      suggestion = suggestion.substring(0, 57) + '...';
    }
    gordonText += ` - ${suggestion}`;
  }

  const seg1 = segment(
    gordonText,
    gordon.bg,
    gordon.fg,
    powerline.bg.braniac
  );

  const braniacText = braniac && braniac.agentCount > 0
    ? `Braniac ● ${braniac.agentCount}ag`
    : 'Braniac ○';

  const seg2 = segment(
    braniacText,
    powerline.bg.braniac,
    powerline.fg.yellow,
    powerline.bg.session
  );

  const seg3 = segment(
    `⏱ Session ${session}`,
    powerline.bg.session,
    powerline.fg.cyan,
    powerline.bg.stats
  );

  const statsText = braniac
    ? `${braniac.agentCount} agents│${braniac.skillCount} skills│${braniac.hookCount} hooks│venv ${venv}│git ${git}`
    : `venv ${venv}│git ${git}`;

  const seg4 = segment(
    statsText,
    powerline.bg.stats,
    powerline.fg.white,
    null
  );

  return seg1 + seg2 + seg3 + seg4;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  try {
    const termWidth = process.stdout.columns || 120;
    const mode = process.argv[2]; // compact | comfortable | wide | minimal

    let output;

    if (mode) {
      // Explicit mode
      switch (mode) {
        case 'minimal':
          output = layoutMinimal();
          break;
        case 'compact':
          output = layoutCompact();
          break;
        case 'comfortable':
          output = layoutComfortable();
          break;
        case 'wide':
          output = layoutWide();
          break;
        default:
          output = layoutCompact();
      }
    } else {
      // Auto-detect based on terminal width
      if (termWidth < 80) {
        output = layoutMinimal();
      } else if (termWidth < 120) {
        output = layoutCompact();
      } else if (termWidth < 160) {
        output = layoutComfortable();
      } else {
        output = layoutWide();
      }
    }

    console.log(output);

  } catch (error) {
    // Fallback - always render something
    const fallback = segment(
      'Claude Code - Unified Statusline',
      powerline.bg.gordon,
      powerline.fg.white,
      null
    );
    console.log(fallback);
  }
}

main();
