#!/bin/bash
# Script Bash pour executer tous les tests avant deploy
# Usage: ./run-all-tests.sh [--skip-e2e] [--coverage]

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SKIP_E2E=false
COVERAGE=false
EXIT_CODE=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-e2e)
      SKIP_E2E=true
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
  esac
done

print_section() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           🧪  EXECUTION DES TESTS COMPLETE                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Lint
print_section "1. ESLint"
if npm run lint; then
  echo -e "${GREEN}✅ Lint: OK${NC}"
else
  echo -e "${RED}❌ Lint: ECHEC${NC}"
  EXIT_CODE=1
fi

# 2. Type check
print_section "2. TypeScript Check"
if npx tsc --noEmit; then
  echo -e "${GREEN}✅ TypeScript: OK${NC}"
else
  echo -e "${RED}❌ TypeScript: ECHEC${NC}"
  EXIT_CODE=1
fi

# 3. Tests unitaires
print_section "3. Tests Unitaires"
UNIT_ARGS="run --exclude __tests__/integration/**"
if [ "$COVERAGE" = true ]; then
  UNIT_ARGS="$UNIT_ARGS --coverage"
fi

if npx vitest $UNIT_ARGS; then
  echo -e "${GREEN}✅ Tests Unitaires: OK${NC}"
else
  echo -e "${RED}❌ Tests Unitaires: ECHEC${NC}"
  EXIT_CODE=1
fi

# 4. Tests integration
print_section "4. Tests Integration"
if npm run test:integration; then
  echo -e "${GREEN}✅ Tests Integration: OK${NC}"
else
  echo -e "${RED}❌ Tests Integration: ECHEC${NC}"
  EXIT_CODE=1
fi

# 5. Build
print_section "5. Build Production"
if npm run build; then
  echo -e "${GREEN}✅ Build: OK${NC}"
else
  echo -e "${RED}❌ Build: ECHEC${NC}"
  EXIT_CODE=1
fi

# 6. Tests E2E
if [ "$SKIP_E2E" = false ]; then
  print_section "6. Tests E2E (Playwright)"
  if npx playwright test; then
    echo -e "${GREEN}✅ Tests E2E: OK${NC}"
  else
    echo -e "${RED}❌ Tests E2E: ECHEC${NC}"
    EXIT_CODE=1
  fi
else
  print_section "6. Tests E2E (SKIPPE)"
  echo -e "${YELLOW}⚠️ E2E tests skipped${NC}"
fi

# Resume
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}║           ✅ TOUS LES TESTS ONT REUSSI!                    ║${NC}"
else
  echo -e "${RED}║           ❌ CERTAINS TESTS ONT ECHOUE                     ║${NC}"
fi
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

exit $EXIT_CODE
