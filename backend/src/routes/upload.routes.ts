import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';
import { rateLimitStrict, rateLimitModerate } from '../middleware/rateLimiter.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// POST /api/upload/single - Upload single file
router.post('/single', 
  rateLimitModerate,
  UploadController.uploadSingle,
  UploadController.uploadFile
);

// POST /api/upload/multiple - Upload multiple files
router.post('/multiple', 
  rateLimitModerate,
  UploadController.uploadMultiple,
  UploadController.uploadMultipleFiles
);

// GET /api/upload/:bucket/:fileName/info - Get file information
router.get('/:bucket/:fileName/info', 
  rateLimitModerate,
  UploadController.getFileInfo
);

// GET /api/upload/:bucket/:fileName/download - Get file download URL
router.get('/:bucket/:fileName/download', 
  rateLimitModerate,
  UploadController.getDownloadUrl
);

// DELETE /api/upload/:bucket/:fileName - Delete file
router.delete('/:bucket/:fileName', 
  rateLimitStrict,
  UploadController.deleteFile
);

// GET /api/upload/:bucket/list - List files in bucket (Admin only)
router.get('/:bucket/list', 
  requireRoles(['ADMIN']),
  rateLimitModerate,
  UploadController.listFiles
);

export default router;