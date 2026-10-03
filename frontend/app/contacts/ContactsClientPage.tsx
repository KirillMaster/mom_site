'use client';

import Navigation from '@/components/Navigation';
import { ContactsData } from '@/lib/api';
import ContactsHero from './ContactsHero';
import ContactDetailsCard from './ContactDetailsCard';
import ContactsSocialSection from './ContactsSocialSection';
import ContactsFaqSection from './ContactsFaqSection';
import ContactFormFields from './ContactFormFields';
import { useContactForm } from './useContactForm';
import { buildArtworkPrefill, type ContactPrefill } from '@/lib/contactPrefill';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Only the form reads the query string, so only it sits behind Suspense: the
// rest of the page (heading, contacts, FAQ) stays in the server-rendered HTML
// that search engines index.
const ContactsClientPage = ({ contactsData }: { contactsData: ContactsData }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow">
        <ContactsHero title={contactsData.bannerTitle} description={contactsData.bannerDescription} />

        {/* Contact Info & Form */}
        <section className="py-20 bg-paper">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <ContactDetailsCard email={contactsData.email} phone={contactsData.phone} />

              <Suspense fallback={<ContactFormCard prefill={EMPTY_PREFILL} />}>
                <PrefilledContactForm />
              </Suspense>
            </div>
          </div>
        </section>

        <ContactsSocialSection contactsData={contactsData} />

        <ContactsFaqSection faq={contactsData.faq} />
      </main>

    </div>
  );
};

const EMPTY_PREFILL = buildArtworkPrefill(null);

const PrefilledContactForm = () => {
  const searchParams = useSearchParams();
  return <ContactFormCard prefill={buildArtworkPrefill(searchParams.get('artwork'))} />;
};

const ContactFormCard = ({ prefill }: { prefill: ContactPrefill }) => {
  const form = useContactForm(prefill);
  return (
    <div className="reveal bg-paper-50 border border-line p-8 rounded-md">
      <h2 className="text-3xl font-serif font-semibold mb-6 text-ink">Напишите мне сообщение</h2>
      <ContactFormFields
        formData={form.formData}
        onChange={form.handleInputChange}
        onSubmit={form.handleSubmit}
        isSubmitting={form.isSubmitting}
        submissionResult={form.submissionResult}
        errorMessage={form.errorMessage}
        validationError={form.validationError}
      />
    </div>
  );
};

export default ContactsClientPage;
