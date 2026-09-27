import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.incident import Incident, IncidentTimeline
from app.schemas.common import IncidentResponse, IncidentAcknowledgeRequest, IncidentResolveRequest
from app.services.audit_service import AuditService
from app.services.incident_engine import IncidentEngine
from app.core.websockets import ws_manager

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
async def list_incidents(db: AsyncSession = Depends(get_db)):
    stmt = select(Incident).order_by(Incident.created_at.desc())
    res = await db.execute(stmt)
    incidents = res.scalars().all()

    out = []
    for inc in incidents:
        t_stmt = select(IncidentTimeline).where(IncidentTimeline.incident_id == inc.id).order_by(IncidentTimeline.timestamp.asc())
        t_res = await db.execute(t_stmt)
        timeline = t_res.scalars().all()

        out.append(IncidentResponse(
            id=inc.id,
            title=inc.title,
            incident_type=inc.incident_type,
            priority=inc.priority,
            status=inc.status,
            risk_score=inc.risk_score,
            explanation=inc.explanation,
            sector=inc.sector,
            zone_ids=json.loads(inc.zone_ids_json or "[]"),
            camera_ids=json.loads(inc.camera_ids_json or "[]"),
            object_ids=json.loads(inc.object_ids_json or "[]"),
            blockchain_status=inc.blockchain_status,
            assigned_to=inc.assigned_to,
            acknowledged_by=inc.acknowledged_by,
            acknowledged_at=inc.acknowledged_at,
            resolved_by=inc.resolved_by,
            resolved_at=inc.resolved_at,
            first_seen=inc.first_seen,
            last_seen=inc.last_seen,
            timeline=[
                {
                    "id": t.id,
                    "incident_id": t.incident_id,
                    "timestamp": t.timestamp,
                    "source": t.source,
                    "action": t.action,
                    "details": t.details
                } for t in timeline
            ]
        ))
    return out

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Incident).where(Incident.id == incident_id)
    res = await db.execute(stmt)
    inc = res.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    t_stmt = select(IncidentTimeline).where(IncidentTimeline.incident_id == inc.id).order_by(IncidentTimeline.timestamp.asc())
    t_res = await db.execute(t_stmt)
    timeline = t_res.scalars().all()

    return IncidentResponse(
        id=inc.id,
        title=inc.title,
        incident_type=inc.incident_type,
        priority=inc.priority,
        status=inc.status,
        risk_score=inc.risk_score,
        explanation=inc.explanation,
        sector=inc.sector,
        zone_ids=json.loads(inc.zone_ids_json or "[]"),
        camera_ids=json.loads(inc.camera_ids_json or "[]"),
        object_ids=json.loads(inc.object_ids_json or "[]"),
        blockchain_status=inc.blockchain_status,
        assigned_to=inc.assigned_to,
        acknowledged_by=inc.acknowledged_by,
        acknowledged_at=inc.acknowledged_at,
        resolved_by=inc.resolved_by,
        resolved_at=inc.resolved_at,
        first_seen=inc.first_seen,
        last_seen=inc.last_seen,
        timeline=[
            {
                "id": t.id,
                "incident_id": t.incident_id,
                "timestamp": t.timestamp,
                "source": t.source,
                "action": t.action,
                "details": t.details
            } for t in timeline
        ]
    )

@router.post("/{incident_id}/acknowledge")
async def acknowledge_incident(incident_id: str, req: IncidentAcknowledgeRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Incident).where(Incident.id == incident_id)
    res = await db.execute(stmt)
    inc = res.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = "ACKNOWLEDGED"
    inc.acknowledged_by = req.officer_name
    inc.acknowledged_at = datetime.now(timezone.utc)

    # Add timeline event
    await IncidentEngine.add_timeline_event(
        db, incident_id, "OFFICER", f"Acknowledged by {req.officer_name}"
    )

    # Audit log
    await AuditService.log_action(
        db,
        action="INCIDENT_ACKNOWLEDGED",
        resource_type="incident",
        resource_id=incident_id,
        details={"officer": req.officer_name, "notes": req.notes}
    )

    await db.commit()

    # Broadcast via WebSocket
    await ws_manager.broadcast({
        "type": "INCIDENT_ACKNOWLEDGED",
        "incident_id": incident_id,
        "officer": req.officer_name
    })

    return {"status": "SUCCESS", "message": f"Incident {incident_id} acknowledged by {req.officer_name}"}

@router.post("/{incident_id}/dispatch-qrt")
async def dispatch_qrt(incident_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Incident).where(Incident.id == incident_id)
    res = await db.execute(stmt)
    inc = res.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = "ESCALATED"
    inc.assigned_to = "Quick Reaction Team Delta (QRT)"

    await IncidentEngine.add_timeline_event(
        db, incident_id, "QRT DISPATCH", "Quick Reaction Team Delta deployed to Sector B Grid 73-08"
    )

    await AuditService.log_action(
        db,
        action="QRT_DISPATCHED",
        resource_type="incident",
        resource_id=incident_id,
        details={"team": "QRT Delta", "grid": "73-08"}
    )

    await db.commit()

    await ws_manager.broadcast({
        "type": "QRT_DISPATCHED",
        "incident_id": incident_id,
        "team": "QRT Delta"
    })

    return {"status": "SUCCESS", "message": "Quick Reaction Team dispatched successfully"}
