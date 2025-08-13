# Сайт художника Анжелы Моисеенко

Полнофункциональный веб-сайт для художника-импрессиониста с админ-панелью для управления контентом.

## 🎨 Особенности

- **Современный дизайн** в теплых тонах, отражающий импрессионистский стиль
- **Полная интеграция** фронтенда и бэкенда
- **Админ-панель** для управления всем контентом
- **Галерея работ** с категориями и ценами
- **Видеогалерея** с группировкой по темам
- **SEO-оптимизация** с семантической разметкой
- **Адаптивный дизайн** для всех устройств
- **Автоматическое добавление водяных знаков** на изображения

## 🛠 Технологии

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (анимации)
- **React Image Lightbox** (просмотр изображений)
- **React Player** (видеоплеер)

### Backend
- **ASP.NET Core 8**
- **Entity Framework Core**
- **PostgreSQL**
- **JWT Authentication**
- **System.Drawing.Common** (обработка изображений)

### Инфраструктура
- **Docker & Docker Compose**
- **PostgreSQL** (в контейнере)

## 🚀 Быстрый старт

### Предварительные требования
- Docker и Docker Compose
- Git

### Установка и запуск

1. **Клонируйте репозиторий**
   ```bash
   git clone <repository-url>
   cd mom_site_gpt5
   ```

2. **Создайте файл .env**
   ```bash
   cp .env.example .env
   ```

3. **Настройте переменные окружения** (отредактируйте .env файл)
   ```env
   # Database Configuration
   POSTGRES_DB=mom_site_db
   POSTGRES_USER=postgres

   # JWT Configuration
   JWT_SECRET=your-super-secret-key-here
   JWT_ISSUER=mom-site
   JWT_AUDIENCE=mom-site

   # Admin Configuration
   ADMIN_PASSWORD=admin

   # Email SMTP Configuration
   EMAIL_SMTP_SERVER=smtp.gmail.com
   EMAIL_SMTP_PORT=587
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@angelamoiseenko.ru
   EMAIL_TO=karangela@narod.ru
   ```

### Настройка SMTP для отправки сообщений

Для работы формы обратной связи на странице "Контакты" необходимо настроить SMTP:

1. **Для Gmail:**
   - Включите двухфакторную аутентификацию
   - Создайте "App Password" в настройках безопасности
   - Используйте этот пароль в `EMAIL_PASSWORD`

2. **Для других провайдеров:**
   - Укажите соответствующий SMTP сервер и порт
   - Используйте правильные учетные данные

3. **Переменные окружения для SMTP:**
   - `EMAIL_SMTP_SERVER` - SMTP сервер (по умолчанию: smtp.gmail.com)
   - `EMAIL_SMTP_PORT` - порт SMTP (по умолчанию: 587)
   - `EMAIL_USERNAME` - ваш email
   - `EMAIL_PASSWORD` - пароль или app password
   - `EMAIL_FROM` - email отправителя (по умолчанию: noreply@angelamoiseenko.ru)
   - `EMAIL_TO` - email получателя (по умолчанию: karangela@narod.ru)

### Настройка S3-совместимого хранилища (Timeweb S3)

Для хранения медиа файлов (изображения, видео) в облачном хранилище:

1. **Создайте S3 bucket в Timeweb:**
   - Войдите в панель управления Timeweb
   - Перейдите в раздел "Облачное хранилище"
   - Создайте новый bucket
   - Настройте публичный доступ для чтения файлов

2. **Получите учетные данные:**
   - Access Key ID
   - Secret Access Key
   - Endpoint URL (обычно https://s3.timeweb.com)

3. **Переменные окружения для S3:**
   - `S3_ACCESS_KEY` - ваш Access Key ID
   - `S3_SECRET_KEY` - ваш Secret Access Key
   - `S3_SERVICE_URL` - URL сервиса S3 (https://s3.timeweb.com)
   - `S3_BUCKET_NAME` - имя вашего bucket
   - `S3_BASE_URL` - базовый URL для доступа к файлам (https://your-bucket-name.s3.timeweb.com)

4. **Преимущества использования S3:**
   - Улучшенная производительность загрузки файлов
   - Масштабируемость хранилища
   - CDN для быстрой доставки контента
   - Автоматическое резервное копирование

4. **Запустите проект**
   ```bash
   docker compose up --build
   ```

5. **Откройте сайт**
   - **Фронтенд**: http://localhost:3000
   - **Админ-панель**: http://localhost:3000/admin
   - **API документация**: http://localhost:5000/swagger

### Доступ к админ-панели
- **Логин**: `admin`
- **Пароль**: `admin` (или значение из ADMIN_PASSWORD в .env)

## 📁 Структура проекта

```
mom_site_gpt5/
├── backend/                    # .NET 8 Backend
│   ├── MomSite.API/           # Основной API проект
│   ├── MomSite.Core/          # Модели и интерфейсы
│   ├── MomSite.Infrastructure/ # Реализация и DbContext
│   └── Dockerfile
├── frontend/                   # Next.js 14 Frontend
│   ├── app/                   # App Router страницы
│   ├── components/            # React компоненты
│   ├── lib/                   # API сервисы
│   ├── hooks/                 # Custom hooks
│   └── Dockerfile
├── docker-compose.yml         # Docker Compose конфигурация
├── .env.example              # Пример переменных окружения
└── README.md                 # Этот файл
```

## 🎯 Функциональность

### Публичные страницы
- **Главная** - баннер, приветствие, отзывы
- **Галерея** - картины с категориями, ценами, лайтбоксом
- **Обо мне** - биография, фото, специализации
- **Контакты** - контактная информация, социальные сети
- **Видео** - видеогалерея с категориями

### Админ-панель
- **Аутентификация** с JWT токенами
- **Управление картинами** - добавление, редактирование, удаление
- **Управление категориями** - для картин и видео
- **Управление отзывами** - добавление и редактирование
- **Управление контентом страниц** - тексты, изображения, ссылки
- **Управление видео** - добавление и редактирование

## 🔧 API Endpoints

### Публичные
- `GET /api/public/home` - данные главной страницы
- `GET /api/public/gallery` - данные галереи
- `GET /api/public/about` - данные страницы "Обо мне"
- `GET /api/public/contacts` - контактные данные
- `GET /api/public/videos` - данные видеогалереи

### Административные (требуют JWT)
- `POST /api/admin/login` - аутентификация
- `GET/POST/PUT/DELETE /api/admin/artworks` - управление картинами
- `GET/POST/PUT/DELETE /api/admin/categories` - управление категориями
- `GET/POST/PUT/DELETE /api/admin/reviews` - управление отзывами
- `GET/PUT /api/admin/page-content` - управление контентом страниц
- `GET/POST/PUT/DELETE /api/admin/videos` - управление видео

## 🖼 Обработка изображений

- **Автоматическое создание миниатюр** для галереи
- **Добавление водяных знаков** "angelamoiseenko.ru"
- **Хранение в файловой системе** (с возможностью перехода на S3)
- **Поддержка форматов** JPG, PNG, GIF

## 🔒 Безопасность

- **JWT аутентификация** для админ-панели
- **CORS настройки** для безопасного взаимодействия
- **Валидация данных** на сервере
- **Защита от XSS** и других атак

## 📱 Адаптивность

- **Мобильная версия** для всех страниц
- **Адаптивная галерея** с сеткой
- **Мобильное меню** с анимациями
- **Оптимизированные изображения** для разных экранов

## 🚀 Развертывание

### Локальная разработка
```bash
docker compose up --build
```

### Продакшн
1. Настройте переменные окружения для продакшна
2. Используйте продакшн образы Docker
3. Настройте reverse proxy (nginx)
4. Настройте SSL сертификаты

## 🐛 Устранение неполадок

### Проблемы с подключением к базе данных
```bash
docker compose down
docker volume rm mom_site_gpt5_postgres_data
docker compose up --build
```

### Проблемы с загрузкой изображений
- Проверьте права доступа к папке `backend/uploads`
- Убедитесь, что папка существует

### Проблемы с API
- Проверьте переменные окружения
- Убедитесь, что все сервисы запущены
- Проверьте логи: `docker compose logs api`

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи Docker: `docker compose logs`
2. Убедитесь, что все переменные окружения настроены
3. Проверьте, что порты 3000, 5000, 5432 свободны

## 📄 Лицензия

Этот проект создан для личного использования художника Анжелы Моисеенко. 