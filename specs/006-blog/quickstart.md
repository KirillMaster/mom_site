# Quickstart: проверка 006-blog

Контракты — `contracts.yaml` (id), сущности — `data-model.yaml` (id).

## Предусловия
- Локальная БД с миграцией блога (`blog-post`, `blog-category`, `blog-post-artwork`) и seed рубрик (A-2).
- `INDEXNOW_KEY` — опционально в локальном `.env` (gitignore); без него пинг выключен.
- Спайк TipTap на Next 14.0 / React 18 пройден (первая задача tasks).

## Автотесты
```bash
cd backend && dotnet test --filter "FullyQualifiedName~Blog"
cd frontend && npm test -- blog sitemap && npx tsc --noEmit && npx playwright test e2e/blog.spec.ts
```

## Сценарии

| # | Шаги | Ожидаемо | Контракт |
|---|---|---|---|
| 1 | `/admin/blog` → «Новая статья»: заголовок, обложка с подписью, текст с H2 и картинкой из буфера, рубрика, 3 работы → «Опубликовать» | Статья на `/blog/<адрес>`; адрес из заголовка; картинка — URL S3, не base64 | `admin-blog`, `admin-blog-images` |
| 2 | Сохранить тело с `<script>`, `onerror`, `<iframe>`, `style` | Опасное удалено, абзацы/списки/жирный сохранены | `blog-service` |
| 3 | Черновик и статья с датой завтра: открыть адреса без входа | 404; в списке, sitemap, RSS их нет | `public-blog-post` |
| 4 | Сменить адрес опубликованной статьи | 409, понятное сообщение | `admin-blog` |
| 5 | Два поста с одинаковым заголовком | Адреса `…` и `…-2` | `admin-blog` |
| 6 | `/blog` при 15 статьях; `/blog/category/<рубрика>`; пустая рубрика | 12 + пагинация; только статьи рубрики с описанием; пустая — 404 | `public-blog-list` |
| 7 | Скрыть работу из «Работ по теме» (005) | Пропадает из блока, статья открывается | `public-blog-post` |
| 8 | Удалить рубрику со статьями | 409 с числом статей | `admin-blog-categories` |
| 9 | View-source статьи | Один H1, canonical без UTM, OG article, ld+json BlogPosting (author → `#artist`) + BreadcrumbList | `public-blog-post` |
| 10 | `/sitemap.xml`, `/blog/rss.xml` | Опубликованные статьи с реальным lastmod; RSS валиден (W3C validator) | `blog-rss` |
| 11 | Публикация с `INDEXNOW_KEY` и с недоступным endpoint | Публикация успешна; в логе sent / failed; `/indexnow-key.txt` отдаёт ключ | `indexnow-client` |
| 12 | Закрыть вкладку при правке, открыть редактор | Предложение восстановить черновик | `admin-blog` |
| 13 | Клик CTA в статье | Переход в `/contacts`, цель Метрики | `public-blog-post` |
| 14 | Lighthouse mobile статьи; размер публичного бандла | LCP ≤ 2,5 с; TipTap в публичных чанках отсутствует | — |
| 15 | Admin-запросы без JWT | 401 | `admin-blog` |
| 16 | Простота (A-8): новость только с заголовком и текстом, фото с телефона кнопкой «Фото»; вставить текст из Word | Публикуется в «Новости», подпись фото = заголовок; оформление Word убрано; на ширине 360 px кнопки видны | `admin-blog`, `admin-blog-images` |
| 17 | Юзабилити: мама публикует новость с 2 фото без подсказок | ≤ 10 минут, без вопросов (SC-001) | — |

## Прод
1. `INDEXNOW_KEY` — в серверный `.env` и GitHub secret (не в git); строка в `docker-compose.prod.yml`.
2. Ссылка «Блог» в меню/футере; sitemap перезагрузить в Вебмастере (делает владелец).
3. Мама публикует первую статью сама (SC-001); закрытие — после «добро» пользователя (P5).
