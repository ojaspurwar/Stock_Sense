import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationHeader } from '../../components/LocationHeader';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { MobileStorage } from '../../services/storage';
import { ProductStockSummary, Location } from '../../types';

export const ProductsScreen = ({ route }: any) => {
  const { selectedLocationId } = useLocation();
  const { user } = useAuth();

  const [products, setProducts] = useState<ProductStockSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Expanded product ID for location breakdown
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Product Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Raw Materials');
  const [newProdUom, setNewProdUom] = useState('pcs');
  const [newProdMin, setNewProdMin] = useState('50');
  const [newProdInitQty, setNewProdInitQty] = useState('');
  const [newProdInitLoc, setNewProdInitLoc] = useState('');

  const initialFilter = route?.params?.filter;

  useEffect(() => {
    if (initialFilter === 'low') {
      setFilterMode('LOW');
    }
  }, [initialFilter]);

  const loadData = useCallback(async () => {
    const prods = await MobileStorage.getProductStockSummaries(selectedLocationId);
    setProducts(prods);
    const locs = await MobileStorage.getLocations();
    setLocations(locs);
    if (locs.length > 0 && !newProdInitLoc) {
      setNewProdInitLoc(locs[0].id);
    }
  }, [selectedLocationId, newProdInitLoc]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    let matchesMode = true;
    if (filterMode === 'LOW') matchesMode = p.is_low_stock;
    if (filterMode === 'OUT') matchesMode = p.is_out_of_stock;
    return matchesSearch && matchesCat && matchesMode;
  });

  const handleCreateProduct = async () => {
    if (!newProdName.trim() || !newProdSku.trim()) {
      Alert.alert('Validation Error', 'Product Name and SKU are required.');
      return;
    }

    const minLevel = parseInt(newProdMin, 10) || 10;
    const initQty = parseFloat(newProdInitQty) || 0;

    await MobileStorage.createProduct({
      name: newProdName.trim(),
      sku: newProdSku.trim().toUpperCase(),
      category: newProdCategory,
      unit_of_measure: newProdUom,
      min_reorder_level: minLevel,
      initial_stock:
        initQty > 0
          ? {
              location_id: newProdInitLoc || locations[0]?.id,
              quantity: initQty,
            }
          : undefined,
    });

    setModalVisible(false);
    setNewProdName('');
    setNewProdSku('');
    setNewProdInitQty('');
    await loadData();
    Alert.alert('Success', `Product ${newProdSku.toUpperCase()} created successfully.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LocationHeader />

      {/* Search Bar & Action Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product name or SKU..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {user?.role === 'MANAGER' && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stock Filter Chips */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterMode('ALL')}
        >
          <Text style={[styles.filterChipText, filterMode === 'ALL' && styles.filterChipTextActive]}>
            All ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'LOW' && styles.filterChipActiveWarn]}
          onPress={() => setFilterMode('LOW')}
        >
          <Ionicons
            name="alert-circle"
            size={12}
            color={filterMode === 'LOW' ? '#ffffff' : '#f59e0b'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterChipText,
              filterMode === 'LOW' && styles.filterChipTextActive,
            ]}
          >
            Low Stock ({products.filter((p) => p.is_low_stock).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'OUT' && styles.filterChipActiveDanger]}
          onPress={() => setFilterMode('OUT')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterMode === 'OUT' && styles.filterChipTextActive,
            ]}
          >
            Out of Stock ({products.filter((p) => p.is_out_of_stock).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <View style={styles.catScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySub}>Try searching for another SKU or clear filters</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodName}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.skuBadge}>
                      <Text style={styles.skuText}>{item.sku}</Text>
                    </View>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>

                <View style={styles.stockCol}>
                  <Text
                    style={[
                      styles.stockVal,
                      item.is_out_of_stock && styles.stockValDanger,
                      item.is_low_stock && styles.stockValWarning,
                    ]}
                  >
                    {item.total_stock} {item.unit_of_measure}
                  </Text>
                  <Text style={styles.reorderText}>Min: {item.min_reorder_level}</Text>
                </View>
              </View>

              {/* Status Alert Tags */}
              <View style={styles.badgeRow}>
                {item.is_out_of_stock ? (
                  <View style={[styles.statusTag, styles.statusTagDanger]}>
                    <Text style={styles.statusTagTextDanger}>OUT OF STOCK</Text>
                  </View>
                ) : item.is_low_stock ? (
                  <View style={[styles.statusTag, styles.statusTagWarning]}>
                    <Text style={styles.statusTagTextWarning}>LOW STOCK ALERT</Text>
                  </View>
                ) : (
                  <View style={[styles.statusTag, styles.statusTagGood]}>
                    <Text style={styles.statusTagTextGood}>HEALTHY</Text>
                  </View>
                )}

                <View style={styles.expandHint}>
                  <Text style={styles.expandText}>
                    {isExpanded ? 'Hide Location Breakdown' : 'View Location Breakdown'}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#64748b"
                  />
                </View>
              </View>

              {/* Expandable Location Breakdown */}
              {isExpanded && (
                <View style={styles.breakdownBox}>
                  <Text style={styles.breakdownTitle}>Live Stock by Location:</Text>
                  {item.location_breakdown.length === 0 ? (
                    <Text style={styles.breakdownEmpty}>No stock recorded in any location.</Text>
                  ) : (
                    item.location_breakdown.map((loc) => (
                      <View key={loc.location_id} style={styles.locRow}>
                        <View style={styles.locNameWrap}>
                          <Ionicons name="location-outline" size={14} color="#64748b" />
                          <Text style={styles.locName}>{loc.location_name}</Text>
                        </View>
                        <Text style={styles.locQty}>
                          {loc.quantity} {item.unit_of_measure}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Add Product Modal (Manager Only) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Copper Wire Spool 2.5mm"
                value={newProdName}
                onChangeText={setNewProdName}
              />

              <Text style={styles.inputLabel}>SKU / Item Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. CPR-WIR-025"
                autoCapitalize="characters"
                value={newProdSku}
                onChangeText={setNewProdSku}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.pickerRow}>
                {['Raw Materials', 'Fasteners', 'Fluids & Chemicals', 'Mechanical', 'Packaging'].map(
                  (c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.pickerChip,
                        newProdCategory === c && styles.pickerChipActive,
                      ]}
                      onPress={() => setNewProdCategory(c)}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          newProdCategory === c && styles.pickerTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Unit of Measure (UoM)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="pcs, kg, liters, boxes"
                    value={newProdUom}
                    onChangeText={setNewProdUom}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Min Reorder Level</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="50"
                    keyboardType="number-pad"
                    value={newProdMin}
                    onChangeText={setNewProdMin}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                Optional Initial Opening Stock
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder="0"
                keyboardType="numeric"
                value={newProdInitQty}
                onChangeText={setNewProdInitQty}
              />

              <Text style={styles.inputLabel}>Initial Storage Location</Text>
              <View style={styles.pickerRow}>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[
                      styles.pickerChip,
                      newProdInitLoc === loc.id && styles.pickerChipActive,
                    ]}
                    onPress={() => setNewProdInitLoc(loc.id)}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        newProdInitLoc === loc.id && styles.pickerTextActive,
                      ]}
                    >
                      {loc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateProduct}>
                <Text style={styles.saveBtnText}>Save Product to Catalog</Text>
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterChipActiveWarn: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  filterChipActiveDanger: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  catScrollWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  catScroll: {
    paddingHorizontal: 16,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  catPillActive: {
    backgroundColor: '#e0e7ff',
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  catTextActive: {
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  prodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  skuBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  skuText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  categoryText: {
    fontSize: 11,
    color: '#64748b',
  },
  stockCol: {
    alignItems: 'flex-end',
  },
  stockVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  stockValWarning: {
    color: '#f59e0b',
  },
  stockValDanger: {
    color: '#ef4444',
  },
  reorderText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTagGood: {
    backgroundColor: '#ecfdf5',
  },
  statusTagWarning: {
    backgroundColor: '#fef3c7',
  },
  statusTagDanger: {
    backgroundColor: '#fef2f2',
  },
  statusTagTextGood: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  statusTagTextWarning: {
    fontSize: 9,
    fontWeight: '700',
    color: '#d97706',
  },
  statusTagTextDanger: {
    fontSize: 9,
    fontWeight: '700',
    color: '#dc2626',
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandText: {
    fontSize: 11,
    color: '#64748b',
    marginRight: 4,
  },
  breakdownBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  breakdownEmpty: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  locRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  locNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locName: {
    fontSize: 12,
    color: '#334155',
    marginLeft: 4,
  },
  locQty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
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
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  pickerChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  row: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
