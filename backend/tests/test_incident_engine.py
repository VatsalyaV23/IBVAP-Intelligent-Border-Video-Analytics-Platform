import pytest
from app.services.incident_engine import IncidentEngine
from app.models.event import DetectionEvent

def test_risk_calculation_restricted_zone():
    mock_events = [
        DetectionEvent(id="EVT-1", camera_id="CAM-04", event_type="ZONE_INTRUSION"),
        DetectionEvent(id="EVT-2", camera_id="CAM-04", event_type="PERSISTENT_TRACK")
    ]
    score, priority, explanation = IncidentEngine.calculate_risk_and_priority(
        events=mock_events,
        has_cross_camera_correlation=True,
        is_restricted_zone=True,
        is_night_low_light=False
    )
    assert score >= 75.0
    assert priority == "CRITICAL"
    assert "Restricted buffer zone breached" in explanation
    assert "Multi-sensor cross-camera correlation" in explanation

def test_risk_calculation_low_priority():
    score, priority, explanation = IncidentEngine.calculate_risk_and_priority(
        events=[],
        has_cross_camera_correlation=False,
        is_restricted_zone=False,
        is_night_low_light=False
    )
    assert score == 20.0
    assert priority == "LOW"

@pytest.mark.asyncio
async def test_create_live_incident_from_detection():
    from app.core.database import engine, Base
    from main import _auto_migrate_schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_auto_migrate_schema)

    dummy_frame = b"\xff\xd8\xff\xe0" + b"\x00" * 50  # minimal JPEG header
    detections = [{"class": "person", "confidence": 0.94, "bbox": [10, 20, 100, 200]}]
    res = await IncidentEngine.create_live_incident_from_detection(
        camera_id="CAM-TEST-01",
        camera_name="Test Web Sensor",
        frame_bytes=dummy_frame,
        detections=detections,
        movement_level=45.0
    )
    assert "incident_id" in res
    assert "alert_id" in res
    assert "evidence_id" in res
    assert res["incident_id"].startswith("INC-")
    assert res["alert_id"].startswith("ALT-")

