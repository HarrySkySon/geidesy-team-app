import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  CloudDownload as CloudDownloadIcon,
} from '@mui/icons-material';
import { UploadedFile, uploadService } from '../../services/upload.service';

interface FileViewerProps {
  files: UploadedFile[];
  onDelete?: (file: UploadedFile) => void;
  showDeleteButton?: boolean;
  compact?: boolean;
  maxHeight?: number;
}

const FileViewer: React.FC<FileViewerProps> = ({
  files,
  onDelete,
  showDeleteButton = false,
  compact = false,
  maxHeight,
}) => {
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    file: UploadedFile | null;
  }>({ open: false, file: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    file: UploadedFile | null;
  }>({ open: false, file: null });

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />;
    if (mimeType === 'application/pdf') return <PdfIcon />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <DescriptionIcon />;
    return <FileIcon />;
  };

  // Get file type color
  const getFileTypeColor = (mimeType: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' => {
    if (mimeType.startsWith('image/')) return 'success';
    if (mimeType === 'application/pdf') return 'error';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'info';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'warning';
    return 'default';
  };

  // Handle file download
  const handleDownload = async (file: UploadedFile) => {
    try {
      const downloadUrl = await uploadService.getDownloadUrl(file.bucket, file.fileName);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  // Handle file preview
  const handlePreview = (file: UploadedFile) => {
    if (uploadService.isImage(file.mimeType) || file.mimeType === 'application/pdf') {
      setPreviewDialog({ open: true, file });
    } else {
      // For non-previewable files, just download
      handleDownload(file);
    }
  };

  // Handle file delete
  const handleDelete = (file: UploadedFile) => {
    setDeleteDialog({ open: true, file });
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteDialog.file && onDelete) {
      onDelete(deleteDialog.file);
    }
    setDeleteDialog({ open: false, file: null });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    return uploadService.formatFileSize(bytes);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (files.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <CloudDownloadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No files uploaded
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload files to see them here
        </Typography>
      </Box>
    );
  }

  if (compact) {
    return (
      <Box sx={{ maxHeight, overflow: 'auto' }}>
        <List>
          {files.map((file) => (
            <ListItem key={file.id}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'transparent' }}>
                  {getFileIcon(file.mimeType)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={file.originalName}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </Typography>
                    <Chip
                      label={file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                      size="small"
                      color={getFileTypeColor(file.mimeType)}
                      variant="outlined"
                    />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => handlePreview(file)}
                  title="View/Download"
                >
                  <ViewIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDownload(file)}
                  title="Download"
                >
                  <DownloadIcon />
                </IconButton>
                {showDeleteButton && (
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(file)}
                    title="Delete"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight, overflow: 'auto' }}>
      <Grid container spacing={2}>
        {files.map((file) => (
          <Grid item xs={12} sm={6} md={4} key={file.id}>
            <Card>
              {uploadService.isImage(file.mimeType) && (
                <Box
                  component="img"
                  src={file.url}
                  alt={file.originalName}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    cursor: 'pointer',
                  }}
                  onClick={() => handlePreview(file)}
                />
              )}
              
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {!uploadService.isImage(file.mimeType) && (
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>
                      {getFileIcon(file.mimeType)}
                    </Box>
                  )}
                  <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                    {file.originalName}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formatFileSize(file.size)}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                    size="small"
                    color={getFileTypeColor(file.mimeType)}
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(file.uploadedAt)}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => handlePreview(file)}
                >
                  {uploadService.isImage(file.mimeType) || file.mimeType === 'application/pdf' 
                    ? 'Preview' 
                    : 'View'
                  }
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(file)}
                >
                  Download
                </Button>
                {showDeleteButton && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(file)}
                  >
                    Delete
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, file: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" noWrap>
              {previewDialog.file?.originalName}
            </Typography>
            <IconButton
              onClick={() => setPreviewDialog({ open: false, file: null })}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewDialog.file && (
            <Box textAlign="center">
              {uploadService.isImage(previewDialog.file.mimeType) ? (
                <Box
                  component="img"
                  src={previewDialog.file.url}
                  alt={previewDialog.file.originalName}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
              ) : previewDialog.file.mimeType === 'application/pdf' ? (
                <Box
                  component="iframe"
                  src={previewDialog.file.url}
                  sx={{
                    width: '100%',
                    height: '70vh',
                    border: 'none',
                  }}
                />
              ) : (
                <Typography>
                  Preview not available for this file type
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => previewDialog.file && handleDownload(previewDialog.file)}
            startIcon={<DownloadIcon />}
          >
            Download
          </Button>
          <Button
            onClick={() => setPreviewDialog({ open: false, file: null })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, file: null })}
      >
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.file?.originalName}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, file: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileViewer;