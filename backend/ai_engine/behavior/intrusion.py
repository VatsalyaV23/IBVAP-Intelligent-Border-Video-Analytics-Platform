from typing import List, Tuple
from ai_engine.core.base_adapters import BoundingBox, TrackResult

class ZoneAnalytics:
    @staticmethod
    def point_in_polygon(point: Tuple[float, float], polygon: List[List[float]]) -> bool:
        """Ray-casting algorithm to determine if a 2D point is inside a polygon."""
        x, y = point
        n = len(polygon)
        inside = False
        p1x, p1y = polygon[0]
        for i in range(n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    @staticmethod
    def check_zone_intrusion(track: TrackResult, polygon: List[List[float]]) -> bool:
        """Tests whether the track's bottom center (feet/ground contact point) is inside the zone."""
        feet_x = (track.bbox.x1 + track.bbox.x2) / 2.0
        feet_y = track.bbox.y2
        return ZoneAnalytics.point_in_polygon((feet_x, feet_y), polygon)
