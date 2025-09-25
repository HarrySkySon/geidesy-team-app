import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, readonly, relation, writer } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

import Task from './Task';

export default class TaskPhoto extends Model {
  static table = 'task_photos';
  static associations: Associations = {
    tasks: { type: 'belongs_to', key: 'task_id' },
  };

  @field('server_id') serverId?: string;
  @field('task_id') taskId!: string;
  @field('file_path') filePath!: string;
  @field('file_name') fileName!: string;
  @field('file_size') fileSize!: number;
  @field('mime_type') mimeType!: string;
  @field('latitude') latitude?: number;
  @field('longitude') longitude?: number;
  @field('location_accuracy') locationAccuracy?: number;
  @field('is_synced') isSynced!: boolean;
  @field('needs_upload') needsUpload!: boolean;
  @field('upload_progress') uploadProgress!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('tasks', 'task_id') task!: Relation<Task>;

  // Mark photo as uploaded
  @writer async markAsUploaded(serverId: string): Promise<void> {
    await this.update(photo => {
      photo.serverId = serverId;
      photo.isSynced = true;
      photo.needsUpload = false;
      photo.uploadProgress = 100;
    });
  }

  // Update upload progress
  @writer async updateUploadProgress(progress: number): Promise<void> {
    await this.update(photo => {
      photo.uploadProgress = progress;
    });
  }

  // Mark upload as failed
  @writer async markUploadFailed(): Promise<void> {
    await this.update(photo => {
      photo.uploadProgress = 0;
      photo.needsUpload = true;
    });
  }

  // Get location object
  get location(): { latitude: number; longitude: number; accuracy?: number } | null {
    if (!this.latitude || !this.longitude) return null;
    
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      accuracy: this.locationAccuracy,
    };
  }

  // Get upload status
  get uploadStatus(): 'pending' | 'uploading' | 'completed' | 'failed' {
    if (this.isSynced && this.serverId) return 'completed';
    if (this.uploadProgress > 0 && this.uploadProgress < 100) return 'uploading';
    if (this.needsUpload) return 'pending';
    return 'failed';
  }

  // Convert to API format
  toAPI(): any {
    return {
      id: this.serverId,
      taskId: this.taskId,
      fileName: this.fileName,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      location: this.location,
      createdAt: this.createdAt.toISOString(),
    };
  }

  // Create from API data
  static fromAPI(apiData: any): Partial<TaskPhoto> {
    return {
      serverId: apiData.id,
      taskId: apiData.taskId,
      fileName: apiData.fileName,
      fileSize: apiData.fileSize,
      mimeType: apiData.mimeType,
      latitude: apiData.location?.latitude,
      longitude: apiData.location?.longitude,
      locationAccuracy: apiData.location?.accuracy,
      isSynced: true,
      needsUpload: false,
      uploadProgress: 100,
    };
  }
}