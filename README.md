# 🗺️ Surveying Team Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

> Modern digital platform for efficient management and coordination of surveying teams with GPS tracking, real-time monitoring, and offline synchronization.

## 🎯 Project Overview

Comprehensive system for coordinating surveying team operations, including:
- 📱 **Mobile Application** for field teams (React Native)
- 🖥️ **Web Application** for supervisors (React.js)
- ⚡ **Backend API** with real-time functionality (Node.js + TypeScript)
- 🗄️ **Geospatial Database** (PostgreSQL + PostGIS)

**Goal:** Replace Excel spreadsheets with a professional digital system for managing up to 20 surveying teams with 30% improved coordination efficiency.

## Project Structure

```
geidesy-team-app/
├── backend/                    # Backend API server (Node.js + TypeScript)
├── frontend/                   # Web application for supervisors (React.js)
├── mobile/                     # Mobile app for teams (React Native)
├── database/                   # Database and migrations (PostgreSQL + PostGIS)
├── docker/                     # Docker configurations
├── scripts/                    # Automation scripts
└── docs/                       # Documentation
    ├── architecture/           # Technical architecture
    ├── api/                   # API documentation
    ├── user-guides/           # User instructions
    ├── development/           # Development documentation
    └── planning/              # Project planning
```

## ✨ Key Features

### 🖥️ Web Application (Supervisor)
- 📍 **Real-time dashboard** with interactive map of active tasks
- 📊 **Performance analytics** with team productivity visualization
- 📋 **Task management** with automatic assignment capabilities
- 👥 **Team coordination** and schedule planning
- 📈 **Reporting system** with PDF/Excel export functionality
- 🔔 **Push notifications** for task status updates

### 📱 Mobile Application (Field Teams)  
- 📋 **Intuitive task list** with prioritization
- 🗺️ **GPS navigation** to sites with 5-meter accuracy
- 📸 **Photo reports** with automatic geotagging and timestamps
- 🔄 **Offline mode** with automatic synchronization
- ⚡ **Real-time updates** of task statuses
- 📍 **Automatic GPS tracking** of routes

## Tech Stack

### Backend
- **Language:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL + PostGIS
- **ORM:** Prisma
- **Caching:** Redis
- **Files:** AWS S3 / MinIO

### Frontend
- **Framework:** React.js + TypeScript
- **UI:** Material-UI
- **Maps:** Leaflet
- **State:** Redux Toolkit

### Mobile
- **Framework:** React Native
- **Navigation:** React Navigation
- **Maps:** React Native Maps
- **Offline:** WatermelonDB
- **Push:** Firebase Cloud Messaging

### DevOps
- **Containers:** Docker
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana

## 🚀 Quick Start

### 📋 System Requirements
- **Node.js** 18.0.0 or higher
- **Docker** and **Docker Compose** for containerization
- **Git** for repository cloning
- **npm** or **yarn** for package management

### ⚡ Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/HarrySkySon/geidesy-team-app.git
   cd geidesy-team-app
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Start development environment**
   ```bash
   # Start all services via Docker
   npm run dev
   
   # View logs
   npm run dev:logs
   ```

4. **Initialize database**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Seed with test data
   npm run db:seed
   ```

5. **Access applications**
   - 🖥️ **Web App:** http://localhost:80
   - ⚡ **API:** http://localhost:3000/api
   - 🗄️ **Prisma Studio:** `npm run db:studio`
   - 📦 **MinIO Console:** http://localhost:9001

## 👥 Development

### 🏗️ Team Structure
- **Project Manager:** 1 person - coordination and planning
- **Backend Developer:** 1-2 people - API and database
- **Frontend Developer:** 1 person - web interface
- **Mobile Developer:** 1 person - React Native app  
- **UI/UX Designer:** 1 person - interface design
- **QA Engineer:** 1 person - testing and quality

### 🎯 Development Roadmap

| Phase | Duration | Main Tasks |
|-------|----------|------------|
| **Phase 1: MVP** | 8-12 weeks | Backend API, web app, basic mobile app |
| **Phase 2: Enhanced** | 4-6 weeks | Offline sync, UX improvements, analytics |
| **Phase 3: Advanced** | 4-6 weeks | Integrations, optimization, extended features |

### 📊 Useful Developer Commands

```bash
# Individual component development
npm run backend:dev    # Backend in dev mode
npm run frontend:dev   # Frontend in dev mode
npm run mobile:dev     # React Native Metro bundler

# Testing
npm run test          # Run all tests
npm run test:backend  # Backend tests
npm run test:frontend # Frontend tests

# Linting and formatting
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix ESLint errors

# Database
npm run db:studio     # Prisma Studio UI
npm run db:reset      # Reset database
```

## 📈 Success Criteria

| Metric | Target Value |
|--------|--------------|
| ⚡ **API Response Time** | < 200ms (95% requests) |
| 🔄 **Sync Success Rate** | > 99% |
| 📱 **Mobile Crash Rate** | < 0.1% |
| 🔐 **System Uptime** | > 99.5% |
| 📈 **Efficiency Improvement** | +30% coordination |
| 🎯 **GPS Accuracy** | < 5m (90% measurements) |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.

## 📞 Contact & Support

- 📧 **Email:** team@geodesy-app.com
- 📚 **Documentation:** [docs/](docs/)  
- 🐛 **Issues:** [GitHub Issues](https://github.com/HarrySkySon/geidesy-team-app/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/HarrySkySon/geidesy-team-app/discussions)

---

<div align="center">
  
**🌟 Made with ❤️ for efficient surveying coordination 🌟**

</div>