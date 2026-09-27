# KAVACH Commander Mobile App Launch Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   KAVACH COMMANDER - HIGHER DEFENSE OFFICIALS MOBILE APP" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

 = Join-Path  "..\mobile"
Set-Location 

if (-not (Test-Path "node_modules")) {
    Write-Host "[IBVAP] Installing mobile app dependencies via npm..." -ForegroundColor Yellow
    npm install
}

Write-Host "
[IBVAP] Default Higher Official Credentials:" -ForegroundColor Green
Write-Host "   Officer ID : COMMANDER-HQ-01" -ForegroundColor Yellow
Write-Host "   Passphrase : Kavach@Command2026" -ForegroundColor Yellow
Write-Host "   Clearance  : LEVEL-5 TOP SECRET" -ForegroundColor Green

Write-Host "
[IBVAP] Launching Expo server for Web, Android & iOS..." -ForegroundColor Cyan
npx expo start --web
