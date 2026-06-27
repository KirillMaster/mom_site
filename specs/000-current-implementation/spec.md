# Spec 000: Текущая реализация — Портфолио художницы Анжелы Моисеенко

**Status**: Baseline (as-is)
**Created**: 2026-06-27

---

## Feature Overview

Сайт-портфолио художницы Анжелы Моисеенко. Публичная часть — витрина работ, биография, видео, отзывы, контакты. Админка — управление всем контентом через веб-интерфейс с JWT-авторизацией.

## User Stories

### Посетитель
- **Как посетитель**, я хочу видеть лендинг с приветствием и отзывами, чтобы получить первое впечатление об художнице
- **Как посетитель**, я хочу просматривать галерею картин, сгруппированных по темам, чтобы увидеть работы по категориям
- **Как посетитель**, я хочу кликнуть на картину и увидеть её в большом размере в модальном окне
- **Как посетитель**, я хочу прочитать биографию художницы с фотографией
- **Как посетитель**, я хочу смотреть видео-контент художницы
- **Как посетитель**, я хочу видеть ссылки на соцсети (Instagram, VK, YouTube, Telegram)
- **Как посетитель**, я хочу читать отзывы с рейтингом на главной странице

### Администратор
- **Как админ**, я хочу авторизоваться через логин/пароль и получить JWT-токен
- **Как админ**, я хочу загружать, удалять и менять порядок картин
- **Как админ**, я хочу управлять порядком тематических групп в галерее
- **Как админ**, я хочу редактировать биографию, фото профиля и фото лендинга
- **Как админ**, я хочу загружать, удалять и менять порядок видео
- **Как админ**, я хочу редактировать ссылки на соцсети
- **Как админ**, я хочу добавлять и удалять отзывы с рейтингом

---

## Functional Requirements

### FR-01: Лендинг (главная страница)
- Отображает приветственный заголовок и подзаголовок (настраиваемые)
- Фоновое фото лендинга (настраиваемое)
- Карусель отзывов с рейтингом (звёзды)
- SSR для SEO

### FR-02: Галерея картин
- Список всех картин, отсортированных по `SortOrder`
- Группировка по полю `Theme`
- Настраиваемый порядок групп через `/api/grouporder`
- Модальное окно при клике на картину (полноразмерное фото + описание)
- Schema.org разметка для SEO

### FR-03: О художнице
- Биография (textarea, HTML не поддерживается — plain text)
- Фотография профиля с fallback на placeholder
- Schema.org разметка

### FR-04: Видео
- Список видео с HTML5 плеером
- Заголовок и описание каждого видео
- Потоковая отдача видео через API

### FR-05: Контакты
- 4 соцсети: Instagram, VK, YouTube, Telegram
- Иконки Font Awesome
- Отображаются также в футере на всех страницах

### FR-06: Отзывы
- Автор, текст, рейтинг (1-5 звёзд, опционально)
- Карусель на главной странице
- CRUD через админку

### FR-07: Авторизация
- Single-user: один администратор
- Логин: POST `/api/auth/login` → JWT токен
- Токен хранится в localStorage
- Все мутирующие операции защищены `[Authorize]`

### FR-08: Админ-панель
- Табы: Картины | Контакты | Обо мне | Видео | Отзывы
- Загрузка файлов через multipart/form-data
- Drag-style reorder (кнопки вверх/вниз)
- Доступна по `/admin`

---

## Architecture

### Backend (C# ASP.NET Core 8)

```
backend/
├── Program.cs                  — Entry point, DI, middleware pipeline
├── Controllers/
│   ├── AuthController.cs       — POST /api/auth/login
│   ├── AboutController.cs      — GET/POST /api/about, GET /photo, /landingphoto
│   ├── PaintingsController.cs  — CRUD /api/paintings, reorder, image endpoint
│   ├── VideosController.cs     — CRUD /api/videos, reorder, data endpoint
│   ├── ContactController.cs    — GET/POST /api/contact
│   ├── GroupOrderController.cs — GET/POST /api/grouporder
│   └── TestimonialsController.cs — CRUD /api/testimonials
├── Models/
│   ├── Painting.cs             — Id, Title, Description, Year, Theme, ImageData, SortOrder
│   ├── AboutInfo.cs            — Singleton, Biography, PhotoData, LandingPagePhotoData, Welcome*
│   ├── Video.cs                — Id, Title, Description, VideoData, SortOrder
│   ├── ContactInfo.cs          — Singleton, Instagram, VK, YouTube, Telegram
│   ├── GroupOrderInfo.cs       — Singleton, OrderedGroupKeys (JSON string)
│   ├── Testimonial.cs          — Id, Author, Text, Rating, CreatedAt
│   └── LoginModel.cs           — Username, Password (DTO)
├── Data/
│   └── ApplicationDbContext.cs — EF Core DbContext, 6 DbSets
└── Migrations/                 — EF Core auto-migrations
```

**Database**: PostgreSQL 13
**ORM**: Entity Framework Core (Npgsql)
**Auth**: JWT Bearer (HMAC SHA-512), 5-min expiry, no refresh tokens
**File Storage**: Binary в PostgreSQL (ImageData/VideoData как `byte[]`)

### Frontend (Next.js 15 + React 19)

```
frontend/
├── pages/
│   ├── index.js          — Лендинг (SSR)
│   ├── gallery.js        — Галерея (SSR)
│   ├── about.js          — Биография (SSR)
│   ├── videos.js         — Видео (SSR)
│   ├── contact.js        — Контакты (SSR)
│   ├── admin.js          — Админка (CSR)
│   ├── _app.js           — Layout wrapper
│   └── api/[...path].js  — HTTP proxy → backend
├── components/
│   ├── PaintingCard.js    — Карточка картины
│   ├── PaintingModal.js   — Модалка просмотра
│   ├── TestimonialCard.js — Карточка отзыва
│   ├── Footer.js          — Общий футер
│   ├── LoginForm.js       — Форма логина
│   ├── AdminPaintings.js  — Админка картин
│   ├── AdminContact.js    — Админка контактов
│   ├── AdminAbout.js      — Админка биографии
│   ├── AdminVideos.js     — Админка видео
│   └── AdminTestimonials.js — Админка отзывов
└── styles/
    ├── App.css            — Основная тема (Playfair Display, терракот, беж)
    ├── globals.css        — Глобальные стили
    └── Home.module.css    — Неиспользуемый (legacy Next.js)
```

**HTTP Client**: Axios
**UI Kit**: Bootstrap 5 + React-Bootstrap
**Icons**: Font Awesome 6
**Carousel**: react-responsive-carousel
**Proxy**: http-proxy (pages/api/[...path].js → backend:8080)
**SSR**: getServerSideProps на всех публичных страницах

### Infrastructure

```yaml
# docker-compose.yml
services:
  backend:   ASP.NET Core → port 8080
  frontend:  Next.js dev → port 3000
  db:        PostgreSQL 13 → port 5432
```

---

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | No | Авторизация → JWT |
| GET | /api/about | No | Биография + мета |
| POST | /api/about | Yes | Обновить биографию/фото |
| GET | /api/about/photo | No | Фото профиля |
| GET | /api/about/landingphoto | No | Фото лендинга |
| GET | /api/paintings | No | Все картины |
| POST | /api/paintings | **No ⚠️** | Загрузить картину |
| GET | /api/paintings/:id/image | No | Изображение картины |
| POST | /api/paintings/reorder | Yes | Изменить порядок |
| DELETE | /api/paintings/:id | Yes | Удалить картину |
| GET | /api/videos | No | Все видео |
| POST | /api/videos | Yes | Загрузить видео |
| GET | /api/videos/:id/data | No | Файл видео |
| DELETE | /api/videos/:id | Yes | Удалить видео |
| POST | /api/videos/reorder | Yes | Изменить порядок |
| GET | /api/contact | No | Контакты |
| POST | /api/contact | Yes | Обновить контакты |
| GET | /api/grouporder | No | Порядок групп |
| POST | /api/grouporder | Yes | Обновить порядок групп |
| GET | /api/testimonials | No | Все отзывы |
| POST | /api/testimonials | Yes | Добавить отзыв |
| DELETE | /api/testimonials/:id | Yes | Удалить отзыв |

---

## Key Entities

| Entity | Type | Fields |
|--------|------|--------|
| Painting | Collection | Id, Title, Description, Year, Theme, ImageData, ImageMimeType, SortOrder |
| Video | Collection | Id, Title, Description, VideoData, VideoMimeType, SortOrder |
| Testimonial | Collection | Id, Author, Text, Rating?, CreatedAt |
| AboutInfo | Singleton | Id(1), Biography, PhotoData, LandingPagePhotoData, WelcomeTitle, WelcomeSubtitle |
| ContactInfo | Singleton | Id(1), Instagram, VK, YouTube, Telegram |
| GroupOrderInfo | Singleton | Id(1), OrderedGroupKeys (JSON) |

---

## Design & UX

### Цветовая палитра
- Фон: кремовый `#FDF8F0`
- Акцент: персиковый `#F8E7D8`
- Основной: терракотовый `#CB6D51`
- Текст: тёмно-коричневый `#4A3732`
- Золото: `#D4AF37`

### Типографика
- Заголовки: Playfair Display (serif)
- Текст: Lora (serif)
- UI: Open Sans (sans-serif)

### Навигация
- Navbar: 6 пунктов (Главная, Галерея, Обо мне, Видео, Контакты + Админ)
- Footer: контакты + навигация + копирайт

---

## Known Issues & Technical Debt

### 🔴 Critical
1. **Hardcoded credentials**: `admin/admin` в AuthController — нет механизма смены пароля
2. **POST /api/paintings без авторизации**: любой может загружать картины
3. **ValidateLifetime = false**: JWT токены принимаются даже после истечения

### 🟡 Medium
4. **Бинарные файлы в БД**: изображения и видео хранятся как `byte[]` в PostgreSQL — проблемы с масштабируемостью
5. **Нет refresh token**: токен живёт 5 минут, нет механизма обновления
6. **CORS только localhost:3000**: не настроен для production
7. **Нет обработки ошибок**: контроллеры не обрабатывают исключения единообразно
8. **Нет rate limiting**: API открыт для спама

### 🟢 Low
9. **Home.module.css**: неиспользуемый файл (legacy Next.js template)
10. **Placeholder URLs в ContactInfo**: дефолтные URL не рабочие
11. **Нет пагинации**: все картины/видео возвращаются разом
12. **Нет оптимизации изображений**: base64 в JSON (тяжёлые ответы)

---

## Assumptions

1. Единственный пользователь-администратор (мама-художница)
2. Невысокая нагрузка (персональный сайт)
3. Контент преимущественно визуальный (картины, фото, видео)
4. Аудитория — русскоязычная
5. Деплой через Docker Compose на одном сервере
