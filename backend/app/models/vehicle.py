from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.core.database import Base

class DetectedVehicle(Base):
    __tablename__ = "detected_vehicles"

    id = Column(String(50), primary_key=True, index=True)
    camera_id = Column(String(50), nullable=False, index=True)
    license_plate_number = Column(String(50), nullable=False, index=True)
    confidence = Column(Float, default=0.0)
    vehicle_type = Column(String(50), default="CAR")  # CAR, TRUCK, BUS, MOTORCYCLE, SUV
    is_known = Column(Boolean, default=False, index=True)
    owner_or_unit = Column(String(100), default="Unregistered Civilian")
    registration_status = Column(String(50), default="UNKNOWN_UNREGISTERED", index=True)  # KNOWN_AUTHORIZED, UNKNOWN_UNREGISTERED, WATCHLIST, SUSPICIOUS
    plate_bbox = Column(String(200), nullable=True)
    vehicle_bbox = Column(String(200), nullable=True)
    snapshot_path = Column(String(255), nullable=True)
    sha256_hash = Column(String(64), nullable=True)
    blockchain_block = Column(Integer, nullable=True)
    ocr_engine = Column(String(50), default="PaddleOCR")
    flagged_status = Column(String(50), default="CLEAR")
    incident_id = Column(String(50), nullable=True)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class KnownAuthorizedVehicle(Base):
    __tablename__ = "known_authorized_vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plate_number = Column(String(50), unique=True, nullable=False, index=True)
    owner_or_unit = Column(String(100), nullable=False)  # e.g. "BSF Patrol QRT Delta"
    vehicle_type = Column(String(50), default="CAR")
    authorized_zone = Column(String(100), default="SECTOR-4-ALL")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
