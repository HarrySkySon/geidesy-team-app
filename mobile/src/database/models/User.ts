import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, writer } from '@nozbe/watermelondb/decorators';

import { UserRole } from '../../types';

export default class User extends Model {
  static table = 'users';

  @field('server_id') serverId!: string;
  @field('email') email!: string;
  @field('first_name') firstName!: string;
  @field('last_name') lastName!: string;
  @field('role') role!: UserRole;
  @field('profile_image') profileImage?: string;
  @field('is_active') isActive!: boolean;
  @date('last_sync_at') lastSyncAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Get full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Mark user as synced
  @writer async markAsSynced(): Promise<void> {
    await this.update(user => {
      user.lastSyncAt = new Date();
    });
  }

  // Convert to API format
  toAPI(): any {
    return {
      id: this.serverId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      profileImage: this.profileImage,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  // Create from API data
  static fromAPI(apiData: any): Partial<User> {
    return {
      serverId: apiData.id,
      email: apiData.email,
      firstName: apiData.firstName,
      lastName: apiData.lastName,
      role: apiData.role,
      profileImage: apiData.profileImage,
      isActive: apiData.isActive,
      lastSyncAt: new Date(),
    };
  }
}