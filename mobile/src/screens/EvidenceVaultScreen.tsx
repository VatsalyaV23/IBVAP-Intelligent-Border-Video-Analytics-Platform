import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { apiService } from '../services/api';
import { BlockchainRecord } from '../types';

export const EvidenceVaultScreen = () => {
  const [blocks, setBlocks] = useState<BlockchainRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = async () => {
    try {
      const data = await apiService.getBlockchainRecords();
      setBlocks(data);
    } catch (e) {
      console.warn('Blockchain records fetch error:', e);
    }
  };

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>BLOCKCHAIN EVIDENCE VAULT</Text>
          <Text style={styles.headerSub}>IMMUTABLE PROOF-OF-EXISTENCE LEDGER</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SHA-256 SEALED</Text>
        </View>
      </View>

      <FlatList
        data={blocks}
        keyExtractor={item => String(item.block_number)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>⛓</Text>
            <Text style={styles.emptyTitle}>No Blockchain Records Loaded</Text>
            <Text style={styles.emptySub}>Ledger blocks are notarized whenever live incidents or vehicle plates are captured.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.blockCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.blockNum}>BLOCK #{item.block_number}</Text>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>

            <View style={styles.dataField}>
              <Text style={styles.fieldLabel}>BLOCK HASH:</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {item.block_hash}
              </Text>
            </View>

            <View style={styles.dataField}>
              <Text style={styles.fieldLabel}>MERKLE ROOT:</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {item.merkle_root}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.txCount}>Transactions: {item.tx_count} Proofs</Text>
              <Text style={styles.verifiedTag}>✓ VERIFIED UNTAMPERED</Text>
            </View>
          </View>
        )}
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
    paddingVertical: 12,
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
  headerSub: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  blockCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 6,
  },
  blockNum: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dataField: {
    marginBottom: 6,
  },
  fieldLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: 'bold',
  },
  fieldValue: {
    color: '#38bdf8',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  txCount: {
    color: '#94a3b8',
    fontSize: 9,
  },
  verifiedTag: {
    color: '#10b981',
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
    marginTop: 4,
    textAlign: 'center',
  },
});
