import math
import numpy as np
from typing import List, Dict, Tuple
from ai_engine.core.base_adapters import BaseTrackingModel, DetectionResult, TrackResult, BoundingBox

class TrajectoryTracker(BaseTrackingModel):
    def __init__(self, max_distance: float = 60.0, max_disappeared: int = 30):
        self.max_distance = max_distance
        self.max_disappeared = max_disappeared
        self.next_track_id = 1
        self.tracks: Dict[str, Dict] = {}

    def _get_centroid(self, bbox: BoundingBox) -> Tuple[float, float]:
        return ((bbox.x1 + bbox.x2) / 2.0, (bbox.y1 + bbox.y2) / 2.0)

    def _get_direction(self, trajectory: List[Tuple[float, float]]) -> Tuple[float, str]:
        if len(trajectory) < 2:
            return 0.0, "STATIONARY"
        p1 = trajectory[-2]
        p2 = trajectory[-1]
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        angle = math.degrees(math.atan2(dy, dx))
        
        # 8-cardinal direction
        if -22.5 <= angle < 22.5:
            label = "E"
        elif 22.5 <= angle < 67.5:
            label = "SE"
        elif 67.5 <= angle < 112.5:
            label = "S"
        elif 112.5 <= angle < 157.5:
            label = "SW"
        elif angle >= 157.5 or angle < -157.5:
            label = "W"
        elif -157.5 <= angle < -112.5:
            label = "NW"
        elif -112.5 <= angle < -67.5:
            label = "N"
        else:
            label = "NE"
        return angle, label

    def update(self, detections: List[DetectionResult], frame: np.ndarray) -> List[TrackResult]:
        active_results: List[TrackResult] = []

        for det in detections:
            centroid = self._get_centroid(det.bbox)
            best_id = None
            min_dist = float('inf')

            for tid, tdata in self.tracks.items():
                last_pos = tdata["trajectory"][-1]
                dist = math.hypot(centroid[0] - last_pos[0], centroid[1] - last_pos[1])
                if dist < self.max_distance and dist < min_dist:
                    min_dist = dist
                    best_id = tid

            if best_id is not None:
                t = self.tracks[best_id]
                t["trajectory"].append(centroid)
                t["bbox"] = det.bbox
                t["disappeared"] = 0
                t["dwell_frames"] += 1
                assigned_id = best_id
            else:
                prefix = "V" if "vehicle" in det.class_name.lower() or det.class_name in ["car", "truck", "bus"] else "P"
                assigned_id = f"{prefix}-{self.next_track_id:03d}"
                self.next_track_id += 1
                self.tracks[assigned_id] = {
                    "class_name": det.class_name,
                    "bbox": det.bbox,
                    "trajectory": [centroid],
                    "disappeared": 0,
                    "dwell_frames": 1
                }

            det.track_id = assigned_id
            tdata = self.tracks[assigned_id]
            angle, dir_label = self._get_direction(tdata["trajectory"])
            velocity = min(12.0, len(tdata["trajectory"]) * 0.4)

            active_results.append(TrackResult(
                track_id=assigned_id,
                class_name=det.class_name,
                bbox=det.bbox,
                velocity=velocity,
                direction_angle=angle,
                direction_label=dir_label,
                dwell_time_seconds=round(tdata["dwell_frames"] / 25.0, 1),
                trajectory=tdata["trajectory"]
            ))

        return active_results
