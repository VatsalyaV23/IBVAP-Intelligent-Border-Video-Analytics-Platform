import pytest
from app.services.camera_diagnostics import (
    CameraDiagnosticEngine,
    CameraDiagnosticCodes,
    sanitize_stream_url
)

def test_sanitize_stream_url():
    raw_rtsp = "rtsp://admin:superSecret99@192.168.1.100:554/h264"
    sanitized = sanitize_stream_url(raw_rtsp)
    assert "superSecret99" not in sanitized
    assert sanitized == "rtsp://admin:*****@192.168.1.100:554/h264"

    raw_http = "http://operator:P@ssw0rd!@10.0.0.5:8080/mjpeg"
    assert sanitize_stream_url(raw_http) == "http://operator:*****@10.0.0.5:8080/mjpeg"

    # URL without credentials unchanged
    public_url = "rtsp://192.168.1.100:554/live"
    assert sanitize_stream_url(public_url) == public_url

def test_diagnostic_invalid_protocol():
    res = CameraDiagnosticEngine.test_camera_source("ftp://192.168.1.50/stream")
    assert res["success"] is False
    assert res["code"] == CameraDiagnosticCodes.INVALID_RTSP_URL
    assert "rtsp://" in res["message"] or "Invalid" in res["message"]

def test_diagnostic_unreachable_network_ip():
    # 192.0.2.0/24 is reserved for documentation (RFC 5737) and is unreachable
    res = CameraDiagnosticEngine.test_camera_source("rtsp://admin:pass@192.0.2.1:554/live")
    assert res["success"] is False
    assert res["code"] == CameraDiagnosticCodes.CAMERA_UNREACHABLE
    assert "unreachable" in res["message"].lower()

def test_diagnostic_missing_file_source():
    res = CameraDiagnosticEngine.test_camera_source("non_existent_border_clip.mp4")
    assert res["success"] is False
    assert res["code"] == CameraDiagnosticCodes.RTSP_STREAM_NOT_FOUND
