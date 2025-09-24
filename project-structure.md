# Структура проєкту

```
geidesy-team-app/
│
├── README.md                           # Головна документація проєкту
├── .gitignore                         # Git ignore файл
├── docker-compose.yml                 # Docker Compose для розробки
├── package.json                       # Root package.json для scripts
│
├── backend/                           # Backend API (Node.js + TypeScript)
│   ├── src/
│   │   ├── controllers/               # HTTP контролери
│   │   │   ├── auth.controller.ts
│   │   │   ├── tasks.controller.ts
│   │   │   ├── teams.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   └── reports.controller.ts
│   │   ├── services/                  # Бізнес логіка
│   │   │   ├── auth.service.ts
│   │   │   ├── tasks.service.ts
│   │   │   ├── teams.service.ts
│   │   │   ├── sync.service.ts
│   │   │   └── notification.service.ts
│   │   ├── models/                    # Prisma моделі та типи
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── middleware/                # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── routes/                    # API роути
│   │   │   ├── auth.routes.ts
│   │   │   ├── tasks.routes.ts
│   │   │   ├── teams.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   └── index.ts
│   │   ├── websocket/                 # WebSocket handlers
│   │   │   ├── index.ts
│   │   │   ├── task.handlers.ts
│   │   │   └── location.handlers.ts
│   │   ├── utils/                     # Утилітарні функції
│   │   │   ├── logger.ts
│   │   │   ├── geo.utils.ts
│   │   │   ├── file.utils.ts
│   │   │   └── validation.ts
│   │   ├── types/                     # TypeScript типи
│   │   │   ├── api.types.ts
│   │   │   ├── auth.types.ts
│   │   │   └── database.types.ts
│   │   ├── app.ts                     # Express app configuration
│   │   └── server.ts                  # Server entry point
│   ├── tests/                         # Тести
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
│   │   ├── components/                # Переспроектні компоненти
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── maps/
│   │   │   ├── dashboard/
│   │   │   └── layout/
│   │   ├── pages/                     # Сторінки додатка
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
│   │   ├── services/                  # API сервіси
│   │   │   ├── api.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── tasks.service.ts
│   │   │   └── websocket.service.ts
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── useGeolocation.ts
│   │   ├── utils/                     # Утилітарні функції
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── types/                     # TypeScript типи
│   │   │   ├── api.types.ts
│   │   │   ├── store.types.ts
│   │   │   └── component.types.ts
│   │   ├── styles/                    # CSS/SCSS файли
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
│   │   ├── screens/                   # Екрани додатка
│   │   │   ├── Home/
│   │   │   ├── Tasks/
│   │   │   ├── TaskDetails/
│   │   │   ├── Camera/
│   │   │   ├── Maps/
│   │   │   ├── Profile/
│   │   │   └── Auth/
│   │   ├── components/                # Компоненти
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── maps/
│   │   │   └── camera/
│   │   ├── navigation/                # Навігаційна структура
│   │   │   ├── AppNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   └── TabNavigator.tsx
│   │   ├── database/                  # WatermelonDB моделі
│   │   │   ├── models/
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── services/                  # API та утилітарні сервіси
│   │   │   ├── api.service.ts
│   │   │   ├── sync.service.ts
│   │   │   ├── location.service.ts
│   │   │   ├── camera.service.ts
│   │   │   └── notification.service.ts
│   │   ├── store/                     # State management
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   └── index.ts
│   │   ├── utils/                     # Допоміжні функції
│   │   │   ├── permissions.ts
│   │   │   ├── storage.ts
│   │   │   ├── formatters.ts
│   │   │   └── constants.ts
│   │   ├── types/                     # TypeScript типи
│   │   ├── App.tsx
│   │   └── index.ts
│   ├── android/                       # Android specific files
│   ├── ios/                          # iOS specific files
│   ├── package.json
│   ├── tsconfig.json
│   ├── metro.config.js
│   └── react-native.config.js
│
├── database/                          # База даних
│   ├── migrations/                    # SQL міграції
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_geospatial.sql
│   │   └── 003_add_indexes.sql
│   ├── seeds/                         # Тестові дані
│   │   ├── users.sql
│   │   ├── teams.sql
│   │   └── sample_data.sql
│   └── schemas/                       # Схеми БД
│       ├── tables.sql
│       ├── indexes.sql
│       └── triggers.sql
│
├── docker/                           # Docker конфігурації
│   ├── development/
│   │   ├── docker-compose.yml
│   │   ├── postgres.dockerfile
│   │   └── redis.dockerfile
│   └── production/
│       ├── docker-compose.prod.yml
│       ├── nginx.conf
│       └── ssl/
│
├── scripts/                          # Скрипти автоматизації
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
└── docs/                             # Документація
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
    │   ├── manager-guide.md
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

## Опис ключових папок

### Backend (`/backend`)
- **Архітектура:** Clean Architecture з розділенням на шари
- **ORM:** Prisma для роботи з PostgreSQL
- **API:** RESTful API + WebSocket для real-time
- **Тести:** Unit, Integration, E2E тести

### Frontend (`/frontend`)
- **Framework:** React.js з TypeScript
- **State Management:** Redux Toolkit
- **UI Library:** Material-UI
- **Routing:** React Router v6

### Mobile (`/mobile`)
- **Framework:** React Native з TypeScript
- **Navigation:** React Navigation v6
- **Local DB:** WatermelonDB для офлайн роботи
- **State:** Context API + AsyncStorage

### Database (`/database`)
- **СУБД:** PostgreSQL 14+ з PostGIS розширенням
- **Міграції:** SQL файли для версіонування схеми
- **Seeds:** Тестові дані для розробки

### Docker (`/docker`)
- **Development:** Docker Compose для локальної розробки
- **Production:** Оптимізовані контейнери для продакшен

### Scripts (`/scripts`)
- **Deploy:** Автоматизація розгортання
- **Backup:** Резервне копіювання даних
- **Monitoring:** Скрипти моніторингу

### Docs (`/docs`)
- **Architecture:** Технічна документація системи
- **API:** Документація REST API та WebSocket
- **User Guides:** Інструкції для користувачів
- **Development:** Документація для розробників