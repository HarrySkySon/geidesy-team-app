import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Text,
  useTheme,
  Button,
  Card,
  List,
  IconButton,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { COLORS, SIZES } from '../../constants';

const { width, height } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  address?: string;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  title?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
  title = 'Select Location',
}) => {
  const theme = useTheme();
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.latitude || 50.4501, // Kyiv default
    longitude: initialLocation?.longitude || 30.5234,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (visible) {
      checkLocationPermission();
    }
  }, [visible]);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
      
      if (status === 'granted' && !initialLocation) {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setHasLocationPermission(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        'Permission Required',
        'Location permission is required to get your current location.'
      );
      return;
    }

    try {
      setIsGettingLocation(true);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
      };

      // Get address from coordinates
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
        
        if (address) {
          const formattedAddress = [
            address.name,
            address.street,
            address.city,
            address.region,
            address.country,
          ]
            .filter(Boolean)
            .join(', ');
          
          locationData.address = formattedAddress;
        }
      } catch (error) {
        console.log('Could not get address:', error);
      }

      setCurrentLocation(locationData);
      setSelectedLocation(locationData);
      setRegion({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    const locationData: LocationData = {
      latitude,
      longitude,
    };

    // Get address for the selected coordinates
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (address) {
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.country,
        ]
          .filter(Boolean)
          .join(', ');
        
        locationData.address = formattedAddress;
      }
    } catch (error) {
      console.log('Could not get address for selected location:', error);
    }

    setSelectedLocation(locationData);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getAccuracyText = (accuracy?: number) => {
    if (!accuracy) return '';
    if (accuracy < 10) return 'High accuracy';
    if (accuracy < 50) return 'Good accuracy';
    return 'Low accuracy';
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return COLORS.secondary;
    if (accuracy < 10) return COLORS.success;
    if (accuracy < 50) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineSmall">{title}</Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={onMapPress}
              showsUserLocation={hasLocationPermission === true}
              showsMyLocationButton={false}
              mapType="hybrid"
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Selected Location"
                  description={selectedLocation.address || formatCoordinates(
                    selectedLocation.latitude,
                    selectedLocation.longitude
                  )}
                />
              )}
            </MapView>

            {/* Current Location Button */}
            <View style={styles.mapControls}>
              <IconButton
                mode="contained"
                icon="crosshairs-gps"
                size={24}
                loading={isGettingLocation}
                onPress={getCurrentLocation}
                disabled={!hasLocationPermission || isGettingLocation}
                style={styles.locationButton}
              />
            </View>
          </View>

          {/* Location Info */}
          {selectedLocation && (
            <Card style={styles.infoCard}>
              <Card.Content>
                <View style={styles.locationInfo}>
                  <List.Item
                    title="Coordinates"
                    description={formatCoordinates(
                      selectedLocation.latitude,
                      selectedLocation.longitude
                    )}
                    left={(props) => <List.Icon {...props} icon="crosshairs-gps" />}
                  />
                  
                  {selectedLocation.address && (
                    <List.Item
                      title="Address"
                      description={selectedLocation.address}
                      left={(props) => <List.Icon {...props} icon="map-marker" />}
                    />
                  )}
                  
                  {selectedLocation.accuracy && (
                    <List.Item
                      title="Accuracy"
                      description={`±${selectedLocation.accuracy.toFixed(1)}m`}
                      left={(props) => <List.Icon {...props} icon="target" />}
                      right={() => (
                        <Chip
                          mode="outlined"
                          textStyle={{ 
                            color: getAccuracyColor(selectedLocation.accuracy),
                            fontSize: 12,
                          }}
                          style={{
                            borderColor: getAccuracyColor(selectedLocation.accuracy),
                          }}
                        >
                          {getAccuracyText(selectedLocation.accuracy)}
                        </Chip>
                      )}
                    />
                  )}

                  {selectedLocation.altitude !== undefined && (
                    <List.Item
                      title="Altitude"
                      description={`${selectedLocation.altitude.toFixed(1)}m above sea level`}
                      left={(props) => <List.Icon {...props} icon="mountain" />}
                    />
                  )}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={onClose}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmLocation}
              disabled={!selectedLocation}
              style={styles.confirmButton}
            >
              Confirm Location
            </Button>
          </View>

          {/* Instructions */}
          {!selectedLocation && (
            <Card style={styles.instructionsCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.instructionsText}>
                  📍 Tap on the map to select a location, or use the GPS button to get your current location
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    margin: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  locationButton: {
    backgroundColor: 'white',
    elevation: 4,
  },
  infoCard: {
    margin: SIZES.padding,
    elevation: 2,
  },
  locationInfo: {
    paddingVertical: SIZES.padding / 2,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SIZES.padding,
    gap: SIZES.padding,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
  instructionsCard: {
    position: 'absolute',
    top: 80,
    left: SIZES.padding,
    right: SIZES.padding,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  instructionsText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default LocationPicker;