import React from 'react';
import { AuthScreen } from './AuthScreen';

export const LoginScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  return (
    <AuthScreen
      initialMode="login"
      onSuccess={() => {
        if (navigation) {
          navigation.navigate('Main');
        }
      }}
    />
  );
};
