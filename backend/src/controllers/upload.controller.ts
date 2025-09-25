import { Request, Response } from 'express';
import { Client } from 'minio';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import sharp from 'sharp';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import Joi from 'joi';

// Initialize MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Bucket configuration
const BUCKETS = {
  TASK_ATTACHMENTS: 'task-attachments',
  PROFILE_IMAGES: 'profile-images',
  DOCUMENTS: 'documents',
  TEMP: 'temp-uploads',
};

// File type configurations
const FILE_CONFIGS = {
  PROFILE_IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    bucket: BUCKETS.PROFILE_IMAGES,
    resize: { width: 400, height: 400 },
  },
  TASK_ATTACHMENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    bucket: BUCKETS.TASK_ATTACHMENTS,
  },
  DOCUMENT: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    bucket: BUCKETS.DOCUMENTS,
  },
};

// Validation schemas
const uploadQuerySchema = Joi.object({
  type: Joi.string().valid('profile_image', 'task_attachment', 'document').required(),
  taskId: Joi.string().when('type', {
    is: 'task_attachment',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.max(...Object.values(FILE_CONFIGS).map(c => c.maxSize)),
  },
  fileFilter: (req, file, cb) => {
    const { type } = req.query;
    const config = FILE_CONFIGS[type as keyof typeof FILE_CONFIGS];
    
    if (!config) {
      return cb(new Error('Invalid file type specified'));
    }

    if (!config.allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed for ${type}`));
    }

    if (file.size > config.maxSize) {
      return cb(new Error(`File size exceeds limit of ${config.maxSize} bytes`));
    }

    cb(null, true);
  },
});

export class UploadController {

  // Initialize MinIO buckets
  static async initializeBuckets() {
    try {
      for (const bucketName of Object.values(BUCKETS)) {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
          await minioClient.makeBucket(bucketName, 'us-east-1');
          console.log(`Created MinIO bucket: ${bucketName}`);

          // Set bucket policy for public read on profile images
          if (bucketName === BUCKETS.PROFILE_IMAGES) {
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: ['*'] },
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${bucketName}/*`],
                },
              ],
            };
            await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
          }
        }
      }
    } catch (error) {
      console.error('Error initializing MinIO buckets:', error);
    }
  }

  // Upload single file
  static uploadSingle = upload.single('file');

  static async uploadFile(req: AuthenticatedRequest, res: Response) {
    try {
      // Validate query parameters
      const { error, value } = uploadQuerySchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const { type, taskId } = value;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      const config = FILE_CONFIGS[type as keyof typeof FILE_CONFIGS];
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const userId = req.user?.id;

      let fileBuffer = req.file.buffer;
      let contentType = req.file.mimetype;

      // Process image files
      if (config.resize && req.file.mimetype.startsWith('image/')) {
        try {
          fileBuffer = await sharp(req.file.buffer)
            .resize(config.resize.width, config.resize.height, {
              fit: 'cover',
              position: 'center',
            })
            .jpeg({ quality: 85 })
            .toBuffer();
          
          contentType = 'image/jpeg';
        } catch (error) {
          console.error('Image processing error:', error);
          // Continue with original file if processing fails
        }
      }

      // Upload to MinIO
      const metaData = {
        'Content-Type': contentType,
        'Uploaded-By': userId || 'unknown',
        'Upload-Date': new Date().toISOString(),
        'Original-Name': req.file.originalname,
      };

      if (taskId) {
        metaData['Task-ID'] = taskId;
      }

      await minioClient.putObject(
        config.bucket,
        fileName,
        fileBuffer,
        fileBuffer.length,
        metaData
      );

      // Generate file URL
      const fileUrl = await minioClient.presignedGetObject(
        config.bucket,
        fileName,
        24 * 60 * 60 // 24 hours
      );

      // For profile images, generate permanent URL
      let permanentUrl = fileUrl;
      if (type === 'profile_image') {
        permanentUrl = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${config.bucket}/${fileName}`;
      }

      const fileInfo = {
        id: fileName,
        originalName: req.file.originalname,
        fileName: fileName,
        mimeType: contentType,
        size: fileBuffer.length,
        bucket: config.bucket,
        url: fileUrl,
        permanentUrl: permanentUrl,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        taskId: taskId || null,
      };

      res.json({
        success: true,
        data: { file: fileInfo },
        message: 'File uploaded successfully',
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload file',
      });
    }
  }

  // Upload multiple files
  static uploadMultiple = upload.array('files', 10);

  static async uploadMultipleFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const { error, value } = uploadQuerySchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const { type, taskId } = value;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded',
        });
      }

      const config = FILE_CONFIGS[type as keyof typeof FILE_CONFIGS];
      const userId = req.user?.id;
      const uploadPromises: Promise<any>[] = [];

      for (const file of files) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;

        let fileBuffer = file.buffer;
        let contentType = file.mimetype;

        // Process image files
        if (config.resize && file.mimetype.startsWith('image/')) {
          try {
            fileBuffer = await sharp(file.buffer)
              .resize(config.resize.width, config.resize.height, {
                fit: 'cover',
                position: 'center',
              })
              .jpeg({ quality: 85 })
              .toBuffer();
            
            contentType = 'image/jpeg';
          } catch (error) {
            console.error('Image processing error:', error);
          }
        }

        const metaData = {
          'Content-Type': contentType,
          'Uploaded-By': userId || 'unknown',
          'Upload-Date': new Date().toISOString(),
          'Original-Name': file.originalname,
        };

        if (taskId) {
          metaData['Task-ID'] = taskId;
        }

        const uploadPromise = minioClient.putObject(
          config.bucket,
          fileName,
          fileBuffer,
          fileBuffer.length,
          metaData
        ).then(async () => {
          const fileUrl = await minioClient.presignedGetObject(
            config.bucket,
            fileName,
            24 * 60 * 60
          );

          let permanentUrl = fileUrl;
          if (type === 'profile_image') {
            permanentUrl = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${config.bucket}/${fileName}`;
          }

          return {
            id: fileName,
            originalName: file.originalname,
            fileName: fileName,
            mimeType: contentType,
            size: fileBuffer.length,
            bucket: config.bucket,
            url: fileUrl,
            permanentUrl: permanentUrl,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            taskId: taskId || null,
          };
        });

        uploadPromises.push(uploadPromise);
      }

      const uploadedFiles = await Promise.all(uploadPromises);

      res.json({
        success: true,
        data: { files: uploadedFiles },
        message: `${uploadedFiles.length} files uploaded successfully`,
      });

    } catch (error) {
      console.error('Multiple files upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload files',
      });
    }
  }

  // Get file information
  static async getFileInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const { bucket, fileName } = req.params;

      if (!Object.values(BUCKETS).includes(bucket)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid bucket name',
        });
      }

      const stat = await minioClient.statObject(bucket, fileName);
      const url = await minioClient.presignedGetObject(bucket, fileName, 24 * 60 * 60);

      const fileInfo = {
        fileName: fileName,
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        metaData: stat.metaData,
        url: url,
      };

      res.json({
        success: true,
        data: { file: fileInfo },
      });

    } catch (error) {
      console.error('Get file info error:', error);
      if (error.code === 'NotFound') {
        return res.status(404).json({
          success: false,
          error: 'File not found',
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to get file information',
      });
    }
  }

  // Delete file
  static async deleteFile(req: AuthenticatedRequest, res: Response) {
    try {
      const { bucket, fileName } = req.params;
      const userId = req.user?.id;

      if (!Object.values(BUCKETS).includes(bucket)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid bucket name',
        });
      }

      // Check if file exists and get metadata
      let stat;
      try {
        stat = await minioClient.statObject(bucket, fileName);
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: 'File not found',
        });
      }

      // Check permissions - users can only delete their own files unless admin
      const uploadedBy = stat.metaData?.['uploaded-by'] || stat.metaData?.['Uploaded-By'];
      if (req.user?.role !== 'ADMIN' && uploadedBy !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only delete your own files.',
        });
      }

      // Delete file
      await minioClient.removeObject(bucket, fileName);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });

    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
      });
    }
  }

  // List files in bucket (Admin only)
  static async listFiles(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin role required.',
        });
      }

      const { bucket } = req.params;
      const { prefix = '', limit = 100 } = req.query;

      if (!Object.values(BUCKETS).includes(bucket)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid bucket name',
        });
      }

      const files: any[] = [];
      let count = 0;

      return new Promise((resolve) => {
        const stream = minioClient.listObjects(bucket, prefix as string, true);
        
        stream.on('data', async (obj) => {
          if (count >= parseInt(limit as string)) return;
          
          files.push({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
            etag: obj.etag,
          });
          count++;
        });

        stream.on('end', () => {
          res.json({
            success: true,
            data: { files, total: files.length },
          });
          resolve(undefined);
        });

        stream.on('error', (error) => {
          console.error('List files error:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to list files',
          });
          resolve(undefined);
        });
      });

    } catch (error) {
      console.error('List files error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list files',
      });
    }
  }

  // Get file download URL
  static async getDownloadUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const { bucket, fileName } = req.params;
      const { expires = '3600' } = req.query; // Default 1 hour

      if (!Object.values(BUCKETS).includes(bucket)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid bucket name',
        });
      }

      const expiresIn = parseInt(expires as string);
      if (isNaN(expiresIn) || expiresIn > 7 * 24 * 60 * 60) { // Max 7 days
        return res.status(400).json({
          success: false,
          error: 'Invalid expires time (max 7 days)',
        });
      }

      const url = await minioClient.presignedGetObject(bucket, fileName, expiresIn);

      res.json({
        success: true,
        data: { 
          url,
          expires: new Date(Date.now() + expiresIn * 1000).toISOString(),
        },
      });

    } catch (error) {
      console.error('Get download URL error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate download URL',
      });
    }
  }
}

// Initialize buckets on startup
UploadController.initializeBuckets().catch(console.error);

export default UploadController;