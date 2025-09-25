import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './tasks.routes';
import teamRoutes from './teams.routes';
import userRoutes from './users.routes';
import uploadRoutes from './upload.routes';
import sitesRoutes from './sites.routes';

const router = Router();

// API version prefix
const API_VERSION = '/v1';

// Route definitions
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/tasks`, taskRoutes);
router.use(`${API_VERSION}/teams`, teamRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/upload`, uploadRoutes);
router.use(`${API_VERSION}/sites`, sitesRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Surveying Team Management API',
    version: '1.0.0',
    description: 'REST API for managing surveying teams and tasks',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      tasks: `${API_VERSION}/tasks`,
      teams: `${API_VERSION}/teams`,
      users: `${API_VERSION}/users`,
      upload: `${API_VERSION}/upload`,
      sites: `${API_VERSION}/sites`
    }
  });
});

export default router;