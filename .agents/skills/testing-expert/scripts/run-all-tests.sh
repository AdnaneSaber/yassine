#!/bin/bash
# Script Bash pour exécuter tous les tests
# Usage: ./run-all-tests.sh [--skip-e2e] [--coverage] [--ci]

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Flags
SKIP_E2E=false
COVERAGE=false
CI=false
EXIT_CODE=0

# Parse arguments
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
    --ci)
      CI=true
      shift
      ;;
    *)
      echo "Option inconnue: $1"
      exit 1
      ;;
  esac
done

# Fonction pour afficher les sections
print_section() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           🧪  EXÉCUTION DES TESTS COMPLETE                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Lint
print_section "1. ESLint"
if npm run lint; then
  echo -e "${GREEN}✅ Lint: OK${NC}"
else
  echo -e "${RED}❌ Lint: ÉCHEC${NC}"
  EXIT_CODE=1
fi

# 2. Type check
print_section "2. TypeScript Check"
if npx tsc --noEmit; then
  echo -e "${GREEN}✅ TypeScript: OK${NC}"
else
  echo -e "${RED}❌ TypeScript: ÉCHEC${NC}"
  EXIT_CODE=1
fi

# 3. Unit & Integration Tests
print_section "3. Tests Unitaires & Intégration"
TEST_ARGS="run"
if [ "$COVERAGE" = true ]; then
  TEST_ARGS="$TEST_ARGS --coverage"
fi
if [ "$CI" = true ]; then
  export CI=true
fi

if npx vitest $TEST_ARGS; then
  echo -e "${GREEN}✅ Tests Unitaires: OK${NC}"
else
  echo -e "${RED}❌ Tests Unitaires: ÉCHEC${NC}"
  EXIT_CODE=1
fi

# 4. Build
print_section "4. Build Production"
if npm run build; then
  echo -e "${GREEN}✅ Build: OK${NC}"
else
  echo -e "${RED}❌ Build: ÉCHEC${NC}"
  EXIT_CODE=1
fi

# 5. E2E Tests
if [ "$SKIP_E2E" = false ]; then
  print_section "5. Tests E2E (Playwright)"
  
  # Vérifier si Playwright est installé
  if ! command -v npx &> /dev/null || ! npx playwright --version &> /dev/null; then
    echo -e "${YELLOW}⚠️ Playwright non installé, installation...${NC}"
    npx playwright install
  fi
  
  E2E_ARGS=""
  if [ "$CI" = true ]; then
    E2E_ARGS="--reporter=html"
  fi
  
  if npx playwright test $E2E_ARGS; then
    echo -e "${GREEN}✅ Tests E2E: OK${NC}"
  else
    echo -e "${RED}❌ Tests E2E: ÉCHEC${NC}"
    EXIT_CODE=1
  fi
else
  print_section "5. Tests E2E (SKIPPÉ)"
  echo -e "${YELLOW}⚠️ E2E tests skipped (remove --skip-e2e to run)${NC}"
fi

# Résumé
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}║           ✅ TOUS LES TESTS ONT RÉUSSI!                    ║${NC}"
else
  echo -e "${RED}║           ❌ CERTAINS TESTS ONT ÉCHOUÉ                     ║${NC}"
fi
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

exit $EXIT_CODE
