'use client';

import Navigation from '@/components/Navigation';
import { ContactsData } from '@/lib/api';
import ContactsHero from './ContactsHero';
import ContactDetailsCard from './ContactDetailsCard';
import ContactsSocialSection from './ContactsSocialSection';
import ContactsFaqSection from './ContactsFaqSection';
import ContactFormFields from './ContactFormFields';
import { useContactForm } from './useContactForm';
import { buildArtworkPrefill } from '@/lib/contactPrefill';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// useSearchParams requires a Suspense boundary, otherwise Next.js fails the
// production build with "missing suspense boundary" for this route.
const ContactsClientPage = ({ contactsData }: { contactsData: ContactsData }) => (
  <Suspense fallback={null}>
    <ContactsForm contactsData={contactsData} />
  </Suspense>
);

const ContactsForm = ({ contactsData }: { contactsData: ContactsData }) => {
  const searchParams = useSearchParams();
  const prefill = buildArtworkPrefill(searchParams.get('artwork'));

  const form = useContactForm(prefill);

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

              {/* Contact Form */}
              <div
                className="reveal bg-paper-50 border border-line p-8 rounded-md"
              >
                <h3 className="text-3xl font-serif font-semibold mb-6 text-ink">
                  Напишите мне сообщение
                </h3>
                
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
            </div>
          </div>
        </section>

        <ContactsSocialSection contactsData={contactsData} />

        <ContactsFaqSection faq={contactsData.faq} />
      </main>

    </div>
  );
};

export default ContactsClientPage;
