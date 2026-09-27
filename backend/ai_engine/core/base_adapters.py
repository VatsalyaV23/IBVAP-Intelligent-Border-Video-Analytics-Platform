from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import numpy as np

@dataclass
class BoundingBox:
    x1: float
    y1: float
    x2: float
    y2: float

@dataclass
class ModelProvenance:
    model_name: str
    model_version: str
    model_hash: str
    framework: str
    device: str

@dataclass
class DetectionResult:
    class_name: str
    confidence: float
    bbox: BoundingBox
    track_id: Optional[str] = None
    provenance: Optional[ModelProvenance] = None

@dataclass
class TrackResult:
    track_id: str
    class_name: str
    bbox: BoundingBox
    velocity: float = 0.0  # m/s
    direction_angle: float = 0.0  # degrees
    direction_label: str = "SE"  # N, S, E, W, SE, NW etc.
    dwell_time_seconds: float = 0.0
    trajectory: List[Tuple[float, float]] = field(default_factory=list)

@dataclass
class FaceResult:
    bbox: BoundingBox
    confidence: float
    quality_score: float
    blur_score: float  # Laplacian variance
    embedding: Optional[List[float]] = None
    candidate_identity: Optional[str] = "UNKNOWN"

@dataclass
class OCRResult:
    text: str
    confidence: float
    bbox: BoundingBox
    consensus_score: float = 1.0

@dataclass
class VehicleProfile:
    track_id: str
    vehicle_type: str  # car, truck, bus, motorcycle, patrol_vehicle, UNKNOWN_VEHICLE
    color: str
    speed_estimate_kmh: float
    plate_candidate: Optional[str] = None
    confidence: float = 0.0

class BaseDetectionModel(ABC):
    @abstractmethod
    def detect(self, image: np.ndarray) -> List[DetectionResult]:
        pass

    @abstractmethod
    def get_provenance(self) -> ModelProvenance:
        pass

class BaseTrackingModel(ABC):
    @abstractmethod
    def update(self, detections: List[DetectionResult], frame: np.ndarray) -> List[TrackResult]:
        pass

class BaseFaceModel(ABC):
    @abstractmethod
    def analyze(self, image: np.ndarray) -> List[FaceResult]:
        pass

class BaseOCRModel(ABC):
    @abstractmethod
    def read_plate(self, plate_crop: np.ndarray) -> Optional[OCRResult]:
        pass

class BaseVehicleModel(ABC):
    @abstractmethod
    def classify(self, vehicle_crop: np.ndarray) -> VehicleProfile:
        pass
