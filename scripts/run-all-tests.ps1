# Script PowerShell pour executer tous les tests avant deploy
# Usage: .\run-all-tests.ps1 [-SkipE2E] [-Coverage]

param(
    [switch]$SkipE2E,
    [switch]$Coverage
)

$ErrorActionPreference = "Stop"
$exitCode = 0

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           🧪  EXECUTION DES TESTS COMPLETE                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Couleurs
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

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
    Write-Host "❌ Lint: ECHEC" -ForegroundColor $Red
    $exitCode = 1
}

# 2. Type check
Write-Section "2. TypeScript Check"
try {
    npx tsc --noEmit
    Write-Host "✅ TypeScript: OK" -ForegroundColor $Green
} catch {
    Write-Host "❌ TypeScript: ECHEC" -ForegroundColor $Red
    $exitCode = 1
}

# 3. Tests unitaires
Write-Section "3. Tests Unitaires"
$unitArgs = @("run", "--exclude", "__tests__/integration/**")
if ($Coverage) {
    $unitArgs += "--coverage"
}

try {
    & npx vitest @unitArgs
    if ($LASTEXITCODE -ne 0) { throw "Tests unitaires failed" }
    Write-Host "✅ Tests Unitaires: OK" -ForegroundColor $Green
} catch {
    Write-Host "❌ Tests Unitaires: ECHEC" -ForegroundColor $Red
    $exitCode = 1
}

# 4. Tests integration
Write-Section "4. Tests Integration"
try {
    npm run test:integration
    if ($LASTEXITCODE -ne 0) { throw "Tests integration failed" }
    Write-Host "✅ Tests Integration: OK" -ForegroundColor $Green
} catch {
    Write-Host "❌ Tests Integration: ECHEC" -ForegroundColor $Red
    $exitCode = 1
}

# 5. Build
Write-Section "5. Build Production"
try {
    npm run build
    Write-Host "✅ Build: OK" -ForegroundColor $Green
} catch {
    Write-Host "❌ Build: ECHEC" -ForegroundColor $Red
    $exitCode = 1
}

# 6. Tests E2E
if (-not $SkipE2E) {
    Write-Section "6. Tests E2E (Playwright)"
    try {
        npx playwright test
        if ($LASTEXITCODE -ne 0) { throw "Tests E2E failed" }
        Write-Host "✅ Tests E2E: OK" -ForegroundColor $Green
    } catch {
        Write-Host "❌ Tests E2E: ECHEC" -ForegroundColor $Red
        $exitCode = 1
    }
} else {
    Write-Section "6. Tests E2E (SKIPPE)"
    Write-Host "⚠️ E2E tests skipped" -ForegroundColor $Yellow
}

# Resume
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "║           ✅ TOUS LES TESTS ONT REUSSI!                    ║" -ForegroundColor $Green
} else {
    Write-Host "║           ❌ CERTAINS TESTS ONT ECHOUE                     ║" -ForegroundColor $Red
}
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
