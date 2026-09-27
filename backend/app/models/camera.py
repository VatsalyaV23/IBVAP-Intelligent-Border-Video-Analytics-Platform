from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(50), primary_key=True, index=True)  # e.g. CAM-01, CAM-02, WT-04
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)  # e.g. "North Gate - Alpha", "Zone B Breach Point"
    sector = Column(String(50), default="IND-PAK-SECTOR-4")
    stream_type = Column(String(50), default="DEMO_STREAM")  # RTSP, WEBCAM, VIDEO_FILE, DEMO_STREAM, ONVIF
    stream_url = Column(String(255), nullable=True)
    resolution = Column(String(20), default="1080p")
    fps = Column(Integer, default=25)
    is_active = Column(Boolean, default=True)
    is_thermal = Column(Boolean, default=False)
    latitude = Column(Float, default=32.7266)
    longitude = Column(Float, default=74.8570)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    health = relationship("CameraHealth", back_populates="camera", uselist=False, cascade="all, delete-orphan")

class CameraHealth(Base):
    __tablename__ = "camera_health"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(50), ForeignKey("cameras.id"), unique=True, nullable=False)
    status = Column(String(20), default="ONLINE")  # ONLINE, OFFLINE, DEGRADED, TAMPERED
    current_fps = Column(Float, default=25.0)
    latency_ms = Column(Float, default=18.0)
    brightness_level = Column(Float, default=78.0)
    error_count = Column(Integer, default=0)
    last_heartbeat = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    camera = relationship("Camera", back_populates="health")
