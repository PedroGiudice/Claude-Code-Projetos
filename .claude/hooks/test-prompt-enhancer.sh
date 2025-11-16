#!/bin/bash
# test-prompt-enhancer.sh - Testes end-to-end para Prompt Enhancer v0
#
# Valida:
# - Pattern matching
# - Quality scoring
# - Bypass detection
# - Tracking de métricas
# - Output JSON correto

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
HOOK_PATH="$PROJECT_DIR/.claude/hooks/prompt-enhancer.js"
QUALITY_FILE="$PROJECT_DIR/.claude/statusline/prompt-quality.json"

echo "🧪 Prompt Enhancer v0 - End-to-End Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper: Run test
run_test() {
  local test_name="$1"
  local prompt="$2"
  local expected_enhanced="$3"  # true/false

  TESTS_RUN=$((TESTS_RUN + 1))

  echo -n "Test $TESTS_RUN: $test_name ... "

  # Create input JSON
  local input_json=$(cat <<EOF
{
  "userPrompt": "$prompt",
  "workspace": {
    "current_dir": "$PROJECT_DIR"
  }
}
EOF
)

  # Execute hook (separar stderr de stdout)
  local output=$(echo "$input_json" | node "$HOOK_PATH" 2>/dev/null)

  # Validate JSON output
  if ! echo "$output" | node -e "const data = require('fs').readFileSync(0, 'utf-8'); JSON.parse(data);" >/dev/null 2>&1; then
    echo -e "${RED}FAILED${NC} (invalid JSON output)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi

  # Check if enhancement occurred
  local system_message=$(echo "$output" | node -e "const data = require('fs').readFileSync(0, 'utf-8'); const json = JSON.parse(data); console.log(json.systemMessage || '');")
  local has_enhancement=false

  if [[ "$system_message" != "" && "$system_message" != "null" ]]; then
    has_enhancement=true
  fi

  # Validate expectation
  if [[ "$expected_enhanced" == "true" && "$has_enhancement" == "false" ]]; then
    echo -e "${RED}FAILED${NC} (expected enhancement, got none)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi

  if [[ "$expected_enhanced" == "false" && "$has_enhancement" == "true" ]]; then
    echo -e "${RED}FAILED${NC} (expected no enhancement, got enhancement)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi

  echo -e "${GREEN}PASSED${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  return 0
}

# Test 1: Bypass with asterisk
run_test "Bypass with *" \
  "*implementar cache" \
  "false"

# Test 2: Bypass with slash
run_test "Bypass with /" \
  "/baixar dados" \
  "false"

# Test 3: Bypass with hash
run_test "Bypass with #" \
  "#processar arquivos" \
  "false"

# Test 4: Force enhance with ++
run_test "Force enhance with ++" \
  "++baixar dados do site X" \
  "true"

# Test 5: Pattern match - mass data collection
run_test "Pattern: mass data collection" \
  "baixar múltiplos PDFs do site da OAB" \
  "true"

# Test 6: Pattern match - monitor-notify
run_test "Pattern: monitor-notify" \
  "monitorar site e alertar quando houver mudanças" \
  "true"

# Test 7: Pattern match - API integration
run_test "Pattern: API integration" \
  "integrar com API REST do servidor X" \
  "true"

# Test 8: High quality prompt (should bypass)
run_test "High quality prompt (bypass)" \
  "Implementar cache Redis com TTL de 1 hora para endpoint /api/products usando biblioteca ioredis, com error handling e logging" \
  "false"

# Test 9: Empty prompt
run_test "Empty prompt (bypass)" \
  "" \
  "false"

# Test 10: Very short prompt
run_test "Very short prompt (low quality)" \
  "baixar" \
  "false"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total:  $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $TESTS_FAILED${NC}"
else
  echo -e "Failed: 0"
fi
echo ""

# Validate quality tracking file
if [ -f "$QUALITY_FILE" ]; then
  echo "✅ Quality tracking file exists"

  # Validate JSON
  if node -e "JSON.parse(require('fs').readFileSync('$QUALITY_FILE', 'utf-8'));" >/dev/null 2>&1; then
    echo "✅ Quality tracking file is valid JSON"

    # Show stats
    total=$(node -e "const d = JSON.parse(require('fs').readFileSync('$QUALITY_FILE', 'utf-8')); console.log(d.stats.totalPrompts);")
    enhanced=$(node -e "const d = JSON.parse(require('fs').readFileSync('$QUALITY_FILE', 'utf-8')); console.log(d.stats.enhancedPrompts);")
    avg=$(node -e "const d = JSON.parse(require('fs').readFileSync('$QUALITY_FILE', 'utf-8')); console.log(d.stats.averageQuality);")

    echo ""
    echo "📈 Current Metrics:"
    echo "  Total prompts:    $total"
    echo "  Enhanced prompts: $enhanced"
    echo "  Average quality:  $avg/100"
  else
    echo -e "${RED}❌ Quality tracking file has invalid JSON${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Quality tracking file not created yet${NC}"
fi

echo ""

# Exit code
if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
