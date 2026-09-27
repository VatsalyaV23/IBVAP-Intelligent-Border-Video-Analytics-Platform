# IBVAP Setup Script (Windows PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   IBVAP: C4ISR Border Incident Intelligence Platform     " -ForegroundColor Cyan
Write-Host "                  ENVIRONMENT SETUP                       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Install Python backend requirements
Write-Host "`n[1/3] Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install -r backend/requirements.txt

# 2. Install Frontend dependencies
Write-Host "`n[2/3] Installing Frontend Node.js dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

# 3. Seed Database
Write-Host "`n[3/3] Initializing and seeding C4ISR demonstration baseline..." -ForegroundColor Yellow
python -c "import asyncio, sys; sys.path.insert(0, 'backend'); from app.core.database import engine, Base, AsyncSessionLocal; from app.services.demo_service import seed_demo_database; async def init(): async with engine.begin() as conn: await conn.run_sync(Base.metadata.create_all); async with AsyncSessionLocal() as db: await seed_demo_database(db); asyncio.run(init()); print('IBVAP Baseline Seeded Successfully!')"

Write-Host "`n✓ Setup completed successfully! Run .\scripts\start.ps1 to launch IBVAP." -ForegroundColor Green
