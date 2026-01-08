import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const UAE_EMIRATES = [
  { id: 'abu-dhabi', name: 'Abu Dhabi', icon: '🏛️' },
  { id: 'dubai', name: 'Dubai', icon: '🏙️' },
  { id: 'sharjah', name: 'Sharjah', icon: '🕌' },
  { id: 'ajman', name: 'Ajman', icon: '🏖️' },
  { id: 'umm-al-quwain', name: 'Umm Al Quwain', icon: '🌊' },
  { id: 'ras-al-khaimah', name: 'Ras Al Khaimah', icon: '⛰️' },
  { id: 'fujairah', name: 'Fujairah', icon: '🏔️' }
];

const DUBAI_AREAS = [
  'Downtown Dubai',
  'Dubai Marina',
  'Jumeirah',
  'Business Bay',
  'Dubai Silicon Oasis',
  'JBR',
  'Palm Jumeirah',
  'Deira',
  'Bur Dubai',
  'Al Barsha',
  'Discovery Gardens',
  'International City',
  'Motor City',
  'Sports City',
  'Arabian Ranches',
  'JLT',
  'DIFC',
  'Other'
];

const ABU_DHABI_AREAS = [
  'Al Reem Island',
  'Yas Island',
  'Saadiyat Island',
  'Al Raha Beach',
  'Khalifa City',
  'Masdar City',
  'Al Reef',
  'Al Shamkha',
  'Mohammed Bin Zayed City',
  'Musaffah',
  'Corniche',
  'Al Nahyan',
  'Al Khalidiya',
  'Tourist Club Area',
  'Other'
];

export default function LocationSetup() {
  const [step, setStep] = useState('method'); // 'method', 'detecting', 'manual-emirate', 'manual-area'
  const [selectedEmirate, setSelectedEmirate] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const { continueAsGuest, isGuest } = useAuth();
  const router = useRouter();

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      setStep('detecting');

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to provide better service. You can still enter your location manually.',
          [
            { text: 'Enter Manually', onPress: () => setStep('manual-emirate') }
          ]
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      // Reverse geocode to get address
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (address && address.length > 0) {
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city: address[0].city || address[0].region || 'Unknown',
          region: address[0].region || 'Unknown',
          country: address[0].country || 'UAE'
        };

        setDetectedLocation(locationData);
        await saveLocationAndProceed(locationData);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Could not get your location. Please enter it manually.',
        [
          { text: 'OK', onPress: () => setStep('manual-emirate') }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualLocation = () => {
    setStep('manual-emirate');
  };

  const handleEmirateSelect = (emirate) => {
    setSelectedEmirate(emirate);
    setStep('manual-area');
  };

  const handleAreaSelect = async (area) => {
    setSelectedArea(area);

    const locationData = {
      emirate: selectedEmirate.name,
      area: area,
      manualEntry: true
    };

    await saveLocationAndProceed(locationData);
  };

  const saveLocationAndProceed = async (locationData) => {
    try {
      await AsyncStorage.setItem('userLocation', JSON.stringify(locationData));

      // If user came as guest, mark guest mode
      if (isGuest) {
        await continueAsGuest();
      }

      // Navigate to main app
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.stepContainer}>
      <MaterialIcons name="location-on" size={100} color="#fff" style={styles.icon} />
      <Text style={styles.title}>Set Your Location</Text>
      <Text style={styles.subtitle}>
        Help us serve you better by providing your location
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={requestLocationPermission}
        disabled={loading}
      >
        <MaterialIcons name="my-location" size={24} color="#FF6B35" />
        <Text style={styles.primaryButtonText}>Use Current Location</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleManualLocation}
      >
        <MaterialIcons name="edit-location" size={24} color="#fff" />
        <Text style={styles.secondaryButtonText}>Enter Manually</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.replace('/(tabs)/home')}
      >
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetecting = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color="#fff" style={styles.loader} />
      <Text style={styles.title}>Detecting Location...</Text>
      <Text style={styles.subtitle}>Please wait while we find your location</Text>
    </View>
  );

  const renderEmirateSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Select Your Emirate</Text>
      <Text style={styles.subtitle}>Choose which emirate you're in</Text>

      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {UAE_EMIRATES.map((emirate) => (
          <TouchableOpacity
            key={emirate.id}
            style={styles.optionButton}
            onPress={() => handleEmirateSelect(emirate)}
          >
            <Text style={styles.optionIcon}>{emirate.icon}</Text>
            <Text style={styles.optionText}>{emirate.name}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('method')}
      >
        <MaterialIcons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAreaSelection = () => {
    const areas = selectedEmirate?.id === 'dubai' ? DUBAI_AREAS :
                  selectedEmirate?.id === 'abu-dhabi' ? ABU_DHABI_AREAS :
                  ['Please select area', 'Other'];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.title}>Select Your Area</Text>
        <Text style={styles.subtitle}>
          Choose your area in {selectedEmirate?.name}
        </Text>

        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {areas.map((area, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleAreaSelect(area)}
            >
              <MaterialIcons name="place" size={24} color="#FF6B35" />
              <Text style={styles.optionText}>{area}</Text>
              <MaterialIcons name="chevron-right" size={24} color="#333" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('manual-emirate')}
        >
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 'method' && renderMethodSelection()}
        {step === 'detecting' && renderDetecting()}
        {step === 'manual-emirate' && renderEmirateSelection()}
        {step === 'manual-area' && renderAreaSelection()}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    marginBottom: 20
  },
  loader: {
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.95,
    paddingHorizontal: 20
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  primaryButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#fff',
    width: '100%'
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  },
  skipButton: {
    marginTop: 20
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  optionsList: {
    width: '100%',
    maxHeight: 400
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 15
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
    fontWeight: '500'
  }
});
