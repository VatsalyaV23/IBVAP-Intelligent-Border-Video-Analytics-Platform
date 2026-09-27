import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { apiService } from '../services/api';
import { Camera } from '../types';

export const LiveCamerasScreen = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCam, setSelectedCam] = useState<string | null>(null);

  const fetchCameras = async () => {
    try {
      const data = await apiService.getCameras();
      setCameras(data);
      if (!selectedCam && data.length > 0) {
        setSelectedCam(data[0].id);
      }
    } catch (e) {
      console.warn('Cameras fetch error:', e);
    }
  };

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 4000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCameras();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TACTICAL SENSOR FEEDS</Text>
        <Text style={styles.headerCount}>{cameras.length} CAMERAS ONLINE</Text>
      </View>

      <FlatList
        data={cameras}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📹</Text>
            <Text style={styles.emptyTitle}>No Surveillance Sensors Connected</Text>
            <Text style={styles.emptySub}>Connect IP or USB hardware cameras on the main KAVACH web console.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const streamUrl = apiService.getCameraStreamUrl(item.id);

          return (
            <View style={styles.cameraCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.cameraName}>
                    {item.id} [{item.name}]
                  </Text>
                </View>
                <Text style={styles.resolutionTag}>
                  {item.resolution || '720p'} · {item.fps || 24} FPS
                </Text>
              </View>

              {/* REAL LIVE STREAM VIDEO IMAGE WITH IN-CAMERA YOLO & ANPR OVERLAYS */}
              <View style={styles.streamContainer}>
                <Image
                  style={styles.streamImage}
                  source={{ uri: streamUrl }}
                  resizeMode="cover"
                />
                <View style={styles.hudOverlay}>
                  <Text style={styles.hudBadge}>LIVE · YOLOv8 + PADDLEOCR</Text>
                  <Text style={styles.hudSec}>{item.sector || 'SECTOR-4 ZERO LINE'}</Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.srcType}>SRC: {item.stream_type}</Text>
                <Text style={styles.cryptoProofTag}>⛓ PROOF-OF-EXISTENCE ARMED</Text>
              </View>
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
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerCount: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  cameraCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  cameraName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  resolutionTag: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600',
  },
  streamContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
  },
  streamImage: {
    width: '100%',
    height: '100%',
  },
  hudOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'between',
  },
  hudBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#34d399',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  hudSec: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  srcType: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cryptoProofTag: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold',
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
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 4,
  },
});
