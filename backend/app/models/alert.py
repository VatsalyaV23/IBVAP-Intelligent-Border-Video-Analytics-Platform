from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True, index=True)  # ALT-2026-XXXX
    incident_id = Column(String(50), ForeignKey("incidents.id"), index=True, nullable=False)
    priority = Column(String(20), default="CRITICAL")
    current_tier = Column(Integer, default=2)  # 1=AI Detect, 2=Incident, 3=Duty Officer, 4=Sector, 5=HQ
    recipient_role = Column(String(50), default="CAMP_OPERATOR")
    status = Column(String(20), default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, TIMEOUT, RESOLVED
    timeout_seconds = Column(Integer, default=85)
    escalated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
