import type { Metadata } from 'next'
import { Button } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Страница не найдена | Анжела Моисеенко',
  description: 'Запрошенная страница не найдена. Перейдите в галерею работ или на главную страницу.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-xl">
        <p className="text-6xl font-serif text-ochre-700 mb-4">404</p>
        <h1 className="text-3xl md:text-4xl mb-4">Страница не найдена</h1>
        <p className="text-ink-500 mb-10">
          Возможно, она была перемещена или ссылка устарела.
          Загляните в галерею — там собраны все работы.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/gallery">Галерея работ</Button>
          <Button href="/" variant="secondary">На главную</Button>
        </div>
      </div>
    </main>
  )
}
