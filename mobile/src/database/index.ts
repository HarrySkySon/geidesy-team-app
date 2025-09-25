import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { Task, TaskPhoto, TaskComment, User, Site, SyncQueue, AppSettings } from './models';

// Initialize SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  dbName: 'SurveyingTeamApp',
  migrations: [],
  synchronous: true,
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [
    Task,
    TaskPhoto,
    TaskComment,
    User,
    Site,
    SyncQueue,
    AppSettings,
  ],
  actionsEnabled: true,
});

// Database utility functions
export class DatabaseManager {
  static async initialize(): Promise<void> {
    console.log('Initializing WatermelonDB database...');
    
    try {
      // Initialize default settings
      await this.initializeDefaultSettings();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  static async initializeDefaultSettings(): Promise<void> {
    const settings = database.get<AppSettings>('app_settings');
    
    const defaultSettings = [
      { key: 'sync_enabled', value: 'true' },
      { key: 'sync_interval', value: '300000' }, // 5 minutes
      { key: 'auto_sync_on_wifi_only', value: 'false' },
      { key: 'photo_quality', value: '0.8' },
      { key: 'location_accuracy', value: 'high' },
      { key: 'cache_size_mb', value: '100' },
      { key: 'last_sync_timestamp', value: '0' },
      { key: 'sync_conflicts_count', value: '0' },
    ];

    for (const setting of defaultSettings) {
      try {
        const existing = await settings.query().where('key', setting.key).fetch();
        
        if (existing.length === 0) {
          await database.write(async () => {
            await settings.create(newSetting => {
              newSetting.key = setting.key;
              newSetting.value = setting.value;
              newSetting.updatedAt = new Date();
            });
          });
        }
      } catch (error) {
        console.error(`Error creating setting ${setting.key}:`, error);
      }
    }
  }

  static async clearAllData(): Promise<void> {
    console.log('Clearing all local data...');
    
    try {
      await database.write(async () => {
        const allTasks = await database.get<Task>('tasks').query().fetch();
        const allPhotos = await database.get<TaskPhoto>('task_photos').query().fetch();
        const allComments = await database.get<TaskComment>('task_comments').query().fetch();
        const allUsers = await database.get<User>('users').query().fetch();
        const allSites = await database.get<Site>('sites').query().fetch();
        const allSyncQueue = await database.get<SyncQueue>('sync_queue').query().fetch();

        // Delete all records
        await Promise.all([
          ...allTasks.map(task => task.markAsDeleted()),
          ...allPhotos.map(photo => photo.markAsDeleted()),
          ...allComments.map(comment => comment.markAsDeleted()),
          ...allUsers.map(user => user.markAsDeleted()),
          ...allSites.map(site => site.markAsDeleted()),
          ...allSyncQueue.map(item => item.markAsDeleted()),
        ]);
      });

      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  static async getDatabaseStats(): Promise<{
    tasks: number;
    photos: number;
    comments: number;
    users: number;
    sites: number;
    syncQueue: number;
    unsyncedTasks: number;
    unsyncedPhotos: number;
  }> {
    const [tasks, photos, comments, users, sites, syncQueue] = await Promise.all([
      database.get<Task>('tasks').query().fetchCount(),
      database.get<TaskPhoto>('task_photos').query().fetchCount(),
      database.get<TaskComment>('task_comments').query().fetchCount(),
      database.get<User>('users').query().fetchCount(),
      database.get<Site>('sites').query().fetchCount(),
      database.get<SyncQueue>('sync_queue').query().fetchCount(),
    ]);

    const [unsyncedTasks, unsyncedPhotos] = await Promise.all([
      database.get<Task>('tasks').query().where('needs_sync', true).fetchCount(),
      database.get<TaskPhoto>('task_photos').query().where('needs_upload', true).fetchCount(),
    ]);

    return {
      tasks,
      photos,
      comments,
      users,
      sites,
      syncQueue,
      unsyncedTasks,
      unsyncedPhotos,
    };
  }

  static async getSetting(key: string): Promise<string | null> {
    try {
      const settings = await database.get<AppSettings>('app_settings')
        .query()
        .where('key', key)
        .fetch();
      
      return settings.length > 0 ? settings[0].value : null;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  static async setSetting(key: string, value: string): Promise<void> {
    try {
      const settings = database.get<AppSettings>('app_settings');
      const existing = await settings.query().where('key', key).fetch();

      await database.write(async () => {
        if (existing.length > 0) {
          await existing[0].updateValue(value);
        } else {
          await settings.create(newSetting => {
            newSetting.key = key;
            newSetting.value = value;
            newSetting.updatedAt = new Date();
          });
        }
      });
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  }
}

export default database;