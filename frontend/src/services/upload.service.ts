import { apiService, ApiResponse } from './api.service';

// Upload-related interfaces
export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  bucket: string;
  url: string;
  permanentUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  taskId?: string | null;
}

export interface FileInfo {
  fileName: string;
  size: number;
  lastModified: Date;
  etag: string;
  metaData: Record<string, string>;
  url: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  loaded: number;
  total: number;
}

export type FileType = 'profile_image' | 'task_attachment' | 'document';

export interface UploadOptions {
  type: FileType;
  taskId?: string;
  onProgress?: (progress: UploadProgress) => void;
}

// File type configurations
export const FILE_CONFIGS = {
  profile_image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    description: 'Profile image (JPEG, PNG, WebP - max 5MB)',
  },
  task_attachment: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    description: 'Task attachment (Images, PDF, Word, Text - max 10MB)',
  },
  document: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    description: 'Document (PDF, Word, Excel, Text - max 20MB)',
  },
};

// Upload service class
export class UploadService {

  // Upload single file
  async uploadFile(file: File, options: UploadOptions): Promise<UploadedFile> {
    // Validate file
    this.validateFile(file, options.type);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Build query string
    const params = new URLSearchParams();
    params.append('type', options.type);
    if (options.taskId) {
      params.append('taskId', options.taskId);
    }

    // Upload with progress tracking
    const response = await apiService.post<{ file: UploadedFile }>(
      `/upload/single?${params.toString()}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              fileName: file.name,
              progress: Math.round((progressEvent.loaded * 100) / progressEvent.total),
              loaded: progressEvent.loaded,
              total: progressEvent.total,
            };
            options.onProgress(progress);
          }
        },
      }
    );

    if (response.success && response.data) {
      return response.data.file;
    }

    throw new Error(response.error || 'Failed to upload file');
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[], 
    options: UploadOptions
  ): Promise<UploadedFile[]> {
    // Validate all files
    files.forEach(file => this.validateFile(file, options.type));

    // Create form data
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    // Build query string
    const params = new URLSearchParams();
    params.append('type', options.type);
    if (options.taskId) {
      params.append('taskId', options.taskId);
    }

    // Upload with progress tracking
    const response = await apiService.post<{ files: UploadedFile[] }>(
      `/upload/multiple?${params.toString()}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              fileName: `${files.length} files`,
              progress: Math.round((progressEvent.loaded * 100) / progressEvent.total),
              loaded: progressEvent.loaded,
              total: progressEvent.total,
            };
            options.onProgress(progress);
          }
        },
      }
    );

    if (response.success && response.data) {
      return response.data.files;
    }

    throw new Error(response.error || 'Failed to upload files');
  }

  // Get file information
  async getFileInfo(bucket: string, fileName: string): Promise<FileInfo> {
    const response = await apiService.get<{ file: FileInfo }>(
      `/upload/${bucket}/${fileName}/info`
    );

    if (response.success && response.data) {
      return response.data.file;
    }

    throw new Error(response.error || 'Failed to get file information');
  }

  // Get file download URL
  async getDownloadUrl(bucket: string, fileName: string, expires?: number): Promise<string> {
    const params = new URLSearchParams();
    if (expires) {
      params.append('expires', expires.toString());
    }

    const queryString = params.toString();
    const url = queryString 
      ? `/upload/${bucket}/${fileName}/download?${queryString}`
      : `/upload/${bucket}/${fileName}/download`;

    const response = await apiService.get<{ url: string }>(url);

    if (response.success && response.data) {
      return response.data.url;
    }

    throw new Error(response.error || 'Failed to get download URL');
  }

  // Delete file
  async deleteFile(bucket: string, fileName: string): Promise<void> {
    const response = await apiService.delete(`/upload/${bucket}/${fileName}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete file');
    }
  }

  // List files in bucket (Admin only)
  async listFiles(bucket: string, prefix?: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (prefix) params.append('prefix', prefix);
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = queryString 
      ? `/upload/${bucket}/list?${queryString}`
      : `/upload/${bucket}/list`;

    const response = await apiService.get<{ files: any[] }>(url);

    if (response.success && response.data) {
      return response.data.files;
    }

    throw new Error(response.error || 'Failed to list files');
  }

  // Validation methods
  validateFile(file: File, type: FileType): void {
    const config = FILE_CONFIGS[type];

    if (!config) {
      throw new Error(`Invalid file type: ${type}`);
    }

    // Check file size
    if (file.size > config.maxSize) {
      throw new Error(
        `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(config.maxSize)}`
      );
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      throw new Error(
        `File type ${file.type} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`
      );
    }
  }

  validateMultipleFiles(files: File[], type: FileType): void {
    if (files.length === 0) {
      throw new Error('No files selected');
    }

    if (files.length > 10) {
      throw new Error('Maximum 10 files allowed per upload');
    }

    files.forEach((file, index) => {
      try {
        this.validateFile(file, type);
      } catch (error) {
        throw new Error(`File ${index + 1} (${file.name}): ${error.message}`);
      }
    });
  }

  // Helper methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.startsWith('text/')) return '📃';
    return '📁';
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  // Convenience methods for specific file types
  async uploadProfileImage(file: File, onProgress?: (progress: UploadProgress) => void): Promise<UploadedFile> {
    return this.uploadFile(file, { type: 'profile_image', onProgress });
  }

  async uploadTaskAttachment(
    file: File, 
    taskId: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFile> {
    return this.uploadFile(file, { type: 'task_attachment', taskId, onProgress });
  }

  async uploadTaskAttachments(
    files: File[], 
    taskId: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFile[]> {
    return this.uploadMultipleFiles(files, { type: 'task_attachment', taskId, onProgress });
  }

  async uploadDocument(file: File, onProgress?: (progress: UploadProgress) => void): Promise<UploadedFile> {
    return this.uploadFile(file, { type: 'document', onProgress });
  }

  // Create file input element programmatically
  createFileInput(options: {
    accept?: string;
    multiple?: boolean;
    onSelect: (files: File[]) => void;
  }): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';

    if (options.accept) {
      input.accept = options.accept;
    }

    if (options.multiple) {
      input.multiple = true;
    }

    input.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      options.onSelect(files);
    });

    return input;
  }

  // Get accept attribute for file input based on type
  getAcceptAttribute(type: FileType): string {
    const config = FILE_CONFIGS[type];
    return config.allowedTypes.join(',');
  }

  // Batch upload with progress tracking
  async batchUpload(
    items: Array<{ file: File; options: UploadOptions }>,
    onItemProgress?: (fileName: string, progress: UploadProgress) => void,
    onOverallProgress?: (completed: number, total: number) => void
  ): Promise<UploadedFile[]> {
    const results: UploadedFile[] = [];
    let completed = 0;

    for (const item of items) {
      try {
        const result = await this.uploadFile(item.file, {
          ...item.options,
          onProgress: (progress) => {
            onItemProgress?.(item.file.name, progress);
          },
        });
        
        results.push(result);
        completed++;
        onOverallProgress?.(completed, items.length);
        
      } catch (error) {
        console.error(`Failed to upload ${item.file.name}:`, error);
        throw error;
      }
    }

    return results;
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService;