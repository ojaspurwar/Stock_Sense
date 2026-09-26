import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WarehouseScreen } from './WarehouseScreen';
import { ProfileScreen } from '../profile/ProfileScreen';

export const SettingsHubScreen = ({ route }: any) => {
  const [activeTab, setActiveTab] = useState<'WAREHOUSES' | 'PROFILE'>(
    route?.params?.screen === 'PROFILE' ? 'PROFILE' : 'WAREHOUSES'
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Segmented Tabs Bar */}
      <View style={styles.segmentedBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'WAREHOUSES' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('WAREHOUSES')}
        >
          <Ionicons
            name="business"
            size={14}
            color={activeTab === 'WAREHOUSES' ? '#ffffff' : '#4f46e5'}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'WAREHOUSES' && styles.segmentTextActive,
            ]}
          >
            Warehouses & Locations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'PROFILE' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('PROFILE')}
        >
          <Ionicons
            name="person"
            size={14}
            color={activeTab === 'PROFILE' ? '#ffffff' : '#4f46e5'}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'PROFILE' && styles.segmentTextActive,
            ]}
          >
            My Profile & Logout
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.screenWrapper}>
        {activeTab === 'WAREHOUSES' ? <WarehouseScreen /> : <ProfileScreen />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#4f46e5',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 6,
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  screenWrapper: {
    flex: 1,
  },
});
