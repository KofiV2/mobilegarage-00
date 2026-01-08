import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import api from '../services/api';

const LOCATION_TYPES = [
  { id: 'home', name: 'Home', icon: 'home', color: '#FF6B35' },
  { id: 'work', name: 'Work', icon: 'work', color: '#2196F3' },
  { id: 'gym', name: 'Gym', icon: 'fitness-center', color: '#4CAF50' },
  { id: 'mall', name: 'Mall', icon: 'shopping-cart', color: '#9C27B0' },
  { id: 'restaurant', name: 'Restaurant', icon: 'restaurant', color: '#FF9800' },
  { id: 'other', name: 'Other', icon: 'place', color: '#607D8B' }
];

const UAE_EMIRATES = [
  { id: 'dubai', name: 'Dubai' },
  { id: 'abu-dhabi', name: 'Abu Dhabi' },
  { id: 'sharjah', name: 'Sharjah' },
  { id: 'ajman', name: 'Ajman' },
  { id: 'ras-al-khaimah', name: 'Ras Al Khaimah' },
  { id: 'fujairah', name: 'Fujairah' },
  { id: 'umm-al-quwain', name: 'Umm Al Quwain' }
];

export default function SavedLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const router = useRouter();

  // Form states
  const [selectedType, setSelectedType] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [emirate, setEmirate] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [isDefault, setIsDefault] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/saved-locations');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setLocationName('');
    setEmirate('');
    setArea('');
    setAddress('');
    setCoordinates(null);
    setIsDefault(false);
    setEditingLocation(null);
  };

  const detectCurrentLocation = async () => {
    try {
      setDetectingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const [addressData] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (addressData) {
        setEmirate(addressData.region || '');
        setArea(addressData.city || addressData.subregion || '');
        setAddress(
          [addressData.street, addressData.streetNumber, addressData.district]
            .filter(Boolean)
            .join(', ')
        );
        setCoordinates({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        Alert.alert('Success', 'Location detected! Please verify the details.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to detect location');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedType || !locationName || !emirate || !area) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }

    try {
      const locationData = {
        type: selectedType.id,
        name: locationName || selectedType.name,
        emirate,
        area,
        address,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        isDefault
      };

      if (editingLocation) {
        await api.put(`/saved-locations/${editingLocation.id}`, locationData);
      } else {
        await api.post('/saved-locations', locationData);
      }

      setShowAddModal(false);
      resetForm();
      fetchLocations();
      Alert.alert('Success', editingLocation ? 'Location updated!' : 'Location saved!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save location');
    }
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setSelectedType(LOCATION_TYPES.find(t => t.id === location.type));
    setLocationName(location.name);
    setEmirate(location.emirate);
    setArea(location.area);
    setAddress(location.address || '');
    setCoordinates(
      location.latitude && location.longitude
        ? { latitude: location.latitude, longitude: location.longitude }
        : null
    );
    setIsDefault(location.isDefault || false);
    setShowAddModal(true);
  };

  const handleDeleteLocation = (locationId) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/saved-locations/${locationId}`);
              fetchLocations();
              Alert.alert('Success', 'Location deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete location');
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (locationId) => {
    try {
      await api.put(`/saved-locations/${locationId}/set-default`);
      fetchLocations();
    } catch (error) {
      Alert.alert('Error', 'Failed to set default location');
    }
  };

  const handleUseLocation = (location) => {
    // Save to AsyncStorage and navigate back
    Alert.alert(
      'Use Location',
      `Use ${location.name} for booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use',
          onPress: () => {
            // Navigate to booking with this location
            router.back();
          }
        }
      ]
    );
  };

  const renderLocationCard = (location) => {
    const type = LOCATION_TYPES.find(t => t.id === location.type);

    return (
      <TouchableOpacity
        key={location.id}
        style={styles.locationCard}
        onPress={() => handleUseLocation(location)}
      >
        <View style={[styles.locationIcon, { backgroundColor: type?.color + '20' }]}>
          <MaterialIcons name={type?.icon || 'place'} size={28} color={type?.color || '#666'} />
        </View>

        <View style={styles.locationInfo}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationName}>{location.name}</Text>
            {location.isDefault && (
              <View style={styles.defaultBadge}>
                <MaterialIcons name="star" size={14} color="#FFD700" />
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>

          <Text style={styles.locationDetails}>
            {location.area}, {location.emirate}
          </Text>

          {location.address && (
            <Text style={styles.locationAddress} numberOfLines={1}>
              {location.address}
            </Text>
          )}

          <View style={styles.locationActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditLocation(location)}
            >
              <MaterialIcons name="edit" size={18} color="#2196F3" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            {!location.isDefault && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleSetDefault(location.id)}
              >
                <MaterialIcons name="star-outline" size={18} color="#FF6B35" />
                <Text style={styles.actionText}>Set Default</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteLocation(location.id)}
            >
              <MaterialIcons name="delete-outline" size={18} color="#EF5350" />
              <Text style={[styles.actionText, { color: '#EF5350' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            {/* Location Type */}
            <Text style={styles.label}>Location Type *</Text>
            <View style={styles.typeGrid}>
              {LOCATION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType?.id === type.id && styles.typeCardSelected,
                    { borderColor: type.color }
                  ]}
                  onPress={() => {
                    setSelectedType(type);
                    if (!locationName) setLocationName(type.name);
                  }}
                >
                  <MaterialIcons
                    name={type.icon}
                    size={32}
                    color={selectedType?.id === type.id ? type.color : '#999'}
                  />
                  <Text style={[
                    styles.typeName,
                    selectedType?.id === type.id && { color: type.color, fontWeight: 'bold' }
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Detect Location Button */}
            <TouchableOpacity
              style={styles.detectButton}
              onPress={detectCurrentLocation}
              disabled={detectingLocation}
            >
              <MaterialIcons
                name="my-location"
                size={20}
                color="#fff"
              />
              <Text style={styles.detectButtonText}>
                {detectingLocation ? 'Detecting...' : 'Detect Current Location'}
              </Text>
            </TouchableOpacity>

            {/* Location Name */}
            <Text style={styles.label}>Location Name *</Text>
            <TextInput
              style={styles.input}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="e.g., My Home, Office, Favorite Mall"
            />

            {/* Emirate */}
            <Text style={styles.label}>Emirate *</Text>
            <View style={styles.emirateGrid}>
              {UAE_EMIRATES.map((em) => (
                <TouchableOpacity
                  key={em.id}
                  style={[
                    styles.emirateChip,
                    emirate === em.name && styles.emirateChipSelected
                  ]}
                  onPress={() => setEmirate(em.name)}
                >
                  <Text style={[
                    styles.emirateText,
                    emirate === em.name && styles.emirateTextSelected
                  ]}>
                    {em.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Area */}
            <Text style={styles.label}>Area *</Text>
            <TextInput
              style={styles.input}
              value={area}
              onChangeText={setArea}
              placeholder="e.g., Dubai Marina, Downtown, JBR"
            />

            {/* Full Address */}
            <Text style={styles.label}>Full Address (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Street address, building name, etc."
              multiline
              numberOfLines={3}
            />

            {/* Coordinates Display */}
            {coordinates && (
              <View style={styles.coordsContainer}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                <Text style={styles.coordsText}>
                  {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Set as Default */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsDefault(!isDefault)}
            >
              <MaterialIcons
                name={isDefault ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#FF6B35"
              />
              <Text style={styles.checkboxLabel}>Set as default location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveLocation}
            >
              <Text style={styles.saveButtonText}>
                {editingLocation ? 'Update Location' : 'Save Location'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {locations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="location-off" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Saved Locations</Text>
            <Text style={styles.emptyText}>
              Save your favorite locations for quick booking
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyButtonText}>Add Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}
            </Text>
            {locations.map(renderLocationCard)}
          </>
        )}
      </ScrollView>

      {renderAddModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  backButton: {
    padding: 5
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  addButton: {
    padding: 5
  },
  content: {
    flex: 1,
    padding: 20
  },
  sectionTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center'
  },
  emptyButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  locationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  locationInfo: {
    flex: 1
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  defaultText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F57C00',
    marginLeft: 3
  },
  locationDetails: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4
  },
  locationAddress: {
    fontSize: 13,
    color: '#999',
    marginBottom: 10
  },
  locationActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  modalForm: {
    padding: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 5
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20
  },
  typeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  typeCardSelected: {
    backgroundColor: '#fff',
    borderWidth: 2
  },
  typeName: {
    fontSize: 12,
    color: '#666',
    marginTop: 5
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  emirateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  emirateChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  emirateChipSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35'
  },
  emirateText: {
    fontSize: 13,
    color: '#666'
  },
  emirateTextSelected: {
    color: '#fff',
    fontWeight: '600'
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8
  },
  coordsText: {
    fontSize: 13,
    color: '#1976D2',
    fontFamily: 'monospace'
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
