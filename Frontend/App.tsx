import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';

// Auth Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignupScreen } from './src/screens/auth/SignupScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';

// Main App Screens
import { DashboardScreen } from './src/screens/dashboard/DashboardScreen';
import { ProductsScreen } from './src/screens/products/ProductsScreen';
import { OperationsHubScreen } from './src/screens/operations/OperationsHubScreen';
import { LedgerScreen } from './src/screens/ledger/LedgerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'cube';
          if (route.name === 'Dashboard') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'ProductsTab') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Operations') {
            iconName = focused ? 'layers' : 'layers-outline';
          } else if (route.name === 'Ledger') {
            iconName = focused ? 'journal' : 'journal-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          borderTopColor: '#f1f5f9',
          backgroundColor: '#ffffff',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsScreen}
        options={{ title: 'Catalog' }}
      />
      <Tab.Screen
        name="Operations"
        component={OperationsHubScreen}
        options={{ title: 'Operations' }}
      />
      <Tab.Screen
        name="Ledger"
        component={LedgerScreen}
        options={{ title: 'Ledger' }}
      />
    </Tab.Navigator>
  );
}

function NavigationRoot() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <StatusBar style="dark" />
          <NavigationRoot />
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
