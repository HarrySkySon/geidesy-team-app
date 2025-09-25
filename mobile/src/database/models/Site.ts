import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, writer } from '@nozbe/watermelondb/decorators';

export default class Site extends Model {
  static table = 'sites';

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('description') description?: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('address') address?: string;
  @field('boundary_coordinates') boundaryCoordinates?: string; // JSON string
  @field('is_active') isActive!: boolean;
  @date('last_sync_at') lastSyncAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Get location object
  get location(): { latitude: number; longitude: number; address?: string } {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      address: this.address,
    };
  }

  // Get boundary as coordinate array
  get boundary(): Array<{ latitude: number; longitude: number }> | null {
    if (!this.boundaryCoordinates) return null;
    
    try {
      return JSON.parse(this.boundaryCoordinates);
    } catch (error) {
      console.error('Error parsing boundary coordinates:', error);
      return null;
    }
  }

  // Set boundary coordinates
  @writer async setBoundary(coordinates: Array<{ latitude: number; longitude: number }>): Promise<void> {
    await this.update(site => {
      site.boundaryCoordinates = JSON.stringify(coordinates);
    });
  }

  // Mark site as synced
  @writer async markAsSynced(): Promise<void> {
    await this.update(site => {
      site.lastSyncAt = new Date();
    });
  }

  // Convert to API format
  toAPI(): any {
    return {
      id: this.serverId,
      name: this.name,
      description: this.description,
      location: this.location,
      boundary: this.boundary,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  // Create from API data
  static fromAPI(apiData: any): Partial<Site> {
    return {
      serverId: apiData.id,
      name: apiData.name,
      description: apiData.description,
      latitude: apiData.location.latitude,
      longitude: apiData.location.longitude,
      address: apiData.location.address,
      boundaryCoordinates: apiData.boundary ? JSON.stringify(apiData.boundary) : undefined,
      isActive: apiData.isActive,
      lastSyncAt: new Date(),
    };
  }
}