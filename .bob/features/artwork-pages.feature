Feature: Indexable per-artwork pages
  As a search engine and as a visitor arriving from search
  I want each artwork to have its own crawlable URL, title, description and structured data
  So that the site ranks for commercial queries like "купить натюрморт" instead of collapsing
  all 286 works into one indistinguishable /gallery page

  # ---------------------------------------------------------------------
  # Slice 1 — slug routing and redirect
  # ---------------------------------------------------------------------

  @S1-AS1
  Scenario: Visiting an artwork's slug URL renders that artwork
    Given an artwork exists with id 7 and title "Осенний сад"
    When a visitor requests "/gallery/osenniy-sad-7"
    Then the response status is 200
    And the page renders the artwork with id 7
    And the rendered h1 contains "Осенний сад"

  @S1-AS2
  Scenario: The legacy query-string URL redirects permanently to the slug URL
    Given an artwork exists with id 7 and title "Осенний сад"
    When a visitor requests "/gallery?artwork=7"
    Then the response status is 301
    And the redirect Location is "/gallery/osenniy-sad-7"

  @S1-AS3
  Scenario: Legacy URL for a nonexistent artwork does not redirect into a dead page
    Given no artwork exists with id 999999
    When a visitor requests "/gallery?artwork=999999"
    Then the response status is 404

  @S1-AS4
  Scenario: An unresolvable slug returns 404
    When a visitor requests "/gallery/this-slug-does-not-exist-1"
    Then the response status is 404

  @S1-AS5
  Scenario: A slug whose trailing id does not match any artwork returns 404
    Given an artwork exists with id 7 and title "Осенний сад"
    When a visitor requests "/gallery/osenniy-sad-42"
    Then the response status is 404

  @S1-AS6
  Scenario: A slug with the correct id but a stale/mismatched title segment still resolves by id
    Given an artwork exists with id 7 and title "Осенний сад"
    When a visitor requests "/gallery/wrong-title-text-7"
    Then the response status is 200
    And the page renders the artwork with id 7

  @S1-AS7
  Scenario: Cyrillic and punctuation in the title produce a clean, unique, resolvable slug
    Given an artwork exists with id 12 and title "«Мама, я тебя люблю!» (этюд)"
    When the slug is generated for artwork 12
    Then the slug contains only lowercase latin letters, digits and hyphens
    And the slug ends with "-12"
    And requesting the generated slug returns status 200 for artwork 12

  @S1-AS8
  Scenario: Two artworks with an identical title get distinct slugs because the id disambiguates
    Given an artwork exists with id 3 and title "Натюрморт"
    And an artwork exists with id 88 and title "Натюрморт"
    When the slug is generated for artwork 3
    And the slug is generated for artwork 88
    Then the two generated slugs are different
    And requesting the slug for artwork 3 renders the artwork with id 3
    And requesting the slug for artwork 88 renders the artwork with id 88

  @S1-AS9
  Scenario: An exhibition photo (not a for-sale artwork) still resolves its own page
    Given an artwork exists with id 55 and title "С открытия выставки" in category "Фото с выставок"
    When a visitor requests the slug for artwork 55
    Then the response status is 200
    And the page does not show a "Узнать цену" button

  # ---------------------------------------------------------------------
  # Slice 2 — artwork page content: gallery card links, price/CTA, related works, breadcrumbs
  # ---------------------------------------------------------------------

  @S2-AS1
  Scenario: Gallery cards link directly to the artwork page (not only the lightbox)
    Given the gallery page lists an artwork with id 7 and title "Осенний сад"
    When the gallery page HTML is inspected
    Then it contains an anchor tag with href "/gallery/osenniy-sad-7"

  @S2-AS2
  Scenario: An artwork that is for sale with a price shows the price and a call to action
    Given an artwork exists with id 7, isForSale true and price 45000
    When a visitor requests the artwork's page
    Then the page displays the price "45 000 ₽"
    And the page shows a "Узнать цену" button

  @S2-AS3
  Scenario: An artwork that is for sale without a price shows "price on request"
    Given an artwork exists with id 8, isForSale true and price null
    When a visitor requests the artwork's page
    Then the page displays the text "цена по запросу"
    And the page shows a "Узнать цену" button

  @S2-AS4
  Scenario: An artwork that is not for sale hides the purchase call to action
    Given an artwork exists with id 9 and isForSale false
    When a visitor requests the artwork's page
    Then the page does not show a "Узнать цену" button

  @S2-AS5
  Scenario: Clicking "Узнать цену" navigates to contacts with the artwork preselected and fires the analytics goal
    Given an artwork exists with id 7, isForSale true and price 45000
    And a visitor is on the artwork's page
    When the visitor clicks the "Узнать цену" button
    Then the browser navigates to "/contacts" with a query parameter identifying artwork 7
    And the Metrica goal "contact_click" is fired with channel "ask_price"

  @S2-AS6
  Scenario: The artwork page lists other works from the same category
    Given an artwork exists with id 7 in category "Натюрморты"
    And at least one other for-sale artwork exists in category "Натюрморты"
    And no other for-sale artwork exists outside category "Натюрморты" is required for this check
    When a visitor requests the artwork's page
    Then the page shows a section titled "Другие работы этой категории"
    And that section does not include artwork 7 itself

  @S2-AS7
  Scenario: An artwork alone in its category shows no related-works section
    Given an artwork exists with id 20 and is the only for-sale artwork in its category
    When a visitor requests the artwork's page
    Then the page does not show a "Другие работы этой категории" section with any items

  @S2-AS8
  Scenario: The artwork page shows breadcrumbs from home to gallery to the artwork
    Given an artwork exists with id 7 and title "Осенний сад"
    When a visitor requests the artwork's page
    Then the page shows breadcrumb links "Главная", "Галерея" and "Осенний сад" in that order

  @S2-AS9
  Scenario: The artwork page shows the full-size image, description and category
    Given an artwork exists with id 7, title "Осенний сад", description "Осенний пейзаж маслом" and category "Пейзажи"
    When a visitor requests the artwork's page
    Then the image element's source resolves through the S3 full image path, not the thumbnail
    And the page text contains "Осенний пейзаж маслом"
    And the page text contains "Пейзажи"

  # ---------------------------------------------------------------------
  # Slice 3 — SEO metadata (title/description/canonical/OG) and schema.org markup
  # ---------------------------------------------------------------------

  @S3-AS1
  Scenario: The artwork page has a unique, commercially-oriented title and description
    Given an artwork exists with id 7, title "Осенний сад" and technique "масло, холст"
    When a visitor requests the artwork's page
    Then the document title contains "Осенний сад"
    And the document title contains "купить"
    And the meta description contains "Осенний сад"
    And the document title is different from the /gallery page's title

  @S3-AS2
  Scenario: The artwork page declares a canonical URL pointing to itself
    Given an artwork exists with id 7 and title "Осенний сад"
    When a visitor requests the artwork's page
    Then the canonical link tag points to "https://angelamoiseenko.ru/gallery/osenniy-sad-7"

  @S3-AS3
  Scenario: The artwork page's Open Graph image is the artwork's own image
    Given an artwork exists with id 7 and title "Осенний сад"
    When a visitor requests the artwork's page
    Then the og:image meta tag resolves to that artwork's full-size S3 image URL

  @S3-AS4
  Scenario: A for-sale artwork with a price emits VisualArtwork/Product schema.org markup with an Offer
    Given an artwork exists with id 7, isForSale true, price 45000, technique "масло, холст"
    When a visitor requests the artwork's page
    Then the page contains a JSON-LD script tag
    And the JSON-LD "@type" is "VisualArtwork" or "Product"
    And the JSON-LD includes name "Осенний сад"
    And the JSON-LD includes artMedium "масло, холст"
    And the JSON-LD creator name is "Анжела Моисеенко"
    And the JSON-LD includes an "offers" object with price 45000, priceCurrency "RUB" and an availability value

  @S3-AS5
  Scenario: An artwork that is not for sale emits schema.org markup without an offers block
    Given an artwork exists with id 9 and isForSale false
    When a visitor requests the artwork's page
    Then the page contains a JSON-LD script tag
    And the JSON-LD does not include an "offers" key

  @S3-AS6
  Scenario: The artwork page emits a BreadcrumbList schema.org block
    Given an artwork exists with id 7 and title "Осенний сад"
    When a visitor requests the artwork's page
    Then the page contains a JSON-LD script tag with "@type" "BreadcrumbList"
    And that BreadcrumbList has 3 itemListElement entries ending with "Осенний сад"

  # ---------------------------------------------------------------------
  # Slice 4 — sitemap emits artwork slugs
  # ---------------------------------------------------------------------

  @S4-AS1
  Scenario: The sitemap lists artwork pages by slug, not by query string
    Given the gallery contains for-sale artworks with ids 7 and 8
    When the sitemap is generated
    Then it contains an entry with url ending "/gallery/osenniy-sad-7"
    And it does not contain any url containing "?artwork="

  @S4-AS2
  Scenario: The sitemap excludes exhibition photos from artwork entries
    Given an artwork exists with id 55 in category "Фото с выставок"
    When the sitemap is generated
    Then it does not contain an entry for artwork 55's slug

  @S4-AS3
  Scenario: Sitemap generation degrades gracefully when the gallery API is unavailable
    Given the gallery data source is unreachable
    When the sitemap is generated
    Then it still returns the static pages
    And it does not throw an unhandled error

  # ---------------------------------------------------------------------
  # Slice 5 — homepage SEO fields decoupled from welcomeMessage
  # ---------------------------------------------------------------------

  @S5-AS1
  Scenario: The homepage title and description no longer derive from welcomeMessage
    Given the home page content has a welcomeMessage longer than 150 characters
    And no explicit SEO title or SEO description has been set in the admin
    When a visitor requests "/"
    Then the document title is at most 70 characters
    And the document title is "Купить картину маслом — художник Анжела Моисеенко"
    And the meta description contains a commercial term "купить"

  @S5-AS2
  Scenario: An admin-configured homepage SEO title and description override the defaults
    Given the admin has set the homepage SEO title to "Анжела Моисеенко — картины маслом на заказ"
    And the admin has set the homepage SEO description to "Галерея и заказ картин маслом художника Анжелы Моисеенко"
    When a visitor requests "/"
    Then the document title is "Анжела Моисеенко — картины маслом на заказ"
    And the meta description is "Галерея и заказ картин маслом художника Анжелы Моисеенко"

  @S5-AS3
  Scenario: The admin panel exposes editable fields for homepage SEO title and description
    Given an admin is authenticated in the admin panel's home content section
    When the admin opens the home page content editor
    Then there are separate input fields labelled for SEO title and SEO description
    And saving new values persists them independently of welcomeMessage

  @S5-AS4
  Scenario: An empty admin-configured SEO title falls back to the default rather than rendering blank
    Given the admin has set the homepage SEO title to an empty string
    When a visitor requests "/"
    Then the document title is "Купить картину маслом — художник Анжела Моисеенко"
