# Quickstart: ручная проверка 010

1. `cd frontend && npm run dev`, открыть `/gallery`, перейти на страницу любой работы.
2. Десктоп: под «Узнать цену» заметная кнопка «Спросить в Telegram»; href `https://t.me/angela_moiseenko_bot?start=art_<id>`; ниже иконки каналов, личный Telegram на месте.
3. Окно 390 px: в нижней панели «Написать», иконка бота, «Позвонить»; горизонтального скролла нет.
4. Клик по кнопке бота открывает Telegram в новой вкладке; бот показывает фото работы и предлагает «Купить».
5. `/contacts` (секция соцсетей) и футер: ссылка на бота с `?start=site`; бот запускает полный сценарий.
6. `NEXT_PUBLIC_FUNNEL_BOT_USERNAME=test_bot` + перезапуск: все ссылки ведут на `t.me/test_bot`.
7. Метрика: клик даёт цель `contact_click` с `channel=telegram_bot`.
8. Тесты: `node node_modules/jest/bin/jest.js --testPathIgnorePatterns=e2e/`; e2e `bot-cta.spec.ts` только читает href.
