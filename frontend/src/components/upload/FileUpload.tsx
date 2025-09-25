import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  uploadService,
  UploadedFile,
  FileType,
  UploadOptions,
  UploadProgress,
  FILE_CONFIGS,
} from '../../services/upload.service';

// Styled components
const UploadContainer = styled(Paper)(({ theme, isDragActive }: { theme?: any, isDragActive?: boolean }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

interface FileUploadProps {
  fileType: FileType;
  taskId?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

interface FileWithProgress {
  file: File;
  progress: number;
  uploaded: boolean;
  error?: string;
  uploadedFile?: UploadedFile;
}

const FileUpload: React.FC<FileUploadProps> = ({
  fileType,
  taskId,
  multiple = false,
  maxFiles = 10,
  onUploadComplete,
  onUploadError,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = FILE_CONFIGS[fileType];

  // Handle file selection
  const handleFileSelect = (selectedFiles: File[]) => {
    setError(null);

    // Validate file count
    const totalFiles = files.length + selectedFiles.length;
    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const newFiles: FileWithProgress[] = [];
    for (const file of selectedFiles) {
      try {
        uploadService.validateFile(file, fileType);
        newFiles.push({
          file,
          progress: 0,
          uploaded: false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid file');
        return;
      }
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Auto-upload if not multiple or if all files are selected
    if (!multiple || newFiles.length === 1) {
      uploadFiles([...files, ...newFiles]);
    }
  };

  // Upload files
  const uploadFiles = async (filesToUpload: FileWithProgress[] = files) => {
    if (uploading || filesToUpload.length === 0) return;

    setUploading(true);
    setError(null);

    const uploadedFiles: UploadedFile[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const fileItem = filesToUpload[i];
      if (fileItem.uploaded) continue;

      try {
        const options: UploadOptions = {
          type: fileType,
          taskId,
          onProgress: (progress: UploadProgress) => {
            setFiles(prev => prev.map((f, index) => 
              index === i ? { ...f, progress: progress.progress } : f
            ));
          },
        };

        const uploadedFile = await uploadService.uploadFile(fileItem.file, options);
        uploadedFiles.push(uploadedFile);

        // Update file status
        setFiles(prev => prev.map((f, index) => 
          index === i ? { 
            ...f, 
            progress: 100, 
            uploaded: true,
            uploadedFile 
          } : f
        ));

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        
        // Update file with error
        setFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, error: errorMessage, progress: 0 } : f
        ));

        setError(errorMessage);
      }
    }

    setUploading(false);

    // Notify parent component
    if (uploadedFiles.length > 0 && onUploadComplete) {
      onUploadComplete(uploadedFiles);
    }

    if (uploadedFiles.length === 0 && onUploadError) {
      onUploadError('No files were uploaded successfully');
    }
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    setError(null);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect(droppedFiles);
  };

  // File input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFileSelect(selectedFiles);
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon />;
    if (file.type === 'application/pdf') return <PdfIcon />;
    if (file.type.includes('word') || file.type.includes('document')) return <DescriptionIcon />;
    return <FileIcon />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    return uploadService.formatFileSize(bytes);
  };

  return (
    <Box>
      {/* Upload Area */}
      <UploadContainer
        isDragActive={isDragActive}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Choose files or drag and drop'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {config.description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {multiple ? `Maximum ${maxFiles} files` : 'Single file only'}
        </Typography>
        
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple={multiple}
          accept={uploadService.getAcceptAttribute(fileType)}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </UploadContainer>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Selected Files ({files.length})
            </Typography>
            <Stack direction="row" spacing={1}>
              {multiple && files.some(f => !f.uploaded) && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => uploadFiles()}
                  disabled={uploading}
                >
                  Upload All
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={clearFiles}
                disabled={uploading}
              >
                Clear All
              </Button>
            </Stack>
          </Box>

          <Paper variant="outlined">
            <List>
              {files.map((fileItem, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getFileIcon(fileItem.file)}
                    </ListItemIcon>
                    <ListItemText
                      primary={fileItem.file.name}
                      secondary={
                        <Stack spacing={1}>
                          <Typography variant="caption">
                            {formatFileSize(fileItem.file.size)}
                          </Typography>
                          {fileItem.error && (
                            <Typography variant="caption" color="error">
                              {fileItem.error}
                            </Typography>
                          )}
                          {fileItem.uploaded && fileItem.uploadedFile && (
                            <Typography variant="caption" color="success.main">
                              Uploaded successfully
                            </Typography>
                          )}
                          {fileItem.progress > 0 && !fileItem.uploaded && !fileItem.error && (
                            <Box sx={{ width: '100%' }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={fileItem.progress}
                                sx={{ mb: 0.5 }}
                              />
                              <Typography variant="caption">
                                {fileItem.progress}%
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => removeFile(index)}
                        disabled={uploading && fileItem.progress > 0}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < files.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;