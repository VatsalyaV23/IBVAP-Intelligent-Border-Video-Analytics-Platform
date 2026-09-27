# IBVAP Stop Script (Windows PowerShell)
Write-Host "Stopping all running uvicorn and vite processes..." -ForegroundColor Yellow

Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" } | Stop-Process -Force

Write-Host "✓ All IBVAP platform services stopped." -ForegroundColor Green
