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
import { DetectedVehicle } from '../types';

export const VehiclesScreen = () => {
  const [vehicles, setVehicles] = useState<DetectedVehicle[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'KNOWN' | 'UNKNOWN'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      let isKnownParam: boolean | undefined = undefined;
      if (filter === 'KNOWN') isKnownParam = true;
      if (filter === 'UNKNOWN') isKnownParam = false;

      const data = await apiService.getVehicles({ is_known: isKnownParam });
      setVehicles(data);
    } catch (e) {
      console.warn('Vehicle ANPR fetch error:', e);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 3000);
    return () => clearInterval(interval);
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  };

  const handleAuthorize = async (item: DetectedVehicle) => {
    try {
      setLoadingId(item.id);
      const unit = 'BSF Border Patrol Sector-IV Authorized Fleet';
      await apiService.authorizeVehicle(item.id, unit);
      RNAlert.alert(
        '✓ Fleet Authorized',
        Vehicle [] is now registered as an Authorized Fleet Unit. Live camera streams updated.
      );
      fetchVehicles();
    } catch (e: any) {
      RNAlert.alert('Authorization Error', e?.response?.data?.detail || 'Failed to authorize vehicle');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'KNOWN', 'UNKNOWN'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterBtn, filter === tab && styles.filterBtnActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterBtnText, filter === tab && styles.filterBtnTextActive]}>
              {tab === 'ALL' ? 'ALL PLATES' : tab === 'KNOWN' ? '✓ AUTHORIZED' : '⚠ UNKNOWN ALERT'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyTitle}>No Scanned Vehicles In Range</Text>
            <Text style={styles.emptySub}>Live PaddleOCR ANPR is monitoring surveillance camera feeds.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isKnown = item.is_known;

          return (
            <View style={[
              styles.vehicleCard,
              { borderColor: isKnown ? '#10b981' : '#ef4444' }
            ]}>
              <View style={styles.cardTopRow}>
                {/* Embossed Indian License Plate */}
                <View style={styles.licensePlateBox}>
                  <View style={styles.indBadge}>
                    <Text style={styles.indText}>IND</Text>
                  </View>
                  <Text style={styles.plateText}>{item.license_plate_number}</Text>
                </View>

                {/* Status Badge */}
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: isKnown ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: isKnown ? '#34d399' : '#f87171' }
                  ]}>
                    {isKnown ? 'AUTHORIZED FLEET' : 'UNKNOWN ALERT'}
                  </Text>
                </View>
              </View>

              <Text style={styles.unitText}>{item.owner_or_unit || 'Unregistered Civilian Vehicle'}</Text>

              <View style={styles.detailsRow}>
                <Text style={styles.detailItem}>📷 {item.camera_id}</Text>
                <Text style={styles.detailItem}>
                  OCR Conf: {(item.confidence * 100).toFixed(0)}%
                </Text>
                {item.blockchain_block && (
                  <Text style={styles.detailItem}>⛓ Block #{item.blockchain_block}</Text>
                )}
              </View>

              {item.sha256_hash && (
                <View style={styles.hashBox}>
                  <Text style={styles.hashLabel}>SHA-256 PROOF:</Text>
                  <Text style={styles.hashValue} numberOfLines={1}>
                    {item.sha256_hash}
                  </Text>
                </View>
              )}

              {/* Quick 1-Tap Fleet Authorization for Higher Officials */}
              {!isKnown && (
                <TouchableOpacity
                  style={styles.authorizeBtn}
                  onPress={() => handleAuthorize(item)}
                  disabled={loadingId === item.id}
                >
                  <Text style={styles.authorizeBtnText}>
                    {loadingId === item.id ? 'AUTHORIZING...' : '✓ 1-TAP AUTHORIZE AS PATROL FLEET'}
                  </Text>
                </TouchableOpacity>
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
  vehicleCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 8,
  },
  licensePlateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#090d16',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  indBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 6,
  },
  indText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  plateText: {
    color: '#090d16',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  unitText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  detailItem: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hashBox: {
    backgroundColor: '#090d16',
    borderRadius: 3,
    padding: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  hashLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: 'bold',
  },
  hashValue: {
    color: '#38bdf8',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  authorizeBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  authorizeBtnText: {
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
