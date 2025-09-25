import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import {
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  Alert,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import L from 'leaflet';
import { sitesService } from '../../services/sites.service';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red marker for location picking
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number | string;
  zoom?: number;
  disabled?: boolean;
}

// Component to handle map clicks
const LocationSelector: React.FC<{
  position: [number, number] | null;
  onLocationSelect: (lat: number, lng: number) => void;
  disabled: boolean;
}> = ({ position, onLocationSelect, disabled }) => {
  useMapEvents({
    click: (e) => {
      if (!disabled) {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
      }
    },
  });

  return position ? <Marker position={position} icon={redIcon} /> : null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  height = 400,
  zoom = 13,
  disabled = false,
}) => {
  const mapRef = useRef<L.Map>(null);
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [center, setCenter] = useState<[number, number]>(
    latitude && longitude ? [latitude, longitude] : [50.4501, 30.5234] // Default to Kiev
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update position when props change
  useEffect(() => {
    if (latitude && longitude) {
      const newPosition: [number, number] = [latitude, longitude];
      setPosition(newPosition);
      setCenter(newPosition);
    }
  }, [latitude, longitude]);

  // Handle location selection
  const handleLocationSelect = (lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    setPosition(newPosition);
    onLocationChange(lat, lng);
    setError(null);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition: [number, number] = [latitude, longitude];
        setPosition(newPosition);
        setCenter(newPosition);
        onLocationChange(latitude, longitude);
        setLoading(false);

        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.setView(newPosition, zoom);
        }
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Search for location (basic implementation - you might want to integrate with a geocoding service)
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // For demo purposes, this is a simplified search
      // In production, you'd integrate with a proper geocoding service like Nominatim or Google Maps
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      if (data.length === 0) {
        setError('Location not found');
        return;
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      const newPosition: [number, number] = [lat, lng];
      setPosition(newPosition);
      setCenter(newPosition);
      onLocationChange(lat, lng);

      // Pan map to new location
      if (mapRef.current) {
        mapRef.current.setView(newPosition, zoom);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Clear selection
  const clearLocation = () => {
    setPosition(null);
    setSearchQuery('');
    setError(null);
  };

  // Handle enter key in search
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  return (
    <Stack spacing={2}>
      {/* Controls */}
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Search */}
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              disabled={disabled || loading}
              InputProps={{
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={searchLocation}
                    disabled={disabled || loading || !searchQuery.trim()}
                  >
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
            
            <Tooltip title="Get current location">
              <IconButton
                color="primary"
                onClick={getCurrentLocation}
                disabled={disabled || loading}
              >
                <MyLocationIcon />
              </IconButton>
            </Tooltip>

            {position && (
              <Tooltip title="Clear selection">
                <IconButton
                  color="error"
                  onClick={clearLocation}
                  disabled={disabled}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Current coordinates */}
          {position && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Selected coordinates:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {sitesService.formatCoordinates(position[0], position[1], 6)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {sitesService.formatCoordinatesDMS(position[0], position[1])}
              </Typography>
            </Box>
          )}
        </Stack>
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
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationSelector
            position={position}
            onLocationSelect={handleLocationSelect}
            disabled={disabled}
          />
        </MapContainer>

        {/* Instructions overlay */}
        {!position && (
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
              Click on the map to select a location
            </Typography>
          </Box>
        )}
      </Box>

      {/* Validation */}
      {position && (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Coordinate Validation:
          </Typography>
          <Stack direction="row" spacing={2}>
            <Typography 
              variant="caption" 
              color={sitesService.isValidLatitude(position[0]) ? 'success.main' : 'error.main'}
            >
              Latitude: {sitesService.isValidLatitude(position[0]) ? 'Valid' : 'Invalid'}
            </Typography>
            <Typography 
              variant="caption" 
              color={sitesService.isValidLongitude(position[1]) ? 'success.main' : 'error.main'}
            >
              Longitude: {sitesService.isValidLongitude(position[1]) ? 'Valid' : 'Invalid'}
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default LocationPicker;