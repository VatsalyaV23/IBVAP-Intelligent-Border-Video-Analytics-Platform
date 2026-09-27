# IBVAP System Architecture

## 1. Architectural Philosophy
IBVAP is designed around three foundational principles:
1. **Explainable AI**: No black-box scores. All incident priority levels and risk weights derive from traceable, rule-based factors (zone sensitivity, persistence, trajectory direction, cross-camera confirmation).
2. **Cryptographic Provenance**: Every evidence asset is hashed using SHA-256 and committed to an append-only permissioned ledger (Local Ledger / Hyperledger Fabric) to prevent judicial repudiation.
3. **Human-in-the-Loop Governance**: AI correlates, detects, and escalates; human command officers acknowledge, verify evidence integrity, dispatch tactical units, and resolve incidents.

## 2. Component Topology

```
+-----------------------------------------------------------------------------------+
|                            IBVAP C4ISR COMMAND CENTER                             |
|  (React 18 + TypeScript + Vite + Tailwind CSS + Lucide / Material Symbols Icons)  |
+-----------------------------------------------------------------------------------+
                                   |           ^
                   REST API Calls  |           | WebSocket Events
                                   v           |
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                    |
|   - Authentication & RBAC (BSF L1-L4 Clearances)                                  |
|   - Camera Fleet Manager & Health Telemetry Heartbeats                            |
|   - Incident Engine & Temporal Correlation                                        |
|   - Evidence Hash Service (SHA-256) & Notarization                                |
|   - Alert Escalation Cascade Timers                                               |
|   - Immutable Audit Logging Service                                               |
+-----------------------------------------------------------------------------------+
           |                                                      |
           v                                                      v
+-----------------------+                              +-----------------------+
|   AI INFERENCE ENGINE |                              |  PERMISSIONED LEDGER  |
| - BaseDetectionModel  |                              | - LocalLedgerProvider |
| - TrajectoryTracker   |                              | - Hyperledger Fabric  |
| - ZoneAnalytics       |                              | - Merkle Root Tree    |
| - LowLightDetector    |                              | - SHA-256 Block Chain |
+-----------------------+                              +-----------------------+
```

## 3. Data Storage Strategy
- **Relational Metadata**: SQLite (local zero-config) / PostgreSQL for cameras, zones, incidents, events, users, and audit logs.
- **Off-Chain Media**: Local filesystem (`storage/evidence/`) or MinIO S3-compatible bucket for video clips, snapshots, and bounding crops.
- **On-Chain Notarization**: The ledger records only transaction hashes, Merkle roots, evidence SHA-256 digests, timestamps, model hashes, and configuration versions.
