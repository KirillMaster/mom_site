# 🚀 Production Deployment Guide

## 📋 Prerequisites

- Docker и Docker Compose установлены
- SSL сертификат настроен
- Reverse proxy (nginx) настроен
- CDN настроен
- S3 bucket настроен

## 🔧 Configuration

### 1. Environment Variables

Скопируйте `env.production.example` в `.env` и заполните все переменные:

```bash
cp env.production.example .env
```

**Обязательные переменные:**
- `POSTGRES_PASSWORD` - сильный пароль для базы данных
- `JWT_SECRET` - длинный случайный ключ (минимум 32 символа)
- `ADMIN_PASSWORD` - пароль для админки
- `S3_ACCESS_KEY` и `S3_SECRET_KEY` - ключи S3
- `EMAIL_USERNAME` и `EMAIL_PASSWORD` - SMTP настройки

### 2. Security Checklist

- ✅ Сильные пароли для всех сервисов
- ✅ JWT secret не менее 32 символов
- ✅ CORS настроен только для нужных доменов
- ✅ HTTPS включен
- ✅ Swagger отключен в продакшене
- ✅ Rate limiting включен
- ✅ Security headers настроены

## 🚀 Deployment

### 1. Build и запуск

```bash
# Остановить development контейнеры
docker compose down

# Запустить production
docker compose -f docker-compose.prod.yml up -d --build
```

### 2. Проверка статуса

```bash
# Проверить статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Проверить логи
docker compose -f docker-compose.prod.yml logs -f api
```

### 3. Health Checks

```bash
# API health check
curl http://localhost:5000/health

# Frontend health check
curl http://localhost:3000
```

## 📊 Monitoring

### 1. Логи

Логи API сохраняются в:
- Консоль контейнера
- Файлы в `/app/logs/` (ротация по дням)

### 2. Health Checks

Все сервисы имеют health checks:
- PostgreSQL: каждые 10 секунд
- API: каждые 30 секунд
- Frontend: каждые 30 секунд

### 3. Resource Limits

- PostgreSQL: 1GB RAM
- API: 2GB RAM, 1 CPU
- Frontend: 1GB RAM, 0.5 CPU

## 🔒 Security Features

### 1. CORS
Разрешены только:
- `https://angelamoiseenko.ru`
- `https://www.angelamoiseenko.ru`

### 2. Rate Limiting
- 100 запросов в минуту на пользователя
- Автоматическое восстановление лимитов

### 3. Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### 4. HTTPS
- Автоматический редирект с HTTP на HTTPS
- Только в production режиме

## 🛠️ Maintenance

### 1. Обновление

```bash
# Остановить сервисы
docker compose -f docker-compose.prod.yml down

# Обновить код и пересобрать
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### 2. Backup базы данных

```bash
# Создать backup
docker exec mom_site_postgres_prod pg_dump -U postgres mom_site_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить backup
docker exec -i mom_site_postgres_prod psql -U postgres mom_site_db < backup_file.sql
```

### 3. Логи

```bash
# Просмотр логов API
docker compose -f docker-compose.prod.yml logs api

# Просмотр логов frontend
docker compose -f docker-compose.prod.yml logs frontend

# Просмотр логов базы данных
docker compose -f docker-compose.prod.yml logs postgres
```

## 🚨 Troubleshooting

### 1. Проблемы с JWT
Убедитесь, что `JWT_SECRET` установлен и достаточно длинный (минимум 32 символа).

### 2. Проблемы с базой данных
Проверьте переменную `POSTGRES_PASSWORD` и права доступа.

### 3. Проблемы с S3
Проверьте `S3_ACCESS_KEY` и `S3_SECRET_KEY`.

### 4. Проблемы с email
Проверьте SMTP настройки и пароль приложения.

## 📞 Support

При возникновении проблем:
1. Проверьте логи: `docker compose -f docker-compose.prod.yml logs`
2. Проверьте health checks
3. Убедитесь, что все переменные окружения установлены
4. Проверьте права доступа к файлам и папкам
