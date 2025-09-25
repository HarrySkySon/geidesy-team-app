import { database } from '../database';
import { Task, TaskPhoto, TaskComment } from '../database/models';
import { Q } from '@nozbe/watermelondb';
import { TaskStatus, Priority, TaskFilterParams, PaginatedResponse } from '../types';

export class OfflineTaskService {
  // Get tasks with filtering
  async getTasks(filters: TaskFilterParams): Promise<PaginatedResponse<Task>> {
    try {
      let query = database.get<Task>('tasks').query();

      // Apply filters
      if (filters.status) {
        query = query.where('status', filters.status);
      }
      
      if (filters.priority) {
        query = query.where('priority', filters.priority);
      }
      
      if (filters.assignedTo) {
        query = query.where('assigned_to_id', filters.assignedTo);
      }

      if (filters.searchQuery) {
        query = query.where(
          Q.or(
            Q.where('title', Q.like(`%${filters.searchQuery}%`)),
            Q.where('description', Q.like(`%${filters.searchQuery}%`))
          )
        );
      }

      if (filters.dateRange?.start) {
        query = query.where('created_at', Q.gte(new Date(filters.dateRange.start).getTime()));
      }

      if (filters.dateRange?.end) {
        query = query.where('created_at', Q.lte(new Date(filters.dateRange.end).getTime()));
      }

      // Add sorting
      query = query.sortBy('updated_at', Q.desc);

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const [tasks, total] = await Promise.all([
        query.skip(offset).take(limit).fetch(),
        query.fetchCount(),
      ]);

      return {
        data: tasks,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // Get task by ID with related data
  async getTaskById(id: string): Promise<Task | null> {
    try {
      const task = await database.get<Task>('tasks').find(id);
      
      // Preload related data
      await Promise.all([
        task.photos.fetch(),
        task.comments.fetch(),
        task.assignedTo?.fetch(),
        task.site?.fetch(),
      ]);
      
      return task;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  // Create new task
  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const newTask = await database.write(async () => {
        return await database.get<Task>('tasks').create(task => {
          task.serverId = taskData.serverId || '';
          task.title = taskData.title!;
          task.description = taskData.description!;
          task.status = taskData.status || 'pending';
          task.priority = taskData.priority || 'medium';
          task.assignedToId = taskData.assignedToId;
          task.createdById = taskData.createdById!;
          task.siteId = taskData.siteId;
          task.dueDate = taskData.dueDate;
          task.latitude = taskData.latitude;
          task.longitude = taskData.longitude;
          task.locationAccuracy = taskData.locationAccuracy;
          task.locationAddress = taskData.locationAddress;
          task.isSynced = false;
          task.needsSync = true;
          task.syncConflict = false;
        });
      });

      console.log('Task created offline:', newTask.id);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Update task
  async updateTask(id: string, updateData: Partial<Task>): Promise<Task> {
    try {
      const task = await database.get<Task>('tasks').find(id);
      
      const updatedTask = await database.write(async () => {
        return await task.update(t => {
          if (updateData.title !== undefined) t.title = updateData.title;
          if (updateData.description !== undefined) t.description = updateData.description;
          if (updateData.status !== undefined) t.status = updateData.status;
          if (updateData.priority !== undefined) t.priority = updateData.priority;
          if (updateData.assignedToId !== undefined) t.assignedToId = updateData.assignedToId;
          if (updateData.siteId !== undefined) t.siteId = updateData.siteId;
          if (updateData.dueDate !== undefined) t.dueDate = updateData.dueDate;
          if (updateData.latitude !== undefined) t.latitude = updateData.latitude;
          if (updateData.longitude !== undefined) t.longitude = updateData.longitude;
          if (updateData.locationAccuracy !== undefined) t.locationAccuracy = updateData.locationAccuracy;
          if (updateData.locationAddress !== undefined) t.locationAddress = updateData.locationAddress;
          
          // Mark for sync
          t.needsSync = true;
          t.isSynced = false;
          
          // Handle completion
          if (updateData.status === 'completed' && !t.completedAt) {
            t.completedAt = new Date();
          } else if (updateData.status !== 'completed') {
            t.completedAt = undefined;
          }
        });
      });

      console.log('Task updated offline:', updatedTask.id);
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Delete task
  async deleteTask(id: string): Promise<void> {
    try {
      const task = await database.get<Task>('tasks').find(id);
      
      await database.write(async () => {
        // If task hasn't been synced to server, just delete locally
        if (!task.serverId) {
          await task.markAsDeleted();
        } else {
          // Mark for deletion sync
          await task.update(t => {
            t.needsSync = true;
            t.isSynced = false;
          });
          // TODO: Add deletion flag to schema
        }
      });

      console.log('Task deleted offline:', id);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    try {
      const task = await database.get<Task>('tasks').find(id);
      
      const updatedTask = await database.write(async () => {
        return await task.update(t => {
          t.status = status;
          t.needsSync = true;
          t.isSynced = false;
          
          if (status === 'completed' && !t.completedAt) {
            t.completedAt = new Date();
          } else if (status !== 'completed') {
            t.completedAt = undefined;
          }
        });
      });

      console.log('Task status updated offline:', updatedTask.id, status);
      return updatedTask;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Add photo to task
  async addTaskPhoto(taskId: string, photoData: {
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    latitude?: number;
    longitude?: number;
    locationAccuracy?: number;
  }): Promise<TaskPhoto> {
    try {
      const photo = await database.write(async () => {
        return await database.get<TaskPhoto>('task_photos').create(photo => {
          photo.taskId = taskId;
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
      });

      // Mark task for sync
      const task = await database.get<Task>('tasks').find(taskId);
      await database.write(async () => {
        await task.markForSync();
      });

      console.log('Photo added to task offline:', photo.id);
      return photo;
    } catch (error) {
      console.error('Error adding photo to task:', error);
      throw error;
    }
  }

  // Add comment to task
  async addTaskComment(taskId: string, text: string, authorId: string): Promise<TaskComment> {
    try {
      const comment = await database.write(async () => {
        return await database.get<TaskComment>('task_comments').create(comment => {
          comment.taskId = taskId;
          comment.authorId = authorId;
          comment.text = text;
          comment.isSynced = false;
        });
      });

      // Mark task for sync
      const task = await database.get<Task>('tasks').find(taskId);
      await database.write(async () => {
        await task.markForSync();
      });

      console.log('Comment added to task offline:', comment.id);
      return comment;
    } catch (error) {
      console.error('Error adding comment to task:', error);
      throw error;
    }
  }

  // Get tasks assigned to current user
  async getMyTasks(userId: string, filters: Partial<TaskFilterParams> = {}): Promise<PaginatedResponse<Task>> {
    return this.getTasks({
      ...filters,
      assignedTo: userId,
    });
  }

  // Get tasks by status
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const tasks = await database.get<Task>('tasks')
        .query(Q.where('status', status))
        .fetch();
      
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks by status:', error);
      throw error;
    }
  }

  // Get task statistics
  async getTaskStatistics(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    withLocation: number;
    needsSync: number;
  }> {
    try {
      const [
        total,
        pending,
        inProgress,
        completed,
        withLocation,
        needsSync,
        allTasks,
      ] = await Promise.all([
        database.get<Task>('tasks').query().fetchCount(),
        database.get<Task>('tasks').query(Q.where('status', 'pending')).fetchCount(),
        database.get<Task>('tasks').query(Q.where('status', 'in_progress')).fetchCount(),
        database.get<Task>('tasks').query(Q.where('status', 'completed')).fetchCount(),
        database.get<Task>('tasks').query(
          Q.and(Q.where('latitude', Q.notEq(null)), Q.where('longitude', Q.notEq(null)))
        ).fetchCount(),
        database.get<Task>('tasks').query(Q.where('needs_sync', true)).fetchCount(),
        database.get<Task>('tasks').query(
          Q.and(
            Q.where('due_date', Q.notEq(null)),
            Q.where('status', Q.neq('completed')),
            Q.where('status', Q.neq('cancelled'))
          )
        ).fetch(),
      ]);

      // Count overdue tasks
      const now = new Date();
      const overdue = allTasks.filter(task => 
        task.dueDate && task.dueDate < now
      ).length;

      return {
        total,
        pending,
        inProgress,
        completed,
        overdue,
        withLocation,
        needsSync,
      };
    } catch (error) {
      console.error('Error fetching task statistics:', error);
      throw error;
    }
  }

  // Get pending sync items count
  async getPendingSyncCount(): Promise<{
    tasks: number;
    photos: number;
    comments: number;
    total: number;
  }> {
    try {
      const [tasks, photos, comments] = await Promise.all([
        database.get<Task>('tasks').query(Q.where('needs_sync', true)).fetchCount(),
        database.get<TaskPhoto>('task_photos').query(Q.where('needs_upload', true)).fetchCount(),
        database.get<TaskComment>('task_comments').query(Q.where('is_synced', false)).fetchCount(),
      ]);

      return {
        tasks,
        photos,
        comments,
        total: tasks + photos + comments,
      };
    } catch (error) {
      console.error('Error fetching pending sync count:', error);
      throw error;
    }
  }

  // Search tasks
  async searchTasks(query: string, limit = 20): Promise<Task[]> {
    try {
      const tasks = await database.get<Task>('tasks')
        .query(
          Q.or(
            Q.where('title', Q.like(`%${query}%`)),
            Q.where('description', Q.like(`%${query}%`)),
            Q.where('location_address', Q.like(`%${query}%`))
          ),
          Q.sortBy('updated_at', Q.desc),
          Q.take(limit)
        )
        .fetch();
      
      return tasks;
    } catch (error) {
      console.error('Error searching tasks:', error);
      throw error;
    }
  }
}

export const offlineTaskService = new OfflineTaskService();