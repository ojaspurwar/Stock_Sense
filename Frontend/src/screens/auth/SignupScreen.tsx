import React from 'react';
import { AuthScreen } from './AuthScreen';

export const SignupScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  return (
    <AuthScreen
      initialMode="signup"
      onSuccess={() => {
        if (navigation) {
          navigation.navigate('Main');
        }
      }}
    />
  );
};
