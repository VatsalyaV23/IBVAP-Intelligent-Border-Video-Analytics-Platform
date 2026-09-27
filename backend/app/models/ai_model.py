from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.core.database import Base

class AIModelRecord(Base):
    __tablename__ = "ai_models"

    id = Column(String(50), primary_key=True, index=True)  # e.g. IBVAP-PERSON-v1, BYTE-TRACK-v1
    name = Column(String(100), nullable=False)
    version = Column(String(20), nullable=False)
    task_type = Column(String(50), nullable=False)  # Object Detection, Tracking, Face Detection, ANPR/OCR, Vehicle Classification
    framework = Column(String(50), nullable=False)  # Ultralytics YOLO, OpenCV, PaddleOCR, ByteTrack
    device = Column(String(20), default="CPU")  # CPU, CUDA, AUTO
    status = Column(String(20), default="ACTIVE")  # ACTIVE, FALLBACK, NOT_INSTALLED, EXPERIMENTAL
    confidence_threshold = Column(Float, default=0.5)
    model_hash = Column(String(64), nullable=False)  # SHA-256
    weights_path = Column(String(255), nullable=True)
    classes_supported = Column(String(255), default="person,car,truck,bus,motorcycle")
    latency_ms = Column(Float, default=16.0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
