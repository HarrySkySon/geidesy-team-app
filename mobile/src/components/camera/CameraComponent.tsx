import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Text,
  useTheme,
  IconButton,
  Button,
  Card,
  Portal,
  Modal,
} from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, SIZES } from '../../constants';

const { width, height } = Dimensions.get('window');

interface CameraComponentProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (photoUri: string, location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) => void;
  captureLocation?: boolean;
  taskId?: string;
}

const CameraComponent: React.FC<CameraComponentProps> = ({
  visible,
  onClose,
  onCapture,
  captureLocation = false,
  taskId,
}) => {
  const theme = useTheme();
  const cameraRef = useRef<Camera>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [isReady, setIsReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<'on' | 'off' | 'auto'>('auto');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (visible) {
      requestPermissions();
    }
  }, [visible]);

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
      
      setHasPermission(cameraStatus === 'granted' && mediaLibraryStatus === 'granted');
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and media library permissions are required to capture photos.'
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request camera permissions');
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      setCapturedPhoto(photo.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const retakePicture = () => {
    setCapturedPhoto(null);
  };

  const savePhoto = async () => {
    if (!capturedPhoto) return;

    try {
      let location: { latitude: number; longitude: number; accuracy?: number } | undefined;
      
      if (captureLocation) {
        // Get current location when saving photo
        const { getCurrentPositionAsync, requestForegroundPermissionsAsync } = await import('expo-location');
        
        const { status } = await requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const locationData = await getCurrentPositionAsync({
              accuracy: 6, // High accuracy
            });
            location = {
              latitude: locationData.coords.latitude,
              longitude: locationData.coords.longitude,
              accuracy: locationData.coords.accuracy || undefined,
            };
          } catch (error) {
            console.log('Could not get location:', error);
          }
        }
      }

      // Generate filename with timestamp and task ID
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `task_${taskId || 'photo'}_${timestamp}.jpg`;
      
      // Copy to a permanent location
      const documentsDir = FileSystem.documentDirectory;
      const newUri = `${documentsDir}${filename}`;
      
      await FileSystem.copyAsync({
        from: capturedPhoto,
        to: newUri,
      });

      // Save to device's photo library
      try {
        await MediaLibrary.saveToLibraryAsync(capturedPhoto);
      } catch (error) {
        console.log('Could not save to library:', error);
      }

      onCapture(newUri, location);
      setCapturedPhoto(null);
      onClose();
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        // Copy to permanent location
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `task_${taskId || 'photo'}_${timestamp}.jpg`;
        const documentsDir = FileSystem.documentDirectory;
        const newUri = `${documentsDir}${filename}`;
        
        await FileSystem.copyAsync({
          from: selectedImage.uri,
          to: newUri,
        });

        onCapture(newUri);
        onClose();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off': return 'on';
        case 'on': return 'auto';
        case 'auto': return 'off';
        default: return 'auto';
      }
    });
  };

  if (hasPermission === null) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={[styles.permissionContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge">Requesting Permissions...</Text>
        </Modal>
      </Portal>
    );
  }

  if (hasPermission === false) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={[styles.permissionContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.permissionTitle}>
            Camera Permission Required
          </Text>
          <Text variant="bodyLarge" style={styles.permissionMessage}>
            Please grant camera and media library permissions to capture photos.
          </Text>
          <View style={styles.permissionButtons}>
            <Button mode="outlined" onPress={onClose}>
              Cancel
            </Button>
            <Button mode="contained" onPress={requestPermissions}>
              Grant Permissions
            </Button>
          </View>
        </Modal>
      </Portal>
    );
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.container}>
          {capturedPhoto ? (
            // Photo Preview
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
              <View style={styles.previewControls}>
                <Button
                  mode="outlined"
                  onPress={retakePicture}
                  style={styles.previewButton}
                >
                  Retake
                </Button>
                <Button
                  mode="contained"
                  onPress={savePhoto}
                  style={styles.previewButton}
                >
                  Save Photo
                </Button>
              </View>
            </View>
          ) : (
            // Camera View
            <View style={styles.cameraContainer}>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                type={cameraType}
                flashMode={flashMode}
                onCameraReady={() => setIsReady(true)}
              >
                <View style={styles.cameraOverlay}>
                  {/* Top Controls */}
                  <View style={styles.topControls}>
                    <IconButton
                      icon="close"
                      iconColor="white"
                      size={30}
                      onPress={onClose}
                    />
                    <View style={styles.topRightControls}>
                      <IconButton
                        icon={
                          flashMode === 'on' ? 'flash' :
                          flashMode === 'auto' ? 'flash-auto' : 'flash-off'
                        }
                        iconColor="white"
                        size={24}
                        onPress={toggleFlash}
                      />
                      <IconButton
                        icon="camera-flip"
                        iconColor="white"
                        size={24}
                        onPress={toggleCameraType}
                      />
                    </View>
                  </View>

                  {/* Center Grid Lines (Optional) */}
                  <View style={styles.centerContent}>
                    <View style={styles.gridContainer}>
                      <View style={styles.gridLine} />
                      <View style={[styles.gridLine, styles.gridLineVertical]} />
                    </View>
                  </View>

                  {/* Bottom Controls */}
                  <View style={styles.bottomControls}>
                    <IconButton
                      icon="image"
                      iconColor="white"
                      size={30}
                      onPress={pickFromGallery}
                    />
                    
                    <TouchableOpacity
                      style={[
                        styles.captureButton,
                        isCapturing && styles.captureButtonDisabled
                      ]}
                      onPress={takePicture}
                      disabled={!isReady || isCapturing}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>

                    <View style={styles.placeholder} />
                  </View>
                </View>
              </Camera>
            </View>
          )}

          {/* Info Card */}
          {captureLocation && !capturedPhoto && (
            <Card style={styles.infoCard}>
              <Card.Content>
                <Text variant="bodySmall" style={styles.infoText}>
                  📍 Location will be captured with this photo
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
    backgroundColor: 'black',
  },
  permissionContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  permissionTitle: {
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  permissionMessage: {
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  permissionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: SIZES.padding,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  topRightControls: {
    flexDirection: 'row',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
    height: 1,
    top: '33%',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    left: '33%',
    top: 0,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  placeholder: {
    width: 60,
    height: 60,
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  previewButton: {
    minWidth: 120,
  },
  infoCard: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  infoText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default CameraComponent;