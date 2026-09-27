from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.common import AlertResponse

router = APIRouter(prefix="/alerts", tags=["Alerts & Escalation"])

@router.get("", response_model=List[AlertResponse])
async def list_alerts(db: AsyncSession = Depends(get_db)):
    stmt = select(Alert).order_by(Alert.escalated_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()
