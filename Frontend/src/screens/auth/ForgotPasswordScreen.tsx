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

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [loading, setLoading] = useState(false);

  const { requestOtp, verifyOtpAndReset } = useAuth();

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your work email.');
      return;
    }
    setLoading(true);
    const res = await requestOtp(email);
    setLoading(false);
    if (res.success) {
      Alert.alert('OTP Sent', `A 6-digit recovery code has been generated:\n\n${res.otp}`);
      setStep('VERIFY');
    }
  };

  const handleResetPassword = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const res = await verifyOtpAndReset(email, otp);
    setLoading(false);
    if (res.success) {
      Alert.alert('Success', 'Password has been reset successfully! Please sign in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } else {
      Alert.alert('Error', res.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step === 'VERIFY' ? setStep('REQUEST') : navigation.goBack())}
        >
          <Ionicons name="arrow-back" size={20} color="#334155" />
          <Text style={styles.backText}>{step === 'VERIFY' ? 'Change Email' : 'Back to Login'}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={28} color="#4f46e5" />
          </View>
          <Text style={styles.title}>
            {step === 'REQUEST' ? 'Reset Password' : 'Enter 6-Digit OTP'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'REQUEST'
              ? 'Enter your registered email to receive an OTP recovery code'
              : `Verification code sent to ${email}`}
          </Text>
        </View>

        <View style={styles.formCard}>
          {step === 'REQUEST' ? (
            <>
              <Text style={styles.inputLabel}>Work Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="sarah.connor@stocksense.io"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? 'Sending OTP...' : 'Send Recovery OTP'}
                </Text>
                <Ionicons name="paper-plane" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>6-Digit OTP Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="849201"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? 'Updating...' : 'Set New Password'}
                </Text>
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </>
          )}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginLeft: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
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
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
    color: '#4f46e5',
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
