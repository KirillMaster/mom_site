import { FAQItem } from '@/lib/api';

const ContactsFaqSection = ({ faq }: { faq: FAQItem[] }) => (
  <section className="py-20 bg-gray-50">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="reveal text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
          Часто задаваемые вопросы
        </h2>
      </div>

      <div className="space-y-8">
        {faq.map((item, index) => (
          <div key={index} className="reveal bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.question}</h3>
            <p className="text-gray-700 leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ContactsFaqSection;
