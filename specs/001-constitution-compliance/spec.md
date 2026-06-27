# Spec 001: Приведение кода в соответствие с конституцией

**Status**: In Progress
**Created**: 2026-06-28
**Priority**: Critical

---

## Feature Overview

Исправление всех нарушений конституции, выявленных при валидации spec-000.

## Issues to Fix

### 🔴 V. Тестирование (3 нарушения)
1. Фикс biography (upsert, formData init) не покрыт тестами
2. Нет E2E теста на сохранение page-content в админке
3. Ручная проверка biography fix ожидает подтверждения

### ⚠️ III. Качество кода (2 нарушения)
4. AdminController > 400 строк — нужно разбить
5. DTOs определены внутри контроллера — вынести в отдельные файлы

### ⚠️ IV. Безопасность (2 нарушения)
6. MailKit 4.3.0 — moderate severity vulnerability
7. ImageSharp 3.1.4 — high severity vulnerabilities

### ⚠️ VI. Git Workflow (1 нарушение)
8. Коммиты пушились напрямую в main без PR — исправить процесс

### ⚠️ VIII. Производительность (2 нарушения)
9. Frontend SSR через внешний URL вместо docker network
10. Lighthouse score не проверен

### ⚠️ IX. Админ-панель (2 нарушения)
11. alert() вместо toast уведомлений
12. Не все delete операции имеют подтверждение

## Success Criteria
- Все автоматические тесты написаны и проходят в CI
- Lighthouse Performance 90+
- Все зависимости без known vulnerabilities
- AdminController разбит на <200 строк каждый
- Админка использует toast, все удаления с confirm
