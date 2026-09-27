import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { SituationRoomScreen } from './src/screens/SituationRoomScreen';
import { HighAlertsScreen } from './src/screens/HighAlertsScreen';
import { LiveCamerasScreen } from './src/screens/LiveCamerasScreen';
import { VehiclesScreen } from './src/screens/VehiclesScreen';
import { EvidenceVaultScreen } from './src/screens/EvidenceVaultScreen';
import { OfficerProfileScreen } from './src/screens/OfficerProfileScreen';

const Tab = createBottomTabNavigator();

function MainNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>INITIALIZING KAVACH COMMAND TERMINAL...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f172a',
          borderBottomWidth: 1,
          borderBottomColor: '#1e293b',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontSize: 13,
          fontWeight: 'bold',
          letterSpacing: 1,
        },
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: 'bold',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="Situation"
        component={SituationRoomScreen}
        options={{
          title: 'SITUATION ROOM',
          tabBarLabel: 'Situation',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🛡️</Text>,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={HighAlertsScreen}
        options={{
          title: 'HIGH ALERTS & QRT',
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🚨</Text>,
        }}
      />
      <Tab.Screen
        name="Cameras"
        component={LiveCamerasScreen}
        options={{
          title: 'TACTICAL CAMERAS',
          tabBarLabel: 'Cameras',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>📹</Text>,
        }}
      />
      <Tab.Screen
        name="Vehicles"
        component={VehiclesScreen}
        options={{
          title: 'LIVE ANPR FLEET',
          tabBarLabel: 'ANPR',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🚗</Text>,
        }}
      />
      <Tab.Screen
        name="Vault"
        component={EvidenceVaultScreen}
        options={{
          title: 'EVIDENCE VAULT',
          tabBarLabel: 'Ledger',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>⛓</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={OfficerProfileScreen}
        options={{
          title: 'OFFICER PROFILE',
          tabBarLabel: 'Officer',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🎖️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 14,
  },
});
