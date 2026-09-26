import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileStorage } from '../../services/storage';
import { Location, ProductStockSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

export const WarehouseScreen = () => {
  const { user } = useAuth();
  const { refreshLocations } = useLocation();

  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<ProductStockSummary[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Add Location Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'WAREHOUSE' | 'RACK' | 'PRODUCTION'>('WAREHOUSE');
  const [description, setDescription] = useState('');

  const loadData = useCallback(async () => {
    const locs = await MobileStorage.getLocations();
    setLocations(locs);
    const prods = await MobileStorage.getProductStockSummaries();
    setProducts(prods);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await refreshLocations();
    setRefreshing(false);
  };

  const handleCreateLocation = async () => {
    if (!name.trim() || !code.trim()) {
      Alert.alert('Validation Error', 'Location Name and Code are required.');
      return;
    }

    await MobileStorage.createLocation({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: type,
      description: description.trim() || undefined,
    });

    setModalVisible(false);
    setName('');
    setCode('');
    setDescription('');
    await loadData();
    await refreshLocations();
    Alert.alert('Success', `Storage location "${name}" registered successfully.`);
  };

  const filteredLocations = locations.filter((loc) => {
    if (typeFilter !== 'ALL' && loc.type !== typeFilter) return false;
    return true;
  });

  const getLocationStockCount = (locId: string) => {
    let count = 0;
    for (const prod of products) {
      const match = prod.location_breakdown.find((b) => b.location_id === locId);
      if (match && match.quantity > 0) {
        count += 1;
      }
    }
    return count;
  };

  const getTypeStyle = (t: string) => {
    switch (t) {
      case 'WAREHOUSE':
        return { bg: '#e0e7ff', text: '#4338ca', icon: 'business' };
      case 'RACK':
        return { bg: '#fef3c7', text: '#b45309', icon: 'grid' };
      case 'PRODUCTION':
        return { bg: '#ecfdf5', text: '#047857', icon: 'construct' };
      default:
        return { bg: '#f1f5f9', text: '#475569', icon: 'location' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Warehouse & Locations</Text>
          <Text style={styles.sub}>Manage storage zones, racks, and production floors</Text>
        </View>

        {user?.role === 'MANAGER' && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Add Location</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter Bar */}
      <View style={styles.filterBar}>
        {['ALL', 'WAREHOUSE', 'RACK', 'PRODUCTION'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.filterChip, typeFilter === t && styles.filterChipActive]}
            onPress={() => setTypeFilter(t)}
          >
            <Text style={[styles.filterChipText, typeFilter === t && styles.filterChipTextActive]}>
              {t === 'ALL' ? 'All Locations' : t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Locations List */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const typeStyle = getTypeStyle(item.type);
          const activeSkus = getLocationStockCount(item.id);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.typeIconBg, { backgroundColor: typeStyle.bg }]}>
                  <Ionicons name={typeStyle.icon as any} size={18} color={typeStyle.text} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.locName}>{item.name}</Text>
                  <View style={styles.codeRow}>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeText}>{item.code}</Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                      <Text style={[styles.typeText, { color: typeStyle.text }]}>{item.type}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.skuCountBox}>
                  <Text style={styles.skuCountVal}>{activeSkus}</Text>
                  <Text style={styles.skuCountLabel}>Active SKUs</Text>
                </View>
              </View>

              {item.description ? (
                <Text style={styles.descText}>{item.description}</Text>
              ) : null}
            </View>
          );
        }}
      />

      {/* Add Location Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Warehouse / Storage Location</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Location / Facility Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Warehouse 2 (Secondary Annex)"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Location Code / Identifier *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. WH-02 or RCK-C10"
                autoCapitalize="characters"
                value={code}
                onChangeText={setCode}
              />

              <Text style={styles.inputLabel}>Facility Type</Text>
              <View style={styles.pickerRow}>
                {[
                  { key: 'WAREHOUSE', label: 'Warehouse' },
                  { key: 'RACK', label: 'Storage Rack' },
                  { key: 'PRODUCTION', label: 'Production Floor' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.pickerChip,
                      type === item.key && styles.pickerChipActive,
                    ]}
                    onPress={() => setType(item.key as any)}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        type === item.key && styles.pickerTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Description / Capacity Notes</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. East wing storage for heavy palletized steel"
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateLocation}>
                <Text style={styles.submitBtnText}>Save Storage Location</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
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
    alignItems: 'center',
  },
  typeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  codeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  skuCountBox: {
    alignItems: 'center',
    paddingLeft: 8,
  },
  skuCountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4f46e5',
  },
  skuCountLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  descText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  formScroll: {
    paddingBottom: 32,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  pickerChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  pickerChipActive: {
    backgroundColor: '#4f46e5',
  },
  pickerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  pickerTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
