import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Text,
  useTheme,
  Card,
  Chip,
  IconButton,
} from 'react-native-paper';
import MapView, { Marker, Circle, Region, Callout } from 'react-native-maps';
import * as Location from 'expo-location';

import { Task, TaskStatus } from '../../types';
import { COLORS, SIZES } from '../../constants';

const { width } = Dimensions.get('window');

interface TaskMapViewProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  showUserLocation?: boolean;
  style?: any;
  initialRegion?: Region;
}

const TaskMapView: React.FC<TaskMapViewProps> = ({
  tasks,
  onTaskPress,
  showUserLocation = true,
  style,
  initialRegion,
}) => {
  const theme = useTheme();
  
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 50.4501, // Kyiv default
      longitude: 30.5234,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    }
  );
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (showUserLocation) {
      getCurrentLocation();
    }
    
    if (tasks.length > 0) {
      fitToTasks();
    }
  }, [tasks, showUserLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Could not get user location:', error);
    }
  };

  const fitToTasks = () => {
    const taskLocations = tasks.filter(task => task.location);
    if (taskLocations.length === 0) return;

    const coordinates = taskLocations.map(task => ({
      latitude: task.location!.latitude,
      longitude: task.location!.longitude,
    }));

    if (coordinates.length === 1) {
      setRegion({
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      // Calculate bounds
      const latitudes = coordinates.map(coord => coord.latitude);
      const longitudes = coordinates.map(coord => coord.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const deltaLat = (maxLat - minLat) * 1.2; // Add padding
      const deltaLng = (maxLng - minLng) * 1.2;
      
      setRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(deltaLat, 0.01),
        longitudeDelta: Math.max(deltaLng, 0.01),
      });
    }
  };

  const getMarkerColor = (status: TaskStatus): string => {
    switch (status) {
      case 'pending':
        return '#FFA726'; // Orange
      case 'in_progress':
        return '#42A5F5'; // Blue
      case 'completed':
        return '#66BB6A'; // Green
      case 'cancelled':
        return '#EF5350'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  const getStatusIcon = (status: TaskStatus): string => {
    switch (status) {
      case 'pending':
        return 'clock-outline';
      case 'in_progress':
        return 'play-circle-outline';
      case 'completed':
        return 'check-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        mapType="hybrid"
        showsCompass={true}
        showsScale={true}
      >
        {/* Task Markers */}
        {tasks
          .filter(task => task.location)
          .map(task => (
            <Marker
              key={task.id}
              coordinate={{
                latitude: task.location!.latitude,
                longitude: task.location!.longitude,
              }}
              pinColor={getMarkerColor(task.status)}
              onPress={() => onTaskPress && onTaskPress(task)}
            >
              <Callout tooltip>
                <Card style={styles.calloutCard}>
                  <Card.Content style={styles.calloutContent}>
                    <View style={styles.calloutHeader}>
                      <Text variant="titleSmall" numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Chip
                        mode="flat"
                        compact
                        icon={getStatusIcon(task.status)}
                        style={[
                          styles.statusChip,
                          { backgroundColor: getMarkerColor(task.status) + '20' }
                        ]}
                        textStyle={{ 
                          color: getMarkerColor(task.status),
                          fontSize: 10,
                        }}
                      >
                        {task.status.toUpperCase()}
                      </Chip>
                    </View>
                    
                    {task.description && (
                      <Text variant="bodySmall" numberOfLines={2} style={styles.calloutDescription}>
                        {task.description}
                      </Text>
                    )}
                    
                    <View style={styles.calloutInfo}>
                      <Text variant="bodySmall" style={styles.calloutCoords}>
                        {task.location!.latitude.toFixed(4)}, {task.location!.longitude.toFixed(4)}
                      </Text>
                      
                      {userLocation && (
                        <Text variant="bodySmall" style={styles.calloutDistance}>
                          {formatDistance(calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            task.location!.latitude,
                            task.location!.longitude
                          ))} away
                        </Text>
                      )}
                    </View>

                    {task.location!.address && (
                      <Text variant="bodySmall" numberOfLines={2} style={styles.calloutAddress}>
                        📍 {task.location!.address}
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              </Callout>
            </Marker>
          ))}

        {/* Accuracy Circles for Tasks with GPS accuracy */}
        {tasks
          .filter(task => task.location && task.location.accuracy)
          .map(task => (
            <Circle
              key={`accuracy-${task.id}`}
              center={{
                latitude: task.location!.latitude,
                longitude: task.location!.longitude,
              }}
              radius={task.location!.accuracy!}
              fillColor={`${getMarkerColor(task.status)}20`}
              strokeColor={getMarkerColor(task.status)}
              strokeWidth={1}
            />
          ))}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <IconButton
          mode="contained"
          icon="crosshairs-gps"
          size={20}
          onPress={getCurrentLocation}
          style={styles.controlButton}
        />
        
        {tasks.length > 0 && (
          <IconButton
            mode="contained"
            icon="fit-to-screen"
            size={20}
            onPress={fitToTasks}
            style={styles.controlButton}
          />
        )}
      </View>

      {/* Legend */}
      <Card style={styles.legend}>
        <Card.Content style={styles.legendContent}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#FFA726' }]} />
            <Text variant="bodySmall">Pending</Text>
            
            <View style={[styles.legendDot, { backgroundColor: '#42A5F5' }]} />
            <Text variant="bodySmall">In Progress</Text>
            
            <View style={[styles.legendDot, { backgroundColor: '#66BB6A' }]} />
            <Text variant="bodySmall">Completed</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'white',
    elevation: 4,
  },
  legend: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
  },
  legendContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  calloutCard: {
    minWidth: 200,
    maxWidth: 280,
  },
  calloutContent: {
    padding: 8,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusChip: {
    height: 24,
  },
  calloutDescription: {
    marginBottom: 4,
    color: '#666',
  },
  calloutInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calloutCoords: {
    fontSize: 10,
    color: '#888',
    fontFamily: 'monospace',
  },
  calloutDistance: {
    fontSize: 10,
    color: '#888',
  },
  calloutAddress: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default TaskMapView;