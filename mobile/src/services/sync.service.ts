import NetInfo from '@react-native-community/netinfo';
import { database, DatabaseManager } from '../database';
import { Task, TaskPhoto, TaskComment, User, Site, SyncQueue } from '../database/models';
import apiService from './api.service';
import { Q } from '@nozbe/watermelondb';

export interface SyncResult {
  success: boolean;
  synced: {
    tasks: number;
    photos: number;
    comments: number;
  };
  conflicts: {
    tasks: Task[];
    total: number;
  };
  errors: string[];
}

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private syncQueue: NodeJS.Timeout | null = null;
  private listeners: ((result: SyncResult) => void)[] = [];

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Start periodic sync
  async startPeriodicSync(): Promise<void> {
    const interval = await DatabaseManager.getSetting('sync_interval');
    const intervalMs = interval ? parseInt(interval) : 300000; // Default 5 minutes

    if (this.syncQueue) {
      clearInterval(this.syncQueue);
    }

    this.syncQueue = setInterval(async () => {
      const isConnected = await this.isNetworkAvailable();
      if (isConnected) {
        await this.performSync();
      }
    }, intervalMs);

    console.log(`Periodic sync started with interval: ${intervalMs}ms`);
  }

  // Stop periodic sync
  stopPeriodicSync(): void {
    if (this.syncQueue) {
      clearInterval(this.syncQueue);
      this.syncQueue = null;
    }
    console.log('Periodic sync stopped');
  }

  // Add sync listener
  addSyncListener(callback: (result: SyncResult) => void): void {
    this.listeners.push(callback);
  }

  // Remove sync listener
  removeSyncListener(callback: (result: SyncResult) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Manual sync
  async performSync(force = false): Promise<SyncResult> {
    if (this.syncInProgress && !force) {
      console.log('Sync already in progress, skipping...');
      return {
        success: false,
        synced: { tasks: 0, photos: 0, comments: 0 },
        conflicts: { tasks: [], total: 0 },
        errors: ['Sync already in progress'],
      };
    }

    const result: SyncResult = {
      success: true,
      synced: { tasks: 0, photos: 0, comments: 0 },
      conflicts: { tasks: [], total: 0 },
      errors: [],
    };

    try {
      this.syncInProgress = true;
      console.log('Starting sync...');

      // Check network connectivity
      const isConnected = await this.isNetworkAvailable();
      if (!isConnected) {
        throw new Error('No network connection available');
      }

      // Check if sync is enabled
      const syncEnabled = await DatabaseManager.getSetting('sync_enabled');
      if (syncEnabled === 'false') {
        throw new Error('Sync is disabled');
      }

      // Sync in order: Users -> Sites -> Tasks -> Photos -> Comments
      await this.syncUsers(result);
      await this.syncSites(result);
      await this.syncTasks(result);
      await this.syncPhotos(result);
      await this.syncComments(result);

      // Update last sync timestamp
      await DatabaseManager.setSetting('last_sync_timestamp', Date.now().toString());
      
      console.log('Sync completed successfully:', result);
      
    } catch (error) {
      console.error('Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.syncInProgress = false;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(result));
    }

    return result;
  }

  // Check network connectivity
  private async isNetworkAvailable(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true && netInfo.isInternetReachable === true;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }

  // Sync users from server
  private async syncUsers(result: SyncResult): Promise<void> {
    try {
      console.log('Syncing users...');
      const users = await apiService.get<any>('/users');
      
      await database.write(async () => {
        const userCollection = database.get<User>('users');
        
        for (const userData of users.data || users) {
          const existing = await userCollection
            .query(Q.where('server_id', userData.id))
            .fetch();

          if (existing.length > 0) {
            // Update existing user
            await existing[0].update(user => {
              Object.assign(user, User.fromAPI(userData));
            });
          } else {
            // Create new user
            await userCollection.create(user => {
              Object.assign(user, User.fromAPI(userData));
            });
          }
        }
      });
      
      console.log(`Synced ${users.length || users.data?.length || 0} users`);
    } catch (error) {
      console.error('Error syncing users:', error);
      result.errors.push(`Users sync failed: ${error}`);
    }
  }

  // Sync sites from server
  private async syncSites(result: SyncResult): Promise<void> {
    try {
      console.log('Syncing sites...');
      const sites = await apiService.get<any>('/sites');
      
      await database.write(async () => {
        const siteCollection = database.get<Site>('sites');
        
        for (const siteData of sites.data || sites) {
          const existing = await siteCollection
            .query(Q.where('server_id', siteData.id))
            .fetch();

          if (existing.length > 0) {
            // Update existing site
            await existing[0].update(site => {
              Object.assign(site, Site.fromAPI(siteData));
            });
          } else {
            // Create new site
            await siteCollection.create(site => {
              Object.assign(site, Site.fromAPI(siteData));
            });
          }
        }
      });
      
      console.log(`Synced ${sites.length || sites.data?.length || 0} sites`);
    } catch (error) {
      console.error('Error syncing sites:', error);
      result.errors.push(`Sites sync failed: ${error}`);
    }
  }

  // Sync tasks (bidirectional)
  private async syncTasks(result: SyncResult): Promise<void> {
    try {
      console.log('Syncing tasks...');

      // First, push local changes to server
      await this.pushTasksToServer(result);
      
      // Then, pull changes from server
      await this.pullTasksFromServer(result);
      
      console.log(`Tasks sync completed: ${result.synced.tasks} synced`);
    } catch (error) {
      console.error('Error syncing tasks:', error);
      result.errors.push(`Tasks sync failed: ${error}`);
    }
  }

  // Push local task changes to server
  private async pushTasksToServer(result: SyncResult): Promise<void> {
    const tasksToSync = await database.get<Task>('tasks')
      .query(Q.where('needs_sync', true))
      .fetch();

    for (const task of tasksToSync) {
      try {
        let response;
        
        if (!task.serverId) {
          // Create new task on server
          response = await apiService.post('/tasks', task.toAPI());
          
          await database.write(async () => {
            await task.update(t => {
              t.serverId = response.id;
              t.isSynced = true;
              t.needsSync = false;
              t.lastSyncAt = new Date();
            });
          });
        } else {
          // Update existing task on server
          response = await apiService.put(`/tasks/${task.serverId}`, task.toAPI());
          
          await database.write(async () => {
            await task.update(t => {
              t.isSynced = true;
              t.needsSync = false;
              t.lastSyncAt = new Date();
            });
          });
        }
        
        result.synced.tasks++;
        
      } catch (error) {
        console.error(`Error syncing task ${task.id}:`, error);
        
        // Handle conflicts
        if (error.response?.status === 409) {
          await database.write(async () => {
            await task.update(t => {
              t.syncConflict = true;
            });
          });
          result.conflicts.tasks.push(task);
          result.conflicts.total++;
        }
        
        result.errors.push(`Task ${task.id} sync failed: ${error}`);
      }
    }
  }

  // Pull task changes from server
  private async pullTasksFromServer(result: SyncResult): Promise<void> {
    const lastSync = await DatabaseManager.getSetting('last_sync_timestamp');
    const since = lastSync ? parseInt(lastSync) : 0;
    
    const tasks = await apiService.get<any>(`/tasks?since=${since}`);
    
    await database.write(async () => {
      const taskCollection = database.get<Task>('tasks');
      
      for (const taskData of tasks.data || tasks) {
        const existing = await taskCollection
          .query(Q.where('server_id', taskData.id))
          .fetch();

        if (existing.length > 0) {
          const localTask = existing[0];
          
          // Check for conflicts
          if (localTask.needsSync && localTask.updatedAt.getTime() > new Date(taskData.updatedAt).getTime()) {
            // Local changes are newer - conflict
            await localTask.update(task => {
              task.syncConflict = true;
            });
            result.conflicts.tasks.push(localTask);
            result.conflicts.total++;
          } else {
            // Server version is newer or no local changes
            await localTask.update(task => {
              Object.assign(task, Task.fromAPI(taskData));
            });
            result.synced.tasks++;
          }
        } else {
          // Create new task from server
          await taskCollection.create(task => {
            Object.assign(task, Task.fromAPI(taskData));
          });
          result.synced.tasks++;
        }
      }
    });
  }

  // Sync photos
  private async syncPhotos(result: SyncResult): Promise<void> {
    try {
      console.log('Syncing photos...');
      
      const photosToUpload = await database.get<TaskPhoto>('task_photos')
        .query(Q.where('needs_upload', true))
        .fetch();

      for (const photo of photosToUpload) {
        try {
          // Create FormData for upload
          const formData = new FormData();
          formData.append('file', {
            uri: photo.filePath,
            type: photo.mimeType,
            name: photo.fileName,
          } as any);
          
          formData.append('taskId', photo.taskId);
          
          if (photo.location) {
            formData.append('latitude', photo.location.latitude.toString());
            formData.append('longitude', photo.location.longitude.toString());
            if (photo.location.accuracy) {
              formData.append('accuracy', photo.location.accuracy.toString());
            }
          }

          const response = await apiService.post('/files/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          await database.write(async () => {
            await photo.markAsUploaded(response.id);
          });
          
          result.synced.photos++;
          
        } catch (error) {
          console.error(`Error uploading photo ${photo.id}:`, error);
          await database.write(async () => {
            await photo.markUploadFailed();
          });
          result.errors.push(`Photo ${photo.id} upload failed: ${error}`);
        }
      }
      
      console.log(`Photos sync completed: ${result.synced.photos} synced`);
    } catch (error) {
      console.error('Error syncing photos:', error);
      result.errors.push(`Photos sync failed: ${error}`);
    }
  }

  // Sync comments
  private async syncComments(result: SyncResult): Promise<void> {
    try {
      console.log('Syncing comments...');
      
      const commentsToSync = await database.get<TaskComment>('task_comments')
        .query(Q.where('is_synced', false))
        .fetch();

      for (const comment of commentsToSync) {
        try {
          const response = await apiService.post('/comments', comment.toAPI());
          
          await database.write(async () => {
            await comment.markAsSynced(response.id);
          });
          
          result.synced.comments++;
          
        } catch (error) {
          console.error(`Error syncing comment ${comment.id}:`, error);
          result.errors.push(`Comment ${comment.id} sync failed: ${error}`);
        }
      }
      
      console.log(`Comments sync completed: ${result.synced.comments} synced`);
    } catch (error) {
      console.error('Error syncing comments:', error);
      result.errors.push(`Comments sync failed: ${error}`);
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    lastSync: Date | null;
    pendingTasks: number;
    pendingPhotos: number;
    pendingComments: number;
    conflicts: number;
    isOnline: boolean;
    syncEnabled: boolean;
  }> {
    const [lastSyncTimestamp, pendingTasks, pendingPhotos, pendingComments, conflicts, isOnline, syncEnabled] = await Promise.all([
      DatabaseManager.getSetting('last_sync_timestamp'),
      database.get<Task>('tasks').query(Q.where('needs_sync', true)).fetchCount(),
      database.get<TaskPhoto>('task_photos').query(Q.where('needs_upload', true)).fetchCount(),
      database.get<TaskComment>('task_comments').query(Q.where('is_synced', false)).fetchCount(),
      database.get<Task>('tasks').query(Q.where('sync_conflict', true)).fetchCount(),
      this.isNetworkAvailable(),
      DatabaseManager.getSetting('sync_enabled'),
    ]);

    return {
      lastSync: lastSyncTimestamp ? new Date(parseInt(lastSyncTimestamp)) : null,
      pendingTasks,
      pendingPhotos,
      pendingComments,
      conflicts,
      isOnline,
      syncEnabled: syncEnabled !== 'false',
    };
  }

  // Resolve sync conflict
  async resolveConflict(taskId: string, resolution: 'use_local' | 'use_server'): Promise<void> {
    const task = await database.get<Task>('tasks').find(taskId);
    
    if (!task || !task.syncConflict) {
      throw new Error('Task not found or no conflict exists');
    }

    await database.write(async () => {
      if (resolution === 'use_local') {
        // Keep local version, push to server
        await task.update(t => {
          t.syncConflict = false;
          t.needsSync = true;
        });
      } else {
        // Use server version - fetch latest
        try {
          const serverTask = await apiService.get(`/tasks/${task.serverId}`);
          await task.update(t => {
            Object.assign(t, Task.fromAPI(serverTask));
            t.syncConflict = false;
          });
        } catch (error) {
          throw new Error('Failed to fetch server version');
        }
      }
    });
  }
}

export const syncService = SyncService.getInstance();