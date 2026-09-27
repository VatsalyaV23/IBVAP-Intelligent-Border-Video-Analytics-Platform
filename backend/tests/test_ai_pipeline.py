import pytest
import numpy as np
from ai_engine.behavior.intrusion import ZoneAnalytics
from ai_engine.behavior.low_light import LowLightDetector
from ai_engine.core.base_adapters import BoundingBox, TrackResult

def test_point_in_polygon_inside():
    # Square polygon from (0,0) to (100, 100)
    polygon = [[0, 0], [100, 0], [100, 100], [0, 100]]
    point_inside = (50, 50)
    assert ZoneAnalytics.point_in_polygon(point_inside, polygon) is True

def test_point_in_polygon_outside():
    polygon = [[0, 0], [100, 0], [100, 100], [0, 100]]
    point_outside = (150, 150)
    assert ZoneAnalytics.point_in_polygon(point_outside, polygon) is False

def test_zone_intrusion_check():
    polygon = [[0, 0], [100, 0], [100, 100], [0, 100]]
    track_inside = TrackResult(
        track_id="P-001",
        class_name="person",
        bbox=BoundingBox(x1=40, y1=20, x2=60, y2=80)
    )
    assert ZoneAnalytics.check_zone_intrusion(track_inside, polygon) is True

def test_low_light_detection():
    # Dark black frame
    black_frame = np.zeros((100, 100, 3), dtype=np.uint8)
    is_low, brightness = LowLightDetector.analyze_illumination(black_frame)
    assert is_low is True
    assert brightness == 0.0

    # Bright white frame
    white_frame = np.full((100, 100, 3), 255, dtype=np.uint8)
    is_low_bright, brightness_white = LowLightDetector.analyze_illumination(white_frame)
    assert is_low_bright is False
    assert brightness_white == 255.0
