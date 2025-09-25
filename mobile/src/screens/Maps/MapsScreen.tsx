import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  Text,
  useTheme,
  FAB,
  Searchbar,
  SegmentedButtons,
  Card,
} from 'react-native-paper';

import { useAppSelector } from '../../store';
import { TaskMapView } from '../../components/maps';
import { CameraComponent } from '../../components/camera';
import { LocationPicker } from '../../components/location';
import { Task, TaskStatus } from '../../types';
import { SIZES } from '../../constants';

interface MapsScreenProps {
  navigation: any;
}

const MapsScreen: React.FC<MapsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { tasks } = useAppSelector((state) => state.tasks);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, filterStatus]);

  const filterTasks = () => {
    let filtered = tasks.filter(task => task.location);

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.location?.address?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TasksTab', {
      screen: 'TaskDetails',
      params: { taskId: task.id }
    });
  };

  const handlePhotoCapture = (photoUri: string, location?: any) => {
    // Handle the captured photo - could save to task or create new task
    console.log('Photo captured:', photoUri, location);
    // You could navigate to TaskForm with the captured photo
    navigation.navigate('TasksTab', {
      screen: 'TaskForm',
      params: { 
        photoUri,
        location,
      }
    });
  };

  const handleLocationSelect = (location: any) => {
    // Handle selected location - could navigate to create task at this location
    console.log('Location selected:', location);
    navigation.navigate('TasksTab', {
      screen: 'TaskForm',
      params: { location }
    });
  };

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Controls */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Searchbar
            placeholder="Search tasks by location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />
          
          <SegmentedButtons
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as 'all' | TaskStatus)}
            buttons={statusOptions}
            style={styles.segmentedButtons}
          />

          <View style={styles.statsRow}>
            <Text variant="bodyMedium" style={styles.statsText}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} with locations
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Map */}
      <View style={styles.mapContainer}>
        {filteredTasks.length > 0 ? (
          <TaskMapView
            tasks={filteredTasks}
            onTaskPress={handleTaskPress}
            showUserLocation={true}
          />
        ) : (
          <View style={styles.emptyMapContainer}>
            <TaskMapView
              tasks={[]}
              showUserLocation={true}
            />
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No Tasks with Locations
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Create tasks with GPS locations to see them on the map'
                  }
                </Text>
              </Card.Content>
            </Card>
          </View>
        )}
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FAB
          icon="map-marker-plus"
          label="Add Location"
          style={[styles.fab, styles.secondaryFab]}
          onPress={() => setShowLocationPicker(true)}
          variant="secondary"
        />
        <FAB
          icon="camera"
          label="Take Photo"
          style={styles.fab}
          onPress={() => setShowCamera(true)}
        />
      </View>

      {/* Camera Modal */}
      <CameraComponent
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handlePhotoCapture}
        captureLocation={true}
      />

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        title="Select Task Location"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    elevation: 2,
    borderRadius: 0,
  },
  searchBar: {
    marginBottom: SIZES.padding,
  },
  segmentedButtons: {
    marginBottom: SIZES.padding / 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsText: {
    opacity: 0.7,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyMapContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyCard: {
    position: 'absolute',
    top: '40%',
    left: SIZES.padding * 2,
    right: SIZES.padding * 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 4,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: SIZES.padding / 2,
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
  },
  fab: {
    backgroundColor: '#2196F3',
  },
  secondaryFab: {
    backgroundColor: '#4CAF50',
  },
});

export default MapsScreen;