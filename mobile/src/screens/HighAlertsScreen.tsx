import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert as RNAlert,
  Platform,
} from 'react-native';
import { apiService } from '../services/api';
import { Alert, Incident } from '../types';
import { useAuth } from '../context/AuthContext';

export const HighAlertsScreen = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAlertsAndIncidents = async () => {
    try {
      const [alertList, incidentList] = await Promise.all([
        apiService.getAlerts().catch(() => []),
        apiService.getIncidents().catch(() => []),
      ]);
      setAlerts(alertList);
      setIncidents(incidentList);
    } catch (e) {
      console.warn('Alerts fetch error:', e);
    }
  };

  useEffect(() => {
    fetchAlertsAndIncidents();
    const interval = setInterval(fetchAlertsAndIncidents, 3000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlertsAndIncidents();
    setRefreshing(false);
  };

  const handleAcknowledge = async (incidentId: string) => {
    try {
      setActionLoading(incidentId);
      const officerName = user?.name || 'Commanding Officer';
      await apiService.acknowledgeIncident(incidentId, officerName);
      RNAlert.alert('Incident Acknowledged', Incident  marked as acknowledged by .);
      fetchAlertsAndIncidents();
    } catch (e: any) {
      RNAlert.alert('Error', e?.response?.data?.detail || 'Failed to acknowledge incident');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDispatchQRT = async (incidentId: string) => {
    try {
      setActionLoading(incidentId);
      await apiService.dispatchQRT(incidentId);
      RNAlert.alert(
        '⚡ QRT DISPATCH ORDER TRANSMITTED',
        Quick Reaction Team Alpha deployed to sector under Incident . Sirens & sirens armed.
      );
      fetchAlertsAndIncidents();
    } catch (e: any) {
      RNAlert.alert('Error', e?.response?.data?.detail || 'Failed to dispatch QRT');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (filter === 'HIGH') return a.severity === 'HIGH';
    return a.severity === 'CRITICAL' || a.severity === 'HIGH';
  });

  return (
    <View style={styles.container}>
      {/* Top Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'CRITICAL', 'HIGH'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterBtn, filter === tab && styles.filterBtnActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterBtnText, filter === tab && styles.filterBtnTextActive]}>
              {tab === 'ALL' ? ALL HIGH ALERTS () : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alert Feed List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={styles.emptyTitle}>No Critical Border Alerts</Text>
            <Text style={styles.emptySub}>All sectors currently reporting nominal defense status.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCritical = item.severity === 'CRITICAL';
          const relatedInc = incidents.find(i => i.id === item.incident_id);

          return (
            <View style={[
              styles.alertCard,
              { borderColor: isCritical ? '#ef4444' : '#f59e0b' }
            ]}>
              <View style={styles.cardHeader}>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: isCritical ? '#ef4444' : '#f59e0b' }
                ]}>
                  <Text style={styles.severityText}>{item.severity} LEVEL</Text>
                </View>
                <Text style={styles.timestamp}>
                  {new Date(item.created_at).toLocaleTimeString()} · {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>

              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertDesc}>{item.description}</Text>

              {item.camera_id && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>📷 SENSOR: {item.camera_id}</Text>
                  {relatedInc && (
                    <Text style={styles.metaText}>
                      RISK SCORE: {relatedInc.risk_score.toFixed(0)}/100
                    </Text>
                  )}
                </View>
              )}

              {/* HIGHER OFFICIAL COMMAND ACTIONS */}
              {item.incident_id && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.ackBtn]}
                    onPress={() => handleAcknowledge(item.incident_id!)}
                    disabled={actionLoading === item.incident_id}
                  >
                    <Text style={styles.ackBtnText}>
                      ✓ ACKNOWLEDGE INCIDENT
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.qrtBtn]}
                    onPress={() => handleDispatchQRT(item.incident_id!)}
                    disabled={actionLoading === item.incident_id}
                  >
                    <Text style={styles.qrtBtnText}>
                      ⚡ DISPATCH QRT
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  filterBtnText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  timestamp: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  alertTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  alertDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginBottom: 10,
  },
  metaText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 4,
    alignItems: 'center',
  },
  ackBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  ackBtnText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  qrtBtn: {
    backgroundColor: '#b91c1c',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  qrtBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
});
