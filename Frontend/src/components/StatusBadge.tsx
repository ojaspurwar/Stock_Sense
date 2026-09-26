import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DocumentStatus } from '../types';

interface StatusBadgeProps {
  status: DocumentStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'DRAFT':
        return { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
      case 'WAITING':
        return { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' };
      case 'READY':
        return { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' };
      case 'DONE':
        return { bg: '#ecfdf5', text: '#047857', dot: '#10b981' };
      case 'CANCELED':
        return { bg: '#ffe4e6', text: '#be123c', dot: '#f43f5e' };
      default:
        return { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
    }
  };

  const style = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <View style={[styles.dot, { backgroundColor: style.dot }]} />
      <Text style={[styles.text, { color: style.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
