import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Box, Typography, Chip, Button, Stack } from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import L from 'leaflet';
import { Site, SiteWithDistance, sitesService } from '../../services/sites.service';

// Import Leaflet CSS (needs to be added to index.html or imported in a CSS file)
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different site types
const createCustomIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `)}`,
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25],
  });
};

const siteIcons = {
  RESIDENTIAL: createCustomIcon('#4CAF50'),
  COMMERCIAL: createCustomIcon('#2196F3'),
  INDUSTRIAL: createCustomIcon('#FF9800'),
  AGRICULTURAL: createCustomIcon('#8BC34A'),
  INFRASTRUCTURE: createCustomIcon('#9C27B0'),
  ENVIRONMENTAL: createCustomIcon('#00BCD4'),
  OTHER: createCustomIcon('#757575'),
};

// Component to update map view when center changes
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface SiteMapProps {
  sites: Site[] | SiteWithDistance[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  onSiteClick?: (site: Site | SiteWithDistance) => void;
  showPopups?: boolean;
  clustered?: boolean;
  interactive?: boolean;
}

const SiteMap: React.FC<SiteMapProps> = ({
  sites,
  center = [50.4501, 30.5234], // Default to Kiev coordinates
  zoom = 10,
  height = 400,
  onSiteClick,
  showPopups = true,
  interactive = true,
}) => {
  const mapRef = useRef<L.Map>(null);

  // Calculate center from sites if not provided
  const mapCenter = React.useMemo(() => {
    if (center) return center;
    
    if (sites.length === 0) return [50.4501, 30.5234];
    
    const avgLat = sites.reduce((sum, site) => sum + site.latitude, 0) / sites.length;
    const avgLng = sites.reduce((sum, site) => sum + site.longitude, 0) / sites.length;
    
    return [avgLat, avgLng] as [number, number];
  }, [sites, center]);

  // Auto-fit bounds to show all sites
  useEffect(() => {
    if (mapRef.current && sites.length > 0) {
      const bounds = L.latLngBounds(
        sites.map(site => [site.latitude, site.longitude])
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [sites]);

  const handleMarkerClick = (site: Site | SiteWithDistance) => {
    if (onSiteClick) {
      onSiteClick(site);
    }
  };

  return (
    <Box sx={{ height, position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        scrollWheelZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
      >
        <ChangeView center={mapCenter} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sites.map((site) => (
          <Marker
            key={site.id}
            position={[site.latitude, site.longitude]}
            icon={siteIcons[site.siteType] || siteIcons.OTHER}
            eventHandlers={{
              click: () => handleMarkerClick(site),
            }}
          >
            {showPopups && (
              <Popup>
                <Box sx={{ minWidth: 200, p: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {site.name}
                  </Typography>
                  
                  {site.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {site.description}
                    </Typography>
                  )}
                  
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={sitesService.getSiteTypeDisplayName(site.siteType)}
                      color={sitesService.getSiteTypeColor(site.siteType)}
                      size="small"
                    />
                    <Chip
                      label={sitesService.getSiteStatusDisplayName(site.status)}
                      color={sitesService.getSiteStatusColor(site.status)}
                      size="small"
                    />
                  </Stack>

                  {site.address && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Address:</strong> {site.address}
                    </Typography>
                  )}

                  <Typography variant="body2" gutterBottom>
                    <strong>Coordinates:</strong> {sitesService.formatCoordinates(site.latitude, site.longitude)}
                  </Typography>

                  {(site as SiteWithDistance).distance !== undefined && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Distance:</strong> {(site as SiteWithDistance).distance.toFixed(2)} km
                    </Typography>
                  )}

                  {site.taskCount !== undefined && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Tasks:</strong> {site.taskCount}
                    </Typography>
                  )}

                  {onSiteClick && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleMarkerClick(site)}
                      sx={{ mt: 1 }}
                    >
                      View Details
                    </Button>
                  )}
                </Box>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          bgcolor: 'background.paper',
          p: 2,
          borderRadius: 1,
          boxShadow: 2,
          zIndex: 1000,
          maxWidth: 200,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Site Types
        </Typography>
        <Stack spacing={0.5}>
          {Object.entries(siteIcons).map(([type, icon]) => (
            <Box key={type} display="flex" alignItems="center" gap={1}>
              <LocationIcon 
                sx={{ 
                  fontSize: 16,
                  color: type === 'RESIDENTIAL' ? '#4CAF50' :
                         type === 'COMMERCIAL' ? '#2196F3' :
                         type === 'INDUSTRIAL' ? '#FF9800' :
                         type === 'AGRICULTURAL' ? '#8BC34A' :
                         type === 'INFRASTRUCTURE' ? '#9C27B0' :
                         type === 'ENVIRONMENTAL' ? '#00BCD4' : '#757575'
                }} 
              />
              <Typography variant="caption">
                {sitesService.getSiteTypeDisplayName(type as any)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default SiteMap;