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
import { LocationHeader } from '../../components/LocationHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { MobileStorage } from '../../services/storage';
import { Document, DocumentStatus, Product, Location } from '../../types';

export const TransfersScreen = () => {
  const { selectedLocationId } = useLocation();
  const { user } = useAuth();

  const [transfers, setTransfers] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // New Transfer Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [sourceLocId, setSourceLocId] = useState('');
  const [destLocId, setDestLocId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [availableStock, setAvailableStock] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const filter = statusFilter === 'ALL' ? undefined : (statusFilter as DocumentStatus);
    const docs = await MobileStorage.getDocuments('TRANSFER', filter, selectedLocationId);
    setTransfers(docs);

    const prods = await MobileStorage.getProducts();
    setProducts(prods);
    if (prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
    }

    const locs = await MobileStorage.getLocations();
    setLocations(locs);
    if (locs.length > 1) {
      if (!sourceLocId) setSourceLocId(locs[0].id);
      if (!destLocId) setDestLocId(locs[1].id);
    }
  }, [statusFilter, selectedLocationId, selectedProductId, sourceLocId, destLocId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check source stock whenever product or source changes
  useEffect(() => {
    if (selectedProductId && sourceLocId) {
      MobileStorage.getStockAtLocation(selectedProductId, sourceLocId).then(setAvailableStock);
    }
  }, [selectedProductId, sourceLocId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleValidate = async (id: string, code: string) => {
    Alert.alert(
      'Execute Internal Transfer',
      `Move items for ${code}? Source location stock will decrease and destination location stock will increase simultaneously, keeping global total constant.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Transfer',
          onPress: async () => {
            const res = await MobileStorage.validateDocument(id);
            if (res.success) {
              Alert.alert('Transfer Executed', res.message);
              await loadData();
            } else {
              Alert.alert('Transfer Error', res.message);
            }
          },
        },
      ]
    );
  };

  const handleCreateTransfer = async () => {
    if (sourceLocId === destLocId) {
      Alert.alert('Invalid Route', 'Source and destination locations must be different.');
      return;
    }

    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid transfer quantity (> 0).');
      return;
    }

    if (availableStock !== null && qty > availableStock) {
      Alert.alert(
        'Insufficient Source Stock',
        `Source location only has ${availableStock} units on hand. Cannot transfer ${qty} units.`
      );
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    const src = locations.find((l) => l.id === sourceLocId);
    const dst = locations.find((l) => l.id === destLocId);

    if (!prod || !src || !dst) {
      Alert.alert('Validation Error', 'Product, source, and destination are required.');
      return;
    }

    const newCode = `TRF-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100
    )}`;

    await MobileStorage.createDocument({
      code: newCode,
      type: 'TRANSFER',
      status: 'READY',
      created_by: user?.id || 'usr-default',
      creator_name: user?.name || 'Staff Operative',
      source_location_id: src.id,
      source_location_name: src.name,
      destination_location_id: dst.id,
      destination_location_name: dst.name,
      notes: notes.trim() || undefined,
      lines: [
        {
          id: `line-${Date.now()}`,
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          requested_quantity: qty,
          processed_quantity: qty,
          unit_of_measure: prod.unit_of_measure,
        },
      ],
    });

    setModalVisible(false);
    setQuantity('');
    setNotes('');
    await loadData();
    Alert.alert('Transfer Scheduled', `Transfer ${newCode} created in READY state.`);
  };

  const statuses = ['ALL', 'DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];

  return (
    <SafeAreaView style={styles.container}>
      <LocationHeader />

      {/* Header & Status Chips */}
      <View style={styles.actionHeader}>
        <View>
          <Text style={styles.screenTitle}>Internal Transfers</Text>
          <Text style={styles.screenSub}>Move stock between warehouses, racks, & production</Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-horizontal" size={16} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.createBtnText}>New Transfer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusChipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {statuses.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusChip, statusFilter === st && styles.statusChipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text
                style={[
                  styles.statusChipText,
                  statusFilter === st && styles.statusChipTextActive,
                ]}
              >
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transfers List */}
      <FlatList
        data={transfers}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No transfers found</Text>
            <Text style={styles.emptySub}>Tap &quot;New Transfer&quot; to relocate stock between bins</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.docCard}>
            <View style={styles.docHeader}>
              <View>
                <Text style={styles.docCode}>{item.code}</Text>
                <Text style={styles.docDate}>
                  {new Date(item.created_at).toLocaleDateString()} by {item.creator_name}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            {/* Source to Destination Route */}
            <View style={styles.routeBox}>
              <View style={styles.routePoint}>
                <Ionicons name="exit-outline" size={14} color="#64748b" />
                <Text style={styles.routeText} numberOfLines={1}>
                  From: <Text style={styles.bold}>{item.source_location_name}</Text>
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color="#8b5cf6" style={{ marginHorizontal: 8 }} />
              <View style={styles.routePoint}>
                <Ionicons name="enter-outline" size={14} color="#7c3aed" />
                <Text style={[styles.routeText, { color: '#6d28d9' }]} numberOfLines={1}>
                  To: <Text style={styles.bold}>{item.destination_location_name}</Text>
                </Text>
              </View>
            </View>

            {/* Line items */}
            <View style={styles.lineItemsBox}>
              {item.lines.map((l, idx) => (
                <View key={idx} style={styles.lineRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineProd}>{l.product_name}</Text>
                    <Text style={styles.lineSku}>{l.sku}</Text>
                  </View>
                  <Text style={styles.lineQty}>
                    {l.requested_quantity} {l.unit_of_measure}
                  </Text>
                </View>
              ))}
            </View>

            {item.notes ? (
              <Text style={styles.notesText}>Note: {item.notes}</Text>
            ) : null}

            {/* Validate Action Button */}
            {item.status !== 'DONE' && item.status !== 'CANCELED' && (
              <TouchableOpacity
                style={styles.validateBtn}
                onPress={() => handleValidate(item.id, item.code)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.validateBtnText}>Validate & Complete Transfer</Text>
              </TouchableOpacity>
            )}

            {item.status === 'DONE' && (
              <View style={styles.completedBanner}>
                <Ionicons name="checkmark-circle" size={14} color="#7c3aed" />
                <Text style={styles.completedText}>Inventory Shift Complete (Total Stock Invariant)</Text>
              </View>
            )}
          </View>
        )}
      />

      {/* New Transfer Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Internal Stock Transfer</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Source Origin Location (Transfer From) *</Text>
              <View style={styles.pickerWrap}>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.pickerOption,
                      sourceLocId === loc.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setSourceLocId(loc.id)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        sourceLocId === loc.id && styles.pickerOptionTextActive,
                      ]}
                    >
                      {loc.name} ({loc.code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Destination Location (Transfer To) *</Text>
              <View style={styles.pickerWrap}>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.pickerOption,
                      destLocId === loc.id && styles.pickerOptionActive,
                      loc.id === sourceLocId && styles.pickerOptionDisabled,
                    ]}
                    onPress={() => loc.id !== sourceLocId && setDestLocId(loc.id)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        destLocId === loc.id && styles.pickerOptionTextActive,
                      ]}
                    >
                      {loc.name} {loc.id === sourceLocId ? '(Same as Source)' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Product to Transfer *</Text>
              <View style={styles.pickerWrap}>
                {products.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.pickerOption,
                      selectedProductId === p.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setSelectedProductId(p.id)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        selectedProductId === p.id && styles.pickerOptionTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {p.name} ({p.sku})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Source Stock Indicator */}
              <View style={styles.sourceStockBox}>
                <Ionicons name="information-circle" size={16} color="#7c3aed" />
                <Text style={styles.sourceStockText}>
                  Available at Source:{' '}
                  <Text style={{ fontWeight: '800', color: '#0f172a' }}>
                    {availableStock !== null ? `${availableStock}` : 'Checking...'}
                  </Text>
                </Text>
              </View>

              <Text style={styles.inputLabel}>Quantity to Transfer *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 50"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <Text style={styles.inputLabel}>Transfer Reason / Notes</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Transfer for assembly batch or shelf replenishment"
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTransfer}>
                <Text style={styles.submitBtnText}>Create Transfer Document</Text>
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
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  screenSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  statusChipsWrapper: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusChips: {
    paddingHorizontal: 16,
  },
  statusChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  statusChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  statusChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  docCard: {
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
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  docDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 11,
    color: '#475569',
    marginLeft: 6,
  },
  bold: {
    fontWeight: '700',
    color: '#1e293b',
  },
  lineItemsBox: {
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  lineProd: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  lineSku: {
    fontSize: 10,
    color: '#64748b',
  },
  lineQty: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7c3aed',
  },
  notesText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 6,
  },
  validateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  validateBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ff',
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 10,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6d28d9',
    marginLeft: 4,
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
  pickerWrap: {
    marginTop: 4,
  },
  pickerOption: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  pickerOptionActive: {
    backgroundColor: '#8b5cf6',
  },
  pickerOptionDisabled: {
    opacity: 0.35,
  },
  pickerOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pickerOptionTextActive: {
    color: '#ffffff',
  },
  sourceStockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  sourceStockText: {
    fontSize: 12,
    color: '#6d28d9',
    marginLeft: 6,
  },
  submitBtn: {
    backgroundColor: '#8b5cf6',
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
