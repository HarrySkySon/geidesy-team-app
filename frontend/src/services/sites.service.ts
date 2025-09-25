import { apiService, ApiResponse } from './api.service';

// Site-related interfaces
export interface Site {
  id: string;
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  siteType: SiteType;
  status: SiteStatus;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  boundaries?: SiteBoundaryPoint[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  taskCount?: number;
  hasBoundaries?: boolean;
  coordinates?: SiteCoordinates;
}

export interface SiteWithDetails extends Site {
  tasks: SiteTask[];
  statistics: SiteStatistics;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SiteTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
    status: string;
  };
}

export interface SiteStatistics {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  completionRate: number;
}

export interface SiteCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface SiteBoundaryPoint {
  latitude: number;
  longitude: number;
}

export interface SiteWithDistance extends Site {
  distance: number;
}

export type SiteType = 
  | 'RESIDENTIAL' 
  | 'COMMERCIAL' 
  | 'INDUSTRIAL' 
  | 'AGRICULTURAL' 
  | 'INFRASTRUCTURE' 
  | 'ENVIRONMENTAL' 
  | 'OTHER';

export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'PLANNED' | 'COMPLETED';

export interface CreateSiteRequest {
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  siteType?: SiteType;
  status?: SiteStatus;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  boundaries?: SiteBoundaryPoint[];
  notes?: string;
}

export interface UpdateSiteRequest {
  name?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
  siteType?: SiteType;
  status?: SiteStatus;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  boundaries?: SiteBoundaryPoint[];
  notes?: string;
}

export interface SiteFilters {
  page?: number;
  limit?: number;
  search?: string;
  siteType?: SiteType;
  status?: SiteStatus;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'siteType' | 'status';
  sortOrder?: 'asc' | 'desc';
  // Geospatial filters
  nearLat?: number;
  nearLng?: number;
  radius?: number;
  // Bounding box filter
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
}

export interface SitesResponse {
  sites: Site[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface NearbySitesResponse {
  sites: SiteWithDistance[];
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
}

export interface SiteStatisticsResponse {
  total: number;
  byType: Record<SiteType, number>;
  byStatus: Record<SiteStatus, number>;
  recent: Array<{
    id: string;
    name: string;
    siteType: SiteType;
    status: SiteStatus;
    createdAt: string;
  }>;
}

// Sites service class
export class SitesService {

  // Get all sites with filtering and pagination
  async getSites(filters: SiteFilters = {}): Promise<SitesResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/sites?${queryString}` : '/sites';
    
    const response = await apiService.get<SitesResponse>(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch sites');
  }

  // Get single site by ID
  async getSite(id: string): Promise<SiteWithDetails> {
    const response = await apiService.get<{ site: SiteWithDetails }>(`/sites/${id}`);
    
    if (response.success && response.data) {
      return response.data.site;
    }
    
    throw new Error(response.error || 'Failed to fetch site');
  }

  // Create new site
  async createSite(siteData: CreateSiteRequest): Promise<Site> {
    const response = await apiService.post<{ site: Site }>('/sites', siteData);
    
    if (response.success && response.data) {
      return response.data.site;
    }
    
    throw new Error(response.error || 'Failed to create site');
  }

  // Update site
  async updateSite(id: string, updates: UpdateSiteRequest): Promise<Site> {
    const response = await apiService.put<{ site: Site }>(`/sites/${id}`, updates);
    
    if (response.success && response.data) {
      return response.data.site;
    }
    
    throw new Error(response.error || 'Failed to update site');
  }

  // Delete site
  async deleteSite(id: string): Promise<void> {
    const response = await apiService.delete(`/sites/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete site');
    }
  }

  // Get sites near a location
  async getSitesNearLocation(
    latitude: number, 
    longitude: number, 
    radius: number = 10, 
    limit: number = 50
  ): Promise<NearbySitesResponse> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
      limit: limit.toString(),
    });

    const response = await apiService.get<NearbySitesResponse>(`/sites/nearby?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch nearby sites');
  }

  // Get site statistics
  async getSiteStatistics(): Promise<SiteStatisticsResponse> {
    const response = await apiService.get<{ statistics: SiteStatisticsResponse }>('/sites/statistics');
    
    if (response.success && response.data) {
      return response.data.statistics;
    }
    
    throw new Error(response.error || 'Failed to fetch site statistics');
  }

  // Helper methods for filtering
  async getSitesByType(siteType: SiteType): Promise<Site[]> {
    const response = await this.getSites({ siteType });
    return response.sites;
  }

  async getSitesByStatus(status: SiteStatus): Promise<Site[]> {
    const response = await this.getSites({ status });
    return response.sites;
  }

  async searchSites(query: string): Promise<Site[]> {
    const response = await this.getSites({ search: query });
    return response.sites;
  }

  async getActiveSites(): Promise<Site[]> {
    return this.getSitesByStatus('ACTIVE');
  }

  async getSitesInBoundingBox(
    swLat: number, 
    swLng: number, 
    neLat: number, 
    neLng: number
  ): Promise<Site[]> {
    const response = await this.getSites({ swLat, swLng, neLat, neLng });
    return response.sites;
  }

  // Utility methods
  getSiteTypeDisplayName(siteType: SiteType): string {
    const typeNames: Record<SiteType, string> = {
      'RESIDENTIAL': 'Residential',
      'COMMERCIAL': 'Commercial',
      'INDUSTRIAL': 'Industrial',
      'AGRICULTURAL': 'Agricultural',
      'INFRASTRUCTURE': 'Infrastructure',
      'ENVIRONMENTAL': 'Environmental',
      'OTHER': 'Other',
    };
    return typeNames[siteType] || siteType;
  }

  getSiteStatusDisplayName(status: SiteStatus): string {
    const statusNames: Record<SiteStatus, string> = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'PLANNED': 'Planned',
      'COMPLETED': 'Completed',
    };
    return statusNames[status] || status;
  }

  getSiteTypeColor(siteType: SiteType): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' {
    const typeColors: Record<SiteType, any> = {
      'RESIDENTIAL': 'info',
      'COMMERCIAL': 'primary',
      'INDUSTRIAL': 'warning',
      'AGRICULTURAL': 'success',
      'INFRASTRUCTURE': 'secondary',
      'ENVIRONMENTAL': 'success',
      'OTHER': 'default',
    };
    return typeColors[siteType] || 'default';
  }

  getSiteStatusColor(status: SiteStatus): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' {
    const statusColors: Record<SiteStatus, any> = {
      'ACTIVE': 'success',
      'INACTIVE': 'default',
      'PLANNED': 'info',
      'COMPLETED': 'primary',
    };
    return statusColors[status] || 'default';
  }

  // Coordinate validation
  isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  isValidLongitude(lng: number): boolean {
    return lng >= -180 && lng <= 180;
  }

  isValidCoordinates(lat: number, lng: number): boolean {
    return this.isValidLatitude(lat) && this.isValidLongitude(lng);
  }

  // Distance calculation (Haversine formula)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Format coordinates for display
  formatCoordinates(lat: number, lng: number, precision: number = 6): string {
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
  }

  formatCoordinatesDMS(lat: number, lng: number): string {
    const formatDMS = (coord: number, isLat: boolean): string => {
      const abs = Math.abs(coord);
      const degrees = Math.floor(abs);
      const minutes = Math.floor((abs - degrees) * 60);
      const seconds = ((abs - degrees - minutes / 60) * 3600).toFixed(2);
      const direction = coord >= 0 
        ? (isLat ? 'N' : 'E') 
        : (isLat ? 'S' : 'W');
      return `${degrees}°${minutes}'${seconds}"${direction}`;
    };

    return `${formatDMS(lat, true)}, ${formatDMS(lng, false)}`;
  }

  // Boundary validation
  isValidBoundary(boundaries: SiteBoundaryPoint[]): boolean {
    return boundaries.length >= 3 && boundaries.every(point => 
      this.isValidCoordinates(point.latitude, point.longitude)
    );
  }

  // Calculate area of boundary polygon (simplified)
  calculateBoundaryArea(boundaries: SiteBoundaryPoint[]): number {
    if (boundaries.length < 3) return 0;

    let area = 0;
    const n = boundaries.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += boundaries[i].longitude * boundaries[j].latitude;
      area -= boundaries[j].longitude * boundaries[i].latitude;
    }

    return Math.abs(area) / 2;
  }

  // Get center point of boundary polygon
  getBoundaryCenter(boundaries: SiteBoundaryPoint[]): SiteBoundaryPoint | null {
    if (boundaries.length === 0) return null;

    const sumLat = boundaries.reduce((sum, point) => sum + point.latitude, 0);
    const sumLng = boundaries.reduce((sum, point) => sum + point.longitude, 0);

    return {
      latitude: sumLat / boundaries.length,
      longitude: sumLng / boundaries.length,
    };
  }

  // Site recommendations based on location and type
  async getRecommendedSites(
    userLat: number, 
    userLng: number, 
    preferredTypes?: SiteType[]
  ): Promise<Site[]> {
    const nearbySites = await this.getSitesNearLocation(userLat, userLng, 50);
    
    let filtered = nearbySites.sites;
    
    if (preferredTypes && preferredTypes.length > 0) {
      filtered = filtered.filter(site => preferredTypes.includes(site.siteType));
    }
    
    // Sort by distance and relevance
    return filtered
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }
}

// Export singleton instance
export const sitesService = new SitesService();
export default sitesService;