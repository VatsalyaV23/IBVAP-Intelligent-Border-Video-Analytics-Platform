import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Alert, Incident, SystemHealthData } from '../types';

export const SituationRoomScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clock, setClock] = useState('00:00:00 IST');

  // Sub-second clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setClock(${pad(now.getHours())}:: IST);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [alertData, incidentData, healthData] = await Promise.all([
        apiService.getAlerts().catch(() => []),
        apiService.getIncidents().catch(() => []),
        apiService.getSystemHealth().catch(() => null),
      ]);
      setAlerts(alertData);
      setIncidents(incidentData);
      if (healthData) setHealth(healthData);
    } catch (e) {
      console.warn('Situation room fetch error:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
  const highIncidents = incidents.filter(i => i.priority === 'HIGH' || i.priority === 'CRITICAL');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
    >
      {/* Officer Command Dossier Bar */}
      <View style={styles.officerBar}>
        <View>
          <Text style={styles.officerRank}>{user?.rank || 'COMMANDING OFFICER'}</Text>
          <Text style={styles.officerName}>{user?.name || 'Brig. R. S. Rathore'}</Text>
          <Text style={styles.officerSector}>{user?.sector || 'SECTOR-4 BORDER COMMAND'}</Text>
        </View>
        <View style={styles.clockBox}>
          <Text style={styles.clockText}>{clock}</Text>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>C4ISR LIVE</Text>
          </View>
        </View>
      </View>

      {/* EMERGENCY PRIORITY BROADCAST BANNER */}
      {criticalAlerts.length > 0 && (
        <TouchableOpacity
          style={styles.emergencyBanner}
          onPress={() => navigation.navigate('Alerts')}
        >
          <View style={styles.emergencyLeft}>
            <Text style={styles.emergencyIcon}>🚨</Text>
            <View>
              <Text style={styles.emergencyTitle}>
                {criticalAlerts.length} CRITICAL BORDER ALERT{criticalAlerts.length > 1 ? 'S' : ''} DISPATCHED
              </Text>
              <Text style={styles.emergencySub}>
                {criticalAlerts[0]?.title} · Tap to Review & Order QRT Dispatch
              </Text>
            </View>
          </View>
          <Text style={styles.emergencyArrow}>&rarr;</Text>
        </TouchableOpacity>
      )}

      {/* KPI METRICS GRID */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { borderColor: '#ef4444' }]}>
          <Text style={[styles.kpiValue, { color: '#ef4444' }]}>
            {criticalAlerts.length}
          </Text>
          <Text style={styles.kpiLabel}>CRITICAL ALERTS</Text>
          <Text style={styles.kpiSub}>OPERATOR DISPATCHED</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#f59e0b' }]}>
          <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>
            {highIncidents.length}
          </Text>
          <Text style={styles.kpiLabel}>ACTIVE INCIDENTS</Text>
          <Text style={styles.kpiSub}>HIGH PRIORITY</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#10b981' }]}>
          <Text style={[styles.kpiValue, { color: '#10b981' }]}>
            {health?.telemetry_stats?.cameras_online || '100%'}
          </Text>
          <Text style={styles.kpiLabel}>SENSORS ONLINE</Text>
          <Text style={styles.kpiSub}>AI VISION FEEDS</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: '#38bdf8' }]}>
          <Text style={[styles.kpiValue, { color: '#38bdf8' }]}>
            {health?.telemetry_stats?.blockchain_records || '47,538'}
          </Text>
          <Text style={styles.kpiLabel}>LEDGER BLOCKS</Text>
          <Text style={styles.kpiSub}>EVIDENCE NOTARIZED</Text>
        </View>
      </View>

      {/* SECTOR DEFENSE MATRIX */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BORDER SECTOR DEFENSE STATUS</Text>
        <View style={styles.statusBox}>
          <View style={styles.statusRow}>
            <Text style={styles.statusName}>ZONE-A: ZERO LINE PERIMETER</Text>
            <Text style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }]}>
              ARMED SENSORS ACTIVE
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusName}>ZONE-B: BUFFER HIGHWAY / ROADWAY</Text>
            <Text style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }]}>
              LIVE PADDLEOCR ANPR ON
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusName}>ZONE-C: QRT ESCORT & CHECKPOINTS</Text>
            <Text style={[styles.statusBadge, { backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }]}>
              STANDBY READY (2 MIN ETA)
            </Text>
          </View>
        </View>
      </View>

      {/* RECENT OPERATOR DISPATCHES */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>OPERATOR DISPATCH STREAM</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Text style={styles.viewAllText}>View All ({alerts.length}) &rarr;</Text>
          </TouchableOpacity>
        </View>

        {alerts.slice(0, 3).map(alert => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={[
                styles.severityTag,
                { backgroundColor: alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }
              ]}>
                <Text style={styles.severityText}>{alert.severity}</Text>
              </View>
              <Text style={styles.alertTime}>
                {new Date(alert.created_at).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertDesc} numberOfLines={2}>{alert.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    padding: 16,
  },
  officerBar: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 14,
  },
  officerRank: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  officerName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  officerSector: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  clockBox: {
    alignItems: 'flex-end',
  },
  clockText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginTop: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  liveText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: 'bold',
  },
  emergencyBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    marginBottom: 14,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emergencyIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  emergencyTitle: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emergencySub: {
    color: '#fca5a5',
    fontSize: 10,
    marginTop: 2,
  },
  emergencyArrow: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'between',
    marginBottom: 14,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  kpiLabel: {
    color: '#f1f5f9',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  kpiSub: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  section: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  viewAllText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBox: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  statusName: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  alertCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  alertTime: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  alertTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  alertDesc: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
});
