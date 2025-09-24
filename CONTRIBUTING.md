# Contributing to Surveying Team Management System

Thank you for your interest in contributing to the Surveying Team Management System! 🎉

## How to Contribute

### 🔧 Setting Up Development Environment

1. **Fork the repository**
   ```bash
   gh repo fork HarrySkySon/geidesy-team-app
   cd geidesy-team-app
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Start development mode**
   ```bash
   npm run dev
   ```

### 📝 Development Process

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```

2. **Make your changes**
   - Follow the project's coding standards
   - Add tests for new functionality
   - Update documentation when necessary

3. **Check code quality**
   ```bash
   npm run lint      # ESLint check
   npm run test      # Run tests
   npm run build     # Check build
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add GPS tracking functionality"
   ```

5. **Push branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use our [PR template](.github/pull_request_template.md)
   - Add detailed description of changes
   - Include screenshots for UI changes

## 📋 Code Standards

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Commit types:**
- `feat`: new functionality
- `fix`: bug fixes
- `docs`: documentation changes
- `style`: code formatting
- `refactor`: code refactoring
- `perf`: performance improvements
- `test`: adding tests
- `chore`: technical changes

**Examples:**
```bash
feat(mobile): add GPS tracking for team location
fix(backend): resolve database connection timeout
docs(readme): update installation instructions
```

### Code Style

- **TypeScript** for all components
- **ESLint** + **Prettier** for formatting
- **Functional components** with hooks for React
- **Async/await** instead of promises
- **Descriptive names** for variables and functions

### Testing

- **Unit tests**: Jest + React Testing Library
- **Integration tests**: Supertest for API
- **E2E tests**: Detox for mobile app
- **Minimum coverage**: 80%

## 🐛 Bug Reports

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md):

1. **Problem description** - clear description of what happened
2. **Steps to reproduce** - step-by-step instructions
3. **Expected behavior** - what should have happened
4. **Screenshots** - if applicable
5. **Environment** - OS, app version, browser

## 💡 Feature Requests

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md):

1. **Problem** - what problem does the feature solve
2. **Solution** - detailed description of the proposal
3. **Alternatives** - other solution options
4. **Additional context** - screenshots, links

## 🏗️ Project Structure

### Backend (`/backend`)
- **Controllers** - HTTP request handlers
- **Services** - business logic
- **Models** - Prisma DB models
- **Middleware** - Express middleware
- **Routes** - API routes

### Frontend (`/frontend`)
- **Components** - React components
- **Pages** - application pages
- **Store** - Redux Toolkit state
- **Services** - API clients
- **Hooks** - custom React hooks

### Mobile (`/mobile`)
- **Screens** - React Native screens
- **Components** - reusable components
- **Navigation** - navigation structure
- **Database** - WatermelonDB models
- **Services** - API and utility services

## 🔍 Code Review Process

### For reviewers:
1. **Functionality** - does it work as expected?
2. **Code quality** - readability, maintainability
3. **Tests** - adequate test coverage
4. **Documentation** - updated when necessary
5. **Performance** - no performance regressions

### For PR authors:
- **Self-review** before creating PR
- **Descriptive comments** for complex logic
- **Small PRs** - easier to review
- **Responsiveness** to reviewer comments

## 📚 Resources

- [Technical Documentation](docs/architecture/)
- [API Documentation](docs/api/)
- [Development Plan](docs/planning/development-plan.md)
- [Coding Standards](docs/development/coding-standards.md)

## 🤝 Community

- **GitHub Discussions** for questions and ideas
- **Issues** for bugs and features
- **Email** team@geodesy-app.com for private inquiries

## ❓ Need Help?

Don't hesitate to ask questions! We're always ready to help new contributors:

- Create a **Discussion** with `question` tag
- Write in **Issue** with `help wanted` tag
- Contact maintainers via email

---

Thank you for your contribution to the Surveying Team Management System development! 🙏