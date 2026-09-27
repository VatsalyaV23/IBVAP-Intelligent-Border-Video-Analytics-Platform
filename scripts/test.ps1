# IBVAP Test Runner Script (Windows PowerShell)
Write-Host "Running automated verification tests..." -ForegroundColor Cyan

python -m pytest tests/ -v

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ All backend tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Test failures encountered." -ForegroundColor Red
}

Set-Location frontend
Write-Host "`nVerifying frontend build compilation..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Frontend build verified!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Frontend build failed." -ForegroundColor Red
}
Set-Location ..
