import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const welcomeSeen = await AsyncStorage.getItem('welcomeSeen');
      setHasSeenWelcome(welcomeSeen === 'true');
    } catch (error) {
      console.error('Error checking welcome status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // First time user - show welcome screen
  if (!hasSeenWelcome) {
    return <Redirect href="/welcome" />;
  }

  // Returning user - go to home
  return <Redirect href="/(tabs)/home" />;
}
