import os
import sys
from pathlib import Path

# Bootstrap sys.path to guarantee root repository and backend modules are always importable
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.websockets import ws_manager
from app.services.demo_service import seed_demo_database

from app.api.auth import router as auth_router
from app.api.cameras import router as cameras_router
from app.api.incidents import router as incidents_router
from app.api.evidence import router as evidence_router
from app.api.blockchain import router as blockchain_router
from app.api.models import router as models_router
from app.api.audit import router as audit_router
from app.api.alerts import router as alerts_router
from app.api.system_health import router as health_router
from app.api.vehicles import router as vehicles_router

def _auto_migrate_schema(sync_conn):
    """Safely adds newly defined columns to existing SQLite tables if missing."""
    try:
        cursor = sync_conn.connection.cursor()
        cursor.execute("PRAGMA table_info(detected_vehicles)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        if existing_cols:
            migrations = [
                ("is_known", "BOOLEAN DEFAULT 0"),
                ("owner_or_unit", "VARCHAR(255) DEFAULT 'Unknown Civilian / Unregistered'"),
                ("registration_status", "VARCHAR(50) DEFAULT 'UNKNOWN_UNREGISTERED'"),
                ("sha256_hash", "VARCHAR(64)"),
                ("blockchain_block", "INTEGER")
            ]
            for col_name, col_def in migrations:
                if col_name not in existing_cols:
                    cursor.execute(f"ALTER TABLE detected_vehicles ADD COLUMN {col_name} {col_def}")
            
        cursor.execute("PRAGMA table_info(evidence)")
        ev_cols = {row[1] for row in cursor.fetchall()}
        if ev_cols:
            if "owner_username" not in ev_cols:
                cursor.execute("ALTER TABLE evidence ADD COLUMN owner_username VARCHAR(50) DEFAULT 'operator'")
            if "is_deleted_by_user" not in ev_cols:
                cursor.execute("ALTER TABLE evidence ADD COLUMN is_deleted_by_user INTEGER DEFAULT 0")
            if "deleted_by_username" not in ev_cols:
                cursor.execute("ALTER TABLE evidence ADD COLUMN deleted_by_username VARCHAR(50)")
            if "deleted_at" not in ev_cols:
                cursor.execute("ALTER TABLE evidence ADD COLUMN deleted_at DATETIME")
            
        sync_conn.connection.commit()
    except Exception as e:
        print(f"[IBVAP] Auto-migration notice: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_auto_migrate_schema)

    # Seed baseline users and AI model records
    async with AsyncSessionLocal() as db:
        await seed_demo_database(db)

    print("[IBVAP] C4ISR Backend System Initialized. Camera connections waiting for user activation.")
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_TITLE,
    description="C4ISR Border Incident Intelligence & Trusted Evidence Platform Backend",
    version="3.2.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Storage Mounting
if os.path.exists(settings.STORAGE_DIR):
    app.mount("/storage", StaticFiles(directory=settings.STORAGE_DIR), name="storage")

# Mount Routers
app.include_router(auth_router, prefix="/api")
app.include_router(cameras_router, prefix="/api")
app.include_router(incidents_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(blockchain_router, prefix="/api")
app.include_router(models_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(vehicles_router, prefix="/api")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "system": "IBVAP C4ISR Surveillance Platform",
        "version": "3.2.0"
    }

@app.websocket("/ws/dashboard")
async def websocket_dashboard_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keepalive and receive client pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

