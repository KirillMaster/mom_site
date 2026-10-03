import { FAQItem } from '@/lib/api';

const ContactsFaqSection = ({ faq }: { faq: FAQItem[] }) => (
  <section className="py-20 bg-paper">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="reveal text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif font-semibold text-ink mb-6">
          Часто задаваемые вопросы
        </h2>
      </div>

      <div className="space-y-8">
        {faq.map((item, index) => (
          <div key={index} className="reveal bg-paper-50 border border-line p-8 rounded-md">
            <h3 className="text-xl font-semibold text-ink mb-4">{item.question}</h3>
            <p className="text-ink-600 leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ContactsFaqSection;
