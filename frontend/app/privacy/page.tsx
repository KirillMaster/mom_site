import { Metadata } from 'next';
import { loadOrBuildFallback } from '@/lib/buildPhase';
import type { PrivacyData } from '@/lib/api';
import { getPrivacyData } from '@/hooks/useApi';
import { resolvePrivacy } from '@/lib/privacy';

export const revalidate = 3600;

const TITLE = 'Политика конфиденциальности | Анжела Моисеенко';
const DESCRIPTION = 'Порядок обработки персональных данных на сайте художницы Анжелы Моисеенко.';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/privacy' },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: 'website',
      url: 'https://angelamoiseenko.ru/privacy',
    },
  };
}

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('ru-RU');
};

const PrivacyPage = async () => {
  const data = await loadOrBuildFallback<PrivacyData>(getPrivacyData, { text: null, updatedAt: null });
  const { sections, updatedAt } = resolvePrivacy(data);
  const revisedAt = updatedAt ? formatDate(updatedAt) : null;

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink mb-6">Политика конфиденциальности</h1>
      {revisedAt && <p className="text-sm text-ink-500 mb-6">Редакция от {revisedAt}</p>}
      {sections.map((section, index) => (
        <section key={index} className="mb-6">
          {section.heading && <h2 className="text-xl font-semibold text-ink mb-2">{section.heading}</h2>}
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-ink-700 leading-relaxed mb-3 whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </main>
  );
};

export default PrivacyPage;
