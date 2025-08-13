# 🚀 Production Deployment with Nginx Reverse Proxy

## 📋 Prerequisites

- Docker и Docker Compose установлены
- SSL сертификат для домена `angelamoiseenko.ru`
- Домен `angelamoiseenko.ru` настроен и указывает на ваш сервер

## 🔧 SSL Certificate Setup

### 1. Подготовка SSL сертификатов

Убедитесь, что у вас есть:
- **Certificate file** (`.crt` или `.pem`)
- **Private key file** (`.key`)

### 2. Размещение сертификатов

Создайте папку для сертификатов:
```bash
sudo mkdir -p /etc/ssl/angelamoiseenko.ru
sudo chmod 700 /etc/ssl/angelamoiseenko.ru
```

Скопируйте сертификаты:
```bash
sudo cp /path/to/your/certificate.crt /etc/ssl/angelamoiseenko.ru/
sudo cp /path/to/your/private.key /etc/ssl/angelamoiseenko.ru/
sudo chmod 600 /etc/ssl/angelamoiseenko.ru/*
```

## 🚀 Deployment

### 1. Настройка переменных окружения

```bash
# Скопировать пример конфигурации
cp env.production.example .env

# Отредактировать .env файл
nano .env
```

**Обязательные переменные для .env:**
```ini
# Database
POSTGRES_PASSWORD=your-strong-password-here
POSTGRES_DB=mom_site_db
POSTGRES_USER=postgres

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_ISSUER=mom-site
JWT_AUDIENCE=mom-site

# Admin
ADMIN_PASSWORD=your-admin-password-here

# Email
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# S3
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_BUCKET_NAME=your-bucket-name
S3_BASE_URL=https://cdn.angelamoiseenko.ru

# Frontend
NEXT_PUBLIC_API_URL=https://angelamoiseenko.ru

# SSL Certificate Paths
SSL_CERT_PATH=/etc/ssl/angelamoiseenko.ru/certificate.crt
SSL_KEY_PATH=/etc/ssl/angelamoiseenko.ru/private.key
```

### 2. Запуск продакшена

```bash
# Остановить development контейнеры (если запущены)
docker compose down

# Запустить production с nginx
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Проверка статуса

```bash
# Проверить статус всех контейнеров
docker compose -f docker-compose.prod.yml ps

# Проверить логи nginx
docker compose -f docker-compose.prod.yml logs nginx

# Проверить логи API
docker compose -f docker-compose.prod.yml logs api

# Проверить логи frontend
docker compose -f docker-compose.prod.yml logs frontend
```

## 🔍 Verification

### 1. Проверка SSL
```bash
# Проверить SSL сертификат
curl -I https://angelamoiseenko.ru

# Проверить health endpoint
curl https://angelamoiseenko.ru/health
```

### 2. Проверка API
```bash
# Тест API через nginx
curl https://angelamoiseenko.ru/api/public/home
```

### 3. Проверка админки
- Откройте https://angelamoiseenko.ru/admin
- Попробуйте войти с логином `admin` и паролем из `ADMIN_PASSWORD`

## 🛠️ Troubleshooting

### Проблемы с SSL
```bash
# Проверить SSL сертификаты в контейнере
docker exec mom_site_nginx_prod ls -la /etc/ssl/certs/
docker exec mom_site_nginx_prod ls -la /etc/ssl/private/

# Проверить конфигурацию nginx
docker exec mom_site_nginx_prod nginx -t
```

### Проблемы с доступом
```bash
# Проверить порты
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :80

# Проверить firewall
sudo ufw status
```

### Проблемы с контейнерами
```bash
# Перезапустить конкретный контейнер
docker compose -f docker-compose.prod.yml restart nginx

# Пересобрать и перезапустить все
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

## 📊 Monitoring

### Логи
```bash
# Просмотр логов в реальном времени
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Статистика
```bash
# Использование ресурсов
docker stats

# Дисковое пространство
docker system df
```

## 🔒 Security Features

- ✅ HTTPS с современными SSL настройками
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ Rate limiting для API
- ✅ Security headers
- ✅ Gzip compression
- ✅ Защита от доступа к чувствительным файлам
- ✅ Автоматический редирект с HTTP на HTTPS

## 🔄 Updates

```bash
# Обновление приложения
git pull
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Обновление только nginx конфигурации
docker compose -f docker-compose.prod.yml restart nginx
```

## 📞 Support

При возникновении проблем:
1. Проверьте логи: `docker compose -f docker-compose.prod.yml logs`
2. Убедитесь, что SSL сертификаты правильно смонтированы
3. Проверьте, что все переменные окружения установлены
4. Убедитесь, что порты 80 и 443 открыты в firewall
