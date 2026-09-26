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

export const ReceiptsScreen = () => {
  const { selectedLocationId } = useLocation();
  const { user } = useAuth();

  const [receipts, setReceipts] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // New Receipt Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    const filter = statusFilter === 'ALL' ? undefined : (statusFilter as DocumentStatus);
    const docs = await MobileStorage.getDocuments('RECEIPT', filter, selectedLocationId);
    setReceipts(docs);

    const prods = await MobileStorage.getProducts();
    setProducts(prods);
    if (prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
    }

    const locs = await MobileStorage.getLocations();
    setLocations(locs);
    if (locs.length > 0 && !destLocationId) {
      setDestLocationId(locs[0].id);
    }
  }, [statusFilter, selectedLocationId, selectedProductId, destLocationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleValidate = async (id: string, code: string) => {
    Alert.alert(
      'Confirm Receipt Validation',
      `Validate and receive items for ${code}? This will execute the Double-Entry Ledger and credit destination warehouse stock immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Validate & Ingest Stock',
          onPress: async () => {
            const res = await MobileStorage.validateDocument(id);
            if (res.success) {
              Alert.alert('Validated', res.message);
              await loadData();
            } else {
              Alert.alert('Validation Error', res.message);
            }
          },
        },
      ]
    );
  };

  const handleCreateReceipt = async () => {
    if (!vendorName.trim()) {
      Alert.alert('Validation Error', 'Supplier / Vendor name is required.');
      return;
    }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid received quantity (> 0).');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    const destLoc = locations.find((l) => l.id === destLocationId);

    if (!prod || !destLoc) {
      Alert.alert('Validation Error', 'Product and Destination location are required.');
      return;
    }

    const newCode = `REC-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100
    )}`;

    await MobileStorage.createDocument({
      code: newCode,
      type: 'RECEIPT',
      status: 'READY',
      created_by: user?.id || 'usr-default',
      creator_name: user?.name || 'Staff Operative',
      source_location_id: null,
      source_location_name: `${vendorName} (Vendor)`,
      destination_location_id: destLoc.id,
      destination_location_name: destLoc.name,
      partner_name: vendorName.trim(),
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
    setVendorName('');
    setQuantity('');
    setNotes('');
    await loadData();
    Alert.alert('Receipt Created', `Receipt ${newCode} has been logged in READY state.`);
  };

  const statuses = ['ALL', 'DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];

  return (
    <SafeAreaView style={styles.container}>
      <LocationHeader />

      {/* Header & Status Chips */}
      <View style={styles.actionHeader}>
        <View>
          <Text style={styles.screenTitle}>Incoming Receipts</Text>
          <Text style={styles.screenSub}>Vendor items arrival & stock ingestion</Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.createBtnText}>New Receipt</Text>
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

      {/* Receipt Documents List */}
      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="arrow-down-circle-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No receipt documents</Text>
            <Text style={styles.emptySub}>Tap &quot;New Receipt&quot; to log incoming shipments</Text>
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

            <View style={styles.routeBox}>
              <View style={styles.routePoint}>
                <Ionicons name="business" size={14} color="#64748b" />
                <Text style={styles.routeText} numberOfLines={1}>
                  Vendor: {item.partner_name || item.source_location_name || 'External'}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color="#94a3b8" style={{ marginHorizontal: 8 }} />
              <View style={styles.routePoint}>
                <Ionicons name="location" size={14} color="#10b981" />
                <Text style={[styles.routeText, { fontWeight: '700', color: '#047857' }]} numberOfLines={1}>
                  {item.destination_location_name}
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
                    +{l.requested_quantity} {l.unit_of_measure}
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
                <Text style={styles.validateBtnText}>Validate & Ingest Stock (+)</Text>
              </TouchableOpacity>
            )}

            {item.status === 'DONE' && (
              <View style={styles.completedBanner}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.completedText}>Stock Added & Ledger Recorded</Text>
              </View>
            )}
          </View>
        )}
      />

      {/* New Receipt Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Incoming Receipt</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Supplier / Vendor Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Apex Industrial Metals Corp"
                value={vendorName}
                onChangeText={setVendorName}
              />

              <Text style={styles.inputLabel}>Select Received Product *</Text>
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

              <Text style={styles.inputLabel}>Quantity Arrived *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <Text style={styles.inputLabel}>Destination Warehouse Location *</Text>
              <View style={styles.pickerWrap}>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.pickerOption,
                      destLocationId === loc.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setDestLocationId(loc.id)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        destLocationId === loc.id && styles.pickerOptionTextActive,
                      ]}
                    >
                      {loc.name} ({loc.code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Notes / Delivery Slip Details</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Dock 2 delivery, batch #981"
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateReceipt}>
                <Text style={styles.submitBtnText}>Create Receipt Order</Text>
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
    backgroundColor: '#10b981',
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
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
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
    backgroundColor: '#f8fafc',
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
    color: '#334155',
    marginLeft: 6,
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
    color: '#059669',
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
    backgroundColor: '#059669',
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
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 10,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
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
    backgroundColor: '#10b981',
  },
  pickerOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pickerOptionTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#10b981',
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
