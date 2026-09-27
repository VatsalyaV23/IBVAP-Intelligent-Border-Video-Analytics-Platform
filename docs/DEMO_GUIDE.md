# IBVAP Demonstration Guide (Rule 91 Specification)

This guide walks an evaluator, judge, or commanding officer through the complete end-to-end surveillance workflow of IBVAP.

---

## Step 1: Launch IBVAP
Open a PowerShell terminal and run:
```powershell
.\scripts\start.ps1
```
Open your browser to [http://localhost:5173](http://localhost:5173).

---

## Step 2: C4ISR Command Center Overview
1. Observe the **Top Sector Header**:
   - Title: `Border Surveillance Command Center [IND-PAK-SECTOR-4]`
   - Telemetry status pills: `SYSTEM: OPERATIONAL`, `CAMERAS: 18/20 ONLINE`, `AI: v3.2 (YOLO-Edge)`, `BLOCKCHAIN: #12841`, and the sub-second live IST clock.
   - Officer Clearance: `CLEARANCE: L4` / `DEF-ID: 9812-IN`.
2. Toggle between **Dark Mode** and **Light Mode** using the theme switcher. Note the smooth visual transitions and institutional color scheme.
3. Observe the **11-step Architectural Pipeline Stepper** with the active pulsating indicator on `Incident Reconstruction & Evidence`.

---

## Step 3: Multi-Sensor Matrix & 2D Tactical GIS Map
1. In the **Tactical Multi-Sensor Matrix**:
   - `CAM-01 [NORTH GATE - ALPHA]`: Bounding box detecting `PERSON [P-042] 94.2%`, velocity vector `→ SE | V: 1.2 m/s`.
   - `CAM-02 [FENCE LINE ROAD A]`: Tracking `VEHICLE [V-017] 89.6%`, speed `24 KM/H`.
   - `CAM-03 [WT-04 RIDGE THERMAL]`: FLIR LWIR thermal crosshair reticle.
   - `CAM-04 [ZONE B]`: Active critical breach notification with bounding boxes for `P-088` and `P-089`.
2. On the **2D Tactical GIS Vector Map**:
   - Note the demarcated **Zero Line (International Border)**.
   - Note the **Restricted Buffer Zone Delta (150m)**.
   - Note the **BSF Perimeter Fence B-2** and **Patrol Route Delta**.
   - Note the animated red pulsing beacon over the breach coordinates with the floating tactical tooltip (`INC-2026-00421`, Grid 73-08).

---

## Step 4: Incident Reconstruction & Acknowledge
1. Inspect the **Incident Action Card** on the right:
   - Priority: `CRITICAL`.
   - Risk Score: `94.2 / 100` (Restricted zone breach +40, Persistent movement +15, Multi-sensor correlation +15).
2. Click **Acknowledge**:
   - Button transforms to `✓ Acknowledged by Officer`.
   - Audit trail records an immutable entry `INCIDENT_ACKNOWLEDGED`.
3. Click **Dispatch Quick Reaction Team (QRT)**:
   - State updates to `✓ QRT DELTA EN ROUTE`.
   - Incident timeline automatically logs the tactical deployment.

---

## Step 5: Cryptographic Proof Verification
1. Inspect the **Cryptographic Proof Seal**:
   - Evidence ID: `EV-2026-00421-03`.
   - Merkle Root: `0x9f1a...b24e`.
   - SHA-256 Digest: `7a91e82c4f01...d891`.
2. Click **Verify On Hyperledger Fabric**:
   - Real-time peer consensus query executes.
   - Confirms `✓ MATCH - BLOCK #12841 VALIDATED 100%`.

---

## Step 6: Explore Navigation Pages
1. **Incidents** (`/incidents`): Filter by priority and inspect the reconstructed timeline.
2. **Evidence** (`/evidence`): Browse evidence crops and click "Verify Hash" for on-chain comparison.
3. **Blockchain** (`/blockchain`): Inspect block height `#12841`, transaction hashes, and test the "Simulate 1-Byte Tampering" demo.
4. **Cameras** (`/cameras`): Check real-time FPS, latency, and open the "Add Sensor Stream" modal.
5. **Models** (`/models`): Inspect model versions, hardware devices, and SHA-256 model weights hashes.
6. **Audit Trail** (`/audit-trail`): Review chronological officer actions and export the legal JSON audit report.
7. **System Health** (`/system-health`): Verify all subsystem worker nodes are nominal.
