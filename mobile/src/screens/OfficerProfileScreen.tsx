import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export const OfficerProfileScreen = () => {
  const { user, logout, serverUrl } = useAuth();

  const handleLogout = () => {
    RNAlert.alert(
      'Confirm Terminal Logout',
      'Are you sure you want to disconnect from KAVACH Commander?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🎖️</Text>
        </View>
        <Text style={styles.officerName}>{user?.name || 'Brig. R. S. Rathore'}</Text>
        <Text style={styles.officerRank}>{user?.rank || 'Commanding Officer / Sector DIG'}</Text>
        <Text style={styles.clearanceBadge}>{user?.clearance_level || 'LEVEL-5 TOP SECRET'}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>OFFICER PROFILE & ASSIGNMENT</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>OFFICER ID</Text>
          <Text style={styles.rowValue}>{user?.id || 'COMMANDER-HQ-01'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>SECTOR JURISDICTION</Text>
          <Text style={styles.rowValue}>{user?.sector || 'SECTOR-4 BORDER COMMAND'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>CLEARANCE LEVEL</Text>
          <Text style={styles.rowValue}>{user?.clearance_level || 'LEVEL-5'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>TERMINAL ACCESS</Text>
          <Text style={[styles.rowValue, { color: '#10b981' }]}>ARMED & AUTHORIZED</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>SYSTEM & CONNECTION</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>CONNECTED SERVER</Text>
          <Text style={styles.rowValue}>{serverUrl}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>MOBILE APP BUILD</Text>
          <Text style={styles.rowValue}>v1.0.0 (Production Ready)</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>BLOCKCHAIN LEDGER</Text>
          <Text style={[styles.rowValue, { color: '#38bdf8' }]}>ONLINE / NOTARIZING</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>DISCONNECT / LOGOUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    padding: 16,
  },
  headerBox: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 28,
  },
  officerName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  officerRank: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  clearanceBadge: {
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginTop: 8,
  },
  infoSection: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  rowLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rowValue: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
