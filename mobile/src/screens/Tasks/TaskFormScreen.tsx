import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Image,
} from 'react-native';
import {
  Text,
  useTheme,
  TextInput,
  Button,
  Card,
  Menu,
  List,
  Switch,
  IconButton,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

import { useAppDispatch, useAppSelector } from '../../store';
import { createTask, updateTask } from '../../store/taskSlice';
import { Task, Priority, User, Site } from '../../types';
import { COLORS, SIZES } from '../../constants';
import { CameraComponent } from '../../components/camera';
import { LocationPicker } from '../../components/location';

interface TaskFormScreenProps {
  route?: {
    params?: {
      task?: Task;
      photoUri?: string;
      location?: {
        latitude: number;
        longitude: number;
        address?: string;
      };
    };
  };
  navigation: any;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  assignedToId?: string;
  siteId?: string;
  dueDate?: Date;
}

const taskSchema = yup.object().shape({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required'),
  priority: yup.string().oneOf(['low', 'medium', 'high', 'urgent']).required(),
});

const TaskFormScreen: React.FC<TaskFormScreenProps> = ({ route, navigation }) => {
  const existingTask = route?.params?.task;
  const initialPhotoUri = route?.params?.photoUri;
  const initialLocation = route?.params?.location;
  const isEdit = !!existingTask;
  
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const { loading } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);

  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(initialLocation || existingTask?.location || null);
  const [captureLocation, setCaptureLocation] = useState(!!initialLocation || !!existingTask?.location);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>(
    initialPhotoUri ? [initialPhotoUri] : []
  );

  // Mock data - would come from API
  const [users] = useState<User[]>([]);
  const [sites] = useState<Site[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<TaskFormData>({
    resolver: yupResolver(taskSchema),
    defaultValues: {
      title: existingTask?.title || '',
      description: existingTask?.description || '',
      priority: existingTask?.priority || 'medium',
      assignedToId: existingTask?.assignedTo?.id || '',
      siteId: existingTask?.site?.id || '',
      dueDate: existingTask?.dueDate ? new Date(existingTask.dueDate) : undefined,
    },
    mode: 'onChange',
  });

  const selectedPriority = watch('priority');
  const selectedDueDate = watch('dueDate');

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Task' : 'Create Task',
    });
  }, [isEdit, navigation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to capture location');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = locationData.coords;

      // Get address from coordinates
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.country,
        ]
          .filter(Boolean)
          .join(', ');

        setLocation({
          latitude,
          longitude,
          address: formattedAddress,
        });
      } catch (error) {
        setLocation({ latitude, longitude });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handlePhotoCapture = (photoUri: string, photoLocation?: any) => {
    setCapturedPhotos(prev => [...prev, photoUri]);
    if (photoLocation && !location) {
      setLocation(photoLocation);
      setCaptureLocation(true);
    }
  };

  const handleLocationSelect = (selectedLocation: any) => {
    setLocation(selectedLocation);
    setCaptureLocation(true);
  };

  const removePhoto = (photoUri: string) => {
    setCapturedPhotos(prev => prev.filter(uri => uri !== photoUri));
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      const taskData = {
        ...data,
        dueDate: data.dueDate?.toISOString(),
        location: captureLocation ? location : undefined,
        photos: capturedPhotos.length > 0 ? capturedPhotos : undefined,
      };

      if (isEdit && existingTask) {
        await dispatch(updateTask({ id: existingTask.id, ...taskData })).unwrap();
      } else {
        await dispatch(createTask(taskData)).unwrap();
      }

      Alert.alert(
        'Success',
        `Task ${isEdit ? 'updated' : 'created'} successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'create'} task`);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setValue('dueDate', selectedDate);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'low':
        return COLORS.success;
      case 'medium':
        return COLORS.warning;
      case 'high':
        return COLORS.error;
      case 'urgent':
        return '#d32f2f';
      default:
        return COLORS.secondary;
    }
  };

  const priorityOptions = [
    { label: 'Low', value: 'low' as Priority },
    { label: 'Medium', value: 'medium' as Priority },
    { label: 'High', value: 'high' as Priority },
    { label: 'Urgent', value: 'urgent' as Priority },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <Card.Content>
            {/* Title */}
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Task Title *"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.title}
                  style={styles.input}
                />
              )}
            />
            {errors.title && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.title.message}
              </Text>
            )}

            {/* Description */}
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Description *"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.description}
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                />
              )}
            />
            {errors.description && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.description.message}
              </Text>
            )}

            {/* Priority */}
            <Menu
              visible={priorityMenuVisible}
              onDismiss={() => setPriorityMenuVisible(false)}
              anchor={
                <List.Item
                  title="Priority *"
                  description={selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)}
                  left={(props) => (
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityColor(selectedPriority) },
                      ]}
                    />
                  )}
                  right={(props) => <List.Icon {...props} icon="chevron-down" />}
                  onPress={() => setPriorityMenuVisible(true)}
                  style={styles.menuItem}
                />
              }
            >
              {priorityOptions.map((option) => (
                <Menu.Item
                  key={option.value}
                  title={option.label}
                  onPress={() => {
                    setValue('priority', option.value);
                    setPriorityMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            {/* Due Date */}
            <List.Item
              title="Due Date"
              description={
                selectedDueDate
                  ? selectedDueDate.toLocaleDateString() +
                    ' ' +
                    selectedDueDate.toLocaleTimeString()
                  : 'No due date set'
              }
              left={(props) => <List.Icon {...props} icon="calendar-clock" />}
              right={(props) => (
                <View style={styles.dateActions}>
                  <IconButton
                    icon="calendar"
                    size={20}
                    onPress={() => setShowDatePicker(true)}
                  />
                  {selectedDueDate && (
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => setValue('dueDate', undefined)}
                    />
                  )}
                </View>
              )}
              style={styles.menuItem}
            />

            {showDatePicker && (
              <DateTimePicker
                value={selectedDueDate || new Date()}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {/* Location */}
            <View style={styles.locationSection}>
              <View style={styles.locationHeader}>
                <Text variant="titleSmall">Location</Text>
                <View style={styles.locationButtons}>
                  <IconButton
                    icon="map-marker-plus"
                    size={24}
                    onPress={() => setShowLocationPicker(true)}
                  />
                  <Switch
                    value={captureLocation}
                    onValueChange={(value) => {
                      setCaptureLocation(value);
                      if (value && !location) {
                        getCurrentLocation();
                      } else if (!value) {
                        setLocation(null);
                      }
                    }}
                  />
                </View>
              </View>

              {captureLocation && (
                <View style={styles.locationInfo}>
                  {location ? (
                    <>
                      <List.Item
                        title="Coordinates"
                        description={`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                        left={(props) => <List.Icon {...props} icon="crosshairs-gps" />}
                      />
                      {location.address && (
                        <List.Item
                          title="Address"
                          description={location.address}
                          left={(props) => <List.Icon {...props} icon="map-marker" />}
                        />
                      )}
                      <View style={styles.locationActions}>
                        <Button
                          mode="outlined"
                          onPress={getCurrentLocation}
                          style={styles.locationButton}
                        >
                          Get Current
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => setShowLocationPicker(true)}
                          style={styles.locationButton}
                        >
                          Choose on Map
                        </Button>
                      </View>
                    </>
                  ) : (
                    <View style={styles.locationLoading}>
                      <Text variant="bodyMedium">Getting current location...</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Photos */}
            <View style={styles.photoSection}>
              <View style={styles.photoHeader}>
                <Text variant="titleSmall">Photos</Text>
                <IconButton
                  icon="camera"
                  size={24}
                  onPress={() => setShowCamera(true)}
                />
              </View>

              {capturedPhotos.length > 0 && (
                <View style={styles.photoGrid}>
                  {capturedPhotos.map((photoUri, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image 
                        source={{ uri: photoUri }} 
                        style={styles.photoThumbnail} 
                      />
                      <IconButton
                        icon="close-circle"
                        size={20}
                        iconColor={COLORS.error}
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(photoUri)}
                      />
                    </View>
                  ))}
                </View>
              )}

              {capturedPhotos.length === 0 && (
                <Card style={styles.photoPlaceholder}>
                  <Card.Content style={styles.photoPlaceholderContent}>
                    <Text variant="bodyMedium" style={styles.photoPlaceholderText}>
                      📷 No photos captured yet
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() => setShowCamera(true)}
                      style={styles.captureButton}
                    >
                      Take Photo
                    </Button>
                  </Card.Content>
                </Card>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || loading}
          loading={loading}
          style={styles.submitButton}
        >
          {isEdit ? 'Update Task' : 'Create Task'}
        </Button>
      </View>

      {/* Camera Modal */}
      <CameraComponent
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handlePhotoCapture}
        captureLocation={true}
        taskId={existingTask?.id}
      />

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={location}
        title="Select Task Location"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: SIZES.padding,
  },
  formCard: {
    elevation: 2,
    marginBottom: SIZES.padding * 4,
  },
  input: {
    marginBottom: SIZES.padding,
  },
  errorText: {
    fontSize: 12,
    marginTop: -SIZES.padding + 4,
    marginBottom: SIZES.padding / 2,
  },
  menuItem: {
    borderRadius: 8,
    marginBottom: SIZES.padding / 2,
  },
  priorityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 16,
  },
  dateActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationSection: {
    marginTop: SIZES.padding,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding / 2,
  },
  locationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.padding / 4,
  },
  locationInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: SIZES.padding,
    marginTop: SIZES.padding / 2,
  },
  locationLoading: {
    alignItems: 'center',
    padding: SIZES.padding,
  },
  locationActions: {
    flexDirection: 'row',
    gap: SIZES.padding / 2,
    marginTop: SIZES.padding / 2,
  },
  locationButton: {
    flex: 1,
  },
  photoSection: {
    marginTop: SIZES.padding,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding / 2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.padding / 2,
    marginTop: SIZES.padding / 2,
  },
  photoItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
  },
  photoPlaceholder: {
    backgroundColor: '#f5f5f5',
    marginTop: SIZES.padding / 2,
  },
  photoPlaceholderContent: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
  },
  photoPlaceholderText: {
    marginBottom: SIZES.padding,
    opacity: 0.7,
  },
  captureButton: {
    minWidth: 120,
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
  submitButton: {
    flex: 2,
  },
});

export default TaskFormScreen;