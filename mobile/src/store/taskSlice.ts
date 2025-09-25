import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import NetInfo from '@react-native-community/netinfo';
import { Task, TaskStatus, Priority, TaskFilterParams } from '../types';
import { taskService } from '../services/task.service';
import { offlineTaskService } from '../services/offline-task.service';
import { syncService } from '../services/sync.service';

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentTask: Task | null;
  totalTasks: number;
  currentPage: number;
  totalPages: number;
  filters: TaskFilterParams;
  isOffline: boolean;
  syncStatus: {
    issyncing: boolean;
    lastSync: string | null;
    pendingCount: number;
    conflictsCount: number;
  };
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  currentTask: null,
  totalTasks: 0,
  currentPage: 1,
  totalPages: 1,
  filters: {
    status: undefined,
    priority: undefined,
    assignedTo: undefined,
    dateRange: undefined,
    searchQuery: '',
    page: 1,
    limit: 10,
  },
  isOffline: false,
  syncStatus: {
    issyncing: false,
    lastSync: null,
    pendingCount: 0,
    conflictsCount: 0,
  },
};

// Helper function to check network connectivity
const isOnline = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected === true && netInfo.isInternetReachable === true;
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (filters: TaskFilterParams, { rejectWithValue }) => {
    try {
      const online = await isOnline();
      
      if (online) {
        try {
          // Try online first
          const response = await taskService.getTasks(filters);
          return { ...response, source: 'online' };
        } catch (error) {
          console.log('Online fetch failed, falling back to offline');
          // Fall back to offline
          const response = await offlineTaskService.getTasks(filters);
          return { ...response, source: 'offline' };
        }
      } else {
        // Use offline service
        const response = await offlineTaskService.getTasks(filters);
        return { ...response, source: 'offline' };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (id: string, { rejectWithValue }) => {
    try {
      const task = await taskService.getTaskById(id);
      return task;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch task');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Partial<Task>, { rejectWithValue }) => {
    try {
      const newTask = await taskService.createTask(taskData);
      return newTask;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, ...updateData }: Partial<Task> & { id: string }, { rejectWithValue }) => {
    try {
      const updatedTask = await taskService.updateTask(id, updateData);
      return updatedTask;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete task');
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, status }: { id: string; status: TaskStatus }, { rejectWithValue }) => {
    try {
      const online = await isOnline();
      
      if (online) {
        try {
          const updatedTask = await taskService.updateTaskStatus(id, status);
          return updatedTask;
        } catch (error) {
          console.log('Online update failed, updating offline');
          const updatedTask = await offlineTaskService.updateTaskStatus(id, status);
          return updatedTask;
        }
      } else {
        const updatedTask = await offlineTaskService.updateTaskStatus(id, status);
        return updatedTask;
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task status');
    }
  }
);

// New sync-specific async thunks
export const performSync = createAsyncThunk(
  'tasks/performSync',
  async (force: boolean = false, { rejectWithValue }) => {
    try {
      const result = await syncService.performSync(force);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sync failed');
    }
  }
);

export const getSyncStatus = createAsyncThunk(
  'tasks/getSyncStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = await syncService.getSyncStatus();
      return status;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get sync status');
    }
  }
);

export const resolveConflict = createAsyncThunk(
  'tasks/resolveConflict',
  async ({ taskId, resolution }: { taskId: string; resolution: 'use_local' | 'use_server' }, { rejectWithValue }) => {
    try {
      await syncService.resolveConflict(taskId, resolution);
      return { taskId, resolution };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resolve conflict');
    }
  }
);

export const addTaskPhoto = createAsyncThunk(
  'tasks/addTaskPhoto',
  async ({ taskId, photoData }: { 
    taskId: string; 
    photoData: {
      filePath: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      latitude?: number;
      longitude?: number;
      locationAccuracy?: number;
    }
  }, { rejectWithValue }) => {
    try {
      const photo = await offlineTaskService.addTaskPhoto(taskId, photoData);
      return { taskId, photo };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add photo');
    }
  }
);

export const addTaskComment = createAsyncThunk(
  'tasks/addTaskComment',
  async ({ taskId, text, authorId }: { taskId: string; text: string; authorId: string }, { rejectWithValue }) => {
    try {
      const comment = await offlineTaskService.addTaskComment(taskId, text, authorId);
      return { taskId, comment };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add comment');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<TaskFilterParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateLocalTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
      }
      if (state.currentTask?.id === action.payload.id) {
        state.currentTask = { ...state.currentTask, ...action.payload };
      }
    },
    setOfflineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    updateSyncStatus: (state, action: PayloadAction<Partial<TaskState['syncStatus']>>) => {
      state.syncStatus = { ...state.syncStatus, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.data;
        state.totalTasks = action.payload.total;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.isOffline = action.payload.source === 'offline';
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Task By ID
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.unshift(action.payload);
        state.totalTasks += 1;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Task
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Task
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        state.totalTasks -= 1;
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Task Status
      .addCase(updateTaskStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload;
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Sync operations
      .addCase(performSync.pending, (state) => {
        state.syncStatus.issyncing = true;
        state.error = null;
      })
      .addCase(performSync.fulfilled, (state, action) => {
        state.syncStatus.issyncing = false;
        state.syncStatus.lastSync = new Date().toISOString();
        state.syncStatus.conflictsCount = action.payload.conflicts.total;
      })
      .addCase(performSync.rejected, (state, action) => {
        state.syncStatus.issyncing = false;
        state.error = action.payload as string;
      })
      // Get sync status
      .addCase(getSyncStatus.fulfilled, (state, action) => {
        state.syncStatus.lastSync = action.payload.lastSync?.toISOString() || null;
        state.syncStatus.pendingCount = action.payload.pendingTasks + action.payload.pendingPhotos + action.payload.pendingComments;
        state.syncStatus.conflictsCount = action.payload.conflicts;
        state.isOffline = !action.payload.isOnline;
      })
      // Add photo
      .addCase(addTaskPhoto.fulfilled, (state, action) => {
        // Update task in the list if it exists
        const taskIndex = state.tasks.findIndex(t => t.id === action.payload.taskId);
        if (taskIndex !== -1) {
          // Increment photo count or mark as having photos
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], updatedAt: new Date() };
        }
        
        // Update current task if it's the same
        if (state.currentTask?.id === action.payload.taskId) {
          state.currentTask = { ...state.currentTask, updatedAt: new Date() };
        }
      })
      // Add comment
      .addCase(addTaskComment.fulfilled, (state, action) => {
        // Update task in the list if it exists
        const taskIndex = state.tasks.findIndex(t => t.id === action.payload.taskId);
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], updatedAt: new Date() };
        }
        
        // Update current task if it's the same
        if (state.currentTask?.id === action.payload.taskId) {
          state.currentTask = { ...state.currentTask, updatedAt: new Date() };
        }
      });
  },
});

export const { 
  setFilters, 
  clearFilters, 
  setCurrentTask, 
  clearError, 
  updateLocalTask,
  setOfflineStatus,
  updateSyncStatus,
} = taskSlice.actions;

export default taskSlice.reducer;