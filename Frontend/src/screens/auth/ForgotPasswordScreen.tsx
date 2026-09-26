import React from 'react';
import { AuthScreen } from './AuthScreen';

export const ForgotPasswordScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  return (
    <AuthScreen
      initialMode="otp"
      onSuccess={() => {
        if (navigation) {
          navigation.navigate('Login');
        }
      }}
    />
  );
};
