'use client'

import Script from 'next/script'
import { YM_COUNTER_ID } from '@/lib/analytics'

export default function YandexMetrica() {
  if (!YM_COUNTER_ID) return null

  return (
    <>
      <Script id="yandex-metrica" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];

          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

          // No ssr/url/referrer here on purpose: those switch the counter into
          // the mode where the app has to send every hit itself with
          // ym(id, 'hit', ...). Without that call the counter never fired a hit,
          // never set the first-party _ym_uid cookie, and every visit looked new.
          ym(${YM_COUNTER_ID}, "init", {
            webvisor: true,
            trackHash: true,
            clickmap: true,
            ecommerce: "dataLayer",
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YM_COUNTER_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  )
}
