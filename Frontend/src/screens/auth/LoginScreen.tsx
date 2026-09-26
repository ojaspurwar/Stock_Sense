import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    await login(email || 'sarah.connor@stocksense.io', 'MANAGER');
  };

  const handleQuickDemo = async (role: 'MANAGER' | 'STAFF') => {
    if (role === 'MANAGER') {
      await login('sarah.connor@stocksense.io', 'MANAGER');
    } else {
      await login('john.doe@stocksense.io', 'STAFF');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="cube" size={32} color="#ffffff" />
          </View>
          <Text style={styles.title}>StockSense</Text>
          <Text style={styles.subtitle}>Modular IMS & Real-Time Stock Ledger</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="sarah.connor@stocksense.io"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordRow}>
            <Text style={styles.inputLabel}>Password</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password (OTP)?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* Quick Demo Switcher */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>1-Tap Demo Personas</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                style={[styles.demoBtn, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}
                onPress={() => handleQuickDemo('MANAGER')}
              >
                <Ionicons name="shield-checkmark" size={16} color="#4f46e5" />
                <Text style={[styles.demoBtnText, { color: '#4338ca' }]}>Manager</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBtn, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}
                onPress={() => handleQuickDemo('STAFF')}
              >
                <Ionicons name="person" size={16} color="#64748b" />
                <Text style={[styles.demoBtnText, { color: '#334155' }]}>Warehouse Staff</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.signupText}>
              Don&apos;t have an account? <Text style={styles.signupBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  demoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  signupLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 12,
    color: '#64748b',
  },
  signupBold: {
    color: '#4f46e5',
    fontWeight: '700',
  },
});
