import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { api, auth } from '../services/api';

// Screens
import AuthScreen from '../screens/AuthScreen';
import CandidateHomeScreen from '../screens/CandidateHomeScreen';
import RecruiterApplicationsScreen from '../screens/RecruiterApplicationsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Placeholder Screens for unfinished tabs ---
import { Text } from 'react-native';
const PlaceholderScreen = ({ route }) => <View className="flex-1 items-center justify-center"><Text>{route.name}</Text></View>;

// --- Navigators ---
function CandidateTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0F1E36' }, headerTintColor: '#fff', tabBarActiveTintColor: '#FF6B00' }}>
      <Tab.Screen name="HomeFeed" component={CandidateHomeScreen} options={{ title: 'Jobs' }} />
      <Tab.Screen name="Applied" component={PlaceholderScreen} options={{ title: 'Applied' }} />
      <Tab.Screen name="Profile" component={PlaceholderScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function RecruiterTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0F1E36' }, headerTintColor: '#fff', tabBarActiveTintColor: '#FF6B00' }}>
      <Tab.Screen name="PostJob" component={PlaceholderScreen} options={{ title: 'Post Job' }} />
      <Tab.Screen name="Pipeline" component={RecruiterApplicationsScreen} options={{ title: 'Pipeline' }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0F1E36' }, headerTintColor: '#fff', tabBarActiveTintColor: '#FF6B00' }}>
      <Tab.Screen name="ControlCenter" component={AdminDashboardScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="Users" component={PlaceholderScreen} options={{ title: 'Users' }} />
      <Tab.Screen name="Moderation" component={PlaceholderScreen} options={{ title: 'Queue' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const hasToken = await auth.isAuthenticated();
      if (hasToken) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.log("Token invalid or expired", err);
          await auth.clear();
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth">
            {props => <AuthScreen {...props} onLoginSuccess={setUser} />}
          </Stack.Screen>
        ) : user.role === 'admin' ? (
          <Stack.Screen name="AdminRoot" component={AdminTabs} />
        ) : user.role === 'recruiter' ? (
          <Stack.Screen name="RecruiterRoot" component={RecruiterTabs} />
        ) : (
          <Stack.Screen name="CandidateRoot" component={CandidateTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

