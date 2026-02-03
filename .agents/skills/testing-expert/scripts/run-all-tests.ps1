# Script PowerShell pour exécuter tous les tests
# Usage: .\run-all-tests.ps1 [-SkipE2E] [-Coverage]

param(
    [switch]$SkipE2E,
    [switch]$Coverage,
    [switch]$Ci
)

$ErrorActionPreference = "Stop"
$exitCode = 0

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           🧪  EXÉCUTION DES TESTS COMPLETE                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Couleurs
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

# Fonction pour afficher les sections
function Write-Section($title) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Cyan
    Write-Host "  $title" -ForegroundColor $Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Cyan
    Write-Host ""
}

# 1. Lint
Write-Section "1. ESLint"
try {
    npm run lint
    Write-Host "✅ Lint: OK" -ForegroundColor $Green
} catch {
    Write-Host "❌ Lint: ÉCHEC" -ForegroundColor $Red
    $exitCode = 1
}

# 2. Type check
Write-Section "2. TypeScript Check"
try {
    npx tsc --noEmit
    Write-Host "✅ TypeScript: OK" -ForegroundColor $Green
} catch {
    Write-Host "❌ TypeScript: ÉCHEC" -ForegroundColor $Red
    $exitCode = 1
}

# 3. Unit & Integration Tests
Write-Section "3. Tests Unitaires & Intégration"
$testArgs = @("run")
if ($Coverage) {
    $testArgs += "--coverage"
}
if ($Ci) {
    $env:CI = "true"
}

try {
    & npx vitest @testArgs
    if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
    Write-Host "✅ Tests Unitaires: OK" -ForegroundColor $Green
} catch {
    Write-Host "❌ Tests Unitaires: ÉCHEC" -ForegroundColor $Red
    $exitCode = 1
}

# 4. Build
Write-Section "4. Build Production"
try {
    npm run build
    Write-Host "✅ Build: OK" -ForegroundColor $Green
} catch {
    Write-Host "❌ Build: ÉCHEC" -ForegroundColor $Red
    $exitCode = 1
}

# 5. E2E Tests
if (-not $SkipE2E) {
    Write-Section "5. Tests E2E (Playwright)"
    
    # Vérifier si Playwright est installé
    if (-not (Test-Path "node_modules/.bin/playwright")) {
        Write-Host "⚠️ Playwright non installé, installation..." -ForegroundColor $Yellow
        npx playwright install
    }
    
    try {
        $e2eArgs = @("test")
        if ($Ci) {
            $e2eArgs += "--reporter=html"
        }
        
        & npx playwright @e2eArgs
        if ($LASTEXITCODE -ne 0) { throw "E2E tests failed" }
        Write-Host "✅ Tests E2E: OK" -ForegroundColor $Green
    } catch {
        Write-Host "❌ Tests E2E: ÉCHEC" -ForegroundColor $Red
        $exitCode = 1
    }
} else {
    Write-Section "5. Tests E2E (SKIPPÉ)"
    Write-Host "⚠️ E2E tests skipped (use -SkipE2E:false to run)" -ForegroundColor $Yellow
}

# Résumé
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "║           ✅ TOUS LES TESTS ONT RÉUSSI!                    ║" -ForegroundColor $Green
} else {
    Write-Host "║           ❌ CERTAINS TESTS ONT ÉCHOUÉ                     ║" -ForegroundColor $Red
}
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
