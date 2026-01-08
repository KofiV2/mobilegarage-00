import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const VEHICLE_TYPES = [
  { id: 'sedan', name: 'Sedan', icon: '🚗' },
  { id: 'suv', name: 'SUV', icon: '🚙' },
  { id: 'truck', name: 'Truck', icon: '🚚' },
  { id: 'van', name: 'Van', icon: '🚐' },
  { id: 'coupe', name: 'Coupe', icon: '🏎️' },
  { id: 'luxury', name: 'Luxury', icon: '✨' }
];

const POPULAR_MAKES = [
  'Toyota', 'Nissan', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz',
  'Audi', 'Lexus', 'Chevrolet', 'Hyundai', 'Kia', 'Mazda',
  'Volkswagen', 'Porsche', 'Land Rover', 'Jeep', 'Other'
];

const COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#008000' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Brown', hex: '#8B4513' }
];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const router = useRouter();

  // Form states
  const [vehicleType, setVehicleType] = useState(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const resetForm = () => {
    setVehicleType(null);
    setMake('');
    setModel('');
    setYear('');
    setColor(null);
    setPlateNumber('');
    setNickname('');
    setPhoto(null);
    setIsDefault(false);
    setSelectedVehicle(null);
  };

  const handleSaveVehicle = async () => {
    if (!vehicleType || !make || !model || !year || !color) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }

    try {
      const vehicleData = {
        type: vehicleType.id,
        make,
        model,
        year: parseInt(year),
        color: color.name,
        plateNumber,
        nickname: nickname || `${make} ${model}`,
        isDefault,
        photo: photo?.uri
      };

      let response;
      if (selectedVehicle) {
        response = await api.put(`/vehicles/${selectedVehicle.id}`, vehicleData);
      } else {
        response = await api.post('/vehicles', vehicleData);
      }

      setShowAddModal(false);
      resetForm();
      fetchVehicles();
      Alert.alert('Success', selectedVehicle ? 'Vehicle updated!' : 'Vehicle added!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save vehicle');
    }
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleType(VEHICLE_TYPES.find(t => t.id === vehicle.type));
    setMake(vehicle.make);
    setModel(vehicle.model);
    setYear(vehicle.year.toString());
    setColor(COLORS.find(c => c.name === vehicle.color));
    setPlateNumber(vehicle.plateNumber || '');
    setNickname(vehicle.nickname || '');
    setIsDefault(vehicle.isDefault);
    setPhoto(vehicle.photo ? { uri: vehicle.photo } : null);
    setShowAddModal(true);
  };

  const handleDeleteVehicle = (vehicleId) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/vehicles/${vehicleId}`);
              fetchVehicles();
              Alert.alert('Success', 'Vehicle deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete vehicle');
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (vehicleId) => {
    try {
      await api.put(`/vehicles/${vehicleId}/set-default`);
      fetchVehicles();
    } catch (error) {
      Alert.alert('Error', 'Failed to set default vehicle');
    }
  };

  const renderVehicleCard = (vehicle) => (
    <TouchableOpacity
      key={vehicle.id}
      style={styles.vehicleCard}
      onPress={() => handleEditVehicle(vehicle)}
    >
      {vehicle.photo && (
        <Image source={{ uri: vehicle.photo }} style={styles.vehiclePhoto} />
      )}

      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleTitle}>
            <Text style={styles.vehicleType}>
              {VEHICLE_TYPES.find(t => t.id === vehicle.type)?.icon || '🚗'}
            </Text>
            <Text style={styles.vehicleName}>{vehicle.nickname}</Text>
          </View>
          {vehicle.isDefault && (
            <View style={styles.defaultBadge}>
              <MaterialIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>

        <Text style={styles.vehicleDetails}>
          {vehicle.make} {vehicle.model} {vehicle.year}
        </Text>

        <View style={styles.vehicleMetadata}>
          <View style={styles.metadataItem}>
            <MaterialIcons name="palette" size={16} color="#666" />
            <Text style={styles.metadataText}>{vehicle.color}</Text>
          </View>
          {vehicle.plateNumber && (
            <View style={styles.metadataItem}>
              <MaterialIcons name="confirmation-number" size={16} color="#666" />
              <Text style={styles.metadataText}>{vehicle.plateNumber}</Text>
            </View>
          )}
        </View>

        <View style={styles.vehicleStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{vehicle.serviceCount || 0}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {vehicle.lastService
                ? new Date(vehicle.lastService).toLocaleDateString()
                : 'Never'}
            </Text>
            <Text style={styles.statLabel}>Last Wash</Text>
          </View>
        </View>

        <View style={styles.vehicleActions}>
          {!vehicle.isDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(vehicle.id)}
            >
              <MaterialIcons name="star-outline" size={20} color="#FF6B35" />
              <Text style={styles.actionButtonText}>Set Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteVehicle(vehicle.id)}
          >
            <MaterialIcons name="delete-outline" size={20} color="#EF5350" />
            <Text style={[styles.actionButtonText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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
              {selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
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
            {/* Vehicle Photo */}
            <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.uploadedPhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MaterialIcons name="add-a-photo" size={40} color="#999" />
                  <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Vehicle Type */}
            <Text style={styles.label}>Vehicle Type *</Text>
            <View style={styles.typeGrid}>
              {VEHICLE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    vehicleType?.id === type.id && styles.typeCardSelected
                  ]}
                  onPress={() => setVehicleType(type)}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.typeName,
                    vehicleType?.id === type.id && styles.typeNameSelected
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Make */}
            <Text style={styles.label}>Make *</Text>
            <View style={styles.makeGrid}>
              {POPULAR_MAKES.map((makeName) => (
                <TouchableOpacity
                  key={makeName}
                  style={[
                    styles.makeChip,
                    make === makeName && styles.makeChipSelected
                  ]}
                  onPress={() => setMake(makeName)}
                >
                  <Text style={[
                    styles.makeText,
                    make === makeName && styles.makeTextSelected
                  ]}>
                    {makeName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Model */}
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="e.g., Camry, Accord, X5"
            />

            {/* Year */}
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              placeholder="e.g., 2023"
              keyboardType="number-pad"
              maxLength={4}
            />

            {/* Color */}
            <Text style={styles.label}>Color *</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((colorOption) => (
                <TouchableOpacity
                  key={colorOption.name}
                  style={[
                    styles.colorOption,
                    { backgroundColor: colorOption.hex },
                    color?.name === colorOption.name && styles.colorSelected
                  ]}
                  onPress={() => setColor(colorOption)}
                >
                  {color?.name === colorOption.name && (
                    <MaterialIcons name="check" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Plate Number */}
            <Text style={styles.label}>Plate Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={plateNumber}
              onChangeText={setPlateNumber}
              placeholder="e.g., ABC-1234"
              autoCapitalize="characters"
            />

            {/* Nickname */}
            <Text style={styles.label}>Nickname (Optional)</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g., My Daily Driver"
            />

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
              <Text style={styles.checkboxLabel}>Set as default vehicle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveVehicle}
            >
              <Text style={styles.saveButtonText}>
                {selectedVehicle ? 'Update Vehicle' : 'Add Vehicle'}
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
        <Text style={styles.headerTitle}>My Vehicles</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="directions-car" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
            <Text style={styles.emptyText}>
              Add your first vehicle to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyButtonText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map(renderVehicleCard)
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
    marginBottom: 30
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
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  vehiclePhoto: {
    width: '100%',
    height: 200,
    resizeMode: 'cover'
  },
  vehicleInfo: {
    padding: 16
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  vehicleTitle: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  vehicleType: {
    fontSize: 24,
    marginRight: 8
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  defaultText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F57C00',
    marginLeft: 4
  },
  vehicleDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12
  },
  vehicleMetadata: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 12
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  metadataText: {
    fontSize: 14,
    color: '#666'
  },
  vehicleStats: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12
  },
  stat: {
    flex: 1
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  statLabel: {
    fontSize: 12,
    color: '#999'
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35'
  },
  actionButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5
  },
  deleteButton: {
    borderColor: '#EF5350'
  },
  deleteText: {
    color: '#EF5350'
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
  photoUpload: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed'
  },
  photoPlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20
  },
  typeCard: {
    width: '30%',
    aspectRatio: 1.2,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  typeCardSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF6B35'
  },
  typeIcon: {
    fontSize: 30,
    marginBottom: 5
  },
  typeName: {
    fontSize: 12,
    color: '#666'
  },
  typeNameSelected: {
    color: '#FF6B35',
    fontWeight: 'bold'
  },
  makeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  makeChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  makeChipSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35'
  },
  makeText: {
    fontSize: 13,
    color: '#666'
  },
  makeTextSelected: {
    color: '#fff',
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd'
  },
  colorSelected: {
    borderColor: '#FF6B35',
    borderWidth: 3
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
