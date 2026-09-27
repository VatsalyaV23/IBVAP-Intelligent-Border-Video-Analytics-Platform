export interface OfficerUser {
  id: string;
  username: string;
  name: string;
  rank: string;
  clearance_level: string;
  sector: string;
  token?: string;
}

export interface Alert {
  id: string;
  incident_id?: string;
  camera_id?: string;
  alert_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED' | 'CLOSED';
  created_at: string;
}

export interface Incident {
  id: string;
  title: string;
  incident_type: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  risk_score: number;
  explanation: string;
  sector: string;
  zone_ids_json?: string;
  camera_ids_json?: string;
  object_ids_json?: string;
  blockchain_status: string;
  first_seen: string;
  last_seen: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  qrt_dispatched?: boolean;
}

export interface Camera {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  resolution: string;
  fps: number;
  stream_type: string;
  sector?: string;
}

export interface DetectedVehicle {
  id: string;
  camera_id: string;
  license_plate_number: string;
  confidence: number;
  vehicle_type: string;
  is_known?: boolean;
  owner_or_unit?: string;
  registration_status?: string;
  plate_bbox?: string;
  vehicle_bbox?: string;
  snapshot_path?: string;
  sha256_hash?: string;
  blockchain_block?: number;
  ocr_engine: string;
  flagged_status: 'CLEAR' | 'WATCHLIST' | 'SUSPICIOUS' | 'STOLEN' | 'ALERT';
  incident_id?: string;
  detected_at: string;
}

export interface BlockchainRecord {
  block_number: number;
  block_hash: string;
  previous_hash: string;
  merkle_root: string;
  tx_count: number;
  timestamp: string;
}

export interface SystemHealthData {
  status: string;
  subsystems: Record<string, string>;
  telemetry_stats: {
    cameras_online: string;
    active_incidents: number;
    critical_alerts: number;
    evidence_verified_rate: string;
    ai_detection_rate: string;
    blockchain_records: number;
  };
}
