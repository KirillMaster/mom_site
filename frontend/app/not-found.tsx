import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Страница не найдена | Анжела Моисеенко',
  description: 'Запрошенная страница не найдена. Перейдите в галерею работ или на главную страницу.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-xl">
        <p className="text-6xl font-light text-gray-300 mb-4">404</p>
        <h1 className="text-3xl md:text-4xl font-light text-gray-800 mb-4">
          Страница не найдена
        </h1>
        <p className="text-gray-600 mb-10">
          Возможно, она была перемещена или ссылка устарела.
          Загляните в галерею — там собраны все работы.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/gallery"
            className="px-8 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors"
          >
            Галерея работ
          </Link>
          <Link
            href="/"
            className="px-8 py-3 border border-gray-300 text-gray-800 rounded-full hover:border-gray-500 transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  )
}
