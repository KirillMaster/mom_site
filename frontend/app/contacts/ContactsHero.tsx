interface ContactsHeroProps {
  title?: string;
  description?: string;
}

const ContactsHero = ({ title, description }: ContactsHeroProps) => (
  <section className="pt-24 pb-16 bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rise-in text-center">
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6">
          {title || "Свяжитесь со мной"}
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          {description || "Буду рада ответить на ваши вопросы и обсудить идеи!"}
        </p>
      </div>
    </div>
  </section>
);

export default ContactsHero;
