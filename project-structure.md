# Project Structure

```
geidesy-team-app/
│
├── README.md                           # Main project documentation
├── .gitignore                         # Git ignore file
├── docker-compose.yml                 # Docker Compose for development
├── package.json                       # Root package.json for scripts
│
├── backend/                           # Backend API (Node.js + TypeScript)
│   ├── src/
│   │   ├── controllers/               # HTTP controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── tasks.controller.ts
│   │   │   ├── teams.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   └── reports.controller.ts
│   │   ├── services/                  # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── tasks.service.ts
│   │   │   ├── teams.service.ts
│   │   │   ├── sync.service.ts
│   │   │   └── notification.service.ts
│   │   ├── models/                    # Prisma models and types
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── middleware/                # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── routes/                    # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── tasks.routes.ts
│   │   │   ├── teams.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   └── index.ts
│   │   ├── websocket/                 # WebSocket handlers
│   │   │   ├── index.ts
│   │   │   ├── task.handlers.ts
│   │   │   └── location.handlers.ts
│   │   ├── utils/                     # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── geo.utils.ts
│   │   │   ├── file.utils.ts
│   │   │   └── validation.ts
│   │   ├── types/                     # TypeScript types
│   │   │   ├── api.types.ts
│   │   │   ├── auth.types.ts
│   │   │   └── database.types.ts
│   │   ├── app.ts                     # Express app configuration
│   │   └── server.ts                  # Server entry point
│   ├── tests/                         # Tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── prisma/                        # Prisma ORM
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                          # Web Frontend (React.js)
│   ├── src/
│   │   ├── components/                # Reusable components
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── maps/
│   │   │   ├── dashboard/
│   │   │   └── layout/
│   │   ├── pages/                     # Application pages
│   │   │   ├── Dashboard/
│   │   │   ├── Tasks/
│   │   │   ├── Teams/
│   │   │   ├── Reports/
│   │   │   ├── Settings/
│   │   │   └── Auth/
│   │   ├── store/                     # Redux store
│   │   │   ├── slices/
│   │   │   ├── api/
│   │   │   └── index.ts
│   │   ├── services/                  # API services
│   │   │   ├── api.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── tasks.service.ts
│   │   │   └── websocket.service.ts
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── useGeolocation.ts
│   │   ├── utils/                     # Utility functions
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── types/                     # TypeScript types
│   │   │   ├── api.types.ts
│   │   │   ├── store.types.ts
│   │   │   └── component.types.ts
│   │   ├── styles/                    # CSS/SCSS files
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── components/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── setupTests.ts
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── icons/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── Dockerfile
│
├── mobile/                            # Mobile App (React Native)
│   ├── src/
│   │   ├── screens/                   # App screens
│   │   │   ├── Home/
│   │   │   ├── Tasks/
│   │   │   ├── TaskDetails/
│   │   │   ├── Camera/
│   │   │   ├── Maps/
│   │   │   ├── Profile/
│   │   │   └── Auth/
│   │   ├── components/                # Components
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── maps/
│   │   │   └── camera/
│   │   ├── navigation/                # Navigation structure
│   │   │   ├── AppNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   └── TabNavigator.tsx
│   │   ├── database/                  # WatermelonDB models
│   │   │   ├── models/
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── services/                  # API and utility services
│   │   │   ├── api.service.ts
│   │   │   ├── sync.service.ts
│   │   │   ├── location.service.ts
│   │   │   ├── camera.service.ts
│   │   │   └── notification.service.ts
│   │   ├── store/                     # State management
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   └── index.ts
│   │   ├── utils/                     # Helper functions
│   │   │   ├── permissions.ts
│   │   │   ├── storage.ts
│   │   │   ├── formatters.ts
│   │   │   └── constants.ts
│   │   ├── types/                     # TypeScript types
│   │   ├── App.tsx
│   │   └── index.ts
│   ├── android/                       # Android specific files
│   ├── ios/                          # iOS specific files
│   ├── package.json
│   ├── tsconfig.json
│   ├── metro.config.js
│   └── react-native.config.js
│
├── database/                          # Database
│   ├── migrations/                    # SQL migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_geospatial.sql
│   │   └── 003_add_indexes.sql
│   ├── seeds/                         # Test data
│   │   ├── users.sql
│   │   ├── teams.sql
│   │   └── sample_data.sql
│   └── schemas/                       # DB schemas
│       ├── tables.sql
│       ├── indexes.sql
│       └── triggers.sql
│
├── docker/                           # Docker configurations
│   ├── development/
│   │   ├── docker-compose.yml
│   │   ├── postgres.dockerfile
│   │   └── redis.dockerfile
│   └── production/
│       ├── docker-compose.prod.yml
│       ├── nginx.conf
│       └── ssl/
│
├── scripts/                          # Automation scripts
│   ├── deploy/
│   │   ├── deploy.sh
│   │   ├── rollback.sh
│   │   └── health-check.sh
│   ├── backup/
│   │   ├── db-backup.sh
│   │   ├── files-backup.sh
│   │   └── restore.sh
│   └── monitoring/
│       ├── setup-monitoring.sh
│       └── log-analyzer.sh
│
└── docs/                             # Documentation
    ├── architecture/
    │   ├── system-architecture.md
    │   ├── database-design.md
    │   ├── api-design.md
    │   └── security.md
    ├── api/
    │   ├── api-reference.md
    │   ├── authentication.md
    │   └── websocket-events.md
    ├── user-guides/
    │   ├── supervisor-guide.md
    │   ├── team-guide.md
    │   └── admin-guide.md
    ├── development/
    │   ├── setup-guide.md
    │   ├── coding-standards.md
    │   ├── testing-guide.md
    │   └── deployment-guide.md
    └── planning/
        ├── development-plan.md
        ├── user-stories.md
        └── requirements.md
```

## Key Folder Descriptions

### Backend (`/backend`)
- **Architecture:** Clean Architecture with layer separation
- **ORM:** Prisma for PostgreSQL operations
- **API:** RESTful API + WebSocket for real-time
- **Tests:** Unit, Integration, E2E tests

### Frontend (`/frontend`)
- **Framework:** React.js with TypeScript
- **State Management:** Redux Toolkit
- **UI Library:** Material-UI
- **Routing:** React Router v6

### Mobile (`/mobile`)
- **Framework:** React Native with TypeScript
- **Navigation:** React Navigation v6
- **Local DB:** WatermelonDB for offline operation
- **State:** Context API + AsyncStorage

### Database (`/database`)
- **DBMS:** PostgreSQL 14+ with PostGIS extension
- **Migrations:** SQL files for schema versioning
- **Seeds:** Test data for development

### Docker (`/docker`)
- **Development:** Docker Compose for local development
- **Production:** Optimized containers for production

### Scripts (`/scripts`)
- **Deploy:** Deployment automation
- **Backup:** Data backup operations
- **Monitoring:** Monitoring scripts

### Docs (`/docs`)
- **Architecture:** Technical system documentation
- **API:** REST API and WebSocket documentation
- **User Guides:** Instructions for users
- **Development:** Documentation for developers