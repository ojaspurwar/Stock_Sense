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
import { Document, Product, Location } from '../../types';

export const AdjustmentsScreen = () => {
  const { selectedLocationId } = useLocation();
  const { user } = useAuth();

  const [adjustments, setAdjustments] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // New Adjustment Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [targetLocationId, setTargetLocationId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentSystemStock, setCurrentSystemStock] = useState<number>(0);
  const [countedQtyStr, setCountedQtyStr] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    const docs = await MobileStorage.getDocuments('ADJUSTMENT', undefined, selectedLocationId);
    setAdjustments(docs);

    const prods = await MobileStorage.getProducts();
    setProducts(prods);
    if (prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
    }

    const locs = await MobileStorage.getLocations();
    setLocations(locs);
    if (locs.length > 0 && !targetLocationId) {
      setTargetLocationId(locs[0].id);
    }
  }, [selectedLocationId, selectedProductId, targetLocationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch current system recorded stock when product or location changes
  useEffect(() => {
    if (selectedProductId && targetLocationId) {
      MobileStorage.getStockAtLocation(selectedProductId, targetLocationId).then(setCurrentSystemStock);
    }
  }, [selectedProductId, targetLocationId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const countedQty = parseFloat(countedQtyStr);
  const variance = !isNaN(countedQty) ? countedQty - currentSystemStock : 0;

  const handleApplyAdjustment = async () => {
    if (isNaN(countedQty) || countedQty < 0) {
      Alert.alert('Validation Error', 'Please enter a valid physical counted quantity (>= 0).');
      return;
    }

    if (variance === 0) {
      Alert.alert('No Discrepancy', 'The physical count matches the system recorded stock. No adjustment needed.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    const loc = locations.find((l) => l.id === targetLocationId);

    if (!prod || !loc) {
      Alert.alert('Validation Error', 'Product and Location are required.');
      return;
    }

    const newCode = `ADJ-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100
    )}`;

    // Create adjustment document
    const doc = await MobileStorage.createDocument({
      code: newCode,
      type: 'ADJUSTMENT',
      status: 'READY',
      created_by: user?.id || 'usr-default',
      creator_name: user?.name || 'Staff Operative',
      source_location_id: variance < 0 ? loc.id : null,
      source_location_name: variance < 0 ? loc.name : 'Physical Audit Adjustment',
      destination_location_id: loc.id,
      destination_location_name: loc.name,
      notes: notes.trim() || `Physical count reconciliation: counted ${countedQty}, was ${currentSystemStock}`,
      lines: [
        {
          id: `line-${Date.now()}`,
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          requested_quantity: variance, // delta to apply
          processed_quantity: countedQty,
          unit_of_measure: prod.unit_of_measure,
        },
      ],
    });

    // Automatically validate and update stock levels and ledger
    const res = await MobileStorage.validateDocument(doc.id);

    setModalVisible(false);
    setCountedQtyStr('');
    setNotes('');
    await loadData();

    if (res.success) {
      Alert.alert(
        'Adjustment Applied',
        `Reconciliation complete for ${newCode}. Stock updated to ${countedQty} ${prod.unit_of_measure} (Variance: ${
          variance > 0 ? `+${variance}` : variance
        }).`
      );
    } else {
      Alert.alert('Error', res.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LocationHeader />

      {/* Header */}
      <View style={styles.actionHeader}>
        <View>
          <Text style={styles.screenTitle}>Stock Adjustments</Text>
          <Text style={styles.screenSub}>Reconcile physical inventory counts & discrepancies</Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="git-commit" size={16} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.createBtnText}>New Count</Text>
        </TouchableOpacity>
      </View>

      {/* Adjustments History */}
      <FlatList
        data={adjustments}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No stock adjustments recorded</Text>
            <Text style={styles.emptySub}>Tap &quot;New Count&quot; to perform physical stock audit</Text>
          </View>
        }
        renderItem={({ item }) => {
          const line = item.lines[0];
          const delta = line ? line.requested_quantity : 0;
          const isSurplus = delta >= 0;

          return (
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

              <View style={styles.locationTag}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.locNameText}>
                  Location: <Text style={styles.bold}>{item.destination_location_name}</Text>
                </Text>
              </View>

              {line && (
                <View style={styles.auditRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineProd}>{line.product_name}</Text>
                    <Text style={styles.lineSku}>{line.sku}</Text>
                    <Text style={styles.finalCountText}>
                      Counted Result: {line.processed_quantity} {line.unit_of_measure}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.deltaBadge,
                      isSurplus ? styles.deltaBadgeSurplus : styles.deltaBadgeLoss,
                    ]}
                  >
                    <Ionicons
                      name={isSurplus ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={isSurplus ? '#047857' : '#b91c1c'}
                    />
                    <Text
                      style={[
                        styles.deltaText,
                        isSurplus ? styles.deltaTextSurplus : styles.deltaTextLoss,
                      ]}
                    >
                      {isSurplus ? `+${delta}` : `${delta}`} {line.unit_of_measure}
                    </Text>
                  </View>
                </View>
              )}

              {item.notes ? (
                <Text style={styles.notesText}>Audit reason: {item.notes}</Text>
              ) : null}

              <View style={styles.completedBanner}>
                <Ionicons name="shield-checkmark" size={14} color="#059669" />
                <Text style={styles.completedText}>Reconciled & Logged in Double-Entry Ledger</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Physical Count Reconciliation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Physical Count Reconciliation</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Warehouse / Storage Location *</Text>
              <View style={styles.pickerWrap}>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.pickerOption,
                      targetLocationId === loc.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setTargetLocationId(loc.id)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        targetLocationId === loc.id && styles.pickerOptionTextActive,
                      ]}
                    >
                      {loc.name} ({loc.code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Product Being Audited *</Text>
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

              {/* Comparison Box */}
              <View style={styles.comparisonBox}>
                <View style={styles.comparisonCol}>
                  <Text style={styles.compLabel}>Current System Stock</Text>
                  <Text style={styles.compVal}>{currentSystemStock}</Text>
                </View>

                <Ionicons name="arrow-forward" size={20} color="#94a3b8" />

                <View style={styles.comparisonCol}>
                  <Text style={styles.compLabel}>Discrepancy (Variance)</Text>
                  <Text
                    style={[
                      styles.compVal,
                      variance > 0 && styles.variancePositive,
                      variance < 0 && styles.varianceNegative,
                    ]}
                  >
                    {!isNaN(countedQty)
                      ? variance > 0
                        ? `+${variance}`
                        : `${variance}`
                      : '0'}
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Actual Physical Counted Quantity *</Text>
              <TextInput
                style={[styles.formInput, styles.countInput]}
                placeholder="Enter verified count..."
                keyboardType="numeric"
                value={countedQtyStr}
                onChangeText={setCountedQtyStr}
              />

              <Text style={styles.inputLabel}>Reason / Audit Note</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 3 kg damaged during handling or annual shelf audit"
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleApplyAdjustment}>
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Apply Adjustment to Ledger</Text>
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
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locNameText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  lineProd: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  lineSku: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  finalCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginTop: 4,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deltaBadgeSurplus: {
    backgroundColor: '#ecfdf5',
  },
  deltaBadgeLoss: {
    backgroundColor: '#fef2f2',
  },
  deltaText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 4,
  },
  deltaTextSurplus: {
    color: '#047857',
  },
  deltaTextLoss: {
    color: '#b91c1c',
  },
  notesText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 6,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
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
  countInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
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
    backgroundColor: '#d97706',
  },
  pickerOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pickerOptionTextActive: {
    color: '#ffffff',
  },
  comparisonBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  comparisonCol: {
    alignItems: 'center',
  },
  compLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  compVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  variancePositive: {
    color: '#059669',
  },
  varianceNegative: {
    color: '#dc2626',
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#d97706',
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
