import pytest
import numpy as np
import cv2
from datetime import datetime, timezone
from ai_engine.ocr.paddle_ocr_engine import paddle_ocr_engine, PaddleOCREngine
from app.models.vehicle import DetectedVehicle

def test_paddle_ocr_initialization():
    assert paddle_ocr_engine is not None
    assert isinstance(paddle_ocr_engine, PaddleOCREngine)
    assert paddle_ocr_engine.engine_name in ["PaddleOCR-Native", "PaddleOCR-Morphology-CV"]

def test_plate_cleaning_and_validation():
    raw_text = " dl - 01 - ab - 1234!! "
    cleaned = PaddleOCREngine.clean_plate_text(raw_text)
    assert cleaned == "DL01AB1234"
    assert PaddleOCREngine.is_valid_plate(cleaned) is True
    assert PaddleOCREngine.is_valid_plate("123") is False
    assert PaddleOCREngine.is_valid_plate("ABCDE") is False

def test_read_license_plate_on_vehicle_crop():
    # Construct synthetic vehicle bumper with license plate
    img = np.zeros((160, 240, 3), dtype=np.uint8)
    cv2.rectangle(img, (20, 20), (220, 140), (60, 60, 60), -1)
    cv2.rectangle(img, (40, 80), (200, 120), (255, 255, 255), -1)
    cv2.putText(img, "HR26DQ5555", (45, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)

    res = paddle_ocr_engine.read_license_plate(img)
    assert res is not None
    assert "plate_number" in res
    assert len(res["plate_number"]) >= 4
    assert res["confidence"] > 0.5
    assert "plate_bbox" in res
    assert res["is_valid_format"] is True

def test_vehicle_database_model():
    now = datetime.now(timezone.utc)
    veh = DetectedVehicle(
        id="VEH-TEST-001",
        camera_id="CAM-01",
        license_plate_number="DL01AB1234",
        confidence=0.94,
        vehicle_type="TRUCK",
        plate_bbox="[40, 80, 200, 120]",
        vehicle_bbox="[20, 20, 220, 140]",
        snapshot_path="storage/evidence/vehicles/test.jpg",
        ocr_engine="PaddleOCR",
        flagged_status="WATCHLIST",
        detected_at=now
    )
    assert veh.id == "VEH-TEST-001"
    assert veh.license_plate_number == "DL01AB1234"
    assert veh.flagged_status == "WATCHLIST"
    assert veh.vehicle_type == "TRUCK"
