# IBVAP Start Script (Windows PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   IBVAP: C4ISR Border Incident Intelligence Platform     " -ForegroundColor Cyan
Write-Host "                    STARTING PLATFORM                     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$rootDir = (Resolve-Path "$PSScriptRoot\..").Path
$backendDir = "$rootDir\backend"
$frontendDir = "$rootDir\frontend"

# Start Backend in new process window
Write-Host "`nStarting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$backendCmd = "`$env:PYTHONPATH = '$rootDir;$backendDir'; cd '$backendDir'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru

# Start Frontend Vite Dev Server in new process window
Write-Host "Starting React Command Center UI on http://localhost:5173..." -ForegroundColor Green
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev" -PassThru

Write-Host "`n✓ Both services are launching!" -ForegroundColor Cyan
Write-Host "Backend API:      http://127.0.0.1:8000" -ForegroundColor White
Write-Host "OpenAPI Docs:     http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "Command Center:   http://localhost:5173" -ForegroundColor White
Write-Host "`nTo shut down running instances, execute .\scripts\stop.ps1" -ForegroundColor Yellow
