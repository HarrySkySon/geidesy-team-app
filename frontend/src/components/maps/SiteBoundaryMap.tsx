import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet';
import {
  Box,
  Button,
  Typography,
  Stack,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  MyLocation as MyLocationIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import L from 'leaflet';
import { SiteBoundaryPoint, sitesService } from '../../services/sites.service';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for boundary points
const boundaryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentPointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface SiteBoundaryMapProps {
  boundaries: SiteBoundaryPoint[];
  center?: [number, number];
  onBoundariesChange: (boundaries: SiteBoundaryPoint[]) => void;
  height?: number | string;
  zoom?: number;
  disabled?: boolean;
  siteCenter?: { latitude: number; longitude: number };
}

// Component to handle map clicks for adding boundary points
const BoundarySelector: React.FC<{
  boundaries: SiteBoundaryPoint[];
  onAddPoint: (lat: number, lng: number) => void;
  disabled: boolean;
}> = ({ boundaries, onAddPoint, disabled }) => {
  useMapEvents({
    click: (e) => {
      if (!disabled) {
        const { lat, lng } = e.latlng;
        onAddPoint(lat, lng);
      }
    },
  });

  return null;
};

const SiteBoundaryMap: React.FC<SiteBoundaryMapProps> = ({
  boundaries,
  center,
  onBoundariesChange,
  height = 500,
  zoom = 15,
  disabled = false,
  siteCenter,
}) => {
  const mapRef = useRef<L.Map>(null);
  const [currentPoint, setCurrentPoint] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate map center
  const mapCenter = React.useMemo(() => {
    if (center) return center;
    if (siteCenter) return [siteCenter.latitude, siteCenter.longitude] as [number, number];
    if (boundaries.length > 0) {
      const avgLat = boundaries.reduce((sum, point) => sum + point.latitude, 0) / boundaries.length;
      const avgLng = boundaries.reduce((sum, point) => sum + point.longitude, 0) / boundaries.length;
      return [avgLat, avgLng] as [number, number];
    }
    return [50.4501, 30.5234] as [number, number]; // Default to Kiev
  }, [center, boundaries, siteCenter]);

  // Auto-fit bounds to show all boundary points
  useEffect(() => {
    if (mapRef.current && boundaries.length > 0) {
      const bounds = L.latLngBounds(
        boundaries.map(point => [point.latitude, point.longitude])
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [boundaries]);

  // Add boundary point
  const handleAddPoint = (lat: number, lng: number) => {
    const newPoint: SiteBoundaryPoint = { latitude: lat, longitude: lng };
    const newBoundaries = [...boundaries, newPoint];
    onBoundariesChange(newBoundaries);
    setError(null);
  };

  // Remove boundary point
  const handleRemovePoint = (index: number) => {
    const newBoundaries = boundaries.filter((_, i) => i !== index);
    onBoundariesChange(newBoundaries);
  };

  // Clear all boundary points
  const clearBoundaries = () => {
    onBoundariesChange([]);
    setError(null);
  };

  // Add current GPS location
  const addCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleAddPoint(latitude, longitude);
        setCurrentPoint([latitude, longitude]);
        
        // Pan map to current location
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], zoom);
        }
      },
      (error) => {
        setError(`Location error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Undo last point
  const undoLastPoint = () => {
    if (boundaries.length > 0) {
      const newBoundaries = boundaries.slice(0, -1);
      onBoundariesChange(newBoundaries);
    }
  };

  // Calculate polygon area
  const polygonArea = React.useMemo(() => {
    if (boundaries.length < 3) return 0;
    return sitesService.calculateBoundaryArea(boundaries);
  }, [boundaries]);

  // Get boundary center
  const boundaryCenter = React.useMemo(() => {
    return sitesService.getBoundaryCenter(boundaries);
  }, [boundaries]);

  // Convert boundaries to Leaflet polygon format
  const polygonPositions = boundaries.map(point => [point.latitude, point.longitude] as [number, number]);

  return (
    <Stack spacing={2}>
      {/* Controls */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Site Boundaries ({boundaries.length} points)
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Add current location">
              <IconButton
                color="primary"
                onClick={addCurrentLocation}
                disabled={disabled}
                size="small"
              >
                <MyLocationIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Undo last point">
              <IconButton
                color="secondary"
                onClick={undoLastPoint}
                disabled={disabled || boundaries.length === 0}
                size="small"
              >
                <UndoIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Clear all points">
              <IconButton
                color="error"
                onClick={clearBoundaries}
                disabled={disabled || boundaries.length === 0}
                size="small"
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Instructions */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Click on the map to add boundary points. You need at least 3 points to form a polygon.
        </Typography>

        {/* Area calculation */}
        {boundaries.length >= 3 && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Area:</strong> {polygonArea.toFixed(6)} square degrees
            </Typography>
            {boundaryCenter && (
              <Typography variant="body2">
                <strong>Center:</strong> {sitesService.formatCoordinates(boundaryCenter.latitude, boundaryCenter.longitude)}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Map */}
      <Box sx={{ height, position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <BoundarySelector
            boundaries={boundaries}
            onAddPoint={handleAddPoint}
            disabled={disabled}
          />

          {/* Site center marker */}
          {siteCenter && (
            <Marker
              position={[siteCenter.latitude, siteCenter.longitude]}
            />
          )}

          {/* Current location marker */}
          {currentPoint && (
            <Marker
              position={currentPoint}
              icon={currentPointIcon}
            />
          )}

          {/* Boundary point markers */}
          {boundaries.map((point, index) => (
            <Marker
              key={index}
              position={[point.latitude, point.longitude]}
              icon={boundaryIcon}
            />
          ))}

          {/* Boundary polygon */}
          {boundaries.length >= 3 && (
            <Polygon
              positions={polygonPositions}
              pathOptions={{
                color: '#3388ff',
                weight: 2,
                fillColor: '#3388ff',
                fillOpacity: 0.2,
              }}
            />
          )}
        </MapContainer>

        {/* Instructions overlay */}
        {boundaries.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              p: 2,
              borderRadius: 1,
              boxShadow: 3,
              textAlign: 'center',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Click on the map to add boundary points
            </Typography>
          </Box>
        )}
      </Box>

      {/* Boundary Points List */}
      {boundaries.length > 0 && (
        <Paper>
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" gutterBottom>
              Boundary Points
            </Typography>
          </Box>
          <List dense>
            {boundaries.map((point, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={`Point ${index + 1}`}
                    secondary={sitesService.formatCoordinates(point.latitude, point.longitude)}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      color="error"
                      onClick={() => handleRemovePoint(index)}
                      disabled={disabled}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < boundaries.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Validation */}
      {boundaries.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Boundary Validation:
          </Typography>
          <Stack direction="row" spacing={2}>
            <Typography 
              variant="caption" 
              color={boundaries.length >= 3 ? 'success.main' : 'warning.main'}
            >
              Points: {boundaries.length >= 3 ? 'Sufficient' : `Need ${3 - boundaries.length} more`}
            </Typography>
            <Typography 
              variant="caption" 
              color={sitesService.isValidBoundary(boundaries) ? 'success.main' : 'error.main'}
            >
              Valid: {sitesService.isValidBoundary(boundaries) ? 'Yes' : 'No'}
            </Typography>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default SiteBoundaryMap;