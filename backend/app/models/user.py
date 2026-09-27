from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="CAMP_OPERATOR", nullable=False)  # SUPER_ADMIN, SYSTEM_ADMIN, COMMAND_OFFICER, CAMP_OPERATOR, INVESTIGATOR, AUDITOR, VIEWER
    clearance_level = Column(String(20), default="L2", nullable=False)  # L1, L2, L3, L4
    def_id = Column(String(50), default="DEF-9812-IN")
    organization = Column(String(100), default="Border Security Force (BSF)")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
