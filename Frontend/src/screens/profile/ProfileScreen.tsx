import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { MobileStorage } from '../../services/storage';

export const ProfileScreen = () => {
  const { user, switchRole, logout } = useAuth();
  const [apiUrl, setApiUrl] = useState('');
  const [dbStats, setDbStats] = useState({ products: 0, locations: 0, ledgerCount: 0 });

  useEffect(() => {
    ApiClient.getBaseUrl().then(setApiUrl);
    MobileStorage.getDB().then((db) => {
      setDbStats({
        products: db.products.length,
        locations: db.locations.length,
        ledgerCount: db.ledger.length,
      });
    });
  }, []);

  const handleSaveApiUrl = async () => {
    if (apiUrl.trim()) {
      await ApiClient.setBaseUrl(apiUrl.trim());
      Alert.alert('Configuration Saved', `API Base URL updated to:\n${apiUrl.trim()}`);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Demo Database',
      'This will reset products, locations, and ledger back to default seed data. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: async () => {
            await MobileStorage.resetToDefaults();
            const db = await MobileStorage.getDB();
            setDbStats({
              products: db.products.length,
              locations: db.locations.length,
              ledgerCount: db.ledger.length,
            });
            Alert.alert('Reset Complete', 'Database has been restored to factory seed state.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View
            style={[
              styles.roleTag,
              { backgroundColor: user?.role === 'MANAGER' ? '#e0e7ff' : '#ecfdf5' },
            ]}
          >
            <Ionicons
              name={user?.role === 'MANAGER' ? 'shield-checkmark' : 'person'}
              size={14}
              color={user?.role === 'MANAGER' ? '#4f46e5' : '#059669'}
            />
            <Text
              style={[
                styles.roleText,
                { color: user?.role === 'MANAGER' ? '#4338ca' : '#047857' },
              ]}
            >
              {user?.role === 'MANAGER' ? 'Inventory Manager' : 'Warehouse Staff'}
            </Text>
          </View>

          {/* Quick Role Switcher */}
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() => switchRole(user?.role === 'MANAGER' ? 'STAFF' : 'MANAGER')}
          >
            <Ionicons name="repeat" size={16} color="#4f46e5" />
            <Text style={styles.switchRoleText}>
              Switch Role to {user?.role === 'MANAGER' ? 'Warehouse Staff' : 'Inventory Manager'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* System & DB Stats */}
        <Text style={styles.sectionTitle}>Local IMS Snapshot</Text>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{dbStats.products}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{dbStats.locations}</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{dbStats.ledgerCount}</Text>
            <Text style={styles.statLabel}>Ledger Logs</Text>
          </View>
        </View>

        {/* Backend API Connection Config */}
        <Text style={styles.sectionTitle}>Backend API Endpoint</Text>
        <View style={styles.configCard}>
          <Text style={styles.configSub}>
            Configure base URL for FastAPI or Vercel server:
          </Text>
          <TextInput
            style={styles.apiInput}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://10.0.2.2:8000/api/v1"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.saveApiBtn} onPress={handleSaveApiUrl}>
            <Text style={styles.saveApiText}>Save API URL</Text>
          </TouchableOpacity>
        </View>

        {/* Factory Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
          <Ionicons name="refresh" size={16} color="#d97706" />
          <Text style={styles.resetBtnText}>Restore Default Seed Inventory</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out" size={18} color="#ef4444" style={{ marginRight: 6 }} />
          <Text style={styles.logoutBtnText}>Sign Out of StockSense</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  avatarBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 16,
  },
  switchRoleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#f1f5f9',
  },
  configCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  configSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  apiInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#0f172a',
  },
  saveApiBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveApiText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
    marginLeft: 6,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 13,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
});
