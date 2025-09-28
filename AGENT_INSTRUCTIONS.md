# 🤖 Agent Instructions - Surveying Team Management System

## 📋 **Project Overview**
**System Name:** Geodesy Team Management Application
**GitHub Repository:** https://github.com/HarrySkySon/geidesy-team-app/
**Owner:** HarrySkySon
**Goal:** Replace Excel-based workflow with comprehensive digital solution for surveying team management
**Technologies:** React.js, React Native, Node.js, PostgreSQL+PostGIS, Docker

---

## 🎯 **Core Agent Responsibilities**

### 1. **Progress Tracking & Documentation**
- **MANDATORY:** After completing ANY development step, update `PROJECT_PROGRESS.md`
- Include timestamp, completion percentage, and detailed description
- Track issues, blockers, and solutions implemented
- Document performance metrics and optimization results
- Update phase status and overall project completion percentage

### 2. **Git Repository Management**
- **Repository Access:** Fully configured with push/pull rights to https://github.com/HarrySkySon/geidesy-team-app/
- **Commit Policy:** Make commits after each significant feature/fix implementation
- **Commit Message Format:** Follow conventional commits (feat:, fix:, docs:, refactor:, test:)
- **Branch Strategy:** Work on master branch unless specified otherwise
- **Push Policy:** Push changes immediately after local commits

### 3. **Code Quality & Standards**
- Follow TypeScript strict mode requirements
- Maintain consistent code formatting and linting
- Implement comprehensive error handling
- Write unit tests for critical functions
- Document complex logic with inline comments
- Follow React/React Native best practices

---

## 🛠 **Development Environment Setup**

### **Local Development Dependencies** (Pre-installed & Configured)
- ✅ Node.js 18+ with npm/yarn
- ✅ Git with SSH keys configured for HarrySkySon account
- ✅ Docker Desktop for containerized services
- ✅ Visual Studio Code with extensions
- ✅ Android Studio for mobile development
- ✅ Expo CLI for React Native development

### **Project Structure**
```
geidesy-team-app/
├── backend/          # Node.js + Express API
├── frontend/         # React.js web application
├── mobile/          # React Native mobile app
├── database/        # PostgreSQL + PostGIS schemas
├── docker/          # Docker configurations
├── docs/           # Technical documentation
├── scripts/        # Automation scripts
└── tests/          # Test suites
```

---

## 🚀 **Development Workflow**

### **Step 1: Task Analysis**
1. Read and understand the user requirement
2. Analyze current project state in `PROJECT_PROGRESS.md`
3. Identify affected components (backend/frontend/mobile)
4. Plan implementation approach

### **Step 2: Implementation**
1. Create feature branch if needed (git checkout -b feature/task-name)
2. Implement code changes following project patterns
3. Test functionality locally
4. Run linting and type checking
5. Write/update unit tests if applicable

### **Step 3: Integration & Deployment**
1. Commit changes with descriptive message
2. Push to repository: `git push origin master`
3. Update `PROJECT_PROGRESS.md` with completion details
4. Verify deployment in production environment if needed

### **Step 4: Documentation**
1. Update relevant documentation files
2. Add comments to complex code sections
3. Update API documentation if backend changes made
4. Create/update user guides if UI changes made

---

## 📊 **Progress Reporting Format**

### **Required Updates to PROJECT_PROGRESS.md:**
```markdown
## [TIMESTAMP] - [FEATURE/TASK NAME]
**Status:** ✅ COMPLETED / 🔄 IN PROGRESS / ❌ BLOCKED
**Duration:** [Time taken]
**Components Modified:** [backend/frontend/mobile]
**Files Changed:** [List of key files]
**Commit Hash:** [Git commit hash]

### Implementation Details:
- [Specific changes made]
- [Technical approach used]
- [Challenges overcome]

### Testing Results:
- [Test coverage added]
- [Performance metrics]
- [User acceptance criteria met]

### Next Steps:
- [Follow-up tasks identified]
- [Dependencies for future work]
```

---

## ⚠️ **Critical Guidelines**

### **Security & Best Practices**
- ❌ NEVER commit sensitive data (API keys, passwords, tokens)
- ❌ NEVER expose database credentials in code
- ✅ Use environment variables for configuration
- ✅ Validate all user inputs
- ✅ Implement proper authentication checks
- ✅ Use HTTPS for all production communications

### **Performance Requirements**
- Mobile app: < 3 second loading time
- Web app: < 2 second page loads
- API responses: < 500ms average
- Database queries: Optimized with proper indexing
- Real-time updates: WebSocket implementation

### **Error Handling**
- Implement try-catch blocks for all async operations
- Log errors with context information
- Provide user-friendly error messages
- Implement retry mechanisms for network operations
- Monitor and alert on critical errors

---

## 🔧 **Available Commands & Scripts**

### **Development Commands**
```bash
# Start full development environment
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm start

# Mobile development
cd mobile && expo start

# Run tests
npm test

# Build for production
npm run build

# Deploy to production
npm run deploy
```

### **Git Workflow Commands**
```bash
# Standard workflow
git add .
git commit -m "feat: implement user authentication"
git push origin master

# Create feature branch
git checkout -b feature/new-functionality
git push -u origin feature/new-functionality
```

---

## 📱 **Mobile Development Specifics**

### **React Native Setup**
- Expo SDK 49+ configured
- Android development environment ready
- Testing on Android Studio emulator available
- APK generation configured for production builds

### **Mobile Testing Protocol**
1. Test on Android emulator (API level 30+)
2. Verify offline functionality
3. Test GPS/location services
4. Validate performance on low-end devices
5. Test app store deployment process

---

## 🎯 **Success Criteria**

### **Code Quality Metrics**
- TypeScript strict mode: 100% compliance
- Test coverage: >80% for critical paths
- ESLint/Prettier: Zero warnings in production builds
- Performance: All Lighthouse scores >90

### **Deployment Success**
- Zero-downtime deployments
- Automated CI/CD pipeline success
- Production monitoring alerts configured
- Backup and recovery procedures tested

---

## 📞 **Emergency Procedures**

### **If Build Fails:**
1. Check `package-lock.json` for dependency conflicts
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Verify environment variables in `.env` files
4. Check Docker containers status: `docker ps`

### **If Git Issues:**
1. Check remote connection: `git remote -v`
2. Verify SSH key access to HarrySkySon account
3. Force push if needed: `git push --force-with-lease`

### **If Database Issues:**
1. Check Docker PostgreSQL container: `docker logs geodesy-db`
2. Verify database schema: `npx prisma db pull`
3. Reset database if needed: `npx prisma migrate reset`

---

## 📈 **Performance Optimization Priorities**

1. **Database Query Optimization**
   - Use proper indexing for geospatial queries
   - Implement query result caching
   - Optimize joins for team/user relationships

2. **Frontend Performance**
   - Implement code splitting and lazy loading
   - Optimize bundle size with tree shaking
   - Use React.memo for expensive components

3. **Mobile Performance**
   - Optimize image loading and caching
   - Minimize JavaScript bundle size
   - Implement efficient state management

---

**Last Updated:** 2024-09-28
**Version:** 1.0
**Maintainer:** Claude AI Agent
**Repository:** https://github.com/HarrySkySon/geidesy-team-app/