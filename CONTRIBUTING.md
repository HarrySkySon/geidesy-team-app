# Contributing до проєкту Geodesy Team App

Дякуємо за інтерес до участі у розробці системи управління геодезичними бригадами! 🎉

## Як зробити свій внесок

### 🔧 Налаштування середовища розробки

1. **Fork репозиторій**
   ```bash
   gh repo fork HarrySkySon/geidesy-team-app
   cd geidesy-team-app
   ```

2. **Встановлення залежностей**
   ```bash
   npm run setup
   ```

3. **Запуск у режимі розробки**
   ```bash
   npm run dev
   ```

### 📝 Процес розробки

1. **Створіть новий branch**
   ```bash
   git checkout -b feature/your-feature-name
   # або
   git checkout -b fix/your-fix-name
   ```

2. **Внесіть зміни**
   - Дотримуйтесь кодових стандартів проєкту
   - Додайте тести для нового функціоналу
   - Оновіть документацію при необхідності

3. **Перевірте якість коду**
   ```bash
   npm run lint      # Перевірка ESLint
   npm run test      # Запуск тестів
   npm run build     # Перевірка збірки
   ```

4. **Commit змін**
   ```bash
   git add .
   git commit -m "feat: add GPS tracking functionality"
   ```

5. **Push branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Створіть Pull Request**
   - Використайте наш [PR template](.github/pull_request_template.md)
   - Додайте детальний опис змін
   - Прикріпіть screenshots для UI змін

## 📋 Стандарти коду

### Commit Messages

Використовуємо [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Типи commits:**
- `feat`: нова функціональність
- `fix`: виправлення багів
- `docs`: зміни в документації
- `style`: форматування коду
- `refactor`: рефакторинг коду
- `perf`: покращення продуктивності
- `test`: додавання тестів
- `chore`: технічні зміни

**Приклади:**
```bash
feat(mobile): add GPS tracking for team location
fix(backend): resolve database connection timeout
docs(readme): update installation instructions
```

### Code Style

- **TypeScript** для всіх компонентів
- **ESLint** + **Prettier** для форматування
- **Функціональні компоненти** з hooks для React
- **Async/await** замість promises
- **Описові назви** змінних та функцій

### Testing

- **Unit tests**: Jest + React Testing Library
- **Integration tests**: Supertest для API
- **E2E tests**: Detox для мобільного додатка
- **Мінімальне покриття**: 80%

## 🐛 Повідомлення про баги

Використовуйте [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md):

1. **Опис проблеми** - чіткий опис що сталося
2. **Кроки для відтворення** - покрокова інструкція
3. **Очікувана поведінка** - що мало б статися
4. **Скріншоти** - якщо застосовно
5. **Середовище** - OS, версія додатка, браузер

## 💡 Пропозиції функціональності

Використовуйте [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md):

1. **Проблема** - яку проблему вирішує фіча
2. **Рішення** - детальний опис пропозиції
3. **Альтернативи** - інші варіанти вирішення
4. **Додатковий контекст** - скріншоти, посилання

## 🏗️ Структура проєкту

### Backend (`/backend`)
- **Controllers** - HTTP обробники запитів
- **Services** - бізнес логіка
- **Models** - Prisma моделі БД
- **Middleware** - Express middleware
- **Routes** - API маршрути

### Frontend (`/frontend`)
- **Components** - React компоненти
- **Pages** - сторінки додатка
- **Store** - Redux Toolkit state
- **Services** - API клієнти
- **Hooks** - custom React hooks

### Mobile (`/mobile`)
- **Screens** - екрани React Native
- **Components** - переспроектні компоненти
- **Navigation** - навігаційна структура
- **Database** - WatermelonDB моделі
- **Services** - API та утилітарні сервіси

## 🔍 Code Review Process

### Для reviewers:
1. **Функціональність** - чи працює як очікується?
2. **Код якість** - читабельність, підтримуваність
3. **Тести** - достатнє покриття тестами
4. **Документація** - оновлена при необхідності
5. **Продуктивність** - немає performance регресій

### Для авторів PR:
- **Self-review** перед створенням PR
- **Описові коментарі** для складної логіки
- **Маленькі PR** - легше для review
- **Отзивчивість** на коментарі reviewers

## 📚 Ресурси

- [Технічна документація](docs/architecture/)
- [API документація](docs/api/)
- [План розробки](docs/planning/development-plan.md)
- [Coding Standards](docs/development/coding-standards.md)

## 🤝 Спільнота

- **GitHub Discussions** для питань та ідей
- **Issues** для багів та фіч
- **Email** team@geodesy-app.com для приватних питань

## ❓ Потрібна допомога?

Не соромтеся ставити питання! Ми завжди готові допомогти новим contributors:

- Створіть **Discussion** з тегом `question`
- Напишіть у **Issue** з тегом `help wanted`
- Зверніться до maintainers через email

---

Дякуємо за ваш внесок у розвиток системи управління геодезичними бригадами! 🙏