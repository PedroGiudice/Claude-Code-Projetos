#!/usr/bin/env node

/**
 * session-end-git-safety.js
 *
 * SessionEnd hook that auto-commits uncommitted changes to a safety branch
 * if session lasted 2.5+ hours without commits.
 *
 * Safety features:
 * - Never commits to main/master
 * - Creates timestamped branches: auto-save/session-{timestamp}
 * - Handles edge cases (merge conflicts, detached HEAD)
 * - Detailed logging
 *
 * Configuration (via env vars):
 * - GIT_SAFETY_ENABLED=true/false (default: true)
 * - GIT_SAFETY_THRESHOLD_HOURS=2.5 (default: 2.5)
 * - GIT_SAFETY_BRANCH_PREFIX=auto-save (default)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  enabled: process.env.GIT_SAFETY_ENABLED !== 'false', // Enabled by default
  thresholdHours: parseFloat(process.env.GIT_SAFETY_THRESHOLD_HOURS || '2.5'),
  branchPrefix: process.env.GIT_SAFETY_BRANCH_PREFIX || 'auto-save',
  sessionFile: '.claude/hooks/legal-braniac-session.json' // Uses existing session tracking
};

/**
 * Execute git command safely
 */
function gitExec(command, silent = false) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
      cwd: process.cwd()
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || ''
    };
  }
}

/**
 * Check if we're in a git repository
 */
function isGitRepo() {
  const result = gitExec('git rev-parse --git-dir', true);
  return result.success;
}

/**
 * Get current branch name
 */
function getCurrentBranch() {
  const result = gitExec('git branch --show-current', true);
  return result.success ? result.output : null;
}

/**
 * Check if there are uncommitted changes
 */
function hasUncommittedChanges() {
  const result = gitExec('git status --porcelain', true);
  return result.success && result.output.length > 0;
}

/**
 * Check if in merge/rebase/cherry-pick state
 */
function isInConflictState() {
  const gitDir = gitExec('git rev-parse --git-dir', true).output;
  if (!gitDir) return false;

  const conflictFiles = [
    'MERGE_HEAD',
    'REBASE_HEAD',
    'CHERRY_PICK_HEAD'
  ];

  return conflictFiles.some(file =>
    fs.existsSync(path.join(gitDir, file))
  );
}

/**
 * Get timestamp of last commit
 */
function getLastCommitTime() {
  const result = gitExec('git log -1 --format=%ct', true);
  if (!result.success) return null;

  const timestamp = parseInt(result.output, 10);
  return isNaN(timestamp) ? null : timestamp;
}

/**
 * Get session start time from legal-braniac session
 */
function getSessionStartTime() {
  const sessionFile = path.join(process.cwd(), CONFIG.sessionFile);

  if (fs.existsSync(sessionFile)) {
    try {
      const content = fs.readFileSync(sessionFile, 'utf8');
      const session = JSON.parse(content);

      // sessionStart and startTime are in milliseconds, convert to seconds
      const timestamp = Math.floor((session.sessionStart || session.startTime) / 1000);
      return isNaN(timestamp) ? null : timestamp;
    } catch (error) {
      console.error(`[GIT-SAFETY] Warning: Could not parse session file: ${error.message}`);
      return null;
    }
  }

  return null;
}

/**
 * Calculate elapsed time since last commit or session start
 */
function getElapsedHours() {
  const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

  // Try session start time first
  const sessionStart = getSessionStartTime();
  if (sessionStart) {
    return (now - sessionStart) / 3600;
  }

  // Fallback to last commit time
  const lastCommit = getLastCommitTime();
  if (lastCommit) {
    return (now - lastCommit) / 3600;
  }

  return 0;
}

/**
 * Create safety branch and commit changes
 */
function createSafetyCommit() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const branchName = `${CONFIG.branchPrefix}/session-${timestamp}`;
  const currentBranch = getCurrentBranch();

  console.error(`\n[GIT-SAFETY] Creating safety commit on branch: ${branchName}`);

  // Create new branch from current HEAD (don't switch to it)
  let result = gitExec(`git branch ${branchName}`, true);
  if (!result.success) {
    console.error(`[GIT-SAFETY] ❌ Failed to create branch: ${result.error}`);
    return false;
  }

  // Checkout the safety branch
  result = gitExec(`git checkout ${branchName}`, true);
  if (!result.success) {
    console.error(`[GIT-SAFETY] ❌ Failed to checkout branch: ${result.error}`);
    return false;
  }

  // Add all changes
  result = gitExec('git add -A', true);
  if (!result.success) {
    console.error(`[GIT-SAFETY] ❌ Failed to stage changes: ${result.error}`);
    // Try to go back to original branch
    gitExec(`git checkout ${currentBranch}`, true);
    return false;
  }

  // Create commit message
  const elapsedHours = getElapsedHours().toFixed(1);
  const commitMessage = `chore: auto-save session changes (${elapsedHours}h elapsed)

Session ended with uncommitted changes after ${elapsedHours} hours.
Auto-saved to safety branch for review.

Branch: ${currentBranch} → ${branchName}
Timestamp: ${new Date().toISOString()}

⚠️ This is an automatic safety commit. Review changes before merging.

🤖 Generated by session-end-git-safety hook`;

  // Commit changes
  result = gitExec(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, true);
  if (!result.success) {
    console.error(`[GIT-SAFETY] ❌ Failed to commit: ${result.error}`);
    // Try to go back to original branch
    gitExec(`git checkout ${currentBranch}`, true);
    return false;
  }

  console.error(`[GIT-SAFETY] ✅ Changes committed to: ${branchName}`);
  console.error(`[GIT-SAFETY] 📊 Elapsed time: ${elapsedHours}h`);
  console.error(`[GIT-SAFETY] 🔄 Returning to original branch: ${currentBranch}`);

  // Return to original branch
  result = gitExec(`git checkout ${currentBranch}`, true);
  if (!result.success) {
    console.error(`[GIT-SAFETY] ⚠️ Warning: Could not return to ${currentBranch}`);
    console.error(`[GIT-SAFETY] You are currently on: ${branchName}`);
  }

  console.error(`[GIT-SAFETY] 💡 To review changes: git diff ${currentBranch}..${branchName}`);
  console.error(`[GIT-SAFETY] 💡 To merge: git merge ${branchName}`);

  return true;
}

/**
 * Main hook logic
 */
async function main() {
  try {
    // Check if enabled
    if (!CONFIG.enabled) {
      console.error('[GIT-SAFETY] Disabled via GIT_SAFETY_ENABLED=false');
      return;
    }

    // Check if we're in a git repo
    if (!isGitRepo()) {
      console.error('[GIT-SAFETY] Not in a git repository - skipping');
      return;
    }

    // Check for conflict state
    if (isInConflictState()) {
      console.error('[GIT-SAFETY] Repository in merge/rebase state - skipping for safety');
      return;
    }

    // Check for uncommitted changes
    if (!hasUncommittedChanges()) {
      console.error('[GIT-SAFETY] No uncommitted changes - nothing to save');
      return;
    }

    // Check elapsed time
    const elapsedHours = getElapsedHours();
    console.error(`[GIT-SAFETY] Elapsed time since last commit: ${elapsedHours.toFixed(1)}h`);

    if (elapsedHours < CONFIG.thresholdHours) {
      console.error(`[GIT-SAFETY] Below threshold (${CONFIG.thresholdHours}h) - skipping auto-save`);
      return;
    }

    // Check current branch
    const currentBranch = getCurrentBranch();
    if (!currentBranch) {
      console.error('[GIT-SAFETY] Detached HEAD state - skipping for safety');
      return;
    }

    // All conditions met - create safety commit
    console.error(`[GIT-SAFETY] ⚠️ Session lasted ${elapsedHours.toFixed(1)}h with uncommitted changes`);
    const success = createSafetyCommit();

    if (success) {
      console.error('[GIT-SAFETY] ✅ Auto-save completed successfully');
    } else {
      console.error('[GIT-SAFETY] ❌ Auto-save failed - manual intervention required');
      process.exit(1);
    }

  } catch (error) {
    console.error(`[GIT-SAFETY] ❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
