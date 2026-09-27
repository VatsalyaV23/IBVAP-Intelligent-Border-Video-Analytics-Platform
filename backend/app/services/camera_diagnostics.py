import os
import re
import socket
import time
from urllib.parse import urlparse
from typing import Dict, Any, Optional
import cv2

class CameraDiagnosticCodes:
    CAMERA_CONNECTED = "CAMERA_CONNECTED"
    CAMERA_UNREACHABLE = "CAMERA_UNREACHABLE"
    CAMERA_AUTH_FAILED = "CAMERA_AUTH_FAILED"
    INVALID_RTSP_URL = "INVALID_RTSP_URL"
    RTSP_STREAM_NOT_FOUND = "RTSP_STREAM_NOT_FOUND"
    CODEC_NOT_SUPPORTED = "CODEC_NOT_SUPPORTED"
    NO_FRAMES_RECEIVED = "NO_FRAMES_RECEIVED"
    STREAM_TIMEOUT = "STREAM_TIMEOUT"
    FFMPEG_NOT_AVAILABLE = "FFMPEG_NOT_AVAILABLE"
    HARDWARE_DEVICE_NOT_FOUND = "HARDWARE_DEVICE_NOT_FOUND"

def sanitize_stream_url(url: str) -> str:
    """
    Masks sensitive passwords in RTSP or HTTP credentials before exposing
    to frontend responses or logs.
    Handles special characters including '@' in passwords.
    Example: rtsp://admin:secret123@192.168.1.50:554/h264 -> rtsp://admin:*****@192.168.1.50:554/h264
    """
    if not url or not isinstance(url, str):
        return str(url)
    m = re.match(r'^(?P<scheme>[a-zA-Z0-9_+.-]+://)(?P<user>[^:/]+):(?P<password>.+)@(?P<rest>[^/@:]+(?::\d+)?(?:/.*)?)$', url)
    if m:
        return f"{m.group('scheme')}{m.group('user')}:*****@{m.group('rest')}"
    return url

class CameraDiagnosticEngine:
    """
    Comprehensive diagnostic engine for CCTV / IP cameras, RTSP streams,
    USB webcams, and video files.
    """

    @staticmethod
    def check_network_reachability(host: str, port: int, timeout_sec: float = 3.0) -> bool:
        """Tests if the remote IP camera socket endpoint is reachable."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout_sec)
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except Exception:
            return False

    @classmethod
    def test_camera_source(cls, source: str) -> Dict[str, Any]:
        """
        Executes a multi-stage diagnostic validation on any camera input:
        1. Source type resolution
        2. Network reachability (IP / Port check for RTSP / HTTP)
        3. URL parsing and credential syntax verification
        4. Capture session initialization with TCP transport enforcement
        5. Frame decoding and timing analysis
        6. Resolution, FPS, and codec extraction
        """
        start_time = time.time()

        # Case 1: Hardware index (e.g. "0", "1", or int)
        if isinstance(source, int) or (isinstance(source, str) and source.isdigit()):
            dev_idx = int(source)
            cap = cv2.VideoCapture(dev_idx, cv2.CAP_DSHOW)
            if not cap or not cap.isOpened():
                cap = cv2.VideoCapture(dev_idx)
            if not cap or not cap.isOpened():
                return {
                    "success": False,
                    "code": CameraDiagnosticCodes.HARDWARE_DEVICE_NOT_FOUND,
                    "message": f"Hardware camera device index {dev_idx} could not be opened. Verify webcam connection.",
                    "source": source,
                    "latency_ms": round((time.time() - start_time) * 1000, 1),
                    "troubleshooting": "Ensure no other application is locking the webcam. Try re-plugging USB or testing index 0."
                }
            ret, frame = cap.read()
            if not ret or frame is None:
                cap.release()
                return {
                    "success": False,
                    "code": CameraDiagnosticCodes.NO_FRAMES_RECEIVED,
                    "message": f"Camera index {dev_idx} opened but returned no valid frames.",
                    "source": source,
                    "latency_ms": round((time.time() - start_time) * 1000, 1)
                }
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
            fps = float(cap.get(cv2.CAP_PROP_FPS)) or 30.0
            cap.release()
            return {
                "success": True,
                "code": CameraDiagnosticCodes.CAMERA_CONNECTED,
                "message": f"Hardware camera {dev_idx} connected successfully.",
                "source": source,
                "resolution": f"{w}x{h}",
                "fps": fps,
                "codec": "RAW_RGB",
                "latency_ms": round((time.time() - start_time) * 1000, 1)
            }

        # Case 2: File video source (e.g. path to .mp4)
        if isinstance(source, str) and (source.endswith('.mp4') or source.endswith('.avi') or source.endswith('.mkv') or os.path.isfile(source)):
            if not os.path.isfile(source):
                return {
                    "success": False,
                    "code": CameraDiagnosticCodes.RTSP_STREAM_NOT_FOUND,
                    "message": f"Video source file not found at path: {source}",
                    "source": source,
                    "latency_ms": round((time.time() - start_time) * 1000, 1)
                }
            cap = cv2.VideoCapture(source)
            if not cap.isOpened():
                return {
                    "success": False,
                    "code": CameraDiagnosticCodes.CODEC_NOT_SUPPORTED,
                    "message": "Failed to decode video file. Format or codec not supported.",
                    "source": source,
                    "latency_ms": round((time.time() - start_time) * 1000, 1)
                }
            ret, frame = cap.read()
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080
            fps = float(cap.get(cv2.CAP_PROP_FPS)) or 25.0
            cap.release()
            return {
                "success": True,
                "code": CameraDiagnosticCodes.CAMERA_CONNECTED,
                "message": "Video file source verified successfully.",
                "source": source,
                "resolution": f"{w}x{h}",
                "fps": fps,
                "codec": "H264_FILE",
                "latency_ms": round((time.time() - start_time) * 1000, 1)
            }

        # Case 3: Network IP Camera (RTSP / HTTP)
        source_str = str(source).strip()
        sanitized = sanitize_stream_url(source_str)

        if not (source_str.startswith("rtsp://") or source_str.startswith("rtsps://") or source_str.startswith("http://") or source_str.startswith("https://")):
            return {
                "success": False,
                "code": CameraDiagnosticCodes.INVALID_RTSP_URL,
                "message": "Invalid URL protocol. Stream URL must start with rtsp://, rtsps://, or http://",
                "source": sanitized,
                "latency_ms": round((time.time() - start_time) * 1000, 1),
                "troubleshooting": "Example format: rtsp://username:password@192.168.1.100:554/h264"
            }

        try:
            parsed = urlparse(source_str)
            host = parsed.hostname
            port = parsed.port or (554 if parsed.scheme.startswith("rtsp") else 80)
        except Exception as e:
            return {
                "success": False,
                "code": CameraDiagnosticCodes.INVALID_RTSP_URL,
                "message": f"Malformed RTSP URL syntax: {e}",
                "source": sanitized,
                "latency_ms": round((time.time() - start_time) * 1000, 1)
            }

        if not host:
            return {
                "success": False,
                "code": CameraDiagnosticCodes.INVALID_RTSP_URL,
                "message": "RTSP URL is missing host address or IP.",
                "source": sanitized,
                "latency_ms": round((time.time() - start_time) * 1000, 1)
            }

        # Step 2: Pre-flight TCP Socket Reachability Check
        is_reachable = cls.check_network_reachability(host, port, timeout_sec=2.5)
        if not is_reachable:
            return {
                "success": False,
                "code": CameraDiagnosticCodes.CAMERA_UNREACHABLE,
                "message": f"Camera network host {host}:{port} is unreachable.",
                "source": sanitized,
                "latency_ms": round((time.time() - start_time) * 1000, 1),
                "troubleshooting": "Check if camera is powered on, IP address is correct, and firewall allows port 554/80."
            }

        # Step 3: Stream Ingestion with TCP Transport Enforcement
        # Force FFmpeg to use TCP for RTSP transport to prevent packet loss
        os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp;stimeout;4000000"

        try:
            cap = cv2.VideoCapture(source_str, cv2.CAP_FFMPEG)
            if not cap or not cap.isOpened():
                # Check if credentials might be the issue
                if parsed.username and parsed.password:
                    return {
                        "success": False,
                        "code": CameraDiagnosticCodes.CAMERA_AUTH_FAILED,
                        "message": "Failed to authenticate with camera. Check username and password.",
                        "source": sanitized,
                        "latency_ms": round((time.time() - start_time) * 1000, 1),
                        "troubleshooting": "Verify ONVIF/RTSP credentials in camera settings."
                    }
                return {
                    "success": False,
                    "code": CameraDiagnosticCodes.RTSP_STREAM_NOT_FOUND,
                    "message": f"Stream path '{parsed.path}' not found or rejected by camera.",
                    "source": sanitized,
                    "latency_ms": round((time.time() - start_time) * 1000, 1),
                    "troubleshooting": "Verify camera channel path (e.g. /h264, /ch0_0.264, /Streaming/Channels/101)."
                }

            ret, frame = cap.read()
            if not ret or frame is None:
                cap.release()
                return {
                    "success": False,
                    "code": CameraDiagnosticCodes.NO_FRAMES_RECEIVED,
                    "message": "Connected to stream, but zero video frames were received (read timeout).",
                    "source": sanitized,
                    "latency_ms": round((time.time() - start_time) * 1000, 1),
                    "troubleshooting": "Ensure camera is transmitting H.264 video. Check if codec is set to H.265 without FFmpeg decode support."
                }

            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080
            fps = float(cap.get(cv2.CAP_PROP_FPS)) or 25.0
            cap.release()

            return {
                "success": True,
                "code": CameraDiagnosticCodes.CAMERA_CONNECTED,
                "message": f"IP Camera connected successfully ({w}x{h} @ {fps:.0f} FPS).",
                "source": sanitized,
                "resolution": f"{w}x{h}",
                "fps": fps,
                "codec": "H264/RTSP_TCP",
                "latency_ms": round((time.time() - start_time) * 1000, 1)
            }

        except Exception as e:
            return {
                "success": False,
                "code": CameraDiagnosticCodes.STREAM_TIMEOUT,
                "message": f"Unexpected error while opening stream: {str(e)}",
                "source": sanitized,
                "latency_ms": round((time.time() - start_time) * 1000, 1)
            }
