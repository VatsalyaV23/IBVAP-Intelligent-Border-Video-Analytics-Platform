from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str
    clearance_level: str
    def_id: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    clearance_level: str
    def_id: str
    organization: str
    is_active: bool

# Camera Schemas
class CameraHealthSchema(BaseModel):
    status: str
    current_fps: float
    latency_ms: float
    brightness_level: float
    error_count: int
    last_heartbeat: datetime

class CameraResponse(BaseModel):
    id: str
    name: str
    location: str
    sector: str
    stream_type: str
    stream_url: Optional[str]
    resolution: str
    fps: int
    is_active: bool
    is_thermal: bool
    latitude: float
    longitude: float
    health: Optional[CameraHealthSchema] = None

class CameraCreate(BaseModel):
    id: str
    name: str
    location: str
    sector: str = "IND-PAK-SECTOR-4"
    stream_type: str = "DEMO_STREAM"
    stream_url: Optional[str] = None
    resolution: str = "1080p"
    fps: int = 25
    is_thermal: bool = False
    latitude: float = 32.7266
    longitude: float = 74.8570

# Incident Schemas
class IncidentTimelineSchema(BaseModel):
    id: int
    incident_id: str
    timestamp: datetime
    source: str
    action: str
    details: Optional[str] = None

class IncidentResponse(BaseModel):
    id: str
    title: str
    incident_type: str
    priority: str
    status: str
    risk_score: float
    explanation: Optional[str] = None
    sector: str
    zone_ids: List[str] = []
    camera_ids: List[str] = []
    object_ids: List[str] = []
    blockchain_status: str
    assigned_to: Optional[str] = None
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    first_seen: datetime
    last_seen: datetime
    timeline: List[IncidentTimelineSchema] = []

class IncidentAcknowledgeRequest(BaseModel):
    officer_name: str = "Duty Officer (BSF Sec-IV)"
    notes: Optional[str] = None

class IncidentResolveRequest(BaseModel):
    resolution_notes: str
    resolved_by: str = "Camp Control Officer"

# Evidence Schemas
class EvidenceResponse(BaseModel):
    id: str
    incident_id: str
    camera_id: str
    evidence_type: str
    file_path: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    status: str
    owner_username: Optional[str] = "operator"
    is_deleted_by_user: Optional[bool] = False
    deleted_by_username: Optional[str] = None
    deleted_at: Optional[datetime] = None
    model_version: str
    captured_at: datetime

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class EvidenceVerifyResponse(BaseModel):
    evidence_id: str
    current_hash: str
    stored_hash: str
    blockchain_hash: Optional[str] = None
    match: bool
    status: str  # MATCH or MISMATCH
    verified_at: datetime
    details: str

# Blockchain Schemas
class BlockchainRecordResponse(BaseModel):
    id: int
    transaction_id: str
    block_number: int
    block_hash: str
    previous_hash: str
    incident_id: str
    evidence_id: str
    evidence_hash: str
    merkle_root: str
    model_version: str
    model_hash: str
    provider: str
    status: str
    timestamp: datetime

class BlockchainStatusResponse(BaseModel):
    network_status: str
    provider: str
    current_block: int
    total_transactions: int
    latest_block_hash: str
    peer_consensus: str

# Model Registry Schemas
class AIModelResponse(BaseModel):
    id: str
    name: str
    version: str
    task_type: str
    framework: str
    device: str
    status: str
    confidence_threshold: float
    model_hash: str
    classes_supported: str
    latency_ms: float

# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    incident_id: str
    priority: str
    current_tier: int
    recipient_role: str
    status: str
    timeout_seconds: int
    escalated_at: datetime

# Audit Schemas
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    user_id: str
    username: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: str
    ip_address: str

# Vehicle & ANPR Schemas
class DetectedVehicleResponse(BaseModel):
    id: str
    camera_id: str
    license_plate_number: str
    confidence: float
    vehicle_type: str
    is_known: bool = False
    owner_or_unit: str = "Unregistered Civilian"
    registration_status: str = "UNKNOWN_UNREGISTERED"
    plate_bbox: Optional[str] = None
    vehicle_bbox: Optional[str] = None
    snapshot_path: Optional[str] = None
    sha256_hash: Optional[str] = None
    blockchain_block: Optional[int] = None
    ocr_engine: str = "PaddleOCR"
    flagged_status: str = "CLEAR"
    incident_id: Optional[str] = None
    detected_at: datetime

    class Config:
        from_attributes = True

class VehicleFlagUpdate(BaseModel):
    flagged_status: str  # CLEAR, WATCHLIST, SUSPICIOUS, STOLEN, ALERT
    is_known: Optional[bool] = None
    owner_or_unit: Optional[str] = None
    registration_status: Optional[str] = None
    notes: Optional[str] = None

class KnownVehicleCreate(BaseModel):
    plate_number: str
    owner_or_unit: str
    vehicle_type: str = "CAR"
    authorized_zone: str = "SECTOR-4-ALL"

class KnownVehicleResponse(BaseModel):
    id: int
    plate_number: str
    owner_or_unit: str
    vehicle_type: str
    authorized_zone: str
    created_at: datetime

    class Config:
        from_attributes = True
