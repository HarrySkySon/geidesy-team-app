# 🤖 Інструкції для агента - Surveying Team Management System

**Створено:** 2024-09-25  
**Версія:** 1.0  
**Проєкт:** Surveying Team Management System  
**GitHub Repository:** https://github.com/HarrySkySon/geidesy-team-app

---

## 📋 **Загальна інформація про проєкт**

### **Опис проєкту**
Це повнофункціональна система управління геодезичними командами, що включає:
- **Backend API** (Node.js + TypeScript + PostgreSQL + PostGIS)
- **Web Frontend** (React.js + Material-UI + Redux)
- **Mobile App** (React Native + Expo + WatermelonDB для офлайн роботи)
- **Docker-конфігурація** для розробки та деплою

### **Поточний статус**
✅ **ПРОЄКТ ПОВНІСТЮ ЗАВЕРШЕНО** (100%)
- Всі 4 фази розробки завершені
- Код залито до GitHub репозиторію
- Система готова до продуктивного використання

---

## 🔧 **Робота з GitHub репозиторієм**

### **Конфігурація Git**
```bash
# Налаштування облікового запису HarrySkySon
git config --global user.name "HarrySkySon"
git config --global user.email "harrysky.son@gmail.com"

# Перевірка конфігурації
git config --list | grep user
```

### **Основні команди для роботи з репозиторієм**
```bash
# Перевірка статусу
git status

# Додавання всіх змін
git add .

# Створення коміту (використовуй HEREDOC для коміту)
git commit -m "$(cat <<'EOF'
feat: опис змін

Детальний опис того, що було зроблено:
- Пункт 1
- Пункт 2
- Пункт 3

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Завантаження змін до GitHub
git push origin master
```

### **Структура репозиторію**
```
geidesy-team-app/
├── backend/          # Node.js API сервер
├── frontend/         # React.js веб-додаток
├── mobile/          # React Native мобільний додаток
├── docker/          # Docker конфігурації
├── database/        # SQL схеми та міграції
├── docs/           # Документація проєкту
├── PROJECT_PROGRESS.md    # Трекер прогресу проєкту
├── AGENT_INSTRUCTIONS.md  # Цей файл
└── docker-compose.yml     # Основна Docker конфігурація
```

---

## 📊 **Обов'язкове відстеження прогресу**

### **ВАЖЛИВО: Після кожного етапу роботи ОБОВ'ЯЗКОВО:**

1. **Оновити PROJECT_PROGRESS.md**
   - Змінити дату останнього оновлення
   - Додати новий розділ з описом виконаних робіт
   - Оновити статус завершених завдань
   - Додати метрики та статистику

2. **Створити коміт з детальним описом**
   - Використовувати осмислені назви комітів
   - Додавати детальний опис змін
   - Включати фірмовий підпис Claude

3. **Завантажити зміни до GitHub**
   - Перевіряти що всі файли додані
   - Переконуватися що коміт успішний
   - Пушити зміни до репозиторію

### **Шаблон оновлення PROJECT_PROGRESS.md**
```markdown
### **[ДАТА] - [НАЗВА ЕТАПУ] ([ВІДСОТОК] Complete)**
- ✅ [Опис виконаної роботи 1]
- ✅ [Опис виконаної роботи 2]
- ✅ [Опис виконаної роботи 3]
- 🎯 **Next:** [Наступні кроки]
```

---

## 🛠️ **Технічні деталі проєкту**

### **Backend (Node.js API)**
- **Порт:** 3000
- **База даних:** PostgreSQL з PostGIS
- **Аутентифікація:** JWT токени
- **WebSocket:** Socket.io для реального часу
- **ORM:** Prisma
- **Тестування:** Jest

### **Frontend (React Web App)**
- **Порт:** 3001
- **Framework:** React.js + TypeScript
- **UI Library:** Material-UI
- **State Management:** Redux Toolkit
- **Maps:** Leaflet + OpenStreetMap

### **Mobile App (React Native)**
- **Framework:** Expo + React Native
- **UI:** React Native Paper
- **Navigation:** React Navigation v6
- **Offline DB:** WatermelonDB
- **Maps:** React Native Maps

### **Інфраструктура**
- **Контейнеризація:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **File Storage:** MinIO (S3-compatible)
- **Cache:** Redis

---

## 🔄 **Алгоритм роботи агента**

### **При отриманні нового завдання:**

1. **Аналіз завдання**
   - Визначити тип завдання (нова фіча, баг-фікс, рефакторінг)
   - Оцінити складність та час виконання
   - Перевірити чи потрібно оновлювати GitHub

2. **Планування роботи**
   - Створити TodoWrite список з етапами
   - Визначити які файли потрібно змінити
   - Спланувати порядок виконання

3. **Виконання завдання**
   - Робити зміни поетапно
   - Тестувати зміни локально
   - Оновлювати прогрес в TodoWrite

4. **Завершення роботи**
   - Оновити PROJECT_PROGRESS.md
   - Створити осмислений коміт
   - Завантажити зміни до GitHub
   - Звітувати про результат

### **Приклад workflow для нової фічі:**
```bash
# 1. Створення фічі
# - Редагувати потрібні файли
# - Тестувати локально

# 2. Оновлення прогресу
# - Редагувати PROJECT_PROGRESS.md
# - Додати новий розділ з поточною датою

# 3. Коміт та пуш
git add .
git commit -m "feat: додавання [назва фічі]

Детальний опис змін...

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin master
```

---

## 📞 **Контактна інформація**

### **GitHub репозиторій:**
- **URL:** https://github.com/HarrySkySon/geidesy-team-app
- **Branch:** master
- **Owner:** HarrySkySon

### **Обліковий запис:**
- **Username:** HarrySkySon
- **Email:** harrysky.son@gmail.com

---

## ⚠️ **Важливі нагадування**

1. **ЗАВЖДИ** оновлюйте PROJECT_PROGRESS.md після завершення роботи
2. **ЗАВЖДИ** використовуйте осмислені назви комітів з детальним описом
3. **ЗАВЖДИ** включайте фірмовий підпис Claude в коміти
4. **ЗАВЖДИ** перевіряйте що зміни завантажені до GitHub
5. **НЕ ЗАБУВАЙТЕ** оновлювати дату останнього оновлення в PROJECT_PROGRESS.md

### **Приклад правильного коміту:**
```bash
git commit -m "$(cat <<'EOF'
feat: implement user profile management system

Added comprehensive user management functionality:
- User profile editing with validation
- Avatar upload functionality  
- Password change system
- Account settings management
- Role-based permissions

Updated PROJECT_PROGRESS.md with completion status
All changes tested and working correctly

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## 📚 **Корисні посилання**

- **GitHub Repository:** https://github.com/HarrySkySon/geidesy-team-app
- **Project Progress:** PROJECT_PROGRESS.md
- **Docker Setup:** docker-compose.yml
- **Backend API:** backend/src/
- **Frontend App:** frontend/src/
- **Mobile App:** mobile/src/

---

**🎯 Пам'ятайте: Кожен етап роботи має бути задокументований та збережений в GitHub!**