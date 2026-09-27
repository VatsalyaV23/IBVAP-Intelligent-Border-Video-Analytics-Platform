from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.audit import AuditLogEntry
from app.schemas.common import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(db: AsyncSession = Depends(get_db)):
    stmt = select(AuditLogEntry).order_by(AuditLogEntry.timestamp.desc()).limit(100)
    res = await db.execute(stmt)
    return res.scalars().all()
