import time
import numpy as np
from typing import List, Dict, Any, Optional
from ai_engine.detection.yolo_adapter import YOLOAdapter
from ai_engine.tracking.bytetrack_adapter import TrajectoryTracker
from ai_engine.behavior.intrusion import ZoneAnalytics
from ai_engine.behavior.low_light import LowLightDetector

class SurveillancePipeline:
    def __init__(self):
        self.detector = YOLOAdapter()
        self.tracker = TrajectoryTracker()

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        zones: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Low light check
        is_low_light, brightness = LowLightDetector.analyze_illumination(frame)

        # 2. Object Detection
        detections = self.detector.detect(frame)

        # 3. Object Tracking
        tracks = self.tracker.update(detections, frame)

        # 4. Zone & Virtual Fence Analysis
        events = []
        if zones:
            for zone in zones:
                poly = zone.get("coordinates", [])
                zone_id = zone.get("id", "ZONE-GENERIC")
                if len(poly) >= 3:
                    for t in tracks:
                        if ZoneAnalytics.check_zone_intrusion(t, poly):
                            events.append({
                                "event_type": "ZONE_INTRUSION",
                                "camera_id": camera_id,
                                "track_id": t.track_id,
                                "class_name": t.class_name,
                                "zone_id": zone_id,
                                "confidence": 0.95
                            })

        infer_ms = (time.time() - start_time) * 1000.0

        return {
            "camera_id": camera_id,
            "latency_ms": round(infer_ms, 2),
            "is_low_light": is_low_light,
            "brightness": round(brightness, 1),
            "detections": [
                {
                    "class": d.class_name,
                    "confidence": round(d.confidence, 3),
                    "bbox": [d.bbox.x1, d.bbox.y1, d.bbox.x2, d.bbox.y2],
                    "track_id": d.track_id
                } for d in detections
            ],
            "tracks": [
                {
                    "track_id": t.track_id,
                    "class": t.class_name,
                    "velocity_ms": t.velocity,
                    "direction": t.direction_label,
                    "dwell_time": t.dwell_time_seconds,
                    "bbox": [t.bbox.x1, t.bbox.y1, t.bbox.x2, t.bbox.y2]
                } for t in tracks
            ],
            "events": events
        }

surveillance_pipeline = SurveillancePipeline()
