# 📋 Trello Clone

Современный клон Trello с Drag & Drop, темной темой и полным функционалом управления задачами. Построен на Next.js 16, Prisma 6 и PostgreSQL.


**Тестовые данные:**
- Email: `user@example.com`
- Password: `password123`

## ✨ Возможности

- 🔐 **Аутентификация** — регистрация и вход пользователей (NextAuth.js)
- 📊 **Управление досками** — создание, редактирование, удаление
- 📝 **Колонки и задачи** — гибкая структура с подзадачами
- 🎯 **Drag & Drop** — перетаскивание задач между колонками и внутри колонки
- 🔄 **Перетаскивание колонок** — изменение порядка колонок
- 🔍 **Поиск** — глобальный поиск по задачам и подзадачам
- 🌓 **Тёмная тема** — автоматическое определение системных настроек и сохранение выбора
- 📱 **Адаптивный дизайн** — работает на всех устройствах
- 💾 **Автосохранение** — все изменения сохраняются в реальном времени
- 🐳 **Docker поддержка** — готов к запуску в контейнерах

## 🛠 Технологии

### Frontend
- **Next.js 16** — React фреймворк с App Router
- **React 19** — современный React
- **Tailwind CSS 4** — утилитарный CSS
- **@dnd-kit** — мощная библиотека для Drag & Drop
- **Lucide React** — иконки
- **TanStack Query** — управление состоянием и кэширование

### Backend
- **Next.js API Routes** — REST API
- **NextAuth.js** — аутентификация
- **Prisma 6** — ORM
- **PostgreSQL** — база данных
- **bcryptjs** — хеширование паролей

### DevOps
- **Docker** — контейнеризация
- **Docker Compose** — оркестрация

## 📋 Требования

- Node.js 20+
- PostgreSQL 16+
- Docker (опционально)

## 🚀 Быстрый старт с Docker

# Полная пересборка
.\docker-rebuild.ps1  
# Запуск   
.\docker-start.ps1  
# Остановка     
.\docker-stop.ps1    
# Просмотр логов    
.\docker-logs.ps1  
# Перезапуск (обычный)
.\docker-restart.ps1
# Полная отчистка контейнеров 
.\docker-clean.ps1

# Запуск  Prisma Studio на http://localhost:5555
docker exec -it trello-app npx prisma studio

### Локальная установка

# Установка зависимостей  
npm install
# Запуск   
npm run dev

1. **Клонировать репозиторий**
```bash
git clone https://github.com/your-username/trello-clone.git
cd trello-clone