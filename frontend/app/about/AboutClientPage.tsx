'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { AboutData } from '@/lib/api';
import ArtistCredentials from '@/components/ArtistCredentials';
import ExhibitionTimeline from '@/components/ExhibitionTimeline';
import BiographySection from '@/components/about/BiographySection';
import { CollectionsSection, PublicationsSection, StonePanelsSection } from '@/components/about/RecordSections';
import { Button } from '@/components/ui';

const AboutClientPage = ({ aboutData }: { aboutData: AboutData }) => {
  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center rise-in">
          <h1 className="mb-6">{aboutData.bannerTitle || 'Обо мне'}</h1>
          <p className="text-xl text-ink-600 max-w-3xl mx-auto">
            {aboutData.bannerDescription || 'Познакомьтесь с художником и узнайте больше о моем творческом пути'}
          </p>
        </div>
      </section>

      <BiographySection artistPhoto={aboutData.artistPhoto} />

      <section className="py-16 md:py-24 bg-paper-200">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="reveal mb-12 text-center">Членство и признание</h2>
          <ArtistCredentials />
        </div>
      </section>

      <StonePanelsSection />

      <section className="py-16 md:py-24 bg-paper-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="reveal mb-4">Выставки</h2>
          <p className="text-ink-500 mb-12">
            Ежегодные персональные выставки во Дворце культуры рыбаков; картины — в постоянной
            экспозиции Севастопольского центра культуры и искусства.
          </p>
          <ExhibitionTimeline />
        </div>
      </section>

      <PublicationsSection />
      <CollectionsSection />

      <section className="py-16 md:py-24 bg-sea text-white">
        <div className="max-w-4xl mx-auto px-4 text-center reveal">
          <h2 className="mb-8 !text-white">Моя философия</h2>
          <blockquote className="text-xl md:text-2xl leading-relaxed italic mb-8">
            &quot;{aboutData.philosophy}&quot;
          </blockquote>
          <p className="text-lg opacity-90">— Анжела Моисеенко</p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-paper-50">
        <div className="max-w-4xl mx-auto px-4 text-center reveal">
          <h2 className="mb-6">Хотите увидеть мои работы?</h2>
          <p className="text-xl text-ink-500 mb-8">Исследуйте галерею и найдите то, что тронет ваше сердце</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/gallery">Посмотреть галерею</Button>
            <Button href="/contacts" variant="secondary">Связаться со мной</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutClientPage;
