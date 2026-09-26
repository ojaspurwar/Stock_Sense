import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationHeader } from '../../components/LocationHeader';
import { StatCard } from '../../components/StatCard';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { MobileStorage } from '../../services/storage';
import { DashboardMetrics, ProductStockSummary } from '../../types';

export const DashboardScreen = ({ navigation }: any) => {
  const { selectedLocationId, currentLocationName } = useLocation();
  const { user, switchRole, logout } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_products: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    pending_receipts: 0,
    pending_deliveries: 0,
    scheduled_transfers: 0,
    recent_adjustments: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<ProductStockSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data = await MobileStorage.getDashboardMetrics(selectedLocationId);
    setMetrics(data);

    const summaries = await MobileStorage.getProductStockSummaries(selectedLocationId);
    setLowStockProducts(summaries.filter((p) => p.is_low_stock || p.is_out_of_stock).slice(0, 3));
  }, [selectedLocationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleRole = async () => {
    if (!user) return;
    const newRole = user.role === 'MANAGER' ? 'STAFF' : 'MANAGER';
    await switchRole(newRole);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with User Profile and Role Toggle */}
      <View style={styles.topBar}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name || 'Inventory Operative'}</Text>
            <TouchableOpacity onPress={handleToggleRole} style={styles.roleTag}>
              <Ionicons
                name={user?.role === 'MANAGER' ? 'shield-checkmark' : 'person'}
                size={12}
                color={user?.role === 'MANAGER' ? '#4f46e5' : '#059669'}
              />
              <Text
                style={[
                  styles.roleText,
                  { color: user?.role === 'MANAGER' ? '#4f46e5' : '#059669' },
                ]}
              >
                {user?.role} (Tap to switch)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Location Filter Header */}
      <LocationHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome & Context Banner */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>StockSense Live Ledger</Text>
            <Text style={styles.bannerSub}>
              Active filter: <Text style={styles.bold}>{currentLocationName}</Text>
            </Text>
          </View>
          <View style={styles.pulseIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.pulseText}>Real-Time</Text>
          </View>
        </View>

        {/* Low Stock Warning Callout */}
        {metrics.low_stock_count > 0 && (
          <TouchableOpacity
            style={styles.alertCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProductsTab', { filter: 'low' })}
          >
            <View style={styles.alertIconBg}>
              <Ionicons name="warning" size={20} color="#b45309" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.alertTitle}>
                {metrics.low_stock_count} item{metrics.low_stock_count > 1 ? 's' : ''} below reorder level
              </Text>
              <Text style={styles.alertSub}>Tap to view critical inventory catalog</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#b45309" />
          </TouchableOpacity>
        )}

        {/* Core KPI Stat Cards */}
        <Text style={styles.sectionHeader}>Operational KPIs</Text>
        <View style={styles.grid}>
          <View style={styles.col}>
            <StatCard
              title="Total Products"
              value={metrics.total_products}
              subtitle="Registered catalog items"
              icon="cube"
              color="#4f46e5"
              onPress={() => navigation.navigate('ProductsTab')}
            />
          </View>
          <View style={styles.col}>
            <StatCard
              title="Low Stock"
              value={metrics.low_stock_count}
              subtitle="Requires reordering"
              icon="alert-circle"
              color="#f59e0b"
              badge={metrics.low_stock_count > 0 ? 'Action' : undefined}
              onPress={() => navigation.navigate('ProductsTab')}
            />
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.col}>
            <StatCard
              title="Pending Receipts"
              value={metrics.pending_receipts}
              subtitle="Inbound shipments"
              icon="arrow-down-circle"
              color="#10b981"
              badge={metrics.pending_receipts > 0 ? 'Dock' : undefined}
              onPress={() => navigation.navigate('Operations', { screen: 'Receipts' })}
            />
          </View>
          <View style={styles.col}>
            <StatCard
              title="Pending Deliveries"
              value={metrics.pending_deliveries}
              subtitle="Outbound orders"
              icon="arrow-up-circle"
              color="#0284c7"
              onPress={() => navigation.navigate('Operations', { screen: 'Deliveries' })}
            />
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.col}>
            <StatCard
              title="Internal Transfers"
              value={metrics.scheduled_transfers}
              subtitle="Scheduled bin moves"
              icon="swap-horizontal"
              color="#8b5cf6"
              onPress={() => navigation.navigate('Operations', { screen: 'Transfers' })}
            />
          </View>
          <View style={styles.col}>
            <StatCard
              title="Out of Stock"
              value={metrics.out_of_stock_count}
              subtitle="Zero on-hand balance"
              icon="close-circle"
              color="#ef4444"
              onPress={() => navigation.navigate('ProductsTab')}
            />
          </View>
        </View>

        {/* Quick Operations Launchpad */}
        <Text style={styles.sectionHeader}>Quick Operations</Text>
        <View style={styles.opsGrid}>
          <TouchableOpacity
            style={styles.opsButton}
            onPress={() => navigation.navigate('Operations', { screen: 'Receipts' })}
          >
            <View style={[styles.opsIcon, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="arrow-down" size={22} color="#059669" />
            </View>
            <Text style={styles.opsTitle}>Receive Goods</Text>
            <Text style={styles.opsDesc}>Incoming vendor receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opsButton}
            onPress={() => navigation.navigate('Operations', { screen: 'Deliveries' })}
          >
            <View style={[styles.opsIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="arrow-up" size={22} color="#2563eb" />
            </View>
            <Text style={styles.opsTitle}>Deliver Order</Text>
            <Text style={styles.opsDesc}>Dispatch outgoing order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opsButton}
            onPress={() => navigation.navigate('Operations', { screen: 'Transfers' })}
          >
            <View style={[styles.opsIcon, { backgroundColor: '#f5f3ff' }]}>
              <Ionicons name="swap-horizontal" size={22} color="#7c3aed" />
            </View>
            <Text style={styles.opsTitle}>Move Stock</Text>
            <Text style={styles.opsDesc}>Transfer between racks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opsButton}
            onPress={() => navigation.navigate('Operations', { screen: 'Adjustments' })}
          >
            <View style={[styles.opsIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="git-commit" size={22} color="#d97706" />
            </View>
            <Text style={styles.opsTitle}>Physical Count</Text>
            <Text style={styles.opsDesc}>Reconcile discrepancies</Text>
          </TouchableOpacity>
        </View>

        {/* Low Stock Items preview */}
        {lowStockProducts.length > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Urgent Stock Attention</Text>
            {lowStockProducts.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemSku}>{item.sku}</Text>
                </View>
                <View style={styles.qtyContainer}>
                  <Text style={styles.qtyText}>
                    {item.total_stock} {item.unit_of_measure}
                  </Text>
                  <Text style={styles.minText}>Min: {item.min_reorder_level}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  bannerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  bold: {
    fontWeight: '700',
    color: '#4f46e5',
  },
  pulseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  pulseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 16,
  },
  alertIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  alertSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  col: {
    flex: 1,
    paddingHorizontal: 4,
  },
  opsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  opsButton: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: '1%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  opsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  opsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  opsDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemSku: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  qtyContainer: {
    alignItems: 'flex-end',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
  minText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
});
