# 🗺️ Система управління геодезичними бригадами

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

> Сучасна цифрова платформа для ефективного управління та координації геодезичних бригад з GPS-трекінгом, real-time моніторингом та офлайн синхронізацією.

## 🎯 Опис проєкту

Комплексна система для координації роботи геодезичних бригад, що включає:
- 📱 **Мобільний додаток** для польових команд (React Native)
- 🖥️ **Веб-додаток** для керівника підрозділу (React.js)
- ⚡ **Backend API** з real-time функціональністю (Node.js + TypeScript)
- 🗄️ **Геопросторова база даних** (PostgreSQL + PostGIS)

**Мета:** Заміна Excel-таблиць на професійну цифрову систему для управління до 20 геодезичних бригад з підвищенням ефективності координації на 30%.

## Структура проєкту

```
geidesy-team-app/
├── backend/                    # Backend API сервер (Node.js + TypeScript)
├── frontend/                   # Веб-додаток керівника (React.js)
├── mobile/                     # Мобільний додаток бригад (React Native)
├── database/                   # База даних та міграції (PostgreSQL + PostGIS)
├── docker/                     # Docker конфігурації
├── scripts/                    # Скрипти для автоматизації
└── docs/                       # Документація
    ├── architecture/           # Технічна архітектура
    ├── api/                   # API документація
    ├── user-guides/           # Інструкції користувача
    ├── development/           # Документація розробки
    └── planning/              # Планування проєкту
```

## ✨ Основні можливості

### 🖥️ Веб-додаток керівника
- 📍 **Real-time дашборд** з інтерактивною картою активних завдань
- 📊 **Аналітика продуктивності** бригад з візуалізацією метрик
- 📋 **Управління завданнями** з автоматичним призначенням
- 👥 **Координація бригад** та планування розкладу
- 📈 **Звітність** з експортом у PDF/Excel форматі
- 🔔 **Push-сповіщення** про статуси завдань

### 📱 Мобільний додаток бригад  
- 📋 **Інтуїтивний список завдань** з пріоритизацією
- 🗺️ **GPS навігація** до об'єктів з точністю до 5 метрів
- 📸 **Фото-звіти** з автоматичними геотегами та часовими мітками
- 🔄 **Офлайн режим** з автоматичною синхронізацією
- ⚡ **Real-time оновлення** статусів завдань
- 📍 **Автоматичний GPS трекінг** маршрутів

## Технологічний стек

### Backend
- **Мова:** Node.js + TypeScript
- **Framework:** Express.js
- **База даних:** PostgreSQL + PostGIS
- **ORM:** Prisma
- **Кешування:** Redis
- **Файли:** AWS S3 / MinIO

### Frontend
- **Framework:** React.js + TypeScript
- **UI:** Material-UI
- **Карти:** Leaflet
- **State:** Redux Toolkit

### Mobile
- **Framework:** React Native
- **Навігація:** React Navigation
- **Карти:** React Native Maps
- **Офлайн:** WatermelonDB
- **Push:** Firebase Cloud Messaging

### DevOps
- **Контейнери:** Docker
- **CI/CD:** GitHub Actions
- **Моніторинг:** Prometheus + Grafana

## 🚀 Швидкий старт

### 📋 Системні вимоги
- **Node.js** 18.0.0 або вище
- **Docker** і **Docker Compose** для контейнеризації
- **Git** для клонування репозиторію
- **npm** або **yarn** для управління пакетами

### ⚡ Встановлення

1. **Клонування репозиторію**
   ```bash
   git clone https://github.com/HarrySkySon/geidesy-team-app.git
   cd geidesy-team-app
   ```

2. **Встановлення залежностей**
   ```bash
   npm run setup
   ```

3. **Запуск середовища розробки**
   ```bash
   # Запуск всіх сервісів через Docker
   npm run dev
   
   # Перегляд логів
   npm run dev:logs
   ```

4. **Ініціалізація бази даних**
   ```bash
   # Виконання міграцій
   npm run db:migrate
   
   # Заповнення тестовими даними
   npm run db:seed
   ```

5. **Доступ до додатків**
   - 🖥️ **Веб-додаток:** http://localhost:80
   - ⚡ **API:** http://localhost:3000/api
   - 🗄️ **Prisma Studio:** `npm run db:studio`
   - 📦 **MinIO Console:** http://localhost:9001

## 👥 Розробка

### 🏗️ Структура команди
- **Project Manager:** 1 особа - координація та планування
- **Backend Developer:** 1-2 особи - API та база даних
- **Frontend Developer:** 1 особа - веб-інтерфейс
- **Mobile Developer:** 1 особа - React Native додаток  
- **UI/UX Designer:** 1 особа - дизайн інтерфейсів
- **QA Engineer:** 1 особа - тестування та якість

### 🎯 Roadmap розробки

| Фаза | Тривалість | Основні задачі |
|------|------------|----------------|
| **Phase 1: MVP** | 8-12 тижнів | Backend API, веб-додаток, базовий мобільний додаток |
| **Phase 2: Enhanced** | 4-6 тижнів | Офлайн синхронізація, UX поліпшення, аналітика |
| **Phase 3: Advanced** | 4-6 тижнів | Інтеграції, оптимізація, розширений функціонал |

### 📊 Корисні команди для розробників

```bash
# Розробка окремих компонентів
npm run backend:dev    # Backend у dev режимі
npm run frontend:dev   # Frontend у dev режимі
npm run mobile:dev     # React Native Metro bundler

# Тестування
npm run test          # Запуск всіх тестів
npm run test:backend  # Backend тести
npm run test:frontend # Frontend тести

# Лінтинг та форматування
npm run lint          # ESLint перевірка
npm run lint:fix      # Автоправлення ESLint помилок

# База даних
npm run db:studio     # Prisma Studio UI
npm run db:reset      # Скидання бази даних
```

## 📈 Критерії успіху

| Метрика | Цільове значення |
|---------|------------------|
| ⚡ **API Response Time** | < 200ms (95% запитів) |
| 🔄 **Sync Success Rate** | > 99% |
| 📱 **Mobile Crash Rate** | < 0.1% |
| 🔐 **System Uptime** | > 99.5% |
| 📈 **Efficiency Improvement** | +30% координації |
| 🎯 **GPS Accuracy** | < 5m (90% вимірювань) |

## 🤝 Contributing

1. Fork репозиторій
2. Створіть feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit зміни (`git commit -m 'Add some AmazingFeature'`)
4. Push до branch (`git push origin feature/AmazingFeature`)
5. Відкрийте Pull Request

## 📄 Ліцензія

Цей проєкт розповсюджується під ліцензією MIT. Дивіться [LICENSE](LICENSE) для деталей.

## 📞 Контакти та підтримка

- 📧 **Email:** team@geodesy-app.com
- 📚 **Документація:** [docs/](docs/)  
- 🐛 **Issues:** [GitHub Issues](https://github.com/HarrySkySon/geidesy-team-app/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/HarrySkySon/geidesy-team-app/discussions)

---

<div align="center">
  
**🌟 Зроблено з ❤️ для ефективної координації геодезичних робіт 🌟**

</div>