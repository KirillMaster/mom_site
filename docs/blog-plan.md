# План блога — angelamoiseenko.ru

## 1. Зачем блог именно этому сайту

Бизнес-цель сайта — продажа картин. Сейчас коммерческий трафик идёт только на "купить" / "заказать" запросы, которых физически мало (низкочастотная ниша, конкуренция с маркетплейсами). Блог нужен не как отдельная витрина, а как канал захвата информационного спроса, которого в разы больше: "как выбрать картину в интерьер", "чем масло отличается от акрила", "как ухаживать за картиной маслом" — эти запросы приводят людей, которые ещё не решили купить, но уже интересуются темой.

У проекта уже есть готовый контент-актив, который просто не используется:
- 286 работ в галерее — у каждой есть история создания, техника, повод.
- 66 видео процесса рисования — сырьё для статей "как я писала эту картину" с видео внутри.

Без блога это либо не показывается вообще, либо тонет в `/gallery?artwork=N` без собственного URL и без текста, который отвечает на вопрос пользователя.

Воронка: информационный запрос (Яндекс/Google) → статья блога, которая закрывает вопрос и по ходу текста ссылается на 2-4 конкретные работы и на коммерческую страницу → карточка товара / посадочная страница (`/kupit-kartinu`, `/natyurmorty` и т.д., см. `docs/landing-pages-plan.md`) → заявка через форму или мессенджер. Каждая статья — это не самоцель, а мост к разделу продаж, у неё обязателен минимум один явный CTA-блок.

## 2. Рубрики

| Рубрика | Slug-префикс | Примеры заголовков | Ведёт на |
|---|---|---|---|
| Картина в интерьере | `interer` | «Как подобрать картину в интерьер гостиной», «Картина над диваном: размер, цвет, стиль», «Триптих или одна большая картина: что выбрать» | `/gallery`, `/kupit-kartinu`, категории по стилю интерьера |
| Техники и материалы | `tehniki` | «Масло или акрил: что выбрать для интерьера», «Импрессионизм: как отличить настоящую технику от подделки», «Почему картина маслом дороже акриловой» | `/kupit-kartinu` (блок «вилка цен»), карточки конкретных работ |
| Уход и хранение | `uhod` | «Как ухаживать за картиной маслом», «Можно ли вешать картину у окна», «Как правильно упаковать картину для переезда» | `/contacts` (консультация), общий доверительный контент, снижает возражения перед покупкой |
| Истории работ | `istorii` | «Как была написана "Крымский рассвет"», «История одного натюрморта: от эскиза до холста» (с видео процесса из `/videos`) | напрямую на конкретный `Artwork` через `RelatedArtworkIds`, затем на `/natyurmorty` или `/peyzazhi` |
| Крым и пленэры | `krym` | «Пленэр в Коктебеле: как рождаются крымские пейзажи», «5 мест в Крыму, которые вдохновляют художников» | `/peyzazhi`, укрепляет локальную идентичность («художница из Симферополя») — полезно и для локального SEO |
| Заказ портрета | `portret` | «Портрет по фото: как подготовить снимок для художника», «Сколько времени пишется портрет маслом», «Портрет в подарок: что учесть» | `/zakazat-portret` напрямую — это единственная рубрика, которая почти 1:1 продающая |

Рубрика хранится как поле `Category` (строка/enum) в самой статье — отдельная сущность категорий блогу не нужна, в отличие от категорий картин, потому что рубрик мало и они не управляются через отдельный CRUD с картинками.

## 3. Техническая реализация

### 3.1 Backend

Новая сущность `backend/MomSite.Core/Models/BlogPost.cs`:

```csharp
public class BlogPost
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Slug { get; set; } = string.Empty; // уникальный, латиница/транслит, напр. "kak-podobrat-kartinu-v-interer"

    [Required, MaxLength(300)]
    public string MetaTitle { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string MetaDescription { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Excerpt { get; set; } // анонс для карточки в /blog

    [Required]
    public string ContentHtml { get; set; } = string.Empty; // WYSIWYG-редактор в админке, хранится как HTML

    [Required, MaxLength(50)]
    public string Category { get; set; } = string.Empty; // interer | tehniki | uhod | istorii | krym | portret

    [MaxLength(500)]
    public string? CoverImagePath { get; set; } // тот же S3-пайплайн, что у Artwork.ImagePath

    public bool IsPublished { get; set; } = false;

    public DateTime? PublishedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BlogPostArtwork> RelatedArtworks { get; set; } = new List<BlogPostArtwork>();
}

public class BlogPostArtwork // связующая таблица статья <-> работы
{
    public int BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;

    public int ArtworkId { get; set; }
    public Artwork Artwork { get; set; } = null!;

    public int DisplayOrder { get; set; } = 0;
}
```

Почему связующая таблица, а не `int[] ArtworkIds` на `BlogPost`: EF Core здесь уже использует классические навигационные свойства (`Category.Artworks`, `VideoCategory.Videos`), паттерн `many-to-many` через явную join-сущность встраивается без ломки текущего стиля и даёт `DisplayOrder` для управления порядком карточек работ внутри статьи.

Регистрация в `ApplicationDbContext`: `DbSet<BlogPost> BlogPosts`, `DbSet<BlogPostArtwork> BlogPostArtworks`, миграция `AddBlogPosts` через `dotnet ef migrations add`.

### 3.2 PublicController — новые эндпоинты

В `backend/MomSite.API/Controllers/PublicController.cs` по образцу `GetGalleryData`/`GetVideosData`:

```csharp
[HttpGet("blog")]
public async Task<ActionResult<BlogListData>> GetBlogPosts([FromQuery] string? category = null, [FromQuery] int page = 1)

[HttpGet("blog/{slug}")]
public async Task<ActionResult<BlogPostData>> GetBlogPostBySlug(string slug)
```

`GetBlogPosts` фильтрует `IsPublished == true`, сортирует по `PublishedAt desc`, пагинация (`Skip/Take`, размер страницы 12). `GetBlogPostBySlug` подгружает `RelatedArtworks.Include(x => x.Artwork).Include(x => x.Artwork.Category)` и отдаёт DTO с уже готовыми `ArtworkDto` для рендера карточек работ внутри статьи — переиспользуется существующий `Artwork.ToDto()`.

DTO в `backend/MomSite.API/DTOs/PublicDtos.cs`: `BlogListData { Posts, TotalCount, Page }`, `BlogPostSummaryDto`, `BlogPostData { ...поля, RelatedArtworks: List<ArtworkDto> }`.

### 3.3 Админка

Новый CRUD-контроллер `backend/MomSite.API/Controllers/Admin/BlogPostsController.cs` — по образцу существующих админ-контроллеров для `Artworks`/`Videos` (`GET/POST/PUT/DELETE /api/admin/blogposts`), плюс `POST /api/admin/blogposts/{id}/image` для обложки через тот же `IImageService`/S3-пайплайн, что и у `Artwork.ImagePath`.

Фронтовая админка: новый раздел `frontend/app/admin/blog/page.tsx` (список + фильтр по рубрике + переключатель "опубликовано") и `frontend/app/admin/blog/[id]/page.tsx` (форма редактирования: заголовок, slug с автогенерацией из заголовка и возможностью правки, meta title/description, WYSIWYG для `ContentHtml`, мультиселект работ из галереи для `RelatedArtworks`, загрузка обложки). Не переиспользовать `pageFields`-паттерн из `frontend/app/admin/pages/page.tsx` напрямую (он заточен под фиксированный набор ключ-значение для статичных страниц) — для блога нужен полноценный список+форма, как у `admin/artworks`.

### 3.4 Next.js фронтенд

Маршруты:
- `frontend/app/blog/page.tsx` — список статей, фильтр по рубрике через `?category=`, серверный компонент как `gallery/page.tsx`.
- `frontend/app/blog/[slug]/page.tsx` — страница статьи, `generateMetadata` из `MetaTitle`/`MetaDescription`, `generateStaticParams` не нужен (данные из API, `dynamic = 'force-dynamic'` как в `gallery/page.tsx`), либо ISR через `revalidate = 3600`, если нужен статический кэш — предпочтительно ISR, чтобы не грузить бэкенд на каждый заход.

Метаданные и schema.org на `/blog/[slug]`:
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${params.slug}` },
    openGraph: { title: post.metaTitle, description: post.metaDescription, type: 'article', images: [{ url: getImageUrl(post.coverImagePath) }] },
  };
}
```

JSON-LD в теле страницы (по образцу `jsonLd` в `frontend/app/gallery/page.tsx`):
```ts
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  image: getImageUrl(post.coverImagePath),
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  author: { '@type': 'Person', name: 'Анжела Моисеенко' },
  mainEntityOfPage: `https://angelamoiseenko.ru/blog/${post.slug}`,
};
const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://angelamoiseenko.ru' },
    { '@type': 'ListItem', position: 2, name: 'Блог', item: 'https://angelamoiseenko.ru/blog' },
    { '@type': 'ListItem', position: 3, name: post.title, item: `https://angelamoiseenko.ru/blog/${post.slug}` },
  ],
};
```

Внутри статьи после каждого упоминания работы — карточка `ArtworkCard` (переиспользовать компонент из галереи) со ссылкой на `/gallery?artwork={id}`; в конце статьи — блок CTA на соответствующую посадочную страницу (`/kupit-kartinu`, `/zakazat-portret` и т.д., в зависимости от `Category`).

### 3.5 Sitemap

В `frontend/app/sitemap.ts` добавить блок аналогично `artworkPages`:

```ts
const blogListData = await getBlogPosts();
const blogPages = blogListData?.posts?.map((post) => ({
  url: `${baseUrl}/blog/${post.slug}`,
  lastModified: new Date(post.updatedAt || post.publishedAt),
  changeFrequency: 'monthly' as const,
  priority: 0.6,
})) || [];
```
плюс статическая запись `${baseUrl}/blog` с `priority: 0.7`, `changeFrequency: 'weekly'`.

## 4. Редакторский процесс

- Пишет: сама художница (истории работ, Крым/пленэры — только она может дать аутентичный текст) + помощник/копирайтер на технические рубрики (уход, техники, интерьер) по брифу от художницы. Копирайтер работает через ту же админку `/admin/blog`, без прямого доступа к базе.
- Частота: 2 статьи в месяц на старте (устойчиво поддерживаемый темп для одного человека без выгорания), с приоритетом на рубрики "Истории работ" и "Крым" в первые 3 месяца — они не требуют исследования, только описания уже созданного.
- Публикация → уведомление в Telegram-боте: в проекте уже есть канал уведомлений через `IFeedbackNotifier` (`backend/MomSite.Core/Interfaces/IFeedbackNotifier.cs`, Telegram-реализация в `PublicController`/`Program.cs`) — он сейчас шлёт админу уведомления о заявках. Для рассылки читателям это отдельная задача: нужен не notifier "для админа", а bot с подписчиками (broadcast). Минимально жизнеспособный вариант — при публикации статьи (`IsPublished` меняется на `true` в админке) бэкенд дергает Telegram Bot API `sendMessage` на канал/чат с анонсом статьи и ссылкой; список получателей — не пользователи бота лично, а публичный Telegram-канал художницы. Это не блокирует остальной план и может быть внедрено вторым этапом.
- SMM: те же 66 видео, что дают материал для рубрики "Истории работ", нарезаются на Reels/VK-видео с подписью-анонсом статьи и ссылкой на `/blog/{slug}` в описании — блог становится источником текста для соцсетей, а не наоборот.

## 5. Как мерить

Добавить в `frontend/lib/analytics.ts` в объект `Goals`:
```ts
BlogPostView: 'blog_post_view',
BlogToLandingClick: 'blog_to_landing_click', // клик по CTA в конце статьи
BlogArtworkClick: 'blog_artwork_click', // клик по карточке работы внутри статьи
```
`reachGoal(Goals.BlogPostView, { slug, category })` на `blog/[slug]/page.tsx` при монтировании; `reachGoal(Goals.BlogToLandingClick, { slug, target })` на CTA-кнопке.

Отчёты в Яндекс.Метрике:
- "Источники, сводка" с сегментом по `/blog/*` — сколько органического трафика приходит именно на статьи.
- Отчёт по достижению целей `blog_to_landing_click` → `contact_form_submit` — доля читателей блога, доходящих до заявки (замеряет саму гипотезу воронки).
- "Страницы входа" с фильтром по блогу — какие рубрики/статьи приводят новых посетителей.

## 6. Этапы внедрения (оценка объёма)

| Этап | Содержание | Оценка |
|---|---|---|
| 1. Backend | Модель `BlogPost`/`BlogPostArtwork`, миграция, `PublicController` эндпоинты, admin CRUD-контроллер, загрузка обложки | 2-3 дня |
| 2. Admin UI | `/admin/blog` список + форма редактирования с WYSIWYG и мультиселектом работ | 2 дня |
| 3. Публичный фронтенд | `/blog`, `/blog/[slug]`, метаданные, JSON-LD, карточки работ внутри статьи, CTA-блоки | 2 дня |
| 4. Sitemap + аналитика | Правка `sitemap.ts`, цели в `analytics.ts`, простановка `reachGoal` | 0.5 дня |
| 5. Контент | Первые 4-6 статей (по 1 на рубрику) до запуска, чтобы `/blog` не выглядел пустым | параллельно, не блокирует релиз кода |
| 6. Telegram-рассылка (опционально, вторая итерация) | Хук на публикацию → `sendMessage` в канал | 0.5-1 день |

Итого на код: примерно 6.5-7.5 человеко-дней до первого релиза раздела блога.
