Feature: Отзывы о работах и творчестве Анжелы Моисеенко
  Как посетитель сайта я хочу читать и оставлять отзывы,
  как администратор — модерировать их,
  чтобы страница /reviews отдавала реальный контент вместо 404.

  # ---------------------------------------------------------------------
  # Slice 1 — Review entity + миграция (backend domain)
  # ---------------------------------------------------------------------

  @S1-AS1
  Scenario: Сущность Review валидна с обязательными полями
    Given в базе данных применена миграция, создающая таблицу Review
    When создаётся Review с AuthorName "Ольга", Text "Прекрасные работы!", Rating 5
    Then запись сохраняется успешно
    And IsPublished по умолчанию равен false
    And CreatedAt проставляется автоматически

  @S1-AS2
  Scenario: AuthorName обязателен и ограничен по длине
    When создаётся Review с пустым AuthorName
    Then валидация модели отклоняет запись с ошибкой на поле AuthorName
    And создание Review с AuthorName длиннее 100 символов также отклоняется

  @S1-AS3
  Scenario: Text обязателен и ограничен 2000 символами
    When создаётся Review с пустым Text
    Then валидация отклоняет запись с ошибкой на поле Text
    And создание Review с Text длиннее 2000 символов также отклоняется

  @S1-AS4
  Scenario: Rating допускает только значения 1..5
    When создаётся Review с Rating 0
    Then валидация отклоняет запись с ошибкой на поле Rating
    And создание Review с Rating 6 также отклоняется
    And создание Review с Rating 1 и с Rating 5 проходит валидацию

  @S1-AS5
  Scenario: AuthorCity, ArtworkId и PhotoPath опциональны
    When создаётся Review без AuthorCity, без ArtworkId и без PhotoPath, но с валидными AuthorName/Text/Rating
    Then запись сохраняется успешно

  @S1-AS6
  Scenario: ArtworkId ссылается на существующую работу
    Given в базе есть Artwork с Id 42
    When создаётся Review с ArtworkId 42
    Then запись сохраняется, и связь с Artwork доступна через navigation property

  # ---------------------------------------------------------------------
  # Slice 2 — Публичные API: список опубликованных + форма отправки
  # ---------------------------------------------------------------------

  @S2-AS1
  Scenario: GET /api/public/reviews возвращает только опубликованные отзывы
    Given существует опубликованный Review "A" с SortOrder 1
    And существует неопубликованный Review "B" с SortOrder 0
    When клиент делает GET /api/public/reviews
    Then ответ 200 содержит только Review "A"
    And Review "B" отсутствует в ответе

  @S2-AS2
  Scenario: GET /api/public/reviews сортирует отзывы по SortOrder
    Given опубликован Review "X" с SortOrder 2
    And опубликован Review "Y" с SortOrder 1
    When клиент делает GET /api/public/reviews
    Then в ответе Review "Y" идёт раньше Review "X"

  @S2-AS3
  Scenario: GET /api/public/reviews при отсутствии опубликованных отзывов возвращает пустой список
    Given в базе нет ни одного опубликованного Review
    When клиент делает GET /api/public/reviews
    Then ответ 200 содержит пустой массив

  @S2-AS4
  Scenario: POST /api/public/reviews создаёт неопубликованный отзыв
    When клиент отправляет POST /api/public/reviews с валидными AuthorName, Text, Rating
    Then ответ 201 (или 200) подтверждает приём отзыва
    And в базе создаётся Review с IsPublished = false
    And администратору отправляется уведомление в Telegram

  @S2-AS5
  Scenario: POST /api/public/reviews отклоняет невалидные данные
    When клиент отправляет POST /api/public/reviews с пустым AuthorName
    Then ответ 400 с описанием ошибки валидации
    And Review не создаётся

  @S2-AS6
  Scenario: POST /api/public/reviews отклоняет Rating вне диапазона 1..5
    When клиент отправляет POST /api/public/reviews с Rating 0
    Then ответ 400 с описанием ошибки валидации
    When клиент отправляет POST /api/public/reviews с Rating 7
    Then ответ 400 с описанием ошибки валидации

  @S2-AS7
  Scenario: POST /api/public/reviews отклоняет Text длиннее лимита
    When клиент отправляет POST /api/public/reviews с Text длиной 2001 символ
    Then ответ 400 с описанием ошибки валидации

  @S2-AS8
  Scenario: POST /api/public/reviews ограничивает частоту отправки с одного источника (rate limiting)
    Given клиент только что успешно отправил отзыв с текущего IP
    When тот же клиент немедленно отправляет ещё один POST /api/public/reviews
    Then ответ 429 Too Many Requests
    And повторный Review не создаётся

  @S2-AS9
  Scenario: POST /api/public/reviews принимает отзыв без ArtworkId и без фото
    When клиент отправляет POST /api/public/reviews с валидными AuthorName, Text, Rating и без ArtworkId, без фото
    Then ответ подтверждает приём отзыва
    And созданный Review имеет ArtworkId = null и PhotoPath = null

  # ---------------------------------------------------------------------
  # Slice 3 — Приватный CRUD и модерация (admin API)
  # ---------------------------------------------------------------------

  @S3-AS1
  Scenario: Неавторизованный запрос к приватному API отзывов отклоняется
    When неавторизованный клиент делает GET /api/admin/reviews
    Then ответ 401 Unauthorized

  @S3-AS2
  Scenario: Администратор получает полный список отзывов, включая неопубликованные
    Given существует опубликованный Review "A" и неопубликованный Review "B"
    When авторизованный администратор делает GET /api/admin/reviews
    Then ответ 200 содержит и "A", и "B"

  @S3-AS3
  Scenario: Администратор публикует отзыв
    Given существует неопубликованный Review "B"
    When администратор вызывает PATCH/PUT публикации для Review "B"
    Then Review "B" становится IsPublished = true и PublishedAt проставлен
    And Review "B" появляется в GET /api/public/reviews

  @S3-AS4
  Scenario: Администратор снимает отзыв с публикации
    Given существует опубликованный Review "A"
    When администратор снимает Review "A" с публикации
    Then Review "A" становится IsPublished = false
    And Review "A" больше не возвращается GET /api/public/reviews

  @S3-AS5
  Scenario: Администратор редактирует отзыв
    Given существует Review "A" с Text "старый текст"
    When администратор обновляет Review "A", устанавливая Text "новый текст"
    Then изменения сохраняются
    And GET /api/public/reviews (если "A" опубликован) отдаёт обновлённый текст

  @S3-AS6
  Scenario: Администратор удаляет отзыв
    Given существует Review "C"
    When администратор вызывает DELETE для Review "C"
    Then запись удаляется из базы
    And повторный GET /api/admin/reviews не содержит "C"

  # ---------------------------------------------------------------------
  # Slice 4 — Публичная страница /reviews (Next.js) + SEO
  # ---------------------------------------------------------------------

  @S4-AS1
  Scenario: Страница /reviews отдаёт 200 и заголовок h1
    When пользователь открывает /reviews
    Then страница отдаёт статус 200
    And на странице присутствует ровно один <h1>

  @S4-AS2
  Scenario: Список отзывов отображает имя, город, рейтинг звёздами, текст и дату
    Given опубликован Review с AuthorName "Ольга", AuthorCity "Москва", Rating 4, Text "Очень понравилось"
    When пользователь открывает /reviews
    Then на странице видны "Ольга", "Москва", 4 закрашенные звезды из 5, текст "Очень понравилось" и дата создания

  @S4-AS3
  Scenario: Отзыв со ссылкой на работу показывает эту ссылку
    Given опубликован Review с привязкой к Artwork "Закат над рекой"
    When пользователь открывает /reviews
    Then рядом с отзывом отображается ссылка на работу "Закат над рекой"

  @S4-AS4
  Scenario: Отзыв без привязки к работе отображается без ссылки на работу
    Given опубликован Review без ArtworkId
    When пользователь открывает /reviews
    Then отзыв отображается без блока ссылки на работу и без ошибок рендера

  @S4-AS5
  Scenario: Пустое состояние при отсутствии опубликованных отзывов
    Given опубликованных отзывов нет
    When пользователь открывает /reviews
    Then отображается заметное сообщение о том, что отзывов пока нет
    And форма отправки отзыва всё равно доступна

  @S4-AS6
  Scenario: Отправка отзыва через форму на странице
    Given пользователь находится на /reviews
    When он заполняет форму (имя, текст, рейтинг) валидными данными и отправляет
    Then форма показывает сообщение об успешной отправке (отзыв ожидает модерации)
    And отправленный отзыв не появляется в списке до публикации администратором

  @S4-AS7
  Scenario: Форма отклоняет отправку с пустым именем
    Given пользователь находится на /reviews
    When он отправляет форму с пустым полем имени
    Then форма показывает ошибку валидации и не отправляет запрос

  @S4-AS8
  Scenario: Форма отклоняет текст отзыва длиннее лимита
    Given пользователь находится на /reviews
    When он вводит текст отзыва длиной более 2000 символов и отправляет
    Then форма показывает ошибку валидации и не отправляет запрос

  @S4-AS9
  Scenario: Ссылка на /reviews присутствует в Header и Footer
    When пользователь открывает любую страницу сайта
    Then в Header есть ссылка на /reviews
    And в Footer есть ссылка на /reviews

  @S4-AS10
  Scenario: Страница /reviews имеет уникальные SEO-метаданные
    When пользователь (или краулер) запрашивает /reviews
    Then generateMetadata отдаёт уникальные title и description, отличные от других страниц
    And присутствует canonical-ссылка на https://angelamoiseenko.ru/reviews

  @S4-AS11
  Scenario: /reviews присутствует в sitemap.ts
    When запрашивается /sitemap.xml
    Then в списке урлов присутствует https://angelamoiseenko.ru/reviews

  @S4-AS12
  Scenario: AggregateRating выводится только при наличии опубликованных отзывов
    Given есть хотя бы один опубликованный Review с Rating
    When пользователь открывает /reviews
    Then в разметке страницы присутствует JSON-LD schema.org AggregateRating с корректными ratingValue и reviewCount
    And для каждого показанного отзыва присутствует JSON-LD Review (author, reviewRating, reviewBody, datePublished)

  @S4-AS13
  Scenario: AggregateRating не выводится при нуле опубликованных отзывов
    Given опубликованных отзывов нет
    When пользователь открывает /reviews
    Then в разметке страницы отсутствует JSON-LD AggregateRating

  # ---------------------------------------------------------------------
  # Slice 5 — Админская страница управления отзывами (Next.js admin)
  # ---------------------------------------------------------------------

  @S5-AS1
  Scenario: Неавторизованный пользователь не видит /admin/reviews
    When неавторизованный пользователь открывает /admin/reviews
    Then он перенаправляется на страницу входа или получает отказ в доступе

  @S5-AS2
  Scenario: Админ видит список всех отзывов с их статусом публикации
    Given авторизован как администратор
    And существуют опубликованный Review "A" и неопубликованный Review "B"
    When администратор открывает /admin/reviews
    Then в списке видны оба отзыва с явным индикатором статуса публикации

  @S5-AS3
  Scenario: Админ публикует отзыв через UI
    Given авторизован как администратор
    And в списке есть неопубликованный Review "B"
    When администратор нажимает "Опубликовать" на Review "B"
    Then статус в UI меняется на "опубликован" без перезагрузки страницы
    And повторный запрос списка подтверждает IsPublished = true

  @S5-AS4
  Scenario: Админ снимает отзыв с публикации через UI
    Given авторизован как администратор
    And в списке есть опубликованный Review "A"
    When администратор нажимает "Снять с публикации" на Review "A"
    Then статус в UI меняется на "не опубликован"

  @S5-AS5
  Scenario: Админ редактирует отзыв через UI
    Given авторизован как администратор
    And в списке есть Review "A"
    When администратор открывает форму редактирования, меняет текст и сохраняет
    Then изменённый текст отображается в списке без перезагрузки страницы

  @S5-AS6
  Scenario: Админ удаляет отзыв через UI с подтверждением
    Given авторизован как администратор
    And в списке есть Review "C"
    When администратор нажимает "Удалить" и подтверждает действие
    Then Review "C" исчезает из списка
    And повторная загрузка страницы не показывает "C"
