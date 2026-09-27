import json
import hashlib
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.security import get_password_hash
from app.models.user import User
from app.models.camera import Camera, CameraHealth
from app.models.zone import Zone
from app.models.ai_model import AIModelRecord
from app.models.incident import Incident, IncidentTimeline
from app.models.evidence import EvidenceItem
from app.models.alert import Alert
from app.models.blockchain import BlockchainRecord, LocalLedgerBlock
from app.models.audit import AuditLogEntry
from app.models.vehicle import KnownAuthorizedVehicle
from app.services.camera_stream_manager import StreamManager

async def seed_demo_database(db: AsyncSession):
    """Initializes the baseline state: Users, AI Models, and Auto-detected Hardware Cameras."""
    
    # 1. Users
    existing_user = await db.execute(select(User).where(User.username == "operator"))
    if not existing_user.scalar_one_or_none():
        users = [
            User(
                username="operator",
                password_hash=get_password_hash("Operator@123"),
                full_name="Camp Control Officer",
                role="CAMP_OPERATOR",
                clearance_level="L4",
                def_id="DEF-9812-IN",
                organization="Border Security Force (BSF Sec-IV)"
            ),
            User(
                username="commander",
                password_hash=get_password_hash("Commander@123"),
                full_name="Col. R. K. Sharma",
                role="COMMAND_OFFICER",
                clearance_level="L4",
                def_id="DEF-1001-HQ",
                organization="BSF Frontier HQ Jammu"
            ),
            User(
                username="DonCasino",
                password_hash=get_password_hash("Don12345@6789"),
                full_name="Chief Administrator Don Casino",
                role="ADMIN",
                clearance_level="L4",
                def_id="DEF-0001-ADMIN",
                organization="Border Intelligence & Command Admin"
            ),
            User(
                username="auditor",
                password_hash=get_password_hash("Auditor@123"),
                full_name="Inspector S. Varma",
                role="AUDITOR",
                clearance_level="L3",
                def_id="DEF-5521-AUD",
                organization="Ministry of Home Affairs (MHA Audit)"
            )
        ]
        db.add_all(users)

    # 2. No default cameras - starts clean with 0 cameras until user connects
    # (Users connect via "Use Laptop Camera" or "Connect Camera Sensor" modal)


    # 3. AI Models Registry
    model_records = [
        ("IBVAP-PERSON-v1", "IBVAP Human & Vehicle Detector", "v3.2", "Object Detection", "Ultralytics YOLOv8", "ACTIVE", 0.50, "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0", 14.0),
        ("BYTE-TRACK-v1", "Centroid Trajectory Tracker", "v1.2", "Tracking", "ByteTrack / Kalman", "ACTIVE", 0.60, "b2c3d4e5f6a10718293a4b5c6d7e8f90123456789abcdef0123456789abcdef1", 4.0),
        ("IBVAP-MOTION-v1", "MOG2 Motion Subtraction Analyzer", "v2.0", "Motion Detection", "OpenCV MOG2", "ACTIVE", 0.70, "c3d4e5f6a1b20718293a4b5c6d7e8f90123456789abcdef0123456789abcdef2", 3.0),
    ]
    for mid, name, ver, task, fw, stat, thresh, hsh, lat in model_records:
        ex = await db.execute(select(AIModelRecord).where(AIModelRecord.id == mid))
        if not ex.scalar_one_or_none():
            m = AIModelRecord(
                id=mid,
                name=name,
                version=ver,
                task_type=task,
                framework=fw,
                device="CPU",
                status=stat,
                confidence_threshold=thresh,
                model_hash=hsh,
                latency_ms=lat
            )
            db.add(m)

    # 5. Baseline Known Authorized Vehicles
    ex_known = await db.execute(select(KnownAuthorizedVehicle).limit(1))
    if not ex_known.scalar_one_or_none():
        known_fleet = [
            KnownAuthorizedVehicle(
                plate_number="DL01AB1234",
                owner_or_unit="BSF Sector-IV QRT Patrol Charlie",
                vehicle_type="TRUCK",
                authorized_zone="SECTOR-4-PERIMETER"
            ),
            KnownAuthorizedVehicle(
                plate_number="JK02AZ7712",
                owner_or_unit="Border Security Escort Vehicle #2",
                vehicle_type="CAR",
                authorized_zone="SECTOR-4-ALL"
            ),
            KnownAuthorizedVehicle(
                plate_number="PB02CC9999",
                owner_or_unit="Border Area Supply & Logistics",
                vehicle_type="TRUCK",
                authorized_zone="BUFFER-ZONE-ROAD"
            )
        ]
        db.add_all(known_fleet)

    await db.commit()
