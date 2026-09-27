import os
import io
import cv2
import json
import hashlib
import numpy as np
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Body
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.vehicle import DetectedVehicle, KnownAuthorizedVehicle
from app.models.evidence import EvidenceItem
from app.models.blockchain import LocalLedgerBlock, BlockchainRecord
from app.models.incident import Incident, IncidentTimeline
from app.schemas.common import (
    DetectedVehicleResponse,
    VehicleFlagUpdate,
    KnownVehicleCreate,
    KnownVehicleResponse,
)
from app.core.websockets import ws_manager
from ai_engine.ocr.paddle_ocr_engine import paddle_ocr_engine

router = APIRouter(prefix="/vehicles", tags=["Vehicles & ANPR"])

@router.get("", response_model=List[DetectedVehicleResponse])
async def list_detected_vehicles(
    camera_id: Optional[str] = None,
    flagged_status: Optional[str] = None,
    registration_status: Optional[str] = None,
    is_known: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DetectedVehicle).order_by(desc(DetectedVehicle.detected_at))
    if camera_id:
        stmt = stmt.where(DetectedVehicle.camera_id == camera_id)
    if flagged_status and flagged_status != "ALL":
        stmt = stmt.where(DetectedVehicle.flagged_status == flagged_status)
    if registration_status and registration_status != "ALL":
        stmt = stmt.where(DetectedVehicle.registration_status == registration_status)
    if is_known is not None:
        stmt = stmt.where(DetectedVehicle.is_known == is_known)
    if search:
        clean_search = search.strip().upper()
        stmt = stmt.where(DetectedVehicle.license_plate_number.like(f"%{clean_search}%"))

    stmt = stmt.limit(limit)
    res = await db.execute(stmt)
    vehicles = res.scalars().all()
    return vehicles

@router.get("/known-registry", response_model=List[KnownVehicleResponse])
async def list_known_authorized_vehicles(db: AsyncSession = Depends(get_db)):
    stmt = select(KnownAuthorizedVehicle).order_by(KnownAuthorizedVehicle.plate_number)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/register-known", response_model=KnownVehicleResponse)
async def register_known_vehicle(
    payload: KnownVehicleCreate,
    db: AsyncSession = Depends(get_db)
):
    clean_plate = paddle_ocr_engine.clean_plate_text(payload.plate_number)
    stmt = select(KnownAuthorizedVehicle).where(KnownAuthorizedVehicle.plate_number == clean_plate)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        existing.owner_or_unit = payload.owner_or_unit
        existing.vehicle_type = payload.vehicle_type.upper()
        existing.authorized_zone = payload.authorized_zone
        await db.commit()
        await db.refresh(existing)
        return existing

    known = KnownAuthorizedVehicle(
        plate_number=clean_plate,
        owner_or_unit=payload.owner_or_unit,
        vehicle_type=payload.vehicle_type.upper(),
        authorized_zone=payload.authorized_zone
    )
    db.add(known)
    await db.commit()
    await db.refresh(known)
    return known

@router.get("/{vehicle_id}", response_model=DetectedVehicleResponse)
async def get_vehicle(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(DetectedVehicle).where(DetectedVehicle.id == vehicle_id)
    res = await db.execute(stmt)
    vehicle = res.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle record not found")
    return vehicle

@router.post("/{vehicle_id}/authorize", response_model=DetectedVehicleResponse)
async def authorize_vehicle_as_known(
    vehicle_id: str,
    owner_or_unit: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """Marks an unknown detected vehicle as Known Authorized Fleet."""
    stmt = select(DetectedVehicle).where(DetectedVehicle.id == vehicle_id)
    res = await db.execute(stmt)
    vehicle = res.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle record not found")

    vehicle.is_known = True
    vehicle.registration_status = "KNOWN_AUTHORIZED"
    vehicle.owner_or_unit = owner_or_unit
    vehicle.flagged_status = "CLEAR"

    # Also register plate in KnownAuthorizedVehicle table
    clean_plate = vehicle.license_plate_number
    k_stmt = select(KnownAuthorizedVehicle).where(KnownAuthorizedVehicle.plate_number == clean_plate)
    k_res = await db.execute(k_stmt)
    if not k_res.scalar_one_or_none():
        db.add(KnownAuthorizedVehicle(
            plate_number=clean_plate,
            owner_or_unit=owner_or_unit,
            vehicle_type=vehicle.vehicle_type,
            authorized_zone="SECTOR-4-ALL"
        ))

    await db.commit()
    await db.refresh(vehicle)

    await ws_manager.broadcast({
        "type": "VEHICLE_AUTHORIZED_KNOWN",
        "vehicle_id": vehicle.id,
        "license_plate": vehicle.license_plate_number,
        "owner_or_unit": vehicle.owner_or_unit
    })

    return vehicle

@router.patch("/{vehicle_id}/flag", response_model=DetectedVehicleResponse)
async def update_vehicle_flag(
    vehicle_id: str,
    update: VehicleFlagUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DetectedVehicle).where(DetectedVehicle.id == vehicle_id)
    res = await db.execute(stmt)
    vehicle = res.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle record not found")

    if update.flagged_status:
        vehicle.flagged_status = update.flagged_status
    if update.is_known is not None:
        vehicle.is_known = update.is_known
    if update.owner_or_unit is not None:
        vehicle.owner_or_unit = update.owner_or_unit
    if update.registration_status is not None:
        vehicle.registration_status = update.registration_status

    await db.commit()
    await db.refresh(vehicle)

    await ws_manager.broadcast({
        "type": "VEHICLE_STATUS_UPDATED",
        "vehicle_id": vehicle.id,
        "license_plate": vehicle.license_plate_number,
        "flagged_status": vehicle.flagged_status,
        "registration_status": vehicle.registration_status
    })

    return vehicle

@router.post("/scan-plate", response_model=DetectedVehicleResponse)
async def scan_vehicle_plate(
    file: UploadFile = File(...),
    camera_id: str = Form("ANPR-SCANNER-MANUAL"),
    vehicle_type: str = Form("CAR"),
    db: AsyncSession = Depends(get_db)
):
    """
    On-demand PaddleOCR plate recognition on an uploaded vehicle or license plate image.
    Performs Known vs Unknown identification, cryptographic SHA-256 evidence hashing,
    and blockchain registration.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file format")

    # Run PaddleOCR
    ocr_result = paddle_ocr_engine.read_license_plate(image)
    if not ocr_result:
        frame_plates = paddle_ocr_engine.scan_frame_for_plates(image)
        if frame_plates:
            ocr_result = frame_plates[0]

    if not ocr_result or not ocr_result.get("plate_number"):
        raise HTTPException(
            status_code=422,
            detail="No plate detected — PaddleOCR could not extract a valid license plate from the uploaded image. Please ensure the vehicle license plate is clearly visible."
        )

    plate_number = ocr_result["plate_number"]
    confidence = ocr_result["confidence"]
    plate_bbox = ocr_result.get("plate_bbox", [0, 0, image.shape[1], image.shape[0]])
    engine_used = ocr_result.get("engine", paddle_ocr_engine.engine_name)

    # 1. Known vs Unknown Vehicle Check
    clean_plate = paddle_ocr_engine.clean_plate_text(plate_number)
    k_stmt = select(KnownAuthorizedVehicle).where(KnownAuthorizedVehicle.plate_number == clean_plate)
    k_res = await db.execute(k_stmt)
    known_veh = k_res.scalar_one_or_none()

    if known_veh:
        is_known = True
        owner_or_unit = known_veh.owner_or_unit
        registration_status = "KNOWN_AUTHORIZED"
        flagged = "CLEAR"
    else:
        is_known = False
        owner_or_unit = "Unknown Unregistered Vehicle"
        registration_status = "UNKNOWN_UNREGISTERED"
        flagged = "WATCHLIST"

    # 2. Cryptographic Evidence Hashing (SHA-256)
    sha256_hash = hashlib.sha256(contents).hexdigest()

    storage_dir = "storage/evidence/vehicles"
    os.makedirs(storage_dir, exist_ok=True)
    snapshot_filename = f"plate_{int(datetime.now(timezone.utc).timestamp())}_{clean_plate}.jpg"
    snapshot_path = os.path.join(storage_dir, snapshot_filename)
    cv2.imwrite(snapshot_path, image)

    # 3. Local Blockchain Ledger Block Registration
    b_stmt = select(LocalLedgerBlock).order_by(desc(LocalLedgerBlock.block_number)).limit(1)
    b_res = await db.execute(b_stmt)
    latest_block = b_res.scalar_one_or_none()
    next_block_num = (latest_block.block_number + 1) if latest_block else 12842
    prev_hash = latest_block.block_hash if latest_block else "0x0000"

    block_data_raw = f"{next_block_num}:{prev_hash}:{sha256_hash}:{clean_plate}"
    new_block_hash = f"0x{hashlib.sha256(block_data_raw.encode()).hexdigest()}"

    ledger_block = LocalLedgerBlock(
        block_number=next_block_num,
        block_hash=new_block_hash,
        previous_hash=prev_hash,
        merkle_root=sha256_hash,
        tx_count=1,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(ledger_block)

    # 4. Create Evidence Record
    ev_id = f"EV-ANPR-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:6]}"
    evidence = EvidenceItem(
        id=ev_id,
        incident_id=f"INC-ANPR-{clean_plate}",
        camera_id=camera_id,
        evidence_type="ANPR_VEHICLE_PLATE",
        file_path=snapshot_path,
        file_size_bytes=len(contents),
        mime_type="image/jpeg",
        sha256_hash=sha256_hash,
        status="SEALED_ON_CHAIN",
        model_version=f"PaddleOCR-ANPR-{engine_used}",
        captured_at=datetime.now(timezone.utc)
    )
    db.add(evidence)

    # 5. Create Vehicle Entry
    vehicle_id = f"VEH-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:6]}"
    new_vehicle = DetectedVehicle(
        id=vehicle_id,
        camera_id=camera_id,
        license_plate_number=clean_plate,
        confidence=confidence,
        vehicle_type=vehicle_type.upper(),
        is_known=is_known,
        owner_or_unit=owner_or_unit,
        registration_status=registration_status,
        plate_bbox=str(plate_bbox),
        vehicle_bbox=f"[0, 0, {image.shape[1]}, {image.shape[0]}]",
        snapshot_path=snapshot_path,
        sha256_hash=sha256_hash,
        blockchain_block=next_block_num,
        ocr_engine=engine_used,
        flagged_status=flagged,
        incident_id=evidence.incident_id,
        detected_at=datetime.now(timezone.utc)
    )
    db.add(new_vehicle)

    # 6. If Unknown / Suspicious, raise high-priority Incident
    if not is_known:
        inc = Incident(
            id=f"INC-VEH-{clean_plate}-{int(datetime.now().timestamp())}",
            title=f"Unknown Vehicle Detected: [{clean_plate}] ({camera_id})",
            incident_type="VEHICLE_INTRUSION",
            priority="HIGH",
            status="NEW",
            risk_score=84.0,
            explanation=f"PaddleOCR scanned unregistered license plate {clean_plate}. Not recognized in Authorized Fleet Registry. Cryptographic evidence sealed in block #{next_block_num}.",
            sector="IND-PAK-SECTOR-4",
            zone_ids_json=json.dumps(["BUFFER-ZONE-ROAD"]),
            camera_ids_json=json.dumps([camera_id]),
            object_ids_json=json.dumps([vehicle_type.upper(), clean_plate]),
            blockchain_status="CONFIRMED",
            first_seen=datetime.now(timezone.utc),
            last_seen=datetime.now(timezone.utc)
        )
        db.add(inc)

    await db.commit()
    await db.refresh(new_vehicle)

    await ws_manager.broadcast({
        "type": "LIVE_ANPR_PLATE_SCANNED",
        "vehicle_id": new_vehicle.id,
        "license_plate": new_vehicle.license_plate_number,
        "is_known": new_vehicle.is_known,
        "owner_or_unit": new_vehicle.owner_or_unit,
        "registration_status": new_vehicle.registration_status,
        "confidence": new_vehicle.confidence,
        "sha256_hash": new_vehicle.sha256_hash,
        "blockchain_block": new_vehicle.blockchain_block,
        "camera_id": new_vehicle.camera_id
    })

    return new_vehicle

@router.get("/{vehicle_id}/snapshot")
async def get_vehicle_snapshot(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(DetectedVehicle).where(DetectedVehicle.id == vehicle_id)
    res = await db.execute(stmt)
    vehicle = res.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle record not found")

    if vehicle.snapshot_path and os.path.exists(vehicle.snapshot_path):
        return FileResponse(vehicle.snapshot_path, media_type="image/jpeg")

    # High-contrast tactical plate SVG badge
    plate = vehicle.license_plate_number
    status_color = "#34d399" if vehicle.is_known else "#f43f5e"
    status_text = "KNOWN / AUTHORIZED" if vehicle.is_known else "UNKNOWN / UNREGISTERED"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="380" height="200" viewBox="0 0 380 200">
      <rect width="100%" height="100%" fill="#0b0f19"/>
      <rect x="20" y="20" width="340" height="110" rx="8" fill="#f8fafc" stroke="#334155" stroke-width="4"/>
      <rect x="26" y="26" width="30" height="98" rx="4" fill="#0284c7"/>
      <text x="41" y="80" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="middle">IND</text>
      <circle cx="41" cy="60" r="4.5" fill="#38bdf8"/>
      <text x="195" y="88" fill="#0f172a" font-family="monospace" font-weight="900" font-size="28" letter-spacing="3" text-anchor="middle">{plate}</text>
      <rect x="20" y="140" width="340" height="36" rx="4" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
      <circle cx="36" cy="158" r="5" fill="{status_color}"/>
      <text x="50" y="162" fill="{status_color}" font-family="monospace" font-size="12" font-weight="bold">{status_text}</text>
      <text x="345" y="162" fill="#94a3b8" font-family="monospace" font-size="11" text-anchor="end">{int(vehicle.confidence * 100)}% CONF</text>
    </svg>"""
    return Response(content=svg, media_type="image/svg+xml")
