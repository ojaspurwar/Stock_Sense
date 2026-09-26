import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationHeader } from '../../components/LocationHeader';
import { useLocation } from '../../context/LocationContext';
import { MobileStorage } from '../../services/storage';
import { StockLedgerEntry, Product } from '../../types';

export const LedgerScreen = () => {
  const { selectedLocationId } = useLocation();
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const prodId = selectedProductId === 'ALL' ? undefined : selectedProductId;
    const entries = await MobileStorage.getLedger(prodId, selectedLocationId);
    setLedgerEntries(entries);

    const prods = await MobileStorage.getProducts();
    setProducts(prods);
  }, [selectedProductId, selectedLocationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredEntries = ledgerEntries.filter((entry) => {
    if (typeFilter !== 'ALL' && entry.document_type !== typeFilter) return false;
    return true;
  });

  const getDocTypeColor = (type: string) => {
    switch (type) {
      case 'RECEIPT':
        return { bg: '#ecfdf5', text: '#059669', icon: 'arrow-down' };
      case 'DELIVERY':
        return { bg: '#eff6ff', text: '#2563eb', icon: 'arrow-up' };
      case 'TRANSFER':
        return { bg: '#f5f3ff', text: '#7c3aed', icon: 'swap-horizontal' };
      case 'ADJUSTMENT':
        return { bg: '#fef3c7', text: '#d97706', icon: 'git-commit' };
      default:
        return { bg: '#f1f5f9', text: '#475569', icon: 'document-text' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LocationHeader />

      {/* Screen Title & Audit Badge */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Immutable Stock Ledger</Text>
          <Text style={styles.sub}>Cryptographically atomic double-entry audit trail</Text>
        </View>
        <View style={styles.auditBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <Text style={styles.auditBadgeText}>Verified</Text>
        </View>
      </View>

      {/* Type Filter Chips */}
      <View style={styles.typeFilterBar}>
        {['ALL', 'RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeChip, typeFilter === type && styles.typeChipActive]}
            onPress={() => setTypeFilter(type)}
          >
            <Text style={[styles.typeChipText, typeFilter === type && styles.typeChipTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product Filter Scroll */}
      <View style={styles.prodScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prodScroll}>
          <TouchableOpacity
            style={[styles.prodPill, selectedProductId === 'ALL' && styles.prodPillActive]}
            onPress={() => setSelectedProductId('ALL')}
          >
            <Text style={[styles.prodPillText, selectedProductId === 'ALL' && styles.prodPillTextActive]}>
              All Products ({ledgerEntries.length})
            </Text>
          </TouchableOpacity>

          {products.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.prodPill, selectedProductId === p.id && styles.prodPillActive]}
              onPress={() => setSelectedProductId(p.id)}
            >
              <Text style={[styles.prodPillText, selectedProductId === p.id && styles.prodPillTextActive]}>
                {p.sku}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Ledger Entries List */}
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No ledger transactions</Text>
            <Text style={styles.emptySub}>Validate operations to generate immutable ledger entries</Text>
          </View>
        }
        renderItem={({ item }) => {
          const typeStyle = getDocTypeColor(item.document_type);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                  <Ionicons name={typeStyle.icon as any} size={13} color={typeStyle.text} />
                  <Text style={[styles.typeText, { color: typeStyle.text }]}>
                    {item.document_type}
                  </Text>
                </View>

                <Text style={styles.timestamp}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>

              <View style={styles.prodRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodName}>{item.product_name}</Text>
                  <Text style={styles.skuText}>{item.sku}</Text>
                </View>

                <View style={styles.qtyBadge}>
                  <Text
                    style={[
                      styles.qtyVal,
                      item.document_type === 'RECEIPT' && styles.qtyReceipt,
                      item.document_type === 'DELIVERY' && styles.qtyDelivery,
                    ]}
                  >
                    {item.document_type === 'RECEIPT' ? '+' : item.document_type === 'DELIVERY' ? '-' : ''}
                    {item.quantity} {item.unit_of_measure}
                  </Text>
                </View>
              </View>

              {/* Movement Route */}
              <View style={styles.routeBox}>
                <View style={styles.routePoint}>
                  <Text style={styles.routeLabel}>Source</Text>
                  <Text style={styles.routeValue} numberOfLines={1}>
                    {item.source_location_name || 'External (Opening/Vendor)'}
                  </Text>
                </View>

                <Ionicons name="arrow-forward" size={14} color="#94a3b8" style={{ marginHorizontal: 8 }} />

                <View style={styles.routePoint}>
                  <Text style={styles.routeLabel}>Destination</Text>
                  <Text style={styles.routeValue} numberOfLines={1}>
                    {item.destination_location_name || 'External (Customer/Waste)'}
                  </Text>
                </View>
              </View>

              {/* Footer Info */}
              <View style={styles.cardFooter}>
                <Text style={styles.docCodeText}>Doc: {item.document_code}</Text>
                <Text style={styles.userText}>Operative: {item.created_by_name}</Text>
              </View>

              {item.notes ? (
                <Text style={styles.notesText}>Note: {item.notes}</Text>
              ) : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  auditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  auditBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4,
  },
  typeFilterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  typeChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  typeChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  typeChipTextActive: {
    color: '#ffffff',
  },
  prodScrollWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  prodScroll: {
    paddingHorizontal: 16,
  },
  prodPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  prodPillActive: {
    backgroundColor: '#e0e7ff',
  },
  prodPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  prodPillTextActive: {
    color: '#4338ca',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#94a3b8',
  },
  prodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  skuText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  qtyBadge: {
    alignItems: 'flex-end',
  },
  qtyVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  qtyReceipt: {
    color: '#059669',
  },
  qtyDelivery: {
    color: '#2563eb',
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 10,
    marginVertical: 8,
  },
  routePoint: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  routeValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8,
    marginTop: 4,
  },
  docCodeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  userText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  notesText: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});
