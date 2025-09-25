import { Model, Q, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, children, relation, writer } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

import { TaskStatus, Priority } from '../../types';
import TaskPhoto from './TaskPhoto';
import TaskComment from './TaskComment';
import User from './User';
import Site from './Site';

export default class Task extends Model {
  static table = 'tasks';
  static associations: Associations = {
    task_photos: { type: 'has_many', foreignKey: 'task_id' },
    task_comments: { type: 'has_many', foreignKey: 'task_id' },
    users: { type: 'belongs_to', key: 'assigned_to_id' },
    sites: { type: 'belongs_to', key: 'site_id' },
  };

  @field('server_id') serverId!: string;
  @field('title') title!: string;
  @field('description') description!: string;
  @field('status') status!: TaskStatus;
  @field('priority') priority!: Priority;
  @field('assigned_to_id') assignedToId?: string;
  @field('created_by_id') createdById!: string;
  @field('site_id') siteId?: string;
  @date('due_date') dueDate?: Date;
  @date('completed_at') completedAt?: Date;
  @field('latitude') latitude?: number;
  @field('longitude') longitude?: number;
  @field('location_accuracy') locationAccuracy?: number;
  @field('location_address') locationAddress?: string;
  @field('is_synced') isSynced!: boolean;
  @field('needs_sync') needsSync!: boolean;
  @field('sync_conflict') syncConflict!: boolean;
  @date('last_sync_at') lastSyncAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('task_photos') photos!: Relation<TaskPhoto>;
  @children('task_comments') comments!: Relation<TaskComment>;
  @relation('users', 'assigned_to_id') assignedTo?: Relation<User>;
  @relation('sites', 'site_id') site?: Relation<Site>;

  // Mark task as needing sync
  @writer async markForSync(): Promise<void> {
    await this.update(task => {
      task.needsSync = true;
      task.isSynced = false;
    });
  }

  // Update task status
  @writer async updateStatus(newStatus: TaskStatus): Promise<void> {
    const now = new Date();
    await this.update(task => {
      task.status = newStatus;
      task.needsSync = true;
      task.isSynced = false;
      if (newStatus === 'completed' && !task.completedAt) {
        task.completedAt = now;
      } else if (newStatus !== 'completed') {
        task.completedAt = undefined;
      }
    });
  }

  // Add photo to task
  @writer async addPhoto(photoData: {
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    latitude?: number;
    longitude?: number;
    locationAccuracy?: number;
  }): Promise<TaskPhoto> {
    const photo = await this.collections.get<TaskPhoto>('task_photos').create(photo => {
      photo.taskId = this.id;
      photo.filePath = photoData.filePath;
      photo.fileName = photoData.fileName;
      photo.fileSize = photoData.fileSize;
      photo.mimeType = photoData.mimeType;
      photo.latitude = photoData.latitude;
      photo.longitude = photoData.longitude;
      photo.locationAccuracy = photoData.locationAccuracy;
      photo.isSynced = false;
      photo.needsUpload = true;
      photo.uploadProgress = 0;
    });

    // Mark task for sync
    await this.markForSync();
    
    return photo;
  }

  // Add comment to task
  @writer async addComment(text: string, authorId: string): Promise<TaskComment> {
    const comment = await this.collections.get<TaskComment>('task_comments').create(comment => {
      comment.taskId = this.id;
      comment.authorId = authorId;
      comment.text = text;
      comment.isSynced = false;
    });

    // Mark task for sync
    await this.markForSync();
    
    return comment;
  }

  // Get location object
  get location(): { latitude: number; longitude: number; accuracy?: number; address?: string } | null {
    if (!this.latitude || !this.longitude) return null;
    
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      accuracy: this.locationAccuracy,
      address: this.locationAddress,
    };
  }

  // Check if task is overdue
  get isOverdue(): boolean {
    if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') {
      return false;
    }
    return new Date() > this.dueDate;
  }

  // Get sync status
  get syncStatus(): 'synced' | 'pending' | 'conflict' {
    if (this.syncConflict) return 'conflict';
    if (this.needsSync || !this.isSynced) return 'pending';
    return 'synced';
  }

  // Convert to API format for sync
  toAPI(): any {
    return {
      id: this.serverId,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      assignedToId: this.assignedToId,
      siteId: this.siteId,
      dueDate: this.dueDate?.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      location: this.location,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  // Create from API data
  static fromAPI(apiData: any): Partial<Task> {
    return {
      serverId: apiData.id,
      title: apiData.title,
      description: apiData.description,
      status: apiData.status,
      priority: apiData.priority,
      assignedToId: apiData.assignedToId,
      createdById: apiData.createdById,
      siteId: apiData.siteId,
      dueDate: apiData.dueDate ? new Date(apiData.dueDate) : undefined,
      completedAt: apiData.completedAt ? new Date(apiData.completedAt) : undefined,
      latitude: apiData.location?.latitude,
      longitude: apiData.location?.longitude,
      locationAccuracy: apiData.location?.accuracy,
      locationAddress: apiData.location?.address,
      isSynced: true,
      needsSync: false,
      syncConflict: false,
      lastSyncAt: new Date(),
    };
  }
}