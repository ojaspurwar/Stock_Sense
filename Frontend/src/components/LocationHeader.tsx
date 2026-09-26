import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';

export const LocationHeader: React.FC = () => {
  const { selectedLocationId, setSelectedLocationId, locations, currentLocationName } = useLocation();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="business-outline" size={16} color="#4f46e5" style={styles.icon} />
        <Text style={styles.locationText} numberOfLines={1}>
          {currentLocationName}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#64748b" />
      </TouchableOpacity>

      {/* Modal Dropdown */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Warehouse / Location</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.optionItem,
                selectedLocationId === 'all' && styles.selectedOptionItem,
              ]}
              onPress={() => {
                setSelectedLocationId('all');
                setModalVisible(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedLocationId === 'all' && styles.selectedOptionText,
                ]}
              >
                All Locations (Consolidated)
              </Text>
              {selectedLocationId === 'all' && (
                <Ionicons name="checkmark" size={18} color="#4f46e5" />
              )}
            </TouchableOpacity>

            <FlatList
              data={locations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedLocationId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.selectedOptionItem]}
                    onPress={() => {
                      setSelectedLocationId(item.id);
                      setModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                        {item.name}
                      </Text>
                      <Text style={styles.optionSub}>{item.code} • {item.type}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#4f46e5" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  icon: {
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  selectedOptionItem: {
    backgroundColor: '#eef2ff',
  },
  optionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
