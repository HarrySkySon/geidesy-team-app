# 🏗️ Geodesy Team Management System - Production Setup

## 📋 Overview

This document provides step-by-step instructions for setting up the production environment of the Geodesy Team Management System.

## 🔧 Prerequisites

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v13 or higher with PostGIS extension
- **Redis**: v6.0 or higher (optional, for caching)
- **npm**: v9.0.0 or higher

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone and navigate to the project directory
cd geidesy-team-app

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env  # If frontend exists
```

### 2. Configure Environment Variables

Edit `backend/.env` with your production values:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/surveying_db"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV="production"
CORS_ORIGIN="https://your-frontend-domain.com"

# Optional: Redis Configuration
REDIS_URL="redis://localhost:6379"

# PostGIS Support
ENABLE_POSTGIS=true
```

### 3. Database Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed
```

### 4. Start the Application

#### Option 1: Quick Start (Recommended for Testing)
```bash
# From project root directory
node start-production.js
```

#### Option 2: Manual Start
```bash
# Backend
cd backend
npm run dev

# Frontend (if exists)
cd frontend
npm start
```

## 📡 API Endpoints

The backend server will be available at `http://localhost:3000`

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Reset password

### Task Management Endpoints
- `GET /api/v1/tasks` - Get all tasks (with pagination and filters)
- `GET /api/v1/tasks/:id` - Get task by ID
- `POST /api/v1/tasks` - Create new task (Supervisors/Admins only)
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task (Supervisors/Admins only)
- `PUT /api/v1/tasks/:id/status` - Update task status
- `POST /api/v1/tasks/:id/reports` - Create task report
- `GET /api/v1/tasks/:id/location` - Get task location

### Team Management Endpoints
- `GET /api/v1/teams` - Get all teams
- `GET /api/v1/teams/:id` - Get team by ID
- `POST /api/v1/teams` - Create new team (Supervisors/Admins only)
- `PUT /api/v1/teams/:id` - Update team
- `DELETE /api/v1/teams/:id` - Delete team (Supervisors/Admins only)
- `GET /api/v1/teams/:id/members` - Get team members
- `POST /api/v1/teams/:id/members` - Add team member
- `DELETE /api/v1/teams/:id/members/:userId` - Remove team member
- `PUT /api/v1/teams/:id/location` - Update team location

### User Management Endpoints
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user profile
- `DELETE /api/v1/users/:id` - Delete user (Admins only)

### Site Management Endpoints
- `GET /api/v1/sites` - Get all sites
- `GET /api/v1/sites/:id` - Get site by ID
- `POST /api/v1/sites` - Create new site
- `PUT /api/v1/sites/:id` - Update site
- `DELETE /api/v1/sites/:id` - Delete site

### File Upload Endpoints
- `POST /api/v1/upload/task-attachment/:taskId` - Upload task attachment
- `POST /api/v1/upload/report-attachment/:reportId` - Upload report attachment
- `DELETE /api/v1/upload/:fileId` - Delete uploaded file

## 🔐 Test User Accounts

After running the seed command, you can use these test accounts:

```
Admin Account:
Email: admin@geodesy.com
Password: password123

Supervisor Account:
Email: supervisor@geodesy.com
Password: password123

Team Member Account:
Email: member1@geodesy.com
Password: password123
```

## 🏗️ System Architecture

### Backend Stack
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Validation**: Joi schema validation
- **Real-time**: Socket.io for WebSocket connections
- **File Storage**: Multer for file uploads
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston logger

### Database Schema
- **Users**: Authentication and profile management
- **Teams**: Team organization and membership
- **Sites**: Survey locations with GPS coordinates
- **Tasks**: Work assignments with status tracking
- **Reports**: Task completion reports with attachments
- **Locations**: GPS tracking for teams
- **Notifications**: System notifications

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### API Testing with cURL

```bash
# Login and get access token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@geodesy.com","password":"password123"}'

# Get all tasks (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create a new task
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Survey Task",
    "description": "Testing API task creation",
    "siteId": "SITE_ID_HERE",
    "priority": "MEDIUM",
    "scheduledDate": "2024-02-01T09:00:00Z",
    "estimatedDuration": 240
  }'
```

## 🔍 Monitoring and Health Checks

- **Health Check**: `GET /health`
- **API Information**: `GET /api`
- **Logs**: Check `backend/logs/` directory

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "uptime": 3600
}
```

## 📁 Project Structure

```
geidesy-team-app/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Server startup
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Database seeding
│   ├── logs/               # Application logs
│   └── package.json
├── frontend/               # React frontend (if exists)
├── mobile/                 # React Native mobile app (if exists)
├── start-production.js     # Quick start script
└── PRODUCTION_SETUP.md     # This file
```

## 🚨 Security Considerations

1. **Environment Variables**: Never commit .env files to version control
2. **JWT Secrets**: Use strong, randomly generated secrets in production
3. **Database**: Use strong database passwords and limit connection access
4. **CORS**: Configure CORS origins appropriately for your frontend domain
5. **Rate Limiting**: Adjust rate limits based on your usage patterns
6. **File Uploads**: Validate file types and sizes to prevent malicious uploads

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Solution: Check DATABASE_URL in .env file and ensure PostgreSQL is running
   ```

2. **JWT Token Invalid**
   ```
   Solution: Check JWT_SECRET in .env file and ensure tokens haven't expired
   ```

3. **Port Already in Use**
   ```
   Solution: Change PORT in .env file or stop the conflicting process
   ```

4. **Prisma Client Generation Error**
   ```bash
   Solution: Run `npm run prisma:generate` in backend directory
   ```

### Logs Location
- Error logs: `backend/logs/error.log`
- Combined logs: `backend/logs/combined.log`
- Console output: In development mode

## 📞 Support

For technical support or questions about the production setup:
1. Check the error logs in `backend/logs/`
2. Verify environment configuration
3. Ensure all dependencies are installed correctly
4. Check database connectivity and migrations

## 🎯 Next Steps

After successful setup, you can:
1. Customize the business logic in service files
2. Add additional API endpoints as needed
3. Implement frontend React components
4. Develop mobile application features
5. Set up automated testing and deployment pipelines

---

✅ **Production environment is now ready for use!**