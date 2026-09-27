import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLogEntry

class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        user_id: str = "OFFICER-BSF-04",
        username: str = "Camp Control Officer",
        details: Optional[Dict[str, Any]] = None,
        ip_address: str = "127.0.0.1"
    ) -> AuditLogEntry:
        """Persists an immutable audit log entry into the system audit trail."""
        entry = AuditLogEntry(
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            username=username,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=json.dumps(details or {}),
            ip_address=ip_address
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry
