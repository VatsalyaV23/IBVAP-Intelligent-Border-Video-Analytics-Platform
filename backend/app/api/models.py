from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.ai_model import AIModelRecord
from app.schemas.common import AIModelResponse

router = APIRouter(prefix="/models", tags=["AI Model Registry"])

@router.get("", response_model=List[AIModelResponse])
async def list_models(db: AsyncSession = Depends(get_db)):
    stmt = select(AIModelRecord)
    res = await db.execute(stmt)
    return res.scalars().all()
