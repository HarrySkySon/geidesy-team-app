import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Users table
    tableSchema({
      name: 'users',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'first_name', type: 'string' },
        { name: 'last_name', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'profile_image', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Tasks table
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'priority', type: 'string', isIndexed: true },
        { name: 'assigned_to_id', type: 'string', isOptional: true },
        { name: 'created_by_id', type: 'string' },
        { name: 'site_id', type: 'string', isOptional: true },
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'location_accuracy', type: 'number', isOptional: true },
        { name: 'location_address', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'needs_sync', type: 'boolean' },
        { name: 'sync_conflict', type: 'boolean' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Task Photos table
    tableSchema({
      name: 'task_photos',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'task_id', type: 'string', isIndexed: true },
        { name: 'file_path', type: 'string' },
        { name: 'file_name', type: 'string' },
        { name: 'file_size', type: 'number' },
        { name: 'mime_type', type: 'string' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'location_accuracy', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'needs_upload', type: 'boolean' },
        { name: 'upload_progress', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Task Comments table
    tableSchema({
      name: 'task_comments',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'task_id', type: 'string', isIndexed: true },
        { name: 'author_id', type: 'string' },
        { name: 'text', type: 'string' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Sites table
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'boundary_coordinates', type: 'string', isOptional: true }, // JSON string
        { name: 'is_active', type: 'boolean' },
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Sync Queue table - for managing sync operations
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'operation_type', type: 'string' }, // 'create', 'update', 'delete'
        { name: 'table_name', type: 'string' },
        { name: 'record_id', type: 'string' },
        { name: 'data', type: 'string' }, // JSON string with changes
        { name: 'priority', type: 'number' },
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'pending', 'processing', 'completed', 'failed'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // App Settings table
    tableSchema({
      name: 'app_settings',
      columns: [
        { name: 'key', type: 'string', isIndexed: true },
        { name: 'value', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});