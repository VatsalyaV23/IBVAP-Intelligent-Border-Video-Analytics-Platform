export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  clearance_level: string;
  def_id: string;
  organization: string;
  is_active: boolean;
}

export interface CameraHealth {
  status: string;
  current_fps: number;
  latency_ms: number;
  brightness_level: number;
  error_count: number;
  last_heartbeat: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  sector: string;
  stream_type: string;
  stream_url?: string;
  resolution: string;
  fps: number;
  is_active: boolean;
  is_thermal: boolean;
  latitude: number;
  longitude: number;
  health?: CameraHealth;
  person_count?: number;
  vehicle_count?: number;
  evidence_count?: number;
  last_detection_time?: string;
}

export interface IncidentTimeline {
  id: number;
  incident_id: string;
  timestamp: string;
  source: string;
  action: string;
  details?: string;
}

export interface Incident {
  id: string;
  title: string;
  incident_type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'UNDER_REVIEW' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'CLOSED' | 'FALSE_POSITIVE';
  risk_score: number;
  explanation?: string;
  sector: string;
  zone_ids: string[];
  camera_ids: string[];
  object_ids: string[];
  blockchain_status: string;
  assigned_to?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  first_seen: string;
  last_seen: string;
  timeline: IncidentTimeline[];
}

export interface EvidenceItem {
  id: string;
  incident_id: string;
  camera_id: string;
  evidence_type: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  status: string;
  owner_username?: string;
  is_deleted_by_user?: boolean;
  deleted_by_username?: string;
  deleted_at?: string;
  model_version: string;
  captured_at: string;
}

export interface EvidenceVerifyResult {
  evidence_id: string;
  current_hash: string;
  stored_hash: string;
  blockchain_hash?: string;
  match: boolean;
  status: string;
  verified_at: string;
  details: string;
}

export interface BlockchainStatus {
  network_status: string;
  provider: string;
  current_block: number;
  total_transactions: number;
  latest_block_hash: string;
  peer_consensus: string;
}

export interface BlockchainRecord {
  id: number;
  transaction_id: string;
  block_number: number;
  block_hash: string;
  previous_hash: string;
  incident_id: string;
  evidence_id: string;
  evidence_hash: string;
  merkle_root: string;
  model_version: string;
  model_hash: string;
  provider: string;
  status: string;
  timestamp: string;
}

export interface AIModel {
  id: string;
  name: string;
  version: string;
  task_type: string;
  framework: string;
  device: string;
  status: string;
  confidence_threshold: number;
  model_hash: string;
  classes_supported: string;
  latency_ms: number;
}

export interface Alert {
  id: string;
  incident_id: string;
  priority: string;
  current_tier: number;
  recipient_role: string;
  status: string;
  timeout_seconds: number;
  escalated_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_id: string;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: string;
  ip_address: string;
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
