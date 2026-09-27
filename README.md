# IBVAP: AI-Powered Border Incident Intelligence & Trusted Evidence Platform

[![C4ISR Standard](https://img.shields.io/badge/C4ISR-Institutional%20Grade-0284c7)](#)
[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue.svg)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](#)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](#)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](#)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](#)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-orange.svg)](#)
[![Blockchain](https://img.shields.io/badge/Blockchain-SHA--256%20Merkle%20Ledger-indigo.svg)](#)

**IBVAP** (Intelligent Border Video Analytics Platform) transforms existing CCTV, RTSP IP cameras, USB webcams, and perimeter video feeds into an automated, responsive, and cryptographically verified border incident monitoring and evidence preservation platform.

---

## 🛡️ Core Surveillance Intelligence Flow

```mermaid
graph TD
    A[CCTV / RTSP IP / USB Webcam / Video Footage] --> B[Video Ingestion & OpenCV Stream Manager]
    B --> C[AI Detection Engine: YOLOv8 / HOG Cascade]
    C --> D[Multi-Object Tracking: Velocity Vectors & Tracking Codes #P001, #V001]
    D --> E[Behavior & Zone Analytics: Virtual Fence Intrusion, Loitering]
    E --> F[Event Ingestion Engine]
    F --> G[Cross-Camera Incident Correlation & Risk Scoring (0-100)]
    G --> H[Evidence Capture: Full-Frame Snapshots & Crops]
    H --> I[SHA-256 Cryptographic Hashing]
    I --> J[Append-Only Local Blockchain Ledger Notarization]
    J --> K[Hierarchical Alert Escalation Cascade]
    K --> L[Human Verification & Duty Officer Acknowledgement]
    L --> M[Quick Reaction Team (QRT) Dispatch & Incident Resolution]
    M --> N[Immutable Legal Audit Trail]
```

---

## ⚡ Key Architectural Capabilities

### 1. Fully Responsive Institutional C4ISR Command Center
- **Mobile-First to 4K Ultra-Wide Responsiveness**: Fully responsive across mobile (320px, 375px, 414px), tablet (768px, 820px), desktop (1024px, 1280px, 1440px), and 1920px command displays without horizontal overflow or clipped text.
- **Responsive Navigation Drawer**: Hidden off-canvas drawer on mobile (`< 1024px`) with backdrop blur and touch gestures; fixed tactical sidebar (`w-72`) on desktop (`>= 1024px`).
- **Official Branding**: Features the official IBVAP crest logo (`/logo.png`) and tactical favicon (`/favicon.png`) across all headers, cards, and sidebars.
- **1-Click Cryptographic Hash Copying**: Integrated `HashBadge` component with truncation (e.g. `0x7a91...d891`) and 1-click clipboard copy feedback.
- **Dual-State Tactical Theme**: Military Dark theme (`#0b0f19` / `#0f172a`) and Institutional High-Contrast Light theme.

### 2. Multi-Source Camera Connection Engine
- **Integrated Laptop Webcam & USB Cameras**: Direct access to local hardware ports (`index 0, 1, 2...`) with automatic USB device scanning (`/api/cameras/scan-hardware`).
- **RTSP Network IP Cameras**: Connect commercial security cameras (Hikvision, Dahua, Axis, Hanwha, Uniview) via RTSP or HTTP/HTTPS.
  - **TCP Transport Enforcement**: Sets `OPENCV_FFMPEG_CAPTURE_OPTIONS=rtsp_transport;tcp` to eliminate UDP packet loss and firewall timeouts.
  - **Pre-Flight Socket Reachability**: Tests camera IP and port reachability (`socket.connect_ex`) before OpenCV initialization to prevent thread hanging.
  - **Credential Sanitization**: Passwords embedded in RTSP URLs are masked with `***` in all API responses to prevent credential leakage.
- **Perimeter Video File Upload**: Direct upload of MP4, AVI, or MKV tactical footage via `/api/cameras/upload-video` for simulated patrols and continuous testing.
- **Auto-Reconnection State Machine**: Resilient background stream manager transitions through `CONNECTING` → `CONNECTED` → `STREAMING` → `DEGRADED` → `RECONNECTING` → `OFFLINE`, using exponential backoff with automatic recovery.

### 3. Deep AI Vision & Tracking
- **Real-Time YOLOv8 Detection**: Live human and vehicle bounding boxes rendered directly into MJPEG video streams.
- **Persistent Tactical IDs**: Target identification with unique tracking codes (`#P001`, `#P002`, `#V001`).
- **Aspect Ratio Integrity**: Native 16:9 (`aspect-video`) non-stretched layout with fallback HUD standby frames displaying diagnostic status.
- **Dynamic Motion-Triggered Incidents**: Real incidents and evidence generated dynamically from camera activity and motion.

### 4. Cryptographic Proof Vault & Local Blockchain Ledger
- **SHA-256 Digest Computation**: Full bit-level SHA-256 digest calculated for every captured evidence frame.
- **Append-Only Merkle Ledger**: Blocks chained via cryptographic hashes with proof verification.
- **Interactive Verification & Tampering Simulation**: Test integrity with 1-click verification or simulate a 1-byte file alteration to demonstrate ledger tamper detection.

---

## 🔍 Camera Diagnostic Codes & Troubleshooting

| Diagnostic Code | Meaning | Root Cause & Resolution |
| :--- | :--- | :--- |
| `CAMERA_CONNECTED` | Stream Verified | Camera is reachable, authenticated, and streaming valid video frames. |
| `CAMERA_UNREACHABLE` | Network Ping / Port Failed | IP address or port (e.g. 554) cannot be reached. Check camera power, network cable, and firewall settings. |
| `CAMERA_AUTH_FAILED` | Unauthorized (401) | RTSP username or password is invalid. Verify RTSP credentials in camera configuration. |
| `INVALID_RTSP_URL` | Malformed URL Format | URL must begin with `rtsp://`, `http://`, or `https://` (e.g., `rtsp://admin:pass@192.168.1.100:554/h264`). |
| `RTSP_STREAM_NOT_FOUND`| Stream Path 404 | RTSP channel or sub-stream path does not exist. Verify stream path (e.g. `/h264Preview_01_main` or `/ch0_0.264`). |
| `NO_FRAMES_RECEIVED` | Capture Opened, No Frames | Camera RTSP server accepted connection but sent 0 frames. Verify video codec is H.264 (H.265 may require transcoding). |
| `STREAM_TIMEOUT` | Connection Timed Out | Network latency exceeded threshold. Check Wi-Fi signal or switch to wired Ethernet. |

---

## 🚀 Quick Start (Windows PowerShell)

### Prerequisites
- **Python 3.11+** installed and available on `PATH`.
- **Node.js 20+ & npm** installed.
- (Optional) Built-in laptop webcam or USB camera for live physical testing.

### Automated Setup & Launch

1. **Clone or Open Repository**:
   ```powershell
   cd c:\Users\vatsa\Desktop\Projects\SIH2026\Pro2
   ```

2. **Automated Setup** (creates Python venv, installs dependencies, builds frontend):
   ```powershell
   .\scripts\setup.ps1
   ```

3. **Launch IBVAP Command Center**:
   ```powershell
   .\scripts\start.ps1
   ```
   - **Command Center UI**: [http://localhost:5173](http://localhost:5173)
   - **FastAPI Backend Server**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
   - **Swagger OpenAPI Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

4. **Run Unit & Diagnostics Tests**:
   ```powershell
   .\scripts\test.ps1
   ```

5. **Stop Running Services**:
   ```powershell
   .\scripts\stop.ps1
   ```

---

## 🛠️ Manual Execution (Step-by-Step)

If you prefer running services in separate terminal windows:

### Terminal 1: Backend
```powershell
cd c:\Users\vatsa\Desktop\Projects\SIH2026\Pro2\backend
..\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2: Frontend
```powershell
cd c:\Users\vatsa\Desktop\Projects\SIH2026\Pro2\frontend
npm run dev
```

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cameras` | List all active camera feeds (credentials sanitized). |
| `POST` | `/api/cameras/test-connection` | Run diagnostic pre-flight and stream grab on RTSP/webcam. |
| `POST` | `/api/cameras` | Add and initialize a new IP, webcam, or tactical feed. |
| `GET` | `/api/cameras/scan-hardware` | Auto-detect local USB webcams on hardware ports. |
| `POST` | `/api/cameras/upload-video` | Upload MP4/AVI tactical footage as a looped camera feed. |
| `GET` | `/api/cameras/{id}/stream` | Real-time MJPEG live stream with YOLO HUD overlay. |
| `GET` | `/api/cameras/{id}/telemetry` | Live stream FPS, latency, reconnection count, and state. |
| `POST` | `/api/cameras/{id}/reconnect` | Trigger immediate reconnect sequence for a camera. |
| `PATCH`| `/api/cameras/{id}/toggle` | Pause or resume video processing for a camera. |
| `DELETE`| `/api/cameras/{id}` | Disconnect and release camera capture resources. |
| `POST` | `/api/cameras/{id}/capture-live-evidence` | Capture current frame, compute SHA-256, notarize to ledger. |
| `GET` | `/api/incidents` | List border incidents with risk scores and sector tags. |
| `GET` | `/api/evidence` | List cryptographic evidence vault items. |
| `GET` | `/api/evidence/{id}/frame` | Retrieve raw evidence image or responsive tactical SVG card. |
| `POST` | `/api/evidence/{id}/verify` | Validate evidence SHA-256 against on-chain block hash. |
| `GET` | `/api/blockchain/status` | Current block height, consensus state, and latest block hash. |
| `GET` | `/api/blockchain/records` | List immutable notarized transaction blocks. |

---

## 🔒 Security & Evidence Integrity

1. **Zero Raw Password Storage in Client**: All RTSP passwords (`rtsp://user:pass@host`) are stripped and masked with `***` before transmission to the frontend.
2. **Deterministic Cryptographic Hashing**: Every evidence item generates a unique SHA-256 hash using chunked binary reading (`8192` bytes) to support high-definition video files.
3. **Collision-Resistant Block Hashes**: Merkle roots and block hashes incorporate previous block hash, Merkle root, timestamp, and block sequence to guarantee unique cryptographic blocks.

---

## 🛡️ License & Institutional Clearance

Developed for tactical border security, perimeter defense, and automated evidence management. Institutional clearance level restricted to authorized personnel.
