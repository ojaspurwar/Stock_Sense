import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReceiptsScreen } from './ReceiptsScreen';
import { DeliveriesScreen } from './DeliveriesScreen';
import { TransfersScreen } from './TransfersScreen';
import { AdjustmentsScreen } from './AdjustmentsScreen';

type OperationTab = 'RECEIPTS' | 'DELIVERIES' | 'TRANSFERS' | 'ADJUSTMENTS';

export const OperationsHubScreen = ({ route }: any) => {
  const initialScreen = route?.params?.screen?.toUpperCase() as OperationTab;
  const [activeTab, setActiveTab] = useState<OperationTab>(
    initialScreen && ['RECEIPTS', 'DELIVERIES', 'TRANSFERS', 'ADJUSTMENTS'].includes(initialScreen)
      ? initialScreen
      : 'RECEIPTS'
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Segmented Tabs Bar */}
      <View style={styles.segmentedBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'RECEIPTS' && styles.segmentBtnActiveReceipts]}
          onPress={() => setActiveTab('RECEIPTS')}
        >
          <Ionicons
            name="arrow-down"
            size={13}
            color={activeTab === 'RECEIPTS' ? '#ffffff' : '#059669'}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'RECEIPTS' && styles.segmentTextActive,
            ]}
          >
            Receipts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'DELIVERIES' && styles.segmentBtnActiveDeliveries]}
          onPress={() => setActiveTab('DELIVERIES')}
        >
          <Ionicons
            name="arrow-up"
            size={13}
            color={activeTab === 'DELIVERIES' ? '#ffffff' : '#0284c7'}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'DELIVERIES' && styles.segmentTextActive,
            ]}
          >
            Deliveries
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'TRANSFERS' && styles.segmentBtnActiveTransfers]}
          onPress={() => setActiveTab('TRANSFERS')}
        >
          <Ionicons
            name="swap-horizontal"
            size={13}
            color={activeTab === 'TRANSFERS' ? '#ffffff' : '#7c3aed'}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'TRANSFERS' && styles.segmentTextActive,
            ]}
          >
            Transfers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'ADJUSTMENTS' && styles.segmentBtnActiveAdjustments]}
          onPress={() => setActiveTab('ADJUSTMENTS')}
        >
          <Ionicons
            name="git-commit"
            size={13}
            color={activeTab === 'ADJUSTMENTS' ? '#ffffff' : '#d97706'}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'ADJUSTMENTS' && styles.segmentTextActive,
            ]}
          >
            Adjust
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.screenWrapper}>
        {activeTab === 'RECEIPTS' && <ReceiptsScreen />}
        {activeTab === 'DELIVERIES' && <DeliveriesScreen />}
        {activeTab === 'TRANSFERS' && <TransfersScreen />}
        {activeTab === 'ADJUSTMENTS' && <AdjustmentsScreen />}
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
    marginHorizontal: 12,
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
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentBtnActiveReceipts: {
    backgroundColor: '#10b981',
  },
  segmentBtnActiveDeliveries: {
    backgroundColor: '#0284c7',
  },
  segmentBtnActiveTransfers: {
    backgroundColor: '#8b5cf6',
  },
  segmentBtnActiveAdjustments: {
    backgroundColor: '#d97706',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 3,
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  screenWrapper: {
    flex: 1,
  },
});
