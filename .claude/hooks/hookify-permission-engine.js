#!/usr/bin/env node
/**
 * hookify-permission-engine.js - Auto-approve permissions via Hookify rules
 *
 * PermissionRequest hook that uses declarative rules from .claude/hookify.*.md files
 * to automatically approve or deny tool permissions.
 *
 * Rule format (in .claude/hookify.permission-*.md):
 * ---
 * name: rule-name
 * enabled: true
 * event: permission
 * tool: Bash|Edit|Write|*
 * action: allow|deny|ask
 * pattern: regex-for-bash-commands (optional, only for Bash)
 * ---
 * Message shown when denied (markdown)
 *
 * Version: 1.0.0
 */

const fs = require("fs");
const path = require("path");

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CLAUDE_DIR = path.join(PROJECT_DIR, ".claude");
const DEBUG = process.env.HOOKIFY_DEBUG === "1";

function debug(...a) {
  if (DEBUG) console.error("[hookify-permission]", ...a);
}

function parseFrontmatter(content) {
  const regex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const m = content.match(regex);
  if (!m) return null;
  const [, yaml, body] = m;
  const cfg = {};
  yaml.split("\n").forEach(l => {
    const i = l.indexOf(":");
    if (i === -1) return;
    const k = l.slice(0, i).trim();
    let v = l.slice(i + 1).trim();
    if (v === "true") v = true;
    else if (v === "false") v = false;
    cfg[k] = v;
  });
  return { config: cfg, message: body.trim() };
}

function loadPermissionRules() {
  const rules = [];
  try {
    const files = fs.readdirSync(CLAUDE_DIR)
      .filter(f => f.startsWith("hookify.") && f.endsWith(".md"));
    debug("Found:", files);

    for (const f of files) {
      try {
        const c = fs.readFileSync(path.join(CLAUDE_DIR, f), "utf8");
        const p = parseFrontmatter(c);
        if (!p) { debug("Skip " + f + ": no frontmatter"); continue; }

        const { config: cfg, message: msg } = p;
        if (cfg.event !== "permission") { debug("Skip " + f + ": not permission event"); continue; }
        if (!cfg.name || !cfg.tool || !cfg.action) { debug("Skip " + f + ": missing fields"); continue; }
        if (cfg.enabled === false) { debug("Skip " + f + ": disabled"); continue; }

        rules.push({
          name: cfg.name,
          tool: cfg.tool,
          action: cfg.action,
          pattern: cfg.pattern || null,
          message: msg,
          file: f,
          priority: cfg.priority || 0
        });
        debug("Loaded:", cfg.name);
      } catch (e) { debug("Err " + f + ":", e.message); }
    }

    // Sort by priority (higher first)
    rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  } catch (e) { debug("Err dir:", e.message); }
  return rules;
}

function toolMatches(toolName, pattern) {
  if (pattern === "*") return true;
  // Support | separated patterns like "Edit|Write|MultiEdit"
  const patterns = pattern.split("|");
  return patterns.some(p => {
    if (p === toolName) return true;
    // Support prefix matching for mcp__* tools
    if (p.endsWith("*")) {
      return toolName.startsWith(p.slice(0, -1));
    }
    return false;
  });
}

function commandMatches(command, pattern) {
  if (!pattern) return true;
  try {
    return new RegExp(pattern).test(command);
  } catch (e) {
    debug("Bad regex:", pattern);
    return false;
  }
}

function evaluateRules(toolName, toolInput, rules) {
  const command = toolInput?.command || "";

  for (const rule of rules) {
    // Check if tool matches
    if (!toolMatches(toolName, rule.tool)) continue;

    // For Bash, check command pattern if specified
    if (toolName === "Bash" && rule.pattern) {
      if (!commandMatches(command, rule.pattern)) continue;
    }

    debug("MATCH:", rule.name, "->", rule.action);

    // Return decision based on action
    switch (rule.action) {
      case "allow":
        return { behavior: "allow" };
      case "deny":
        return {
          behavior: "deny",
          message: rule.message || `Bloqueado por regra: ${rule.name}`
        };
      case "ask":
        return { behavior: "ask" };
      default:
        debug("Unknown action:", rule.action);
    }
  }

  // No matching rule - default to ask
  debug("No match - default to ask");
  return { behavior: "ask" };
}

async function main() {
  let input = "";
  try {
    input = fs.readFileSync(0, "utf8");
  } catch (e) {
    debug("No stdin");
    console.log(JSON.stringify({ behavior: "ask" }));
    return;
  }

  if (!input.trim()) {
    debug("Empty input");
    console.log(JSON.stringify({ behavior: "ask" }));
    return;
  }

  let h;
  try {
    h = JSON.parse(input);
  } catch (e) {
    debug("Bad JSON:", e.message);
    console.log(JSON.stringify({ behavior: "ask" }));
    return;
  }

  debug("Input:", JSON.stringify(h, null, 2));

  // Extract tool info - try multiple possible field names
  const toolName = h.toolName || h.tool_name || h.tool || "";
  const toolInput = h.toolInput || h.tool_input || h.input || {};

  debug("Tool:", toolName);

  // Load and evaluate rules
  const rules = loadPermissionRules();
  if (!rules.length) {
    debug("No permission rules - default allow");
    // If no rules defined, default to allowing everything
    // This maintains backward compatibility
    console.log(JSON.stringify({ behavior: "allow" }));
    return;
  }

  const decision = evaluateRules(toolName, toolInput, rules);
  console.log(JSON.stringify(decision));
}

main().catch(e => {
  console.error("[hookify-permission] Fatal:", e.message);
  console.log(JSON.stringify({ behavior: "ask" }));
});
