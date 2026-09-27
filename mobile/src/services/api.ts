import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OfficerUser,
  Alert,
  Incident,
  Camera,
  DetectedVehicle,
  BlockchainRecord,
  SystemHealthData
} from '../types';

export const STORAGE_KEY_BASE_URL = '@kavach_server_url';
export const DEFAULT_API_URL = 'http://localhost:8000';

let currentBaseUrl = DEFAULT_API_URL;

const apiClient = axios.create({
  baseURL: ${DEFAULT_API_URL}/api,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const apiService = {
  init: async () => {
    try {
      const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_BASE_URL);
      if (savedUrl) {
        currentBaseUrl = savedUrl;
        apiClient.defaults.baseURL = ${savedUrl}/api;
      }
    } catch (e) {
      console.warn('Failed to load server URL from storage:', e);
    }
  },

  setBaseUrl: async (url: string) => {
    let clean = url.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = http://;
    }
    currentBaseUrl = clean;
    apiClient.defaults.baseURL = ${clean}/api;
    await AsyncStorage.setItem(STORAGE_KEY_BASE_URL, clean);
    return clean;
  },

  getBaseUrl: () => currentBaseUrl,

  getCameraStreamUrl: (cameraId: string) => {
    return ${currentBaseUrl}/api/cameras//stream;
  },

  getVehicleSnapshotUrl: (vehicleId: string) => {
    return ${currentBaseUrl}/api/vehicles//snapshot;
  },

  // Higher Officer Authentication
  loginOfficer: async (officerId: string, pass: string): Promise<OfficerUser> => {
    const cleanId = officerId.trim().toUpperCase();
    const cleanPass = pass.trim();

    // Default Higher Command Official Accounts
    if (
      (cleanId === 'COMMANDER-HQ-01' && cleanPass === 'Kavach@Command2026') ||
      (cleanId === 'BSF-DIG-NORTH' && cleanPass === 'Kavach@2026') ||
      (cleanId === 'COMMANDANT-OPS' && cleanPass === 'Kavach@123') ||
      (cleanId === 'ADMIN' && cleanPass === 'admin123')
    ) {
      return {
        id: cleanId,
        username: cleanId.toLowerCase(),
        name: cleanId === 'COMMANDER-HQ-01' ? 'Brig. R. S. Rathore' : 'Col. V. K. Malhotra',
        rank: 'Commanding Officer / Sector DIG',
        clearance_level: 'LEVEL-5 TOP SECRET / BORDER OPS',
        sector: 'IND-PAK SECTOR-IV (PUNJAB/JAMMU BORDER)',
        token: cmd_token__auth,
      };
    }

    // Try backend authentication endpoint if exists
    try {
      const res = await apiClient.post('/auth/login', {
        username: officerId,
        password: pass,
      });
      return {
        id: officerId,
        username: res.data.username || officerId,
        name: res.data.name || 'Command Officer',
        rank: 'Operations Commander',
        clearance_level: 'LEVEL-5 TOP SECRET',
        sector: 'SECTOR-4',
        token: res.data.access_token,
      };
    } catch (e: any) {
      throw new Error('Invalid Officer ID or Security Passphrase. Use default COMMANDER-HQ-01 credentials.');
    }
  },

  // Operator Alerts
  getAlerts: async (): Promise<Alert[]> => {
    const res = await apiClient.get('/alerts');
    return res.data;
  },

  // Incidents
  getIncidents: async (): Promise<Incident[]> => {
    const res = await apiClient.get('/incidents');
    return res.data;
  },

  getIncident: async (id: string): Promise<Incident> => {
    const res = await apiClient.get(/incidents/);
    return res.data;
  },

  acknowledgeIncident: async (id: string, officerName: string) => {
    const res = await apiClient.post(/incidents//acknowledge, {
      officer_name: officerName,
    });
    return res.data;
  },

  dispatchQRT: async (id: string) => {
    const res = await apiClient.post(/incidents//dispatch-qrt);
    return res.data;
  },

  // Surveillance Cameras
  getCameras: async (): Promise<Camera[]> => {
    const res = await apiClient.get('/cameras');
    return res.data;
  },

  // ANPR & Vehicles
  getVehicles: async (params?: { is_known?: boolean; registration_status?: string; search?: string; limit?: number }): Promise<DetectedVehicle[]> => {
    const res = await apiClient.get('/vehicles', { params });
    return res.data;
  },

  authorizeVehicle: async (id: string, owner_or_unit: string): Promise<DetectedVehicle> => {
    const res = await apiClient.post(/vehicles//authorize, { owner_or_unit });
    return res.data;
  },

  updateVehicleFlag: async (id: string, flagged_status: string, notes?: string): Promise<DetectedVehicle> => {
    const res = await apiClient.patch(/vehicles//flag, { flagged_status, notes });
    return res.data;
  },

  // Blockchain Ledger
  getBlockchainRecords: async (): Promise<BlockchainRecord[]> => {
    const res = await apiClient.get('/blockchain/records');
    return res.data;
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealthData> => {
    const res = await apiClient.get('/system-health');
    return res.data;
  },
};
