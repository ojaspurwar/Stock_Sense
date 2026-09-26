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

export const DeliveriesScreen = () => {
  const { selectedLocationId } = useLocation();
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // New Delivery Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [availableStock, setAvailableStock] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const filter = statusFilter === 'ALL' ? undefined : (statusFilter as DocumentStatus);
    const docs = await MobileStorage.getDocuments('DELIVERY', filter, selectedLocationId);
    setDeliveries(docs);

    const prods = await MobileStorage.getProducts();
    setProducts(prods);
    if (prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
    }

    const locs = await MobileStorage.getLocations();
    setLocations(locs);
    if (locs.length > 0 && !sourceLocationId) {
      setSourceLocationId(locs[0].id);
    }
  }, [statusFilter, selectedLocationId, selectedProductId, sourceLocationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update available stock preview when product or source location changes
  useEffect(() => {
    if (selectedProductId && sourceLocationId) {
      MobileStorage.getStockAtLocation(selectedProductId, sourceLocationId).then(setAvailableStock);
    }
  }, [selectedProductId, sourceLocationId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleValidate = async (id: string, code: string) => {
    Alert.alert(
      'Confirm Delivery Dispatch',
      `Dispatch and validate items for ${code}? Stock will be verified and deducted from the source warehouse in the Double-Entry Ledger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch & Deduct Stock',
          onPress: async () => {
            const res = await MobileStorage.validateDocument(id);
            if (res.success) {
              Alert.alert('Delivery Dispatched', res.message);
              await loadData();
            } else {
              Alert.alert('Insufficient Stock / Error', res.message);
            }
          },
        },
      ]
    );
  };

  const handleCreateDelivery = async () => {
    if (!customerName.trim()) {
      Alert.alert('Validation Error', 'Customer / Client name is required.');
      return;
    }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid requested quantity (> 0).');
      return;
    }

    if (availableStock !== null && qty > availableStock) {
      Alert.alert(
        'Stock Shortage Warning',
        `Current available stock at selected location is only ${availableStock}. You can still create a draft/waiting order, but validation will require sufficient stock.`
      );
    }

    const prod = products.find((p) => p.id === selectedProductId);
    const srcLoc = locations.find((l) => l.id === sourceLocationId);

    if (!prod || !srcLoc) {
      Alert.alert('Validation Error', 'Product and Source Location are required.');
      return;
    }

    const newCode = `DEL-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100
    )}`;

    await MobileStorage.createDocument({
      code: newCode,
      type: 'DELIVERY',
      status: 'WAITING',
      created_by: user?.id || 'usr-default',
      creator_name: user?.name || 'Staff Operative',
      source_location_id: srcLoc.id,
      source_location_name: srcLoc.name,
      destination_location_id: null,
      destination_location_name: `${customerName} (Customer)`,
      partner_name: customerName.trim(),
      notes: notes.trim() || undefined,
      lines: [
        {
          id: `line-${Date.now()}`,
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          requested_quantity: qty,
          processed_quantity: 0,
          unit_of_measure: prod.unit_of_measure,
        },
      ],
    });

    setModalVisible(false);
    setCustomerName('');
    setQuantity('');
    setNotes('');
    await loadData();
    Alert.alert('Order Created', `Delivery Order ${newCode} has been logged in WAITING state.`);
  };

  const statuses = ['ALL', 'DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];

  return (
    <SafeAreaView style={styles.container}>
      <LocationHeader />

      {/* Header & Status Chips */}
      <View style={styles.actionHeader}>
        <View>
          <Text style={styles.screenTitle}>Delivery Orders</Text>
          <Text style={styles.screenSub}>Outgoing customer shipments & picking</Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.createBtnText}>New Delivery</Text>
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

      {/* Deliveries List */}
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="arrow-up-circle-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No delivery orders found</Text>
            <Text style={styles.emptySub}>Tap &quot;New Delivery&quot; to log outbound orders</Text>
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
                <Ionicons name="location" size={14} color="#0284c7" />
                <Text style={[styles.routeText, { fontWeight: '700', color: '#0369a1' }]} numberOfLines={1}>
                  {item.source_location_name}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color="#94a3b8" style={{ marginHorizontal: 8 }} />
              <View style={styles.routePoint}>
                <Ionicons name="people" size={14} color="#64748b" />
                <Text style={styles.routeText} numberOfLines={1}>
                  Customer: {item.partner_name || item.destination_location_name || 'External'}
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
                    -{l.requested_quantity} {l.unit_of_measure}
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
                <Ionicons name="send" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.validateBtnText}>Validate & Dispatch Stock (-)</Text>
              </TouchableOpacity>
            )}

            {item.status === 'DONE' && (
              <View style={styles.completedBanner}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.completedText}>Dispatched & Stock Deducted in Ledger</Text>
              </View>
            )}
          </View>
        )}
      />

      {/* New Delivery Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Outgoing Delivery Order</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Customer / Destination Client *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Metro Machining Industries"
                value={customerName}
                onChangeText={setCustomerName}
              />

              <Text style={styles.inputLabel}>Source Picking Location *</Text>
              <View style={styles.pickerWrap}>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.pickerOption,
                      sourceLocationId === loc.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setSourceLocationId(loc.id)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        sourceLocationId === loc.id && styles.pickerOptionTextActive,
                      ]}
                    >
                      {loc.name} ({loc.code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Select Product to Ship *</Text>
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

              {/* Live stock indicator */}
              <View style={styles.liveStockBox}>
                <Ionicons name="information-circle" size={16} color="#0284c7" />
                <Text style={styles.liveStockText}>
                  Current stock at selected location:{' '}
                  <Text style={{ fontWeight: '800', color: '#0f172a' }}>
                    {availableStock !== null ? `${availableStock}` : 'Checking...'}
                  </Text>
                </Text>
              </View>

              <Text style={styles.inputLabel}>Quantity to Deliver *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 20"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <Text style={styles.inputLabel}>Delivery Instructions / Notes</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Standard freight shipment, attach packing list"
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateDelivery}>
                <Text style={styles.submitBtnText}>Create Delivery Order</Text>
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
    backgroundColor: '#0284c7',
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
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
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
    color: '#ef4444',
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
    backgroundColor: '#0284c7',
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
    backgroundColor: '#0284c7',
  },
  pickerOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pickerOptionTextActive: {
    color: '#ffffff',
  },
  liveStockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  liveStockText: {
    fontSize: 12,
    color: '#0369a1',
    marginLeft: 6,
  },
  submitBtn: {
    backgroundColor: '#0284c7',
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
