from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, oauth2_scheme, decode_access_token
from app.models.user import User
from app.schemas.common import LoginRequest, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.username == req.username)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid security credentials"
        )

    token = create_access_token(data={"sub": user.username, "role": user.role, "clearance": user.clearance_level})
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        full_name=user.full_name,
        clearance_level=user.clearance_level,
        def_id=user.def_id
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid session token")
    username = payload.get("sub")
    stmt = select(User).where(User.username == username)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return UserResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        clearance_level=user.clearance_level,
        def_id=user.def_id,
        organization=user.organization,
        is_active=user.is_active
    )
